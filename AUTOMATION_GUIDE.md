# Automated Data Updates Guide

This guide explains how to set up automated property data updates for NEK Scout.

## Overview

The automation system can:
- ✅ Check Vermont data sources for updates
- ✅ Download new property data automatically  
- ✅ Import data into the database
- ✅ Run on a schedule (daily, weekly, or monthly)
- ✅ Log all updates for auditing

## Quick Start

### 1. Discover Available Data Sources

```bash
tsx scripts/fetch-vermont-data.ts
```

This will:
- Check Vermont Open Geodata Portal (VCGI)
- List available parcel datasets
- Show download URLs
- Identify API endpoints

### 2. Configure Auto-Updates

Create `data/update-config.json`:

```json
{
  "dataSourceUrl": "https://geodata.vermont.gov/...",
  "updateFrequency": "weekly",
  "autoImport": true,
  "lastUpdate": null
}
```

Options:
- `updateFrequency`: "daily" | "weekly" | "monthly"
- `autoImport`: true (auto-import) or false (download only)
- `dataSourceUrl`: Direct URL to Vermont data (optional)

### 3. Run Manual Update

```bash
tsx scripts/auto-update.ts
```

This will:
- Check if update is needed based on frequency
- Download latest data
- Import into database
- Update lastUpdate timestamp
- Log results

### 4. Schedule Automatic Updates

#### Option A: Using Cron (Linux/Mac)

Edit crontab:
```bash
crontab -e
```

Add one of these lines:

**Weekly (Sundays at 2am):**
```bash
0 2 * * * cd /path/to/nek-scout && tsx scripts/auto-update.ts >> data/cron.log 2>&1
```

**Monthly (1st of month at 2am):**
```bash
0 2 1 * * cd /path/to/nek-scout && tsx scripts/auto-update.ts >> data/cron.log 2>&1
```

**Daily (2am):**
```bash
0 2 * * * cd /path/to/nek-scout && tsx scripts/auto-update.ts >> data/cron.log 2>&1
```

#### Option B: Using Render Cron Jobs

If hosting on Render:

1. Go to your Render dashboard
2. Add a new **Cron Job** service
3. Use this configuration:
   - **Name**: nek-scout-data-update
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Schedule**: `0 2 * * *` (every day at 2am)
   - **Command**: `tsx scripts/auto-update.ts`
   - **Branch**: main

Render will run the update automatically on schedule.

#### Option C: GitHub Actions

Create `.github/workflows/update-data.yml`:

```yaml
name: Update Vermont Property Data

on:
  schedule:
    - cron: '0 2 * * *'  # Every day at 2am UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-data:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run data update
        run: tsx scripts/auto-update.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Commit updated database
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add prisma/dev.db data/
          git commit -m "chore: automated data update" || echo "No changes"
          git push
```

## Update Logs

All updates are logged to `data/update-log.json`:

```json
[
  {
    "timestamp": "2024-10-06T02:00:00.000Z",
    "success": true,
    "recordsImported": 1234,
    "error": null
  }
]
```

View recent updates:
```bash
cat data/update-log.json | jq '.[-5:]'
```

## Data Sources

The automation system checks these sources:

### 1. Vermont Open Geodata Portal (VCGI)
- **URL**: https://geodata.vermont.gov/
- **API**: CKAN-based API
- **Data**: Statewide parcel boundaries, tax data
- **Format**: GeoJSON, CSV, Shapefile
- **Update Frequency**: Varies by dataset

### 2. Vermont Property Transfer Database
- **URL**: https://tax.vermont.gov/property-transfer-tax
- **Format**: May require manual access
- **Contains**: Sale dates, prices, transfer types

### 3. Town-Specific Sources
- Some towns publish their own open data
- May have more current information
- Check individual town websites

## Customization

### Add Custom Data Source

Edit `scripts/fetch-vermont-data.ts`:

```typescript
const VERMONT_DATA_SOURCES: DataSource[] = [
  // Add your custom source
  {
    name: 'Custom Source',
    url: 'https://example.com/api/parcels',
    type: 'api',
    description: 'Description'
  }
]
```

### Change Update Logic

Edit `scripts/auto-update.ts` to customize:
- When updates run
- What data is downloaded
- How duplicates are handled
- Notification settings

### Add Notifications

Add email/Slack notifications on update:

```typescript
// In auto-update.ts, after successful import
await sendNotification({
  message: `Updated ${count} properties`,
  timestamp: new Date()
})
```

## Troubleshooting

### "No automated data sources found"

- Vermont may not have public APIs for all data
- Check VCGI manually: https://geodata.vermont.gov/
- Contact Vermont Dept of Taxes for API access
- May need to combine manual + automated approach

### "Download failed"

- Check internet connection
- Verify data source URL is still valid
- Check file permissions on `/data` directory
- Try manual download first to test

### "Import failed"

- Check CSV column mappings in `import-csv.ts`
- Verify data format matches expected schema
- Check database has space
- Review error logs

### Updates not running on schedule

**Cron:**
- Check cron service is running: `sudo service cron status`
- Verify crontab: `crontab -l`
- Check logs: `cat data/cron.log`

**Render:**
- Verify cron job is enabled in dashboard
- Check job logs in Render UI
- Ensure environment variables are set

## Best Practices

1. **Test First**: Run manual update before scheduling
2. **Monitor Logs**: Check `update-log.json` regularly
3. **Backup Data**: Keep database backups before bulk updates
4. **Verify Sources**: Data sources may change - verify quarterly
5. **Start Weekly**: Begin with weekly updates, adjust as needed
6. **Handle Duplicates**: Import script skips existing parcels by ID

## Production Deployment

For production use:

1. **Set up monitoring** - Alert on failed updates
2. **Use database backups** - Before each update
3. **Add data validation** - Check imported data quality
4. **Log to external service** - CloudWatch, DataDog, etc.
5. **Set up rollback** - Ability to restore previous data
6. **Rate limiting** - Don't overwhelm data sources
7. **Error notifications** - Email/Slack on failures

## Support

If you need help with automation:
- Review logs in `data/update-log.json`
- Check `data/cron.log` for cron errors
- Verify data source access
- Contact Vermont data providers for API documentation
