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
   > **No Supabase yet?** Set `DATA_BACKEND=memory` and a `SESSION_SECRET`, and you can run the app with no database. Data is lost on restart.
7. Run `npm run dev` and open http://localhost:3000.

## Environment variables
| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, **secret** | Used by `repositories/supabase` |
| `SESSION_SECRET` | server only, **secret** | ≥ 32 random chars. Signs the session and share cookies (`openssl rand -base64 32`) |
| `OPENROUTER_API_KEY` | server only, **secret** | OCR |
| `OPENROUTER_MODEL` | server | Vision model id, e.g. a `:free` model (see ADR 0005). Empty means OCR is disabled. |
| `DATA_BACKEND` | server | `supabase` (default) or `memory` (no DB; data is lost on restart, useful for demos) |
| `APP_URL` | server | Public base URL used in share links |
| `SUPABASE_TEST_URL` / `SUPABASE_TEST_SERVICE_ROLE_KEY` | tests only | Optional. Runs the repository contract tests against a throwaway Supabase project |

## Database schema / migrations
- `supabase/migrations/20261103000001_init.sql` creates the tables, constraints, RLS (deny-all) and the `save_bill(jsonb)` function. That function saves a bill with its items, allocations and charges in **one transaction**, and refuses to move a bill to another event.
- `supabase/migrations/20261103000002_storage.sql` creates the private `bill-images` bucket (5 MB, jpeg/png/webp).
- The DB **cannot** check that `paid_by` or allocation participants belong to the bill's event. `BillService` validates this.
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
  features/<name>/    components/ (view) + hooks/ (view logic) + containers/ (glue)
  components/form/    shared form views (TextField, error translation)
  proxy.ts            locale prefix + optimistic redirect to /login for /events/*
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
- `src/server/repositories/contract.test.ts` holds the **same tests for every backend**. Memory always runs. Supabase runs when the `SUPABASE_TEST_*` vars are set. A new database backend is "done" when this file passes against it.
- `src/server/services/**/*.test.ts` runs services against the **memory** repositories (`createMemoryContainer()`), so no DB is needed.

## OCR
- `src/server/providers/ocr/ocr-provider.ts` holds the `OcrProvider` port and the shared receipt prompt. `openrouter.ts` is the implementation.
- `src/server/services/ocr-normalize.ts` is pure and tested: model JSON (major units) becomes form values (minor units).
- To add a provider, implement `OcrProvider` and return it from `createOcrProvider()` in `container.ts`.

## API documentation
- [server-actions.md](server-actions.md) is the hand-written guide to calling each action from a hook.
- `npm run docs` builds a TypeDoc HTML site from the TSDoc comments into `docs/api/`. Open `docs/api/index.html`.

## Manual end-to-end check (before a release)
1. Register, log out, log in (also try a wrong password).
2. Create an event and add 3 people. Rename one and remove one.
3. Add a bill from a photo (with OCR configured) and check that the draft is prefilled. Fix it, choose the payer, and save.
4. Add a second bill by hand. Use custom portions on one item (e.g. qty 3 → 2 + 1). Add tax 10% and service 5%.
5. On the summary, check that the per-person totals add up to the bill totals, and switch between Nett and Per bill.
6. Download the Excel and image exports.
7. Share with a passcode and open the link in a private window: wrong code, right code, view only.
8. Switch between ID and EN on every page.

## Deployment
- Vercel is recommended: import the repo and set the env vars from the table above.
- Supabase: run the migrations against the production project first.

## Troubleshooting
| Problem | Fix |
|---|---|
| `SyntaxError` / unsupported engine on `npm install` | You're on Node 14. Run `nvm use`. |
| Password visible in the dev terminal | It shouldn't be: `logging.serverFunctions` is turned off in `next.config.ts`. Keep it off. |
| `UNAUTHORIZED` from every action | `SESSION_SECRET` is missing or changed. Log in again. |
| Upload says "Automatic reading is not set up" | Set both `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`, then restart `npm run dev`. |
| OCR always says "Could not read" | The server log shows `[ocr] extraction failed: ...`. Usually the model isn't vision-capable, is rate-limited, or no longer exists. Pick another one from the free vision list. |
| OCR returns `OCR_FAILED` | Check `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Free models are rate-limited, so try again or enter the bill manually. |
| ESLint `no-restricted-imports` error | You crossed a layer boundary. Move the code to the right layer (see CLAUDE.md). |
