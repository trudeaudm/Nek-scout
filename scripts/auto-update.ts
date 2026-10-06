import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { importFromVcgi } from './import-vcgi'

const prisma = new PrismaClient()

/**
 * Automated Data Update Script
 *
 * Pulls Northeast Kingdom parcel + Grand List attributes from VCGI's
 * public ArcGIS FeatureServer and upserts them into Postgres.
 */

interface UpdateConfig {
  updateFrequency: 'daily' | 'weekly' | 'monthly'
  lastUpdate?: string
  autoImport: boolean
  minAcres: number
  outOfStateOnly: boolean
}

const DEFAULT_CONFIG: UpdateConfig = {
  updateFrequency: 'daily',
  autoImport: true,
  minAcres: 5,
  outOfStateOnly: false,
}

async function loadConfig(): Promise<UpdateConfig> {
  const configPath = path.join(process.cwd(), 'data', 'update-config.json')

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    return { ...DEFAULT_CONFIG, ...config }
  }

  return { ...DEFAULT_CONFIG }
}

async function saveConfig(config: UpdateConfig) {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const configPath = path.join(dataDir, 'update-config.json')
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

async function shouldUpdate(config: UpdateConfig): Promise<boolean> {
  // Always update when forced via env (used by Render manual runs / boot import)
  if (process.env.FORCE_UPDATE === 'true') return true

  if (!config.lastUpdate) return true

  const lastUpdate = new Date(config.lastUpdate)
  const now = new Date()
  const daysSinceUpdate =
    (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

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

async function logUpdate(
  success: boolean,
  recordsImported: number,
  error?: string
) {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const logPath = path.join(dataDir, 'update-log.json')
  const log = {
    timestamp: new Date().toISOString(),
    success,
    recordsImported,
    error,
  }

  let logs: unknown[] = []
  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
  }

  logs.push(log)
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

    if (!(await shouldUpdate(config))) {
      console.log('Update not needed yet based on frequency setting')
      console.log(`Last update: ${config.lastUpdate}`)
      console.log(`Frequency: ${config.updateFrequency}`)
      return
    }

    if (!config.autoImport) {
      console.log('Auto-import disabled in data/update-config.json')
      return
    }

    console.log('Fetching NEK parcels from VCGI ArcGIS FeatureServer...')
    const result = await importFromVcgi({
      minAcres: config.minAcres,
      outOfStateOnly: config.outOfStateOnly,
      upsert: true,
    })

    config.lastUpdate = new Date().toISOString()
    await saveConfig(config)

    const count = await prisma.parcel.count()
    await logUpdate(true, result.fetched || count)

    console.log(`\n✓ Update complete! Database now has ${count} properties`)
  } catch (error) {
    console.error('Update failed:', error)
    await logUpdate(
      false,
      0,
      error instanceof Error ? error.message : 'Unknown error'
    )
    throw error
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n=================================================')
  console.log('Update Complete')
  console.log('=================================================')
}

export { runUpdate, shouldUpdate }

if (require.main === module) {
  runUpdate().catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}
