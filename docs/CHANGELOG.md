# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/). Add one line under **Unreleased** for every change.

## Unreleased
### Added
- Project docs: brief, CLAUDE.md, README, architecture diagrams, ADRs 0001–0006, `update-docs` skill.
- Next.js 16 scaffold with shadcn/ui (base-nova).
- i18n: Bahasa Indonesia (default) and English, with an ID/EN toggle in the header.
- TanStack Query provider, `ActionResult`/`AppError` contract, Vitest, ESLint layer-boundary rules, per-layer CLAUDE.md files.
- Domain: money `allocate()` (largest remainder), item split, charges (ID receipt order), bill and event calculation, per-bill and nett settlement, with 37 tests.
- DTOs: zod schemas for auth, events, bills, OCR, summary and share (messages are i18n keys); test that ID and EN message files match.
- Database: Supabase migrations (tables, RLS deny-all, transactional `save_bill`, private `bill-images` bucket) and typed `db.types.ts`.
- Repositories: interfaces, in-memory and Supabase implementations, a contract test suite shared by both, `container.ts` wiring and validated env (`.env.example`).
- Auth: register, login and logout with email and password (bcrypt, signed httpOnly cookie), header user menu, redirect to /login for /events, locale-aware 404 page. Server Action argument logging turned off.
- Events: create and list events, an event page with people (add, rename, remove) and a bill list, delete with confirmation. Fixed the shadcn font variable (Geist).
- Bills: bill editor with title, date, payer, items (qty × price, auto total), even or custom portion split, tax/service/discount, a choice of proportional or equal charge sharing, and a live per-person preview. Edit and delete.
- OCR: upload a receipt photo (compressed in the browser), read it with an OpenRouter vision model and prefill the bill as a draft. The photo is kept even when OCR fails or is disabled.
- Summary: who pays whom (nett or per bill, saved per event), per-person consumed, paid and balance with item details, and warnings for bills without a payer or with unassigned items.
- Export: download the summary as Excel (4 sheets, translated headers, numeric money cells) or as a PNG image.
- Share: read-only public link per event (/s/<slug>), optional passcode (bcrypt, 5 tries then a 15 minute lock, 12 hour access cookie), turn the link on or off, image export on the shared view.
- Bills: **Per unit** split. Each unit of an item's qty gets its own group of people, and each unit's price is split equally within that group. Migration `20261104000001_per_unit_split.sql` adds `item_allocations.unit_index`.
- `npm run db:migrate`: applies only new migrations (history-tracked `supabase db push`) using `SUPABASE_DB_URL` (session pooler). Replaces the broken `db:push` script.
- Export: the Image button opens a menu with **Copy image** (to paste into chat or email), **Share…** (native share sheet on phones) and **Download image**.
- People: edit the event's people as a draft, then **Save** once. Enter adds the next name instantly, and pasting a list separated by commas or new lines adds many people. Rename in place, remove with undo, and see duplicate-name hints. Removals are confirmed. One atomic `saveParticipants` action, backed by the `save_participants` Postgres function (migration `20261105000001`).
- OCR: `OPENROUTER_MODEL` accepts a comma-separated list of free models that fall back on each other when one is rate-limited.
- OCR: on phones, choose between **Take photo** (camera) and **Choose photo** (gallery or files). Computers show only **Choose photo**.
- CI/CD: GitHub Actions checks every PR. On `main` it runs check → migrate → Vercel production deploy (ADR 0007).
- Docs: TypeDoc API site (`npm run docs`), updated architecture diagrams, user guides (EN/ID) matching the UI, manual release checklist.

### Fixed
- Bills: reopening a bill right after saving it showed the old values, and saving again reverted the edit.
- OCR: a correct model answer containing `null` (e.g. no discount) was rejected as "Could not read". The reason a result is rejected is now logged.
- Events: the **Add** person button showed no feedback, so clicking it again added the same person several times. It is now disabled with a spinner while saving.
