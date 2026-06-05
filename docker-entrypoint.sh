#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Waiting for PostgreSQL database to be ready..."
until pg_isready -h db -U postgres; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

echo "Database is ready! Running migrations..."
npx prisma db push

echo "Running seed script..."
npx prisma db seed

echo "Starting Next.js server..."
exec npm run start
