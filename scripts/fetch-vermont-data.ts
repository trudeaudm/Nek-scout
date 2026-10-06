import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import { NEK_TOWNS } from './import-vcgi'

/**
 * Discover / probe Vermont public parcel data sources.
 * Primary source: VCGI ArcGIS FeatureServer (parcels + Grand List join).
 */

const FEATURE_SERVER_URL =
  'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/ArcGIS/rest/services/FS_VCGI_OPENDATA_Cadastral_VTPARCELS_poly_standardized_parcels_SP_v1/FeatureServer/0'

async function fetchVCGIData() {
  console.log('Checking VCGI ArcGIS FeatureServer...')

  try {
    const meta = await axios.get(FEATURE_SERVER_URL, {
      params: { f: 'json' },
      timeout: 15000,
    })

    console.log(`✓ Layer: ${meta.data.name}`)
    console.log(`  Description: ${meta.data.description?.slice(0, 160)}...`)
    console.log(`  Max record count: ${meta.data.maxRecordCount}`)

    const towns = Object.values(NEK_TOWNS).flat()
    const townList = towns.map((t) => `'${t.replace(/'/g, "''")}'`).join(',')
    const where = `TNAME IN (${townList}) AND PROPTYPE='PARCEL' AND OWNER1 IS NOT NULL AND ACRESGL>=5`

    const countResponse = await axios.get(`${FEATURE_SERVER_URL}/query`, {
      params: {
        where,
        returnCountOnly: true,
        f: 'json',
      },
      timeout: 30000,
    })

    console.log(
      `✓ NEK parcels (>=5 acres, with owner): ${countResponse.data.count}`
    )

    return [
      {
        title: meta.data.name,
        metadata_modified: new Date().toISOString(),
        resources: [
          {
            name: 'ArcGIS FeatureServer Query',
            format: 'JSON',
            url: `${FEATURE_SERVER_URL}/query`,
          },
        ],
      },
    ]
  } catch (error) {
    console.error('Error fetching VCGI FeatureServer:', error)
    return []
  }
}

async function downloadGISData(url: string, outputPath: string) {
  console.log(`Downloading from ${url}...`)

  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
    timeout: 120000,
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
}

async function main() {
  console.log('=================================================')
  console.log('Vermont Property Data Automation Script')
  console.log('=================================================\n')

  const dataDir = path.join(process.cwd(), 'data', 'automated')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const datasets = await fetchVCGIData()

  console.log('\n=================================================')
  console.log('Data Discovery Complete')
  console.log('=================================================\n')

  if (datasets.length > 0) {
    console.log('Next steps:')
    console.log('  npm run import:vcgi')
    console.log('  npm run import:vcgi -- --oos --min-acres=5')
    console.log('  npm run auto-update')
  } else {
    console.log('Could not reach the VCGI FeatureServer.')
    console.log('See DATA_IMPORT_GUIDE.md for manual import options.')
  }
}

export { fetchVCGIData, downloadGISData }

if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}
