# 0001 — Next.js App Router + Server Actions

**Status:** Accepted · 2026-11-03

## Context
We need a React web app with server-side code (DB access, OCR calls, secrets) but no separate backend to deploy. The frontend must call server logic in a typed, documented way.

## Decision
- Next.js App Router with TypeScript (strict).
- The client calls the server through **Server Actions** in `src/server/actions/*.actions.ts`.
- Actions are **thin**. Each one:
  1. parses its input with a zod DTO,
  2. resolves the session,
  3. calls one service method,
  4. returns `ActionResult<T>` (`{ ok: true, data } | { ok: false, error }`). It never throws to the client.
- TanStack Query and TanStack Form call the actions from hooks (`features/*/hooks`). Components never call actions directly.
- Every action is listed in `docs/server-actions.md` and carries TSDoc, which TypeDoc renders.

- We use **Next.js 16**. Middleware is now called `proxy.ts`, and the bundled docs live in `node_modules/next/dist/docs/` (see `AGENTS.md`).
- **`cacheComponents` is off.** Every page depends on the session cookie and loads its data client-side through TanStack Query. Leaving it on would mean wrapping every cookie read in `<Suspense>` for very little benefit.

## Consequences
- ➖ The Next.js client runs Server Actions **one at a time**, so parallel queries are serialized. That is fine at this scale. Combine reads into one action for each screen where it matters (e.g. `getEventDetail`).
- ➖ Action bodies are capped at 1MB by default. Receipt images are compressed in the browser, and `serverActions.bodySizeLimit` is raised for uploads.
- ➕ End-to-end types, no hand-written REST layer, secrets stay on the server.
- ➖ Actions are tied to Next.js. Because they are thin, the services can still be reused elsewhere, e.g. behind a REST API later.
- ➖ Actions are POST-only. Read queries also go through actions (used as `queryFn`), which is fine at this scale.
