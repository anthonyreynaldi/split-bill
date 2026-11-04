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
| **Allocation** | Who consumed an item. One of three modes:<br>• **even**: all participants share it equally;<br>• **custom**: units per person, fractions allowed (e.g. qty 3 → A: 2, B: 1);<br>• **per unit**: each unit of the qty has its own group of people (e.g. pizza qty 2 → unit 1: A, B; unit 2: C, D, E). |
| **Charge** | Tax, service or discount, as a percent or a fixed amount. Shared **proportionally** to item subtotals or **evenly**, chosen per bill. |
| **Settlement** | Who pays whom. In **per-bill** mode, everyone pays each bill's payer. In **nett** mode, balances are offset across all bills and the number of transfers is minimized. |

## Calculation rules (implemented in `src/domain`)
1. **Item split.** An `even` item is split equally among **all event participants**. A `custom` item is split proportionally to each person's **units**. Units are portions (qty 3 → A: 2, B: 1), and halves are allowed. A custom item with nobody selected is **unassigned**. A `per_unit` item (whole qty, 1–50) is first divided into equal unit amounts; each unit amount is then split equally among the people ticked on that unit. A unit with nobody ticked is **unassigned**. Example: pizza qty 2, total 60 000, unit 1 → A, B and unit 2 → C, D, E gives A 15 000, B 15 000, C/D/E 10 000 each.
2. **Charge order** follows Indonesian receipts:
   1. discount on the subtotal,
   2. service on (subtotal − discount),
   3. tax on (subtotal − discount + service).

   Percent charges are rounded to the nearest rupiah.
3. **Charge sharing**, chosen per bill:
   - `proportional`: by each person's item subtotal. Unassigned items carry their share too.
   - `even`: equally among the people who have items on that bill.
4. **Rounding.** Every split uses the largest-remainder method, so per-person amounts always add up exactly to the bill total.
5. **Balances.** On a bill with a payer, each other person owes the payer their part. Unassigned money stays with the payer. Bills without a payer count as consumption but are left out of settlement, and the UI warns about them.
6. **Nett settlement** matches the largest debtor with the largest creditor, repeatedly. This takes at most n−1 transfers.

## Must-have features (v1)
1. Register and log in with email and password. This is custom for now and has the same shape as Supabase Auth, so we can switch later.
2. Create, edit and delete events and participants.
3. Upload a bill photo. **OCR** (OpenRouter vision model) fills in a draft of the merchant, items, qty, price, total and charges. The user reviews and confirms it.
4. Manual editing: add or edit bills and items, set the payer, set allocations (even, custom or per unit), and set charges and how they are shared.
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
