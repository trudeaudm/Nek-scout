import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Automated Vermont Property Data Fetcher
 * 
 * This script attempts to fetch property data from Vermont's public data sources.
 * Data sources may change - verify URLs and update as needed.
 */

interface DataSource {
  name: string
  url: string
  type: 'api' | 'download' | 'gis'
  description: string
}

const VERMONT_DATA_SOURCES: DataSource[] = [
  {
    name: 'Vermont Open Geodata Portal',
    url: 'https://geodata.vermont.gov/api/3/action/package_list',
    type: 'api',
    description: 'VCGI statewide GIS data including parcels'
  },
  {
    name: 'Vermont Tax Department - Grand List',
    url: 'https://tax.vermont.gov/property',
    type: 'download',
    description: 'Grand List data (may require manual download)'
  },
  {
    name: 'Vermont Property Transfer Records',
    url: 'https://tax.vermont.gov/property-transfer-tax',
    type: 'download',
    description: 'Property transfer database'
  }
]

async function fetchVCGIData() {
  console.log('Fetching VCGI open data catalog...')
  
  try {
    // VCGI uses CKAN API
    const catalogResponse = await axios.get(
      'https://geodata.vermont.gov/api/3/action/package_search',
      {
        params: {
          q: 'parcel',
          rows: 100
        }
      }
    )
    
    if (catalogResponse.data.success) {
      const packages = catalogResponse.data.result.results
      console.log(`Found ${packages.length} parcel-related datasets`)
      
      // Look for statewide or county parcel data
      const parcelDatasets = packages.filter((pkg: any) => 
        pkg.title.toLowerCase().includes('parcel') ||
        pkg.title.toLowerCase().includes('tax') ||
        pkg.title.toLowerCase().includes('property')
      )
      
      console.log('\nAvailable parcel datasets:')
      parcelDatasets.forEach((dataset: any, index: number) => {
        console.log(`${index + 1}. ${dataset.title}`)
        console.log(`   Organization: ${dataset.organization?.title || 'N/A'}`)
        console.log(`   URL: https://geodata.vermont.gov/dataset/${dataset.name}`)
        
        // Check for downloadable resources
        if (dataset.resources && dataset.resources.length > 0) {
          console.log(`   Resources:`)
          dataset.resources.forEach((resource: any) => {
            console.log(`   - ${resource.name} (${resource.format}): ${resource.url}`)
          })
        }
        console.log('')
      })
      
      return parcelDatasets
    }
  } catch (error) {
    console.error('Error fetching VCGI data:', error)
  }
  
  return []
}

async function downloadGISData(url: string, outputPath: string) {
  console.log(`Downloading from ${url}...`)
  
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    })
    
    const writer = fs.createWriteStream(outputPath)
    response.data.pipe(writer)
    
    return new Promise<void>((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Downloaded to ${outputPath}`)
        resolve()
      })
      writer.on('error', reject)
    })
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

async function checkVermontOpenDataPortal() {
  console.log('\nChecking Vermont Open Data Portal...')
  
  // Vermont may use Socrata platform
  const possibleEndpoints = [
    'https://data.vermont.gov/api/views',
    'https://opendata.vermont.gov/api/views'
  ]
  
  for (const endpoint of possibleEndpoints) {
    try {
      const response = await axios.get(endpoint, { timeout: 5000 })
      console.log(`✓ Found data portal at ${endpoint}`)
      return endpoint
    } catch (error) {
      // Try next endpoint
    }
  }
  
  console.log('⚠ No standard open data portal found')
  return null
}

async function fetchPropertyTransferData() {
  console.log('\nChecking for Property Transfer API...')
  
  // Vermont may have a property transfer database API
  // This is speculative - actual implementation depends on available APIs
  
  const possibleAPIs = [
    'https://tax.vermont.gov/api/property-transfers',
    'https://data.vermont.gov/resource/property-transfers.json'
  ]
  
  for (const apiUrl of possibleAPIs) {
    try {
      const response = await axios.get(apiUrl, { timeout: 5000 })
      console.log(`✓ Found transfer data API at ${apiUrl}`)
      return response.data
    } catch (error) {
      // API not available
    }
  }
  
  console.log('⚠ No property transfer API found - may require manual download')
  return null
}

async function main() {
  console.log('=================================================')
  console.log('Vermont Property Data Automation Script')
  console.log('=================================================\n')
  
  // Create data directory
  const dataDir = path.join(process.cwd(), 'data', 'automated')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  console.log(`Data will be saved to: ${dataDir}\n`)
  
  // 1. Fetch VCGI Parcel Data
  const parcelDatasets = await fetchVCGIData()
  
  // 2. Check Open Data Portal
  await checkVermontOpenDataPortal()
  
  // 3. Check Transfer Data
  await fetchPropertyTransferData()
  
  console.log('\n=================================================')
  console.log('Data Discovery Complete')
  console.log('=================================================\n')
  
  if (parcelDatasets.length > 0) {
    console.log('Next steps:')
    console.log('1. Review the datasets listed above')
    console.log('2. Download the most relevant parcel dataset')
    console.log('3. Run: npm run import data/your-file.csv')
    console.log('\nTo download automatically, update this script with the specific dataset URL')
  } else {
    console.log('No automated data sources found.')
    console.log('You may need to:')
    console.log('1. Contact Vermont Department of Taxes for Grand List access')
    console.log('2. Download data manually from town clerk websites')
    console.log('3. Use VCGI geodata portal: https://geodata.vermont.gov/')
  }
  
  console.log('\nSee DATA_IMPORT_GUIDE.md for manual download instructions.')
}

// Export for use in other scripts
export { fetchVCGIData, downloadGISData, checkVermontOpenDataPortal }

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}
