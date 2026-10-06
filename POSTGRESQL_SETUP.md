# PostgreSQL Setup Guide

Your app has been migrated to PostgreSQL! Follow these steps to deploy with full automation.

## What Changed

✅ Migrated from SQLite to PostgreSQL
✅ Updated Prisma schema
✅ Removed SQLite dependencies
✅ Updated render.yaml with:
   - PostgreSQL database
   - Web service
   - Cron job for automated updates

## Deploy to Render

### Option 1: Use Blueprint (Easiest)

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +"** → **"Blueprint"**

3. **Connect Repository**:
   - Select your GitHub account
   - Choose repository: `trudeaudm/Nek-scout`
   - Branch: `main`

4. **Render will detect `render.yaml`** and show:
   - ✅ nek-scout-db (PostgreSQL database)
   - ✅ nek-scout (Web service)
   - ✅ nek-scout-updater (Cron job)

5. **Click "Apply"**

That's it! Render will:
- Create PostgreSQL database
- Deploy web app
- Set up daily cron job
- Connect everything automatically

### Option 2: Manual Setup

If blueprint doesn't work:

**Step 1: Create PostgreSQL Database**
1. Go to Render Dashboard → **New +** → **PostgreSQL**
2. Name: `nek-scout-db`
3. Database: `nekscout`
4. User: `nekscout`
5. Plan: **Free**
6. Click **Create Database**
7. **Copy the "Internal Database URL"**

**Step 2: Update Web Service**
1. Go to your existing `nek-scout` web service
2. **Environment** tab → Add variable:
   - Key: `DATABASE_URL`
   - Value: (paste the Internal Database URL)
3. **Settings** tab → Build Command:
   ```
   npm install && npx prisma generate && npm run build
   ```
4. **Settings** tab → Start Command:
   ```
   npm start
   ```
5. Save and it will auto-deploy

**Step 3: Add Cron Job**
1. Go to Render Dashboard → **New +** → **Cron Job**
2. Name: `nek-scout-updater`
3. Runtime: **Node**
4. Build Command:
   ```
   npm install && npx prisma generate
   ```
5. Start Command:
   ```
   npm run auto-update
   ```
6. Schedule: `0 2 * * 0` (Every Sunday at 2am)
7. **Environment** tab → Add:
   - Key: `DATABASE_URL`
   - Value: (same Internal Database URL)
8. Click **Create Cron Job**

## First Deployment

On first deploy, the database will be empty. The migrations will create all tables automatically.

To import initial data:

### Option A: Via Render Shell (Manual)

1. Go to your web service → **Shell** tab
2. Run:
   ```bash
   npm run fetch-data
   # Review available datasets
   
   # If data is found and downloaded:
   npm run import data/automated/[filename].csv
   ```

### Option B: Locally Then Deploy

1. Set DATABASE_URL to your Render PostgreSQL URL:
   ```bash
   export DATABASE_URL="postgresql://..."
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Import data:
   ```bash
   npm run auto-update
   # or
   npm run import data/your-file.csv
   ```

## Verify Everything Works

### 1. Check Database

Go to Render → nek-scout-db → **Query** tab:

```sql
SELECT COUNT(*) FROM "Parcel";
```

Should show your imported properties.

### 2. Check Web App

Visit: `https://nek-scout.onrender.com`

Should show properties if data was imported.

### 3. Check Cron Job

Go to Render → nek-scout-updater:
- Should show "Deployed"
- Next run time displayed
- Can click "Trigger Run" to test

## Automated Updates

The cron job will now:
- ✅ Run every day at 2am UTC
- ✅ Check for new Vermont property data
- ✅ Download automatically
- ✅ Import into shared PostgreSQL database
- ✅ Updates appear in web app immediately

## Monitor Updates

Check cron job logs:
1. Go to nek-scout-updater service
2. Click **Logs** tab
3. See update results

## Configuration

To change update frequency:

1. Go to nek-scout-updater service
2. **Settings** → **Schedule**
3. Change cron expression:
   - Daily: `0 2 * * *`
   - Weekly: `0 2 * * 0`
   - Monthly: `0 2 1 * *`

## Costs

✅ **All Free Tier:**
- PostgreSQL: Free (1GB storage)
- Web Service: Free
- Cron Job: Free

## Troubleshooting

### "Migration failed"

Run migrations manually in Shell:
```bash
npx prisma migrate deploy
```

### "Can't connect to database"

Check DATABASE_URL is set correctly in Environment variables.

### "Cron job not running"

- Verify schedule is correct cron format
- Check logs for errors
- Try "Trigger Run" button to test

### "No data showing"

Database is empty - import data:
```bash
npm run fetch-data
npm run auto-update
```

## Next Steps

1. ✅ Deploy via Blueprint or manual setup
2. ✅ Verify database connected
3. ✅ Import initial data
4. ✅ Test cron job
5. ✅ Monitor first automated update

Your app is now production-ready with full automation! 🚀


## Initial Data Import

On first boot, `scripts/start.sh` runs migrations and, if the database is empty, imports NEK parcels (>=5 acres) from the VCGI ArcGIS FeatureServer.

Manual import (Render Shell or local with DATABASE_URL):

```bash
npm run import:vcgi
npm run import:vcgi -- --oos --min-acres=5
npm run import:vcgi -- --limit=100
FORCE_UPDATE=true npm run auto-update
```
