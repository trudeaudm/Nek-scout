#!/bin/bash
set -e

echo "Running database migrations..."
# The production database was created before migrations existed, so the init
# migration's CREATE TABLE statements fail when the tables are already there.
if ! npx prisma migrate deploy; then
  echo "migrate deploy failed. Baselining the existing schema..."
  npx prisma migrate resolve --rolled-back 20261006171500_init >/dev/null 2>&1 || true
  npx prisma migrate resolve --applied 20261006171500_init
  npx prisma db push --skip-generate
fi

echo "Starting application..."
# Kick off an initial VCGI import in the background when the DB is empty.
# Keeping this off the critical path so Render health checks pass quickly.
if [ "${SKIP_BOOT_IMPORT}" != "true" ]; then
  (
    set +e
    PARCEL_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.parcel.count()
  .then((c) => { console.log(c); return prisma.\$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.\$disconnect(); process.exit(1); });
" 2>/dev/null)

    if [ "${PARCEL_COUNT}" = "0" ]; then
      echo "Database empty — background import of NEK parcels from VCGI starting..."
      IMPORT_ARGS="--min-acres=${IMPORT_MIN_ACRES:-5}"
      if [ "${IMPORT_OOS_ONLY}" = "true" ]; then
        IMPORT_ARGS="${IMPORT_ARGS} --oos"
      fi
      npx tsx scripts/import-vcgi.ts ${IMPORT_ARGS} \
        >> /tmp/nek-scout-boot-import.log 2>&1 \
        && echo "Background import finished successfully." \
        || echo "Background import failed. Check /tmp/nek-scout-boot-import.log or run: npm run import:vcgi"
    else
      echo "Skipping boot import; parcel count is ${PARCEL_COUNT}."
    fi
  ) &
fi

npm start
