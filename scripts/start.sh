#!/bin/bash
set -e

export DATABASE_URL="file:./prisma/dev.db"

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run seed

echo "Starting application..."
npm start
