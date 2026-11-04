# Split Bill

Split group bills fairly, without the spreadsheet. Upload a receipt photo and let OCR read the items. Then assign each item to the people who had it, and see exactly who owes whom. You can see this per bill, or **nett** across the whole trip.

> Status: **v1 feature-complete**. See [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Features (v1)
- 📸 Receipt OCR: a photo becomes an editable draft (items, qty, price, tax, service).
- ✍️ Manual editing: add bills and items, choose who paid.
- ➗ Flexible splits: an item is split evenly, by portions per person, or **per unit** (e.g. pizza 1 shared by 2 people, pizza 2 by 3). Tax, service and discount are shared proportionally or evenly.
- 🧾 Per-person summary, with **per-bill** or **nett** settlement (debts cancel out across bills).
- 📤 Export to Excel, export to an image, or share a **read-only link** with an optional passcode.
- 🌐 Bahasa Indonesia / English.

## Quick start
```bash
nvm use                      # Node 22 (see .nvmrc)
npm install
cp .env.example .env.local   # fill in the Supabase + OpenRouter keys
npm run dev                  # http://localhost:3000
```
**Try it without any accounts:** in `.env.local` set `DATA_BACKEND=memory` and any 32+ character `SESSION_SECRET`. Everything works except automatic receipt reading, and data is lost on restart.

| Command | What it does |
|---|---|
| `npm run check` | lint + typecheck + all tests (run before every commit) |
| `npm run docs` | build the API reference site into `docs/api/index.html` |
| `npm run db:push` / `npm run db:types` | apply migrations / regenerate DB types (Supabase CLI) |

For the full setup, including the database: [docs/DEVELOPER.md](docs/DEVELOPER.md).

## Documentation map
| You are… | Read |
|---|---|
| A user of the app | [User Guide (EN)](docs/USER_GUIDE.md) · [Panduan Pengguna (ID)](docs/USER_GUIDE.id.md) |
| A developer | [Developer Guide](docs/DEVELOPER.md) · [Architecture (diagrams)](docs/architecture.md) · [Server Actions reference](docs/server-actions.md) · API site: `npm run docs` → `docs/api/index.html` |
| An AI assistant (Claude) | [CLAUDE.md](CLAUDE.md), plus the `CLAUDE.md` in each layer folder |
| Curious about why it's built this way | [Architecture decisions](docs/decisions/) |
| The product owner | [Project Brief](docs/PROJECT_BRIEF.md) |

## Tech stack
Next.js (App Router, TypeScript) · shadcn/ui · TanStack Query & Form · zod · next-intl · Supabase · OpenRouter · Vitest
