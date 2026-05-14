#!/bin/sh
set -e

echo "==> Running database migrations..."
cd /app/server
# 'yes' pipes 'y' to any interactive prompts drizzle-kit may show
yes | bunx drizzle-kit push || true

echo "==> Starting server..."
exec bun run /app/server/src/index.ts
