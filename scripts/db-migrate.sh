#!/usr/bin/env sh
# ─────────────────────────────────────────────────────────────────────
# Apply NEW migrations from supabase/migrations/ to the database in
# SUPABASE_DB_URL. Supabase records applied versions in
# supabase_migrations.schema_migrations, so every file runs exactly once.
#
#   npm run db:migrate          apply pending migrations
#   npm run db:migrate -- --dry-run   only list what would be applied
#
# Locally the URL is read from .env.local; in CI it comes from the
# SUPABASE_DB_URL GitHub secret (.github/workflows/ci-deploy.yml).
# ─────────────────────────────────────────────────────────────────────
set -eu

if [ -z "${SUPABASE_DB_URL:-}" ] && [ -f .env.local ]; then
  # read only this one line; don't source the whole file (values may contain & ; etc.)
  SUPABASE_DB_URL=$(grep -E '^SUPABASE_DB_URL=' .env.local | head -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')
fi
if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL is not set. Dashboard → Connect → Session pooler URI (see .env.example)." >&2
  exit 1
fi

exec npx -y supabase@3 db push --remote="$SUPABASE_DB_URL" --yes "$@"
