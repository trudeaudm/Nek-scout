#!/bin/bash
set -e

export DATABASE_URL="file:./prisma/dev.db"

echo "Running database migrations..."
npx prisma migrate deploy

echo "Database ready. Starting application..."
echo "Note: Database is empty. Use import scripts to load real data."
npm start
