# src/domain: pure calculation

The money math lives here: splitting items, distributing charges, building per-person totals, and settlement (per-bill and nett).

## Rules
- **Pure TypeScript.** No IO, no `fetch`, no DB, no Next/React, no `@/server`. ESLint enforces this.
- Inputs and outputs are plain domain types from `types.ts`. Don't use DTOs or DB rows here.
- Money is an **integer** in minor units. Every division must go through `allocate()` in `@/shared/lib/money`, so that parts always add up to the whole.
- Every function is deterministic: same input, same output, including tie-breaking order.
- Every exported function has TSDoc and tests in `*.test.ts` next to it. Cover the rounding and empty or edge cases.

## Files
- `types.ts`: domain entities (Bill, Item, Allocation, Charge, Participant…)
- `split.ts`: item total → per-participant item shares
- `charges.ts`: tax/service/discount → per-participant amounts
- `bill-calc.ts`: one bill → per-person breakdown
- `settlement.ts`: balances, per-bill transfers, nett transfers
- `test-fixtures.ts`: builders for tests only
