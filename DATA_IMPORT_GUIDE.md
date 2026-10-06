# Vermont Property Data Import Guide

This guide explains how to obtain and import real Vermont property data into the NEK Scout system.

## Data Sources

### 1. Vermont Grand List Data

**What it contains:** Property assessments, owner names, mailing addresses, land/building values, acreage

**Where to get it:**
- **Vermont Department of Taxes**: https://tax.vermont.gov/property
- **Individual Town Clerks**: Each town publishes their Grand List
- **Vermont Center for Geographic Information (VCGI)**: https://vcgi.vermont.gov/

**Format:** Usually Excel (.xlsx) or CSV files, one file per town

**Key fields needed:**
- SPAN (parcel ID)
- Owner name
- Mailing address
- Property location
- Land value, Building value
- Acreage
- Property class
- Year built

### 2. Vermont Property Transfer Data

**What it contains:** Sale dates, sale prices, transfer types

**Where to get it:**
- **Vermont Department of Taxes Property Transfer Database**: https://tax.vermont.gov/property-transfer-tax
- Available from 1986 to present
- Can request bulk data or query individual records

**Key fields needed:**
- Parcel ID (to match with Grand List)
- Sale date
- Sale price
- Transfer type

### 3. Vermont GIS Parcel Data

**What it contains:** Parcel boundaries, coordinates, zoning

**Where to get it:**
- **VCGI Open Geodata Portal**: https://geodata.vermont.gov/
- Search for "parcel" or "tax parcels"
- Download by county or statewide

**Format:** Shapefiles (.shp) or GeoJSON

**Key fields needed:**
- SPAN (parcel ID)
- Latitude/Longitude (centroid)
- Acreage (for verification)
- Zoning designation

### 4. Environmental Constraint Data

#### Floodplain
- **FEMA National Flood Hazard Layer**: https://msc.fema.gov/portal
- Filter by Vermont counties
- Export as CSV with parcel IDs

#### Wetlands
- **National Wetlands Inventory**: https://www.fws.gov/program/national-wetlands-inventory
- Vermont wetlands layer
- Can overlay with parcel data

#### River Corridors
- **Vermont ANR River Corridor Maps**: https://anr.vermont.gov/
- Download GIS layers

#### Current Use Program
- **Vermont Department of Taxes Current Use Program**: https://tax.vermont.gov/property/current-use
- Lists of enrolled parcels by town

#### Conserved Lands
- **Vermont Housing and Conservation Board**: https://vhcb.org/
- Land trust registry
- Conservation easement database

## Data Preparation

### Step 1: Download Data

1. Start with **Grand List data** for your target counties (Caledonia, Orleans, Essex)
2. Get **Transfer data** for the same timeframe
3. Download **GIS parcel data** for coordinates
4. Get **constraint layers** (floodplain, wetlands, etc.)

### Step 2: Consolidate into CSV

Create a CSV file with these columns (column names can vary - the import script will try to match):

**Required columns:**
- `Parcel ID` or `SPAN`
- `Town`
- `Owner` or `Owner Name`
- `Mailing Address`
- `Address` or `Location`

**Recommended columns:**
- `County`
- `Land Value`
- `Building Value`
- `Total Value`
- `Acres` or `Acreage`
- `Property Class`
- `Year Built`
- `Sale Date`
- `Sale Price`
- `Latitude`
- `Longitude`
- `Floodplain` (yes/no)
- `Wetlands` (yes/no)
- `Current Use` (yes/no)

### Step 3: Clean Data

- Remove any header rows or summary rows
- Ensure dates are in format: YYYY-MM-DD or MM/DD/YYYY
- Remove dollar signs and commas from numeric fields
- Verify mailing addresses include state codes

## Import Process

### Method 1: CSV Import (Recommended)

```bash
# Place your CSV file in the data/ directory
mkdir -p data
mv your-vermont-properties.csv data/

# Run the import script
tsx scripts/import-csv.ts data/your-vermont-properties.csv
```

### Method 2: Custom Script

If your data format is different, modify `scripts/import-csv.ts` to match your column names in the `mapCSVToProperty` function.

### Method 3: Multiple Files

If you have separate files for each town:

```bash
# Import each town file
for file in data/towns/*.csv; do
  tsx scripts/import-csv.ts "$file"
done
```

## Verification

After import, verify the data:

```bash
# Check total properties imported
npx prisma studio

# Or query directly
tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.parcel.count().then(count => console.log('Total properties:', count));
"
```

## Data Updates

To refresh with new data:

1. The import script **skips existing parcels** by parcelId
2. To update existing properties, delete them first:
   ```bash
   npx prisma studio
   # Or reset entire database:
   npx prisma migrate reset
   ```
3. Then re-import all data

## Tips for Success

1. **Start small**: Import one town first to test
2. **Verify mappings**: Check that column names match in your CSV
3. **Clean data**: Remove special characters, normalize formats
4. **Batch processing**: Import 100-500 properties at a time for better error handling
5. **Back up**: Keep original data files and database backups

## Need Help?

Common issues:

**"Missing required fields"** - Check that your CSV has columns named: Parcel ID, Town, Owner
**"Invalid date format"** - Dates should be YYYY-MM-DD
**"Duplicate parcel"** - Parcel already exists (this is normal, it skips)
**"Not in target counties"** - Property is outside Caledonia, Orleans, or Essex

## Contact Data Providers

- **Vermont Dept of Taxes**: 802-828-2865
- **VCGI**: vcgi@vermont.gov
- **Town Clerks**: Find contacts at https://www.sec.state.vt.us/municipal-services/town-clerks.aspx
