# src/server: actions, services, repositories

Only server code goes here. Nothing in this folder may be imported by view components. Hooks may import `actions/` only.

## Request flow
`actions/*.actions.ts` → `services/*.service.ts` → `repositories/interfaces/*` ← `repositories/supabase/*` | `repositories/memory/*`

## actions/ (thin entry points)
- Every file starts with `'use server'`. Use one file per feature, named `<feature>.actions.ts`.
- Wrap every action with `defineAction(InputSchema, handler)` from `actions/_lib/define-action.ts`. It parses the input with zod, converts `AppError` to `ActionResult`, and logs unknown errors.
- An action may: get the session, call **one** service method, and return a DTO. It holds **no business rules**.
- Document every action in `docs/server-actions.md` and in its TSDoc.

## services/ (business rules)
- Classes receive their repositories through the constructor, as interfaces only. They never import Supabase, Next or React (ESLint enforces this).
- They check ownership on every call (`assertOwner`). Never trust ids from the client.
- They throw `AppError(code)` and never return human text.
- They map domain objects to output DTOs before returning.
- Tests live in `*.test.ts` and use `createMemoryContainer()`, so no DB is needed.

## repositories/
- `interfaces/`: one interface per aggregate. The TSDoc describes the contract.
- `supabase/`: the **only** place that imports `@supabase/*`. Row types (`db.types.ts`) and the row ⇄ domain mappers stay here.
- `memory/`: simple Map-based implementations of the same interfaces, used by tests and `DATA_BACKEND=memory`.
- When you change an interface, update **both** implementations.

## container.ts
- The single wiring point: it picks the implementations and constructs the services.
- To switch databases, add a new `repositories/<db>/` folder and change only this file.

## auth/
- `password.ts` (bcrypt) and `session.ts` (signed JWT cookie). See ADR 0003.
