import proj4 from 'proj4'
import { PrismaClient } from '@prisma/client'
import { isLifeEstateName } from '../lib/life-estate'
import { calculateAllScores } from '../lib/scoring'
import { fetchLatestTransfers, NEK_TOWNS } from './import-vcgi'

/**
 * Fills life-estate, floodplain, and wetland flags on parcels already in the
 * database, then refreshes scores those flags affect.
 */

proj4.defs(
  'EPSG:32145',
  '+proj=tmerc +lat_0=42.5 +lon_0=-72.5 +k=0.999964285714286 +x_0=500000 +y_0=0 +datum=NAD83 +units=m +no_defs'
)

const FLOOD_QUERY =
  'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/FS_VCGI_ACT174CONSTRAINTS_SP_v2022/FeatureServer/126/query'
const WETLAND_QUERY =
  'https://services5.arcgis.com/Uzks6LSde6r23wwG/arcgis/rest/services/Vermont_Significant_Wetland_Inventory/FeatureServer/0/query'

const prisma = new PrismaClient()

function normalizeSpan(value: string): string {
  return value.replace(/\D/g, '')
}

function toStatePlane(longitude: number, latitude: number): [number, number] {
  const [x, y] = proj4('EPSG:4326', 'EPSG:32145', [longitude, latitude])
  return [x, y]
}

async function layerHits(
  url: string,
  longitude: number,
  latitude: number,
  statePlane: boolean,
  where?: string
): Promise<boolean> {
  const [x, y] = statePlane
    ? toStatePlane(longitude, latitude)
    : [longitude, latitude]
  const params = new URLSearchParams({
    geometry: `${x},${y}`,
    geometryType: 'esriGeometryPoint',
    inSR: statePlane ? '32145' : '4326',
    spatialRel: 'esriSpatialRelIntersects',
    returnCountOnly: 'true',
    f: 'json',
  })
  if (where) params.set('where', where)

  const response = await fetch(`${url}?${params}`, {
    signal: AbortSignal.timeout(25000),
  })
  const json = await response.json()
  if (json.error) {
    throw new Error(JSON.stringify(json.error))
  }
  return Number(json.count) > 0
}

async function applyLifeEstates(): Promise<string[]> {
  const parcels = await prisma.parcel.findMany({
    select: {
      id: true,
      parcelId: true,
      lifeEstate: true,
      owner: { select: { ownerName: true } },
    },
  })

  const fromDeed = new Map<string, boolean>()
  try {
    const transfers = await fetchLatestTransfers(Object.values(NEK_TOWNS).flat())
    for (const [span, transfer] of transfers) {
      if (transfer.lifeEstate) fromDeed.set(span, true)
    }
  } catch (error) {
    console.error('Deed life-estate lookup failed; using owner-name suffixes only.', error)
  }

  const changed: string[] = []
  for (const parcel of parcels) {
    const lifeEstate =
      isLifeEstateName(parcel.owner.ownerName) ||
      fromDeed.get(normalizeSpan(parcel.parcelId)) === true
    if (lifeEstate === parcel.lifeEstate) continue
    await prisma.parcel.update({
      where: { id: parcel.id },
      data: { lifeEstate },
    })
    changed.push(parcel.id)
  }
  console.log(`Life estate flags updated: ${changed.length}`)
  return changed
}

async function applySpatialFlags() {
  const missingLocation = await prisma.parcel.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
      constraints: { spatialChecked: false },
    },
    select: { id: true },
  })
  if (missingLocation.length > 0) {
    await prisma.constraints.updateMany({
      where: { parcelId: { in: missingLocation.map((parcel) => parcel.id) } },
      data: { spatialChecked: true },
    })
  }

  const pending = await prisma.parcel.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      constraints: { spatialChecked: false },
    },
    select: { id: true, latitude: true, longitude: true },
  })

  console.log(`Checking floodplain and wetlands for ${pending.length} parcels...`)
  let done = 0
  let failures = 0
  const workers = 6

  async function worker(start: number) {
    for (let index = start; index < pending.length; index += workers) {
      const parcel = pending[index]
      const latitude = parcel.latitude as number
      const longitude = parcel.longitude as number
      try {
        const [floodplain, wetlands] = await Promise.all([
          layerHits(FLOOD_QUERY, longitude, latitude, true, "SFHA_TF='T'"),
          layerHits(WETLAND_QUERY, longitude, latitude, false),
        ])
        await prisma.constraints.update({
          where: { parcelId: parcel.id },
          data: { floodplain, wetlands, spatialChecked: true },
        })
        failures = 0
      } catch (error) {
        failures++
        console.error(`Spatial check failed for ${parcel.id}:`, error)
        if (failures >= 25) {
          throw new Error('Stopping spatial checks after repeated layer errors.')
        }
      }
      done++
      if (done % 100 === 0) {
        console.log(`Spatial checks ${done}/${pending.length}`)
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, (_, index) => worker(index)))
  console.log(`Spatial checks finished (${done} attempted).`)
}

async function refreshAffectedScores(changedIds: string[]) {
  const or: Array<Record<string, unknown>> = [
    { lifeEstate: true },
    { constraints: { currentUse: true } },
    { constraints: { floodplain: true } },
    { constraints: { wetlands: true } },
  ]
  if (changedIds.length > 0) {
    or.push({ id: { in: changedIds } })
  }

  const parcels = await prisma.parcel.findMany({
    where: { OR: or },
    include: { owner: true, transfer: true, constraints: true },
  })

  console.log(`Refreshing scores for ${parcels.length} parcels...`)
  for (const parcel of parcels) {
    const scores = calculateAllScores(parcel)
    await prisma.scores.upsert({
      where: { parcelId: parcel.id },
      create: { parcelId: parcel.id, ...scores },
      update: scores,
    })
  }
  console.log('Score refresh finished.')
}

async function main() {
  try {
    const changedLifeEstates = await applyLifeEstates()
    await applySpatialFlags()
    await refreshAffectedScores(changedLifeEstates)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Constraint enrichment failed:', error)
    process.exit(1)
  })
}
