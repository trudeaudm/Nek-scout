import { PrismaClient } from '@prisma/client'
import { calculateAllScores } from '../lib/scoring'
import * as fs from 'fs'
import * as path from 'path'

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

function determineOwnerType(ownerName: string): string {
  const name = ownerName.toLowerCase()
  
  if (name.includes('trust')) return 'trust'
  if (name.includes('estate of') || name.includes('estate,')) return 'estate'
  if (name.includes('llc') || name.includes('l.l.c')) return 'LLC'
  if (name.includes('inc') || name.includes('corp') || name.includes('company')) return 'corporation'
  
  return 'individual'
}

function calculateOwnershipYears(saleDate: string): number {
  const sale = new Date(saleDate)
  const now = new Date()
  return Math.floor((now.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

async function importProperties(data: ImportedProperty[]) {
  console.log(`Starting import of ${data.length} properties...`)
  
  let imported = 0
  let skipped = 0
  let errors = 0
  
  for (const property of data) {
    try {
      // Skip if parcel ID already exists
      const existing = await prisma.parcel.findUnique({
        where: { parcelId: property.parcelId }
      })
      
      if (existing) {
        console.log(`Skipping ${property.parcelId} - already exists`)
        skipped++
        continue
      }
      
      // Determine county if not provided
      const county = property.county || determineCounty(property.town)
      
      if (!['Caledonia', 'Orleans', 'Essex'].includes(county)) {
        console.log(`Skipping ${property.parcelId} - not in target counties`)
        skipped++
        continue
      }
      
      // Create or find owner
      const ownerType = determineOwnerType(property.ownerName)
      const mailingState = property.mailingState || extractState(property.mailingAddress) || 'VT'
      const outOfState = mailingState !== 'VT'
      const absenteeOwner = outOfState || !property.mailingAddress.toLowerCase().includes(property.town.toLowerCase())
      
      let owner = await prisma.owner.findFirst({
        where: {
          ownerName: property.ownerName,
          mailingAddress: property.mailingAddress
        }
      })
      
      if (!owner) {
        owner = await prisma.owner.create({
          data: {
            ownerName: property.ownerName,
            mailingAddress: property.mailingAddress,
            mailingState,
            ownerType,
            outOfStateOwner: outOfState,
            absenteeOwner
          }
        })
      }
      
      // Create parcel
      const parcel = await prisma.parcel.create({
        data: {
          parcelId: property.parcelId,
          town: property.town,
          county,
          address: property.address,
          acreage: property.acreage,
          landValue: property.landValue,
          buildingValue: property.buildingValue,
          totalAssessedValue: property.totalValue || (property.landValue || 0) + (property.buildingValue || 0),
          yearBuilt: property.yearBuilt,
          propertyClass: property.propertyClass,
          latitude: property.latitude,
          longitude: property.longitude,
          ownerId: owner.id
        }
      })
      
      // Create transfer record
      if (property.lastSaleDate) {
        await prisma.transfer.create({
          data: {
            parcelId: parcel.id,
            lastSaleDate: new Date(property.lastSaleDate),
            lastSalePrice: property.lastSalePrice,
            ownershipYears: calculateOwnershipYears(property.lastSaleDate),
            transferType: 'Warranty Deed'
          }
        })
      }
      
      // Create constraints
      await prisma.constraints.create({
        data: {
          parcelId: parcel.id,
          floodplain: property.floodplain || false,
          wetlands: property.wetlands || false,
          riverCorridor: property.riverCorridor || false,
          currentUse: property.currentUse || false,
          conservedLand: property.conservedLand || false,
          steepSlope: false
        }
      })
      
      // Calculate and save scores
      const parcelWithRelations = await prisma.parcel.findUnique({
        where: { id: parcel.id },
        include: {
          owner: true,
          transfer: true,
          constraints: true
        }
      })
      
      if (parcelWithRelations) {
        const scores = calculateAllScores(parcelWithRelations as any)
        await prisma.scores.create({
          data: {
            parcelId: parcel.id,
            ...scores
          }
        })
      }
      
      imported++
      if (imported % 10 === 0) {
        console.log(`Imported ${imported} properties...`)
      }
      
    } catch (error) {
      console.error(`Error importing ${property.parcelId}:`, error)
      errors++
    }
  }
  
  console.log(`\nImport complete!`)
  console.log(`Imported: ${imported}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
}

function determineCounty(town: string): string {
  const caledoniaTowns = ['St. Johnsbury', 'Lyndon', 'Burke', 'Danville', 'Hardwick', 'Barnet', 'Peacham', 'Walden', 'Waterford', 'Kirby', 'Concord', 'Victory', 'Granby']
  const orleansTowns = ['Newport', 'Derby', 'Barton', 'Irasburg', 'Glover', 'Brownington', 'Coventry', 'Lowell', 'Troy', 'Westmore', 'Charleston', 'Holland']
  const essexTowns = ['Guildhall', 'Concord', 'Lunenburg', 'Maidstone', 'Brunswick', 'Bloomfield', 'Brighton', 'Ferdinand', 'Granby']
  
  const normalized = town.trim()
  
  if (caledoniaTowns.some(t => normalized.includes(t))) return 'Caledonia'
  if (orleansTowns.some(t => normalized.includes(t))) return 'Orleans'
  if (essexTowns.some(t => normalized.includes(t))) return 'Essex'
  
  return 'Unknown'
}

function extractState(address: string): string | null {
  const stateMatch = address.match(/\b([A-Z]{2})\s+\d{5}/)
  return stateMatch ? stateMatch[1] : null
}

// Export functions for use in other scripts
export { importProperties }
export type { ImportedProperty }

// If run directly
if (require.main === module) {
  console.log('Use specific import scripts (import-csv.ts, import-json.ts) to import data')
  process.exit(0)
}
