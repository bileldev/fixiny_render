#!/bin/sh
# entrypoint.sh

set -e

FLAG_FILE="/app/.db_seeded"

DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+):.*|\1|')

echo "[debug] DATABASE_URL: $DATABASE_URL"
env

#DB_PORT=5432
if [ -z "$DATABASE_URL" ]; then
  echo "[error] DATABASE_URL is not set!"
  exit 1
fi
echo "[init] Waiting for the database to be ready at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "⏳ Waiting for $DB_HOST:$DB_PORT..."
  sleep 1
done

echo "[init] Database is ready."

# Run migrations every time the container starts
echo "[init] Running Prisma migrations..."
npx prisma migrate deploy

# Seed only once
if [ ! -f "$FLAG_FILE" ]; then
  echo "[init] Running one-time DB seed…"
  npm run seed || exit 1
  touch "$FLAG_FILE"
else
  echo "[init] DB already seeded, skipping…"
fi

echo "[init] Starting Express…"
exec npm start