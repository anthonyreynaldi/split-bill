/**
 * Money helpers. All money is an **integer in minor units** (ADR 0004).
 * IDR has 0 decimals (Rp 10.000 → 10000); USD has 2 ($1.50 → 150).
 *
 * @module
 */

/**
 * Decimals per currency as used in practice. This is our own table, because
 * `Intl` reports 2 decimals for IDR even though nobody uses sen.
 */
export const CURRENCY_DECIMALS: Record<string, number> = {
  IDR: 0,
  JPY: 0,
  KRW: 0,
  VND: 0,
  USD: 2,
  EUR: 2,
  SGD: 2,
  MYR: 2,
  AUD: 2,
  THB: 2,
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_DECIMALS);

/** Number of decimals for a currency (defaults to 2). */
export function currencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
}

/** Major units (what a human types, e.g. 12.5) → integer minor units (1250). */
export function toMinor(major: number, currency: string): number {
  return Math.round(major * 10 ** currencyDecimals(currency));
}

/** Integer minor units → major units (for inputs). */
export function fromMinor(minor: number, currency: string): number {
  return minor / 10 ** currencyDecimals(currency);
}

/** Format integer minor units for display, e.g. `formatMoney(10000, 'IDR', 'id')` → "Rp 10.000". */
export function formatMoney(minor: number, currency: string, locale: string): string {
  const decimals = currencyDecimals(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fromMinor(minor, currency));
}

/**
 * Split an integer `total` into parts proportional to `weights`, using the
 * **largest-remainder method**. The parts always add up to exactly `total`.
 *
 * - Leftover units go to the parts with the largest fractional remainder.
 *   Ties go to the lower index, so the result is deterministic.
 * - A weight of 0 always gets 0.
 * - A negative `total` (e.g. a discount) is split by its absolute value and then negated.
 *
 * @example allocate(10000, [1, 1, 1]) // → [3334, 3333, 3333]
 * @example allocate(3000, [2, 1])     // → [2000, 1000]
 * @throws if `total` is not an integer, a weight is negative, or all weights are 0 while total ≠ 0.
 */
export function allocate(total: number, weights: readonly number[]): number[] {
  if (!Number.isInteger(total)) throw new Error(`allocate: total must be an integer, got ${total}`);
  if (weights.some((w) => !(w >= 0))) throw new Error("allocate: weights must be ≥ 0");
  if (weights.length === 0) {
    if (total !== 0) throw new Error("allocate: no weights to allocate a non-zero total");
    return [];
  }
  if (total < 0) return allocate(-total, weights).map((v) => (v === 0 ? 0 : -v));

  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    if (total !== 0) throw new Error("allocate: all weights are 0 but total is not");
    return weights.map(() => 0);
  }

  const EPS = 1e-9; // guards against 2.9999999 → 2 from float division
  const exact = weights.map((w) => (total * w) / sum);
  const parts = exact.map((x) => Math.floor(x + EPS));
  let remainder = total - parts.reduce((a, b) => a + b, 0);

  const order = exact
    .map((x, i) => ({ i, frac: x - parts[i], w: weights[i] }))
    .filter((o) => o.w > 0)
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  for (let k = 0; remainder > 0; k = (k + 1) % order.length) {
    parts[order[k].i] += 1;
    remainder -= 1;
  }
  return parts;
}

/** Sum of integers. */
export const sum = (values: readonly number[]): number =>
  values.reduce((a, b) => a + b, 0);
