# 0006 — i18n with next-intl (id/en)

**Status:** Accepted · 2026-11-03

## Context
The UI must support Bahasa Indonesia and English, with a toggle.

## Decision
- `next-intl` with locale-prefixed routes: `/id/...` (default) and `/en/...`.
- Messages live in `messages/id.json` and `messages/en.json`, grouped by feature (`auth`, `events`, `bills`, …).
- Components use `useTranslations('<feature>')`. Hard-coded UI strings aren't allowed.
- Money and dates are formatted with `Intl` using the active locale.
- Server-side error codes, e.g. `EVENT_NOT_FOUND`, are translated in the UI (`errors.<CODE>`). Services never return human text.

## Consequences
- ➕ Adding a language means adding a JSON file plus a locale entry.
- ➖ Every new string needs two entries, and the docs recipe reminds you of that.
