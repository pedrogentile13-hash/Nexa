#!/usr/bin/env bash
# ============================================================================
# Applies every migration + seed + the SQL test suite to a throwaway database.
#
# This is what proves the schema, the RLS policies and the grade views actually
# work — the grade math is the one thing in Nexa that cannot be "probably right".
#
# Usage:
#   scripts/test-db.sh                     # uses PGHOST/PGPORT/PGUSER from env
#   PGPORT=55432 scripts/test-db.sh
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${NEXA_TEST_DB:-nexa_test}"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-55432}"
export PGUSER="${PGUSER:-postgres}"

psql -q -d postgres -v ON_ERROR_STOP=1 \
  -c "drop database if exists ${DB_NAME};" \
  -c "create database ${DB_NAME};"

run() { psql -q -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "$1"; }

echo "→ auth stub"
run "${ROOT}/supabase/tests/00_local_auth_stub.sql"

echo "→ migrations"
for f in "${ROOT}"/supabase/migrations/*.sql; do
  echo "   $(basename "$f")"
  run "$f"
done

echo "→ seed"
run "${ROOT}/supabase/seed.sql"

echo "→ tests"
for f in "${ROOT}"/supabase/tests/[1-9]*.sql; do
  echo "   $(basename "$f")"
  run "$f"
done

echo "✓ database suite passed"
