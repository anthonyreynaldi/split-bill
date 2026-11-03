# 0004 — Money as integer minor units

**Status:** Accepted · 2026-11-03

## Context
Floats can't represent money exactly (`0.1 + 0.2 !== 0.3`). Splitting a total among people creates remainders, e.g. Rp 10.000 ÷ 3.

## Decision
- All money values are **integers in the currency's minor unit**: IDR has 0 decimals, so Rp 10.000 = `10000`. USD would be cents.
- The DB uses `bigint`. TypeScript uses `number`, which is safe up to 2^53, far above any bill.
- Every division goes through `allocate()` in `src/shared/lib/money.ts`, which uses the **largest-remainder method**. The parts always add up exactly to the whole, and leftover units go to the largest fractional parts (ties are broken by a stable order).
- Quantities and allocation units may be fractional (`numeric`). Only money is an integer.

## Consequences
- ➕ Per-person totals always reconcile with the bill total, and tests assert this.
- ➖ Format at the edge only, with `formatMoney()` and `Intl.NumberFormat`. Never do math on formatted strings.
