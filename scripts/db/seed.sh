#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must be set before running seeds." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run seeds." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

for seed in "$ROOT_DIR"/packages/database/seeds/*.sql; do
  echo "Seeding $(basename "$seed")"
  psql "$DATABASE_URL" -X --no-psqlrc --set ON_ERROR_STOP=1 --file "$seed"
done
