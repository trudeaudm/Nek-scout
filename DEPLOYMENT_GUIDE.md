# Deployment Guide - Render & Production Setup

## Current Deployment Status

✅ **Web app is live** at: `https://nek-scout.onrender.com`  
✅ **Using**: Render Free tier, SQLite database  
⚠️ **Limitation**: SQLite is local to each service (can't share between web app and cron jobs)

## SQLite Limitation on Render

**The Issue:**
- Render's free tier uses **ephemeral filesystems**
- Each service (web, cron) has its **own separate filesystem**
- SQLite database file can't be shared between services
- Cron job would update a **different database** than the web app uses

**Result:** Automated updates with SQLite won't work across separate Render services.

## Solutions for Automated Updates

### Option 1: Upgrade to PostgreSQL (Recommended for Production)

**Pros:**
- ✅ Both web app and cron job access same database
- ✅ No file sync issues
- ✅ Better for production
- ✅ Render offers free PostgreSQL

**Setup:**

1. **Create PostgreSQL database** in Render:
   - Go to Render Dashboard → New → PostgreSQL
   - Name: `nek-scout-db`
   - Plan: Free
   - Copy the "Internal Database URL"

2. **Update DATABASE_URL** in both services:
   ```
   DATABASE_URL=postgresql://user:pass@host/db
   ```

3. **Update Prisma schema** (`prisma/schema.prisma`):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Update Prisma client** (`lib/prisma.ts`) - remove SQLite adapter
   
5. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```

6. **Deploy both services** with new DATABASE_URL

**Then add the cron job:**

```yaml
# Add to render.yaml
- type: cron
  name: nek-scout-updater
  runtime: node
  plan: free
  schedule: "0 2 * * 0"
  buildCommand: npm install
  startCommand: npm run auto-update
  envVars:
    - key: DATABASE_URL
      fromDatabase:
        name: nek-scout-db
        property: connectionString
```

### Option 2: GitHub Actions (Free, works with SQLite)

**Pros:**
- ✅ Free
- ✅ Works with current SQLite setup
- ✅ No database migration needed
- ✅ Updates committed to repo

**Setup:**

Create `.github/workflows/update-data.yml`:

```yaml
name: Update Vermont Property Data

on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2am UTC
  workflow_dispatch:  # Manual trigger button

jobs:
  update:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run migrations
        run: npx prisma migrate deploy
      
      - name: Fetch and import data
        run: npm run auto-update
      
      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add prisma/dev.db data/
          git diff --quiet && git diff --staged --quiet || git commit -m "chore: automated data update [skip ci]"
          git push
```

**How it works:**
1. Runs weekly on schedule
2. Fetches latest Vermont data
3. Updates SQLite database
4. Commits database back to repo
5. Render auto-deploys with new data

### Option 3: Manual Updates (Simplest)

**Pros:**
- ✅ Complete control
- ✅ No automation setup needed
- ✅ Works with free tier

**Process:**
1. Run locally: `npm run auto-update`
2. Commit and push: `git add . && git commit -m "update data" && git push`
3. Render auto-deploys

## Current render.yaml

Your current `render.yaml` defines:
- ✅ Web service (already running)
- ❌ No cron job (SQLite limitation)

## Recommended Production Setup

For a production deployment:

```yaml
services:
  # PostgreSQL Database
  - type: database
    name: nek-scout-db
    plan: free
    databaseName: nekscout
    
  # Web Application
  - type: web
    name: nek-scout
    runtime: node
    plan: starter  # $7/mo for better performance
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: nek-scout-db
          property: connectionString
      - key: NODE_ENV
        value: production
    
  # Data Updater Cron Job
  - type: cron
    name: nek-scout-updater
    runtime: node
    plan: free
    schedule: "0 2 * * 0"
    buildCommand: npm install
    startCommand: npm run auto-update
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: nek-scout-db
          property: connectionString
```

## Migration Path: SQLite → PostgreSQL

If you want to migrate:

1. **Export current SQLite data**:
   ```bash
   npx prisma db pull
   ```

2. **Update schema to PostgreSQL**

3. **Create PostgreSQL database** on Render

4. **Run migrations**:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

5. **Import data** (if any):
   ```bash
   DATABASE_URL="postgresql://..." npm run import data/export.csv
   ```

## Which Option Should You Choose?

**For MVP/Testing:** 
→ **Manual updates** or **GitHub Actions** (keep SQLite)

**For Production:**
→ **PostgreSQL + Render Cron** (Option 1)

**Current Cost:**
- ✅ Free: Web app + SQLite + GitHub Actions
- 💰 Free: Web app + PostgreSQL + Cron Job (all Render free tier)
- 💰 $7/mo: Starter plan for better performance

## Next Steps

1. **Choose your automation approach**
2. **Follow setup for that option**
3. **Test with sample data first**
4. **Monitor logs and updates**

## Questions?

- **"Can I stay on free tier?"** - Yes, use GitHub Actions for updates
- **"Should I use PostgreSQL?"** - Yes if you want Render Cron automation
- **"Can I test before going live?"** - Yes, use GitHub Actions in draft mode
