# 0002 — Supabase behind a repository layer

**Status:** Accepted · 2026-11-03

## Context
Supabase gives us Postgres and file storage for free. But we want the option to move to another database (plain Postgres, MySQL, Firebase…) without rewriting the business logic.

## Decision
- Services depend only on **interfaces** in `src/server/repositories/interfaces/`.
- `src/server/repositories/supabase/` is the only place that imports `@supabase/*`. Generated DB row types and row⇄domain mappers stay there too.
- `src/server/repositories/memory/` is a second implementation, used in tests.
- `src/server/container.ts` is the **single place** that chooses which implementation each service gets.
- An ESLint `no-restricted-imports` rule blocks `@supabase/*` everywhere outside `repositories/supabase/` (and `container.ts`).

## Consequences
- ➕ To change the DB: write `repositories/<db>/`, then switch the container. Services, actions and UI stay the same.
- ➕ Service tests run in milliseconds with no DB.
- ➖ Two implementations to maintain. The memory one is kept intentionally simple.
- ➖ We don't use Supabase-specific client features (realtime, RLS-driven client queries) from the browser.
