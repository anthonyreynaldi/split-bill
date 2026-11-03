# Project: Split Bill

## Purpose
A web app for splitting bills within a group event. The creator uploads receipt photos, OCR fills in a draft of the items, and the creator assigns items to people. The app then shows what each person owes, either per bill or as a nett settlement across bills. The result can be exported to Excel or PNG, or shared through a read-only link that can have a passcode. Full requirements: [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md).

## Stack
- Next.js (App Router) + TypeScript (strict). UI is shadcn/ui + Tailwind.
- TanStack Query (server state), TanStack Form (forms), zod (DTOs and validation).
- next-intl: locales `id` (default) and `en`. Message files live in `messages/`.
- Supabase (Postgres + Storage), accessed **only** from `src/server/repositories/supabase/`.
- OpenRouter vision model for OCR, accessed **only** from `src/server/providers/ocr/`.
- Vitest for tests. Node 22 (`nvm use`).

## Commands
- Install: `npm install`
- Dev server: `npm run dev` (http://localhost:3000)
- Tests: `npm test` (watch mode: `npm run test:watch`)
- Lint: `npm run lint` · Type check: `npm run typecheck` · Build: `npm run build`
- API docs (TypeDoc HTML → `docs/api/`): `npm run docs`
- DB types: `npm run db:types` (needs the Supabase CLI to be logged in)

## Architecture: layer rules (MUST follow)
```
components (view) → hooks (TanStack) → server/actions → server/services → repositories/interfaces
                                                         ↘ domain (pure)        ↑ supabase/ | memory/
```
1. **View** (`src/features/*/components`) receives props and emits callbacks. It never fetches data, never imports `server/`, and contains no business rules.
2. **Hooks** (`src/features/*/hooks`) hold the view logic: TanStack Query/Form, calling Server Actions, mapping errors to UI.
3. **Server Actions** (`src/server/actions`) are thin. Each one parses its input with a zod DTO, gets the session, calls a service, and returns `ActionResult<T>`.
4. **Services** (`src/server/services`) hold the business rules and ownership checks. They depend only on repository **interfaces** and never import `@supabase/*`.
5. **Repositories**: interfaces live in `src/server/repositories/interfaces`. Implementations live in `supabase/` (real) and `memory/` (tests). DB row types and mappers stay inside the implementation folder.
6. **Domain** (`src/domain`) is pure TypeScript for the money math: split, charges, settlement. It has no IO and no framework imports.
7. **DTOs** (`src/shared/dto`) are zod schemas shared by client forms and server actions. Types come from `z.infer`.
8. **Wiring** happens only in `src/server/container.ts`. To change the DB, add a new `repositories/<db>/` folder and edit only the container.

ESLint `no-restricted-imports` rules enforce points 1, 4 and 6. Don't disable them.

## Conventions
- Money is an **integer in minor units** (`number`, the `bigint` column in the DB). Never use floats for money. Use the helpers in `src/shared/lib/money.ts`.
- Splitting uses the largest-remainder method, so shares always add up exactly to the total.
- All UI text goes through next-intl (`useTranslations`). Add every key to **both** `messages/id.json` and `messages/en.json`.
- Files use kebab-case. React components use PascalCase. Hooks are named `useXxx`. Server action files are named `<feature>.actions.ts`.
- Every exported action, service method and repository interface gets a TSDoc comment. TypeDoc builds the API site from these.
- Never commit secrets. Config goes in `.env.local` (see `.env.example`). The Supabase service-role key and the OpenRouter key are server-only.
- Never hand-edit `src/components/ui/*`. Regenerate those files with the shadcn CLI.

## How to add a feature (recipe)
1. Plan first (Plan mode).
2. Write the zod DTOs in `src/shared/dto/`.
3. Add domain logic (pure) with tests, if needed.
4. Add or extend the repository interface, then implement it in **both** `memory/` and `supabase/`. Add a migration if the schema changes.
5. Add the service method and test it with the memory repos.
6. Add a Server Action and document it in [docs/server-actions.md](docs/server-actions.md).
7. Add a hook, then the view component, then the page.
8. Run `npm run lint && npm test`, then make **one commit per logical step**.
9. Run `/update-docs`.

## Docs
- Users: [docs/USER_GUIDE.md](docs/USER_GUIDE.md) (EN) and [docs/USER_GUIDE.id.md](docs/USER_GUIDE.id.md) (ID)
- Developers: [docs/DEVELOPER.md](docs/DEVELOPER.md), [docs/architecture.md](docs/architecture.md) (Mermaid), [docs/server-actions.md](docs/server-actions.md)
- Decisions: [docs/decisions/](docs/decisions/)
- Change log: [docs/CHANGELOG.md](docs/CHANGELOG.md)
