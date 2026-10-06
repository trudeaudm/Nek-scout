import { fetchVCGIData, downloadGISData } from './fetch-vermont-data'
import { importFromCSV } from './import-csv'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'

const prisma = new PrismaClient()

/**
 * Automated Data Update Script
 * 
 * This script can be run on a schedule (e.g., weekly or monthly) to:
 * 1. Check for new Vermont property data
 * 2. Download updates
 * 3. Import into database
 * 4. Log results
 */

interface UpdateConfig {
  dataSourceUrl?: string
  updateFrequency: 'daily' | 'weekly' | 'monthly'
  lastUpdate?: Date
  autoImport: boolean
}

const DEFAULT_CONFIG: UpdateConfig = {
  updateFrequency: 'weekly',
  autoImport: true
}

async function loadConfig(): Promise<UpdateConfig> {
  const configPath = path.join(process.cwd(), 'data', 'update-config.json')
  
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    return { ...DEFAULT_CONFIG, ...config }
  }
  
  return DEFAULT_CONFIG
}

async function saveConfig(config: UpdateConfig) {
  const configPath = path.join(process.cwd(), 'data', 'update-config.json')
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

async function shouldUpdate(config: UpdateConfig): Promise<boolean> {
  if (!config.lastUpdate) return true
  
  const lastUpdate = new Date(config.lastUpdate)
  const now = new Date()
  const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
  
  switch (config.updateFrequency) {
    case 'daily':
      return daysSinceUpdate >= 1
    case 'weekly':
      return daysSinceUpdate >= 7
    case 'monthly':
      return daysSinceUpdate >= 30
    default:
      return false
  }
}

async function checkForUpdates() {
  console.log('Checking for data updates...')
  
  // Check VCGI for new parcel data
  const datasets = await fetchVCGIData()
  
  if (datasets && datasets.length > 0) {
    // Look for the most recently updated statewide parcel dataset
    const statewideDatasets = datasets.filter((d: any) => 
      d.title.toLowerCase().includes('statewide') ||
      d.title.toLowerCase().includes('vermont parcel')
    )
    
    if (statewideDatasets.length > 0) {
      const latest = statewideDatasets[0]
      console.log(`Found latest dataset: ${latest.title}`)
      console.log(`Last updated: ${latest.metadata_modified}`)
      
      return {
        available: true,
        dataset: latest,
        resources: latest.resources
      }
    }
  }
  
  return { available: false }
}

async function downloadLatestData(dataset: any): Promise<string | null> {
  const dataDir = path.join(process.cwd(), 'data', 'automated')
  
  // Look for CSV or GeoJSON resources
  const csvResource = dataset.resources?.find((r: any) => 
    r.format?.toLowerCase() === 'csv'
  )
  
  const geojsonResource = dataset.resources?.find((r: any) => 
    r.format?.toLowerCase() === 'geojson' || r.format?.toLowerCase() === 'json'
  )
  
  const resource = csvResource || geojsonResource
  
  if (!resource) {
    console.log('No CSV or GeoJSON resource found')
    return null
  }
  
  const filename = `vermont-parcels-${new Date().toISOString().split('T')[0]}.${resource.format.toLowerCase()}`
  const outputPath = path.join(dataDir, filename)
  
  try {
    await downloadGISData(resource.url, outputPath)
    return outputPath
  } catch (error) {
    console.error('Download failed:', error)
    return null
  }
}

async function logUpdate(success: boolean, recordsImported: number, error?: string) {
  const logPath = path.join(process.cwd(), 'data', 'update-log.json')
  const log = {
    timestamp: new Date().toISOString(),
    success,
    recordsImported,
    error
  }
  
  let logs = []
  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
  }
  
  logs.push(log)
  
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs = logs.slice(-100)
  }
  
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2))
}

async function runUpdate() {
  console.log('=================================================')
  console.log('Automated Data Update')
  console.log(`Started: ${new Date().toISOString()}`)
  console.log('=================================================\n')
  
  try {
    const config = await loadConfig()
    
    if (!await shouldUpdate(config)) {
      console.log('Update not needed yet based on frequency setting')
      console.log(`Last update: ${config.lastUpdate}`)
      console.log(`Frequency: ${config.updateFrequency}`)
      return
    }
    
    console.log('Checking for new data...')
    const updateCheck = await checkForUpdates()
    
    if (!updateCheck.available) {
      console.log('No new data available')
      return
    }
    
    console.log('New data available!')
    
    if (config.autoImport) {
      console.log('Downloading...')
      const filePath = await downloadLatestData(updateCheck.dataset)
      
      if (filePath && fs.existsSync(filePath)) {
        console.log('Importing data...')
        
        // Import the data
        if (filePath.endsWith('.csv')) {
          await importFromCSV(filePath)
        } else if (filePath.endsWith('.json') || filePath.endsWith('.geojson')) {
          console.log('GeoJSON import not yet implemented')
          console.log('Convert to CSV first or implement GeoJSON parser')
        }
        
        // Get count of imported records
        const count = await prisma.parcel.count()
        
        console.log(`\n✓ Update complete! Database now has ${count} properties`)
        
        // Update config
        config.lastUpdate = new Date()
        await saveConfig(config)
        
        // Log success
        await logUpdate(true, count)
      } else {
        console.log('Download failed')
        await logUpdate(false, 0, 'Download failed')
      }
    } else {
      console.log('Auto-import disabled. To import, run:')
      console.log('npm run import data/automated/[filename]')
    }
    
  } catch (error) {
    console.error('Update failed:', error)
    await logUpdate(false, 0, error instanceof Error ? error.message : 'Unknown error')
  } finally {
    await prisma.$disconnect()
  }
  
  console.log('\n=================================================')
  console.log('Update Complete')
  console.log('=================================================')
}

// Export for testing
export { runUpdate, checkForUpdates, shouldUpdate }

// Run if called directly
if (require.main === module) {
  runUpdate().catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}
