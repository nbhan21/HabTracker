param(
  [string]$DatabaseUrl = $(if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "" })
)

if (-not $DatabaseUrl) {
  Write-Host "Usage: .\\scripts\\verify_db.ps1 -DatabaseUrl <connection_string>" -ForegroundColor Yellow
  exit 2
}

Write-Host "Running schema and RLS scripts against: $DatabaseUrl"
& psql $DatabaseUrl -f db/schema_mvp.sql
& psql $DatabaseUrl -f db/rls_policies.sql

Write-Host "Running verification queries..."
& psql $DatabaseUrl -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','habits','habit_completions','daily_tasks','books','weekly_reviews','habit_templates');"
& psql $DatabaseUrl -c "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('users','habits','habit_completions','daily_tasks','books','weekly_reviews','habit_templates');"
& psql $DatabaseUrl -c "SELECT id,name FROM habit_templates ORDER BY id;"

Write-Host "Verification complete."
