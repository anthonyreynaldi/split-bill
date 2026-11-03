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
