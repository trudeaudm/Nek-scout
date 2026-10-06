import { PrismaClient } from '@prisma/client'
import { importProperties, ImportedProperty } from './import-data'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface CSVRow {
  [key: string]: string
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows: CSVRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: CSVRow = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }
  
  return rows
}

function mapCSVToProperty(row: CSVRow): ImportedProperty | null {
  // Try to map common Vermont Grand List column names
  // Adjust these mappings based on actual data format
  
  const parcelId = row['SPAN'] || row['Parcel ID'] || row['ParcelID'] || row['parcel_id']
  const town = row['Town'] || row['TOWN'] || row['town']
  const ownerName = row['Owner'] || row['OWNER'] || row['owner_name'] || row['Owner Name']
  
  if (!parcelId || !town || !ownerName) {
    console.warn('Missing required fields in row:', row)
    return null
  }
  
  return {
    parcelId,
    town,
    county: row['County'] || row['COUNTY'],
    address: row['Address'] || row['ADDR'] || row['Location'] || row['LOCATION'] || '',
    ownerName,
    mailingAddress: row['Mailing Address'] || row['MAIL_ADDR'] || row['mailing_address'] || '',
    mailingState: row['Mail State'] || row['MAIL_ST'] || row['mailing_state'],
    landValue: parseFloat(row['Land Value'] || row['LANDVAL'] || row['land_value'] || '0'),
    buildingValue: parseFloat(row['Building Value'] || row['BLDGVAL'] || row['building_value'] || '0'),
    totalValue: parseFloat(row['Total Value'] || row['TOTVAL'] || row['total_value'] || '0'),
    acreage: parseFloat(row['Acres'] || row['ACRES'] || row['acreage'] || '0'),
    propertyClass: row['Property Class'] || row['PROPCLASS'] || row['property_class'],
    yearBuilt: parseInt(row['Year Built'] || row['YRBUILT'] || row['year_built'] || '0') || undefined,
    lastSaleDate: row['Sale Date'] || row['SALEDATE'] || row['sale_date'],
    lastSalePrice: parseFloat(row['Sale Price'] || row['SALEPRICE'] || row['sale_price'] || '0'),
    latitude: parseFloat(row['Latitude'] || row['LAT'] || row['lat'] || '0') || undefined,
    longitude: parseFloat(row['Longitude'] || row['LON'] || row['lon'] || '0') || undefined,
    floodplain: (row['Floodplain'] || row['floodplain'] || '').toLowerCase() === 'yes',
    wetlands: (row['Wetlands'] || row['wetlands'] || '').toLowerCase() === 'yes',
    currentUse: (row['Current Use'] || row['current_use'] || '').toLowerCase() === 'yes'
  }
}

async function importFromCSV(filePath: string) {
  console.log(`Reading CSV file: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  const rows = parseCSV(content)
  
  console.log(`Parsed ${rows.length} rows from CSV`)
  
  const properties: ImportedProperty[] = []
  
  for (const row of rows) {
    const property = mapCSVToProperty(row)
    if (property) {
      properties.push(property)
    }
  }
  
  console.log(`Mapped ${properties.length} valid properties`)
  
  if (properties.length === 0) {
    console.error('No valid properties found. Check column mappings.')
    process.exit(1)
  }
  
  await importProperties(properties)
  await prisma.$disconnect()
}

// Run if called directly
if (require.main === module) {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.log('Usage: tsx scripts/import-csv.ts <path-to-csv-file>')
    console.log('\nExample: tsx scripts/import-csv.ts data/vermont-properties.csv')
    process.exit(1)
  }
  
  importFromCSV(filePath).catch(error => {
    console.error('Import failed:', error)
    process.exit(1)
  })
}

export { importFromCSV }
