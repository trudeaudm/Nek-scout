import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { importProperties, type ImportedProperty } from './import-data'

const prisma = new PrismaClient()

/**
 * Import Northeast Kingdom parcels from VCGI's public ArcGIS FeatureServer
 * (statewide parcels joined to Grand List data).
 */

const FEATURE_SERVER_URL =
  'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/ArcGIS/rest/services/FS_VCGI_OPENDATA_Cadastral_VTPARCELS_poly_standardized_parcels_SP_v1/FeatureServer/0'

const OUT_FIELDS = [
  'SPAN',
  'GLIST_SPAN',
  'TNAME',
  'TOWN',
  'OWNER1',
  'OWNER2',
  'ADDRGL1',
  'ADDRGL2',
  'CITYGL',
  'STGL',
  'ZIPGL',
  'LOCAPROP',
  'E911ADDR',
  'DESCPROP',
  'CAT',
  'ACRESGL',
  'LAND_LV',
  'IMPRV_LV',
  'REAL_FLV',
  'UVREDUC_HS',
  'UVREDUC_NR',
  'RESCODE',
  'GLYEAR',
].join(',')

const TRANSFER_SERVER_URL =
  'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/ArcGIS/rest/services/FS_VCGI_OPENDATA_Cadastral_PTTR_point_WM_v1_view/FeatureServer/0'

/** Towns in Caledonia, Orleans, and Essex counties (Grand List TNAME values). */
export const NEK_TOWNS: Record<string, string[]> = {
  Caledonia: [
    'Barnet',
    'Burke',
    'Danville',
    'Groton',
    'Hardwick',
    'Kirby',
    'Lyndon',
    'Newark',
    'Peacham',
    'Ryegate',
    'Saint Johnsbury',
    'Sheffield',
    'Stannard',
    'Sutton',
    'Walden',
    'Waterford',
    'Wheelock',
  ],
  Orleans: [
    'Albany',
    'Barton',
    'Brownington',
    'Charleston',
    'Coventry',
    'Craftsbury',
    'Derby',
    'Glover',
    'Greensboro',
    'Holland',
    'Irasburg',
    'Jay',
    'Lowell',
    'Morgan',
    'Newport City',
    'Newport Town',
    'Troy',
    'Westfield',
    'Westmore',
  ],
  Essex: [
    'Bloomfield',
    'Brighton',
    'Brunswick',
    'Canaan',
    'Concord',
    'East Haven',
    'Ferdinand',
    'Granby',
    'Guildhall',
    'Lemington',
    'Lunenburg',
    'Maidstone',
    'Norton',
    'Victory',
  ],
}

export interface VcgiImportOptions {
  /** Minimum acreage filter (default 5). */
  minAcres?: number
  /** Only out-of-state mailing addresses. */
  outOfStateOnly?: boolean
  /** Max features to import (useful for smoke tests). */
  limit?: number
  /** Towns to include; defaults to all NEK towns. */
  towns?: string[]
  /** Upsert existing parcels instead of skipping. */
  upsert?: boolean
}

interface ArcGisFeature {
  attributes: Record<string, unknown>
  centroid?: { x: number; y: number }
  geometry?: { x?: number; y?: number }
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''")
}

function townCountyMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const [county, towns] of Object.entries(NEK_TOWNS)) {
    for (const town of towns) {
      map.set(town.toLowerCase(), county)
    }
  }
  return map
}

function buildWhere(options: VcgiImportOptions): string {
  const towns =
    options.towns && options.towns.length > 0
      ? options.towns
      : Object.values(NEK_TOWNS).flat()

  const townList = towns.map((t) => `'${escapeSqlString(t)}'`).join(',')
  const clauses = [
    `TNAME IN (${townList})`,
    `PROPTYPE='PARCEL'`,
    `OWNER1 IS NOT NULL`,
  ]

  const minAcres = options.minAcres ?? 5
  if (minAcres > 0) {
    clauses.push(`ACRESGL>=${minAcres}`)
  }

  if (options.outOfStateOnly) {
    clauses.push(`STGL<>'VT'`)
  }

  return clauses.join(' AND ')
}

async function queryPage(
  where: string,
  offset: number,
  pageSize: number
): Promise<ArcGisFeature[]> {
  const response = await axios.get(`${FEATURE_SERVER_URL}/query`, {
    params: {
      where,
      outFields: OUT_FIELDS,
      returnGeometry: false,
      returnCentroid: true,
      outSR: 4326,
      resultOffset: offset,
      resultRecordCount: pageSize,
      orderByFields: 'OBJECTID ASC',
      f: 'json',
    },
    timeout: 60000,
  })

  if (response.data.error) {
    throw new Error(
      `ArcGIS query failed: ${JSON.stringify(response.data.error)}`
    )
  }

  return response.data.features || []
}

async function queryCount(where: string): Promise<number> {
  const response = await axios.get(`${FEATURE_SERVER_URL}/query`, {
    params: {
      where,
      returnCountOnly: true,
      f: 'json',
    },
    timeout: 30000,
  })

  if (response.data.error) {
    throw new Error(
      `ArcGIS count failed: ${JSON.stringify(response.data.error)}`
    )
  }

  return response.data.count || 0
}

interface LatestTransfer {
  closeMs: number
  price?: number
}

function normalizeSpan(value: string): string {
  return value.replace(/\D/g, '')
}

function selectedTowns(options: VcgiImportOptions): string[] {
  return options.towns && options.towns.length > 0
    ? options.towns
    : Object.values(NEK_TOWNS).flat()
}

/** Latest deed per SPAN from the statewide property-transfer layer (January 2019 onward). */
async function fetchLatestTransfers(
  towns: string[]
): Promise<Map<string, LatestTransfer>> {
  const latest = new Map<string, LatestTransfer>()
  const where = `TOWNNAME IN (${towns
    .map((town) => `'${escapeSqlString(town)}'`)
    .join(',')}) AND closeDate IS NOT NULL`
  const pageSize = 1000
  let offset = 0

  console.log('Querying property transfers since 2019...')

  while (true) {
    const response = await axios.get(`${TRANSFER_SERVER_URL}/query`, {
      params: {
        where,
        outFields: 'span,closeDate,RlPrVlPdTr,ValPdOrTrn',
        returnGeometry: false,
        resultOffset: offset,
        resultRecordCount: pageSize,
        orderByFields: 'OBJECTID ASC',
        f: 'json',
      },
      timeout: 120000,
    })

    if (response.data.error) {
      throw new Error(
        `Transfer query failed: ${JSON.stringify(response.data.error)}`
      )
    }

    const features: ArcGisFeature[] = response.data.features || []
    if (features.length === 0) break

    for (const feature of features) {
      const attributes = feature.attributes
      const span = normalizeSpan(String(attributes.span || ''))
      const closeMs = Number(attributes.closeDate)
      if (!span || !closeMs) continue

      const realPrice = Number(attributes.RlPrVlPdTr)
      const paidPrice = Number(attributes.ValPdOrTrn)
      const price = realPrice > 0 ? realPrice : paidPrice > 0 ? paidPrice : undefined
      const existing = latest.get(span)
      if (!existing || closeMs > existing.closeMs) {
        latest.set(span, { closeMs, price })
      }
    }

    offset += features.length
    console.log(`Fetched ${offset} transfer records...`)
    if (features.length < pageSize) break
  }

  console.log(`Latest transfers indexed for ${latest.size} parcels.`)
  return latest
}

function mapFeature(
  feature: ArcGisFeature,
  countyLookup: Map<string, string>,
  transfers: Map<string, LatestTransfer>
): ImportedProperty | null {
  const a = feature.attributes
  const parcelId = String(a.GLIST_SPAN || a.SPAN || '').trim()
  const town = String(a.TNAME || a.TOWN || '').trim()
  const ownerName = String(a.OWNER1 || '').trim()

  if (!parcelId || !town || !ownerName) {
    return null
  }

  const county = countyLookup.get(town.toLowerCase()) || 'Unknown'
  const street = [a.ADDRGL1, a.ADDRGL2].filter(Boolean).join(' ').trim()
  const city = String(a.CITYGL || '').trim()
  const state = String(a.STGL || '').trim()
  const zip = String(a.ZIPGL || '').trim()
  const mailingAddress = [street, city, state, zip].filter(Boolean).join(', ')

  const address =
    String(a.E911ADDR || a.LOCAPROP || a.DESCPROP || '').trim() ||
    `${town}, VT`

  const landValue = Number(a.LAND_LV) || undefined
  const buildingValue = Number(a.IMPRV_LV) || undefined
  const totalValue = Number(a.REAL_FLV) || undefined
  const acreage = Number(a.ACRESGL) || undefined

  const currentUse =
    Number(a.UVREDUC_HS || 0) > 0 || Number(a.UVREDUC_NR || 0) > 0

  const centroid = feature.centroid || feature.geometry
  const longitude =
    centroid && typeof centroid.x === 'number' ? centroid.x : undefined
  const latitude =
    centroid && typeof centroid.y === 'number' ? centroid.y : undefined

  const transfer = transfers.get(normalizeSpan(parcelId))
  let lastSaleDate: string | undefined
  let lastSalePrice: number | undefined
  let transferType: string | undefined
  if (transfer) {
    lastSaleDate = new Date(transfer.closeMs).toISOString()
    lastSalePrice = transfer.price
    const grandListYear = Number(a.GLYEAR)
    const grandListAsOf = grandListYear
      ? Date.UTC(grandListYear, 3, 1)
      : undefined
    transferType =
      grandListAsOf && transfer.closeMs > grandListAsOf
        ? 'After grand list'
        : 'Deed'
  }

  return {
    parcelId,
    town,
    county,
    address,
    ownerName,
    mailingAddress,
    mailingState: state || undefined,
    landValue,
    buildingValue,
    totalValue,
    acreage,
    propertyClass: a.CAT ? String(a.CAT) : undefined,
    currentUse,
    latitude,
    longitude,
    lastSaleDate,
    lastSalePrice,
    transferType,
  }
}

export async function fetchNekParcels(
  options: VcgiImportOptions = {}
): Promise<ImportedProperty[]> {
  const where = buildWhere(options)
  const countyLookup = townCountyMap()
  const pageSize = 1000
  const limit = options.limit
  let transfers = new Map<string, LatestTransfer>()
  try {
    transfers = await fetchLatestTransfers(selectedTowns(options))
  } catch (error) {
    console.error(
      'Property transfer lookup failed; tenure will stay blank for this import.',
      error
    )
  }

  console.log(`Querying VCGI FeatureServer...`)
  console.log(`WHERE: ${where}`)

  const totalAvailable = await queryCount(where)
  console.log(`Matching parcels available: ${totalAvailable}`)

  const target =
    typeof limit === 'number' ? Math.min(limit, totalAvailable) : totalAvailable

  const properties: ImportedProperty[] = []
  let offset = 0

  while (properties.length < target) {
    const batchSize = Math.min(pageSize, target - properties.length)
    const features = await queryPage(where, offset, batchSize)

    if (features.length === 0) {
      break
    }

    for (const feature of features) {
      const mapped = mapFeature(feature, countyLookup, transfers)
      if (mapped) {
        properties.push(mapped)
      }
      if (properties.length >= target) break
    }

    offset += features.length
    console.log(`Fetched ${properties.length}/${target} parcels...`)

    if (features.length < batchSize) {
      break
    }
  }

  return properties
}

export async function importFromVcgi(options: VcgiImportOptions = {}) {
  const properties = await fetchNekParcels(options)

  if (properties.length === 0) {
    console.log('No parcels returned from VCGI.')
    return { imported: 0, skipped: 0, errors: 0, total: 0 }
  }

  console.log(`Importing ${properties.length} parcels into the database...`)
  await importProperties(properties, { upsert: options.upsert ?? false })

  const total = await prisma.parcel.count()
  console.log(`Database now has ${total} parcels.`)
  return { total, fetched: properties.length }
}

async function main() {
  const args = process.argv.slice(2)
  const options: VcgiImportOptions = {
    minAcres: 5,
    outOfStateOnly: false,
    upsert: args.includes('--upsert'),
  }

  if (args.includes('--oos')) {
    options.outOfStateOnly = true
  }

  const acresArg = args.find((a) => a.startsWith('--min-acres='))
  if (acresArg) {
    options.minAcres = parseFloat(acresArg.split('=')[1])
  }

  const limitArg = args.find((a) => a.startsWith('--limit='))
  if (limitArg) {
    options.limit = parseInt(limitArg.split('=')[1], 10)
  }

  try {
    await importFromVcgi(options)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('VCGI import failed:', error)
    process.exit(1)
  })
}
