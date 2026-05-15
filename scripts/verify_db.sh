#!/usr/bin/env bash
set -euo pipefail

# Usage:
# ./scripts/verify_db.sh "postgresql://user:pass@host:5432/dbname"
# or
# DATABASE_URL="postgresql://..." ./scripts/verify_db.sh

DB_URL="${1:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
  echo "Usage: $0 <DATABASE_URL> or set DATABASE_URL env var"
  exit 2
fi

echo "Running schema and RLS scripts against: $DB_URL"
psql "$DB_URL" -f db/schema_mvp.sql
psql "$DB_URL" -f db/rls_policies.sql

echo "Running verification queries..."
psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','habits','habit_completions','daily_tasks','books','weekly_reviews','habit_templates');"
psql "$DB_URL" -c "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('users','habits','habit_completions','daily_tasks','books','weekly_reviews','habit_templates');"
psql "$DB_URL" -c "SELECT id,name FROM habit_templates ORDER BY id;"

echo "Verification complete."
