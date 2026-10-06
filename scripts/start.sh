#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Database ready. Starting application..."
echo "Note: Database is empty. Use import scripts to load real data."
npm start
