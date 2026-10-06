import { PrismaClient } from '@prisma/client'
import { calculateAllScores } from '../lib/scoring'

const prisma = new PrismaClient()

interface ImportedProperty {
  // Grand List data
  parcelId: string
  town: string
  county: string
  address: string
  ownerName: string
  mailingAddress: string
  mailingState?: string
  landValue?: number
  buildingValue?: number
  totalValue?: number
  acreage?: number
  propertyClass?: string
  yearBuilt?: number

  // Transfer data
  lastSaleDate?: string
  lastSalePrice?: number
  transferType?: string
  lifeEstate?: boolean

  // Constraint data
  floodplain?: boolean
  wetlands?: boolean
  riverCorridor?: boolean
  currentUse?: boolean
  conservedLand?: boolean

  // Location
  latitude?: number
  longitude?: number
}

interface ImportOptions {
  upsert?: boolean
}

function determineOwnerType(ownerName: string): string {
  const name = ownerName.toLowerCase()

  if (name.includes('trust')) return 'trust'
  if (name.includes('estate of') || name.includes('estate,')) return 'estate'
  if (name.includes('llc') || name.includes('l.l.c')) return 'LLC'
  if (name.includes('inc') || name.includes('corp') || name.includes('company'))
    return 'corporation'

  return 'individual'
}

function calculateOwnershipYears(saleDate: string): number {
  const sale = new Date(saleDate)
  const now = new Date()
  return Math.floor(
    (now.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24 * 365)
  )
}

async function recalculateScores(parcelId: string) {
  const parcelWithRelations = await prisma.parcel.findUnique({
    where: { id: parcelId },
    include: {
      owner: true,
      transfer: true,
      constraints: true,
    },
  })

  if (!parcelWithRelations) return

  const scores = calculateAllScores(parcelWithRelations as any)

  await prisma.scores.upsert({
    where: { parcelId },
    create: {
      parcelId,
      ...scores,
    },
    update: scores,
  })
}

async function importProperties(
  data: ImportedProperty[],
  options: ImportOptions = {}
) {
  console.log(`Starting import of ${data.length} properties...`)

  let imported = 0
  let updated = 0
  let skipped = 0
  let errors = 0
  const upsert = options.upsert ?? false

  for (const property of data) {
    try {
      const existing = await prisma.parcel.findUnique({
        where: { parcelId: property.parcelId },
        include: { owner: true, transfer: true, constraints: true },
      })

      if (existing && !upsert) {
        skipped++
        continue
      }

      const county = property.county || determineCounty(property.town)

      if (!['Caledonia', 'Orleans', 'Essex'].includes(county)) {
        skipped++
        continue
      }

      const ownerType = determineOwnerType(property.ownerName)
      const mailingState =
        property.mailingState || extractState(property.mailingAddress) || 'VT'
      const outOfState = mailingState !== 'VT'
      const absenteeOwner =
        outOfState ||
        !property.mailingAddress
          .toLowerCase()
          .includes(property.town.toLowerCase())

      const ownerData = {
        ownerName: property.ownerName,
        mailingAddress: property.mailingAddress,
        mailingState,
        ownerType,
        outOfStateOwner: outOfState,
        absenteeOwner,
      }

      if (existing) {
        await prisma.owner.update({
          where: { id: existing.ownerId },
          data: ownerData,
        })

        await prisma.parcel.update({
          where: { id: existing.id },
          data: {
            town: property.town,
            county,
            address: property.address,
            acreage: property.acreage,
            landValue: property.landValue,
            buildingValue: property.buildingValue,
            totalAssessedValue:
              property.totalValue ||
              (property.landValue || 0) + (property.buildingValue || 0),
            yearBuilt: property.yearBuilt,
            propertyClass: property.propertyClass,
            latitude: property.latitude,
            longitude: property.longitude,
            lifeEstate: property.lifeEstate ?? false,
          },
        })

        if (property.lastSaleDate) {
          await prisma.transfer.upsert({
            where: { parcelId: existing.id },
            create: {
              parcelId: existing.id,
              lastSaleDate: new Date(property.lastSaleDate),
              lastSalePrice: property.lastSalePrice,
              ownershipYears: calculateOwnershipYears(property.lastSaleDate),
              transferType: property.transferType || 'Deed',
            },
            update: {
              lastSaleDate: new Date(property.lastSaleDate),
              lastSalePrice: property.lastSalePrice,
              ownershipYears: calculateOwnershipYears(property.lastSaleDate),
              transferType: property.transferType || 'Deed',
            },
          })
        }

        await prisma.constraints.upsert({
          where: { parcelId: existing.id },
          create: {
            parcelId: existing.id,
            floodplain: property.floodplain || false,
            wetlands: property.wetlands || false,
            riverCorridor: property.riverCorridor || false,
            currentUse: property.currentUse || false,
            conservedLand: property.conservedLand || false,
            steepSlope: false,
          },
          update: {
            floodplain: property.floodplain || false,
            wetlands: property.wetlands || false,
            riverCorridor: property.riverCorridor || false,
            currentUse: property.currentUse || false,
            conservedLand: property.conservedLand || false,
          },
        })

        await recalculateScores(existing.id)
        updated++
      } else {
        let owner = await prisma.owner.findFirst({
          where: {
            ownerName: property.ownerName,
            mailingAddress: property.mailingAddress,
          },
        })

        if (!owner) {
          owner = await prisma.owner.create({ data: ownerData })
        }

        const parcel = await prisma.parcel.create({
          data: {
            parcelId: property.parcelId,
            town: property.town,
            county,
            address: property.address,
            acreage: property.acreage,
            landValue: property.landValue,
            buildingValue: property.buildingValue,
            totalAssessedValue:
              property.totalValue ||
              (property.landValue || 0) + (property.buildingValue || 0),
            yearBuilt: property.yearBuilt,
            propertyClass: property.propertyClass,
            latitude: property.latitude,
            longitude: property.longitude,
            lifeEstate: property.lifeEstate ?? false,
            ownerId: owner.id,
          },
        })

        if (property.lastSaleDate) {
          await prisma.transfer.create({
            data: {
              parcelId: parcel.id,
              lastSaleDate: new Date(property.lastSaleDate),
              lastSalePrice: property.lastSalePrice,
              ownershipYears: calculateOwnershipYears(property.lastSaleDate),
              transferType: property.transferType || 'Deed',
            },
          })
        }

        await prisma.constraints.create({
          data: {
            parcelId: parcel.id,
            floodplain: property.floodplain || false,
            wetlands: property.wetlands || false,
            riverCorridor: property.riverCorridor || false,
            currentUse: property.currentUse || false,
            conservedLand: property.conservedLand || false,
            steepSlope: false,
          },
        })

        await recalculateScores(parcel.id)
        imported++
      }

      const processed = imported + updated
      if (processed % 50 === 0) {
        console.log(`Processed ${processed} properties...`)
      }
    } catch (error) {
      console.error(`Error importing ${property.parcelId}:`, error)
      errors++
    }
  }

  console.log(`\nImport complete!`)
  console.log(`Imported: ${imported}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)

  return { imported, updated, skipped, errors }
}

function determineCounty(town: string): string {
  const caledoniaTowns = [
    'Saint Johnsbury',
    'St. Johnsbury',
    'Lyndon',
    'Burke',
    'Danville',
    'Hardwick',
    'Barnet',
    'Peacham',
    'Walden',
    'Waterford',
    'Kirby',
    'Groton',
    'Ryegate',
    'Sheffield',
    'Stannard',
    'Sutton',
    'Wheelock',
    'Newark',
  ]
  const orleansTowns = [
    'Newport City',
    'Newport Town',
    'Newport',
    'Derby',
    'Barton',
    'Irasburg',
    'Glover',
    'Brownington',
    'Coventry',
    'Lowell',
    'Troy',
    'Westmore',
    'Charleston',
    'Holland',
    'Albany',
    'Craftsbury',
    'Greensboro',
    'Jay',
    'Morgan',
    'Westfield',
  ]
  const essexTowns = [
    'Guildhall',
    'Concord',
    'Lunenburg',
    'Maidstone',
    'Brunswick',
    'Bloomfield',
    'Brighton',
    'Ferdinand',
    'Granby',
    'Canaan',
    'East Haven',
    'Lemington',
    'Norton',
    'Victory',
  ]

  const normalized = town.trim()

  if (caledoniaTowns.some((t) => normalized.includes(t))) return 'Caledonia'
  if (orleansTowns.some((t) => normalized.includes(t))) return 'Orleans'
  if (essexTowns.some((t) => normalized.includes(t))) return 'Essex'

  return 'Unknown'
}

function extractState(address: string): string | null {
  const stateMatch = address.match(/\b([A-Z]{2})\s+\d{5}/)
  return stateMatch ? stateMatch[1] : null
}

export { importProperties }
export type { ImportedProperty }

if (require.main === module) {
  console.log(
    'Use specific import scripts (import-csv.ts, import-vcgi.ts) to import data'
  )
  process.exit(0)
}
