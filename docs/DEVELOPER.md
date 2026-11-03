# Developer Guide

> Read [CLAUDE.md](../CLAUDE.md) first for the layer rules. Diagrams are in [architecture.md](architecture.md).

## Architecture overview
The code is layered. The view calls hooks (TanStack), hooks call Server Actions, actions call services, and services call repository interfaces. Supabase or memory implementations sit behind those interfaces, and the pure money math lives in `src/domain`. Every layer depends only on the layers to its right. See [architecture.md §1](architecture.md#1-layers).

## Local setup (step by step)
1. Use Node 22: `nvm install 22 && nvm use` (reads `.nvmrc`).
2. Install dependencies: `npm install`.
3. Create a Supabase project at https://supabase.com, or run it locally with `npx supabase start` (needs Docker).
4. Apply the migrations in `supabase/migrations/`. Either:
   - with the CLI: `npx supabase link --project-ref <ref>` and then `npx supabase db push`, or
   - by pasting each SQL file, in order, into the Supabase SQL editor.
5. Create a **private** Storage bucket named `bill-images`. Migration `0002` does this when it is run through the CLI.
6. Copy `.env.example` to `.env.local` and fill in the values (see below).
7. Run `npm run dev` and open http://localhost:3000.

## Environment variables
| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, **secret** | Used by `repositories/supabase` |
| `SESSION_SECRET` | server only, **secret** | ≥ 32 random chars. Signs the session and share cookies (`openssl rand -base64 32`) |
| `OPENROUTER_API_KEY` | server only, **secret** | OCR |
| `OPENROUTER_MODEL` | server | Vision model id, e.g. a `:free` model (see ADR 0005) |
| `DATA_BACKEND` | server | `supabase` (default) or `memory` (no DB; data is lost on restart, useful for demos) |

## Database schema / migrations
- The SQL lives in `supabase/migrations/NNNN_name.sql`, and the ERD is in [architecture.md §2](architecture.md#2-data-model-erd).
- Every schema change needs a new migration, an update to the repository mapper, and an update to the ERD.
- Regenerate the types with `npm run db:types`. They are written to `src/server/repositories/supabase/db.types.ts`.

## Folder structure
```
src/
  app/[locale]/       routes (thin pages, compose feature components)
  components/ui/      shadcn generated — don't hand-edit
  components/layout/  app shell (header, language toggle)
  components/providers/ QueryProvider etc.
  lib/utils.ts        shadcn `cn()` helper (path required by shadcn CLI)
  features/<name>/    components/ (view) + hooks/ (view logic)
  shared/dto/         zod DTOs used by client + server
  shared/lib/         money, ActionResult, utils
  domain/             pure calculation (split, charges, settlement)
  server/actions/     'use server' entry points
  server/services/    business rules
  server/repositories/{interfaces,supabase,memory}/
  server/providers/ocr/
  server/auth/        password + session
  server/container.ts the only wiring point
  i18n/               next-intl config
messages/             id.json, en.json
supabase/migrations/  SQL
```

## Coding conventions
See [CLAUDE.md → Conventions](../CLAUDE.md#conventions). In short:
- money is an integer;
- every string goes through i18n;
- add TSDoc to every export;
- one commit per logical step.

## Testing
- `npm run check` runs lint, typecheck and the tests in one go. Run it before every commit.
- `npm test` runs all Vitest tests.
- `src/domain/**/*.test.ts` covers the calculation, including rounding and nett-settlement edge cases.
- `src/server/services/**/*.test.ts` runs services against the **memory** repositories (`createMemoryContainer()`), so no DB is needed.

## API documentation
- [server-actions.md](server-actions.md) is the hand-written guide to calling each action from a hook.
- `npm run docs` builds a TypeDoc HTML site from the TSDoc comments into `docs/api/`. Open `docs/api/index.html`.

## Deployment
- Vercel is recommended: import the repo and set the env vars from the table above.
- Supabase: run the migrations against the production project first.

## Troubleshooting
| Problem | Fix |
|---|---|
| `SyntaxError` / unsupported engine on `npm install` | You're on Node 14. Run `nvm use`. |
| `UNAUTHORIZED` from every action | `SESSION_SECRET` is missing or changed. Log in again. |
| OCR returns `OCR_FAILED` | Check `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Free models are rate-limited, so try again or enter the bill manually. |
| ESLint `no-restricted-imports` error | You crossed a layer boundary. Move the code to the right layer (see CLAUDE.md). |
