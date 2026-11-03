# Project Brief — Split Bill

## Problem
After a group meal or trip, someone has to work out from paper receipts who owes what. When several people paid different bills, that gets messy fast. People also end up sending money back and forth when the amounts could cancel out.

## Users
- **Creator.** Uploads receipts, sets who ate what, and shares the result. Needs an account (email and password).
- **Viewers.** Friends who open a read-only share link, which may be protected by a passcode. They don't need an account.
- Scale: small groups (2–30 people), a handful of bills per event.

## Core concepts
| Concept | Meaning |
|---|---|
| **Event** | A group of bills, e.g. "Bali Trip". It owns the participants, the share link and the settlement. |
| **Participant** | A person in the event, identified by name only. |
| **Bill** | One receipt. It has a title, a date, an optional photo, **one payer**, items and charges. |
| **Item** | A line on the receipt: name, qty, unit price, total. |
| **Allocation** | Who consumed an item. Either **even** (all participants share it equally) or **custom** (units per person, fractions allowed, e.g. qty 3 → A: 2, B: 1). |
| **Charge** | Tax, service or discount, as a percent or a fixed amount. Shared **proportionally** to item subtotals or **evenly**, chosen per bill. |
| **Settlement** | Who pays whom. In **per-bill** mode, everyone pays each bill's payer. In **nett** mode, balances are offset across all bills and the number of transfers is minimized. |

## Must-have features (v1)
1. Register and log in with email and password. This is custom for now and has the same shape as Supabase Auth, so we can switch later.
2. Create, edit and delete events and participants.
3. Upload a bill photo. **OCR** (OpenRouter vision model) fills in a draft of the merchant, items, qty, price, total and charges. The user reviews and confirms it.
4. Manual editing: add or edit bills and items, set the payer, set allocations (even or custom), and set charges and how they are shared.
5. Summary per person: items with their share, subtotal, charges, total owed and total paid.
6. A settlement toggle between **per bill** and **nett**.
7. Export as **Excel (.xlsx)**, an **image (.png)**, or a **read-only share link** with an optional **passcode**.
8. UI in **Bahasa Indonesia** and **English**, with a toggle.

## Nice-to-have (later)
- Mark individual transfers as paid.
- A QR code for the share link, and "copy summary for WhatsApp".
- Show the receipt image side by side with the OCR draft.
- An offline OCR fallback (Tesseract.js).
- Move to real Supabase Auth with RLS policies.

## Stack and constraints
- Next.js (App Router, TypeScript) and Server Actions.
- shadcn/ui, Tailwind, TanStack Query, TanStack Form, zod, next-intl.
- Supabase: Postgres plus Storage. It is reached **only** through the repository layer, so it can be replaced.
- OpenRouter for OCR, ideally with a free vision model. The model is configurable through env.
- Money is stored as integers in minor units. The default currency is IDR.
- Node 22 (see `.nvmrc`).

## Definition of done for v1
- Every must-have feature works end to end in `npm run dev`.
- Per-person totals always add up exactly to the bill totals. Unit tests cover this, including rounding.
- Services are tested against in-memory repositories, with no database needed.
- `npm run lint`, `npm test` and `npm run build` pass.
- The README, user guides (ID/EN), developer guide, architecture diagrams and server-action reference are up to date.
