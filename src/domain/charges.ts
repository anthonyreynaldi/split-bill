import { sum } from "@/shared/lib/money";
import type { BillCharge, ChargeKind } from "./types";

/**
 * Bill-level charge totals in minor units.
 * `discount` is a positive number (subtracted); `rounding` is **signed** (added as-is).
 */
export interface ChargeTotals {
  discount: number;
  service: number;
  tax: number;
  rounding: number;
}

/**
 * Compute bill-level charge amounts from the item subtotal.
 *
 * Percent charges use the usual Indonesian receipt order:
 * 1. **discount** on the subtotal
 * 2. **service** on (subtotal − discount)
 * 3. **tax** (e.g. PB1 10%) on (subtotal − discount + service)
 * 4. **rounding** last, as a signed amount ("Pembulatan −200"). It is never a base for percents.
 *
 * Amount charges are used as-is. Several charges of the same kind add up.
 * Each percent charge is rounded to the nearest minor unit.
 *
 * @example
 * computeChargeTotals(100000, [{kind:'service',mode:'percent',value:5}, {kind:'tax',mode:'percent',value:10}])
 * // → { discount: 0, service: 5000, tax: 10500, rounding: 0 }
 */
export function computeChargeTotals(
  subtotal: number,
  charges: readonly Pick<BillCharge, "kind" | "mode" | "value">[],
): ChargeTotals {
  const of = (kind: ChargeKind, base: number) =>
    sum(
      charges
        .filter((c) => c.kind === kind)
        .map((c) => (c.mode === "percent" ? Math.round((base * c.value) / 100) : Math.round(c.value))),
    );

  const discount = Math.min(of("discount", subtotal), subtotal);
  const service = of("service", subtotal - discount);
  const tax = of("tax", subtotal - discount + service);
  const rounding = sum(charges.filter((c) => c.kind === "rounding").map((c) => Math.round(c.value)));
  return { discount, service, tax, rounding };
}
