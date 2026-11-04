# 0007: CI applies migrations, then deploys

## Context
We want every merged feature to reach production with no manual steps, and that includes database changes. Vercel's Git integration deploys on every push, but it doesn't know about Supabase migrations. If code reaches production before the migration it needs, users get errors. Running migrations inside the Vercel build is also unsafe: preview builds would migrate the production database.

## Decision
A single GitHub Actions workflow (`.github/workflows/ci-deploy.yml`) handles both:
- **Pull request:** check (lint, typecheck, tests, build).
- **Push to `main`:** check → migrate → deploy.
  - **migrate** runs `npm run db:migrate`. That is `supabase db push` against the `SUPABASE_DB_URL` secret. It is history-tracked, so only new files run.
  - **deploy** runs `vercel pull/build/deploy --prebuilt --prod` with the Vercel CLI.
- `vercel.json` disables Vercel's Git deploy for `main`, so production is only deployed by the workflow. PR previews from Vercel stay on, and use `DATA_BACKEND=memory`.
- Production secrets live in the GitHub environment `production`.

## Consequences
- Production order is always **migrate, then deploy**. A failing check or migration stops the release.
- For about a minute, the **old code runs on the new schema**, so migrations must be backward compatible: additive changes, and renames or drops done in two releases. This is described in DEVELOPER.md.
- Migrations are never edited after they are applied. Fixes go in a new file.
- Manual SQL-editor changes must be recorded with `supabase migration repair`, or CI will try to re-run them.
