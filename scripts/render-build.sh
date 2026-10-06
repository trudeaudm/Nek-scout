#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Setting DATABASE_URL..."
export DATABASE_URL="file:./prisma/dev.db"

echo "Building application..."
npm run build

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run seed

echo "Build complete!"
