import { allocate, sum } from "@/shared/lib/money";
import { computeChargeTotals } from "./charges";
import { splitItem } from "./split";
import type { Bill, Id } from "./types";

/** One line in a person's part of a bill. */
export interface PersonItemLine {
  itemId: Id;
  name: string;
  units: number;
  amount: number;
}

/** What one participant owes for one bill. */
export interface PersonBillBreakdown {
  participantId: Id;
  items: PersonItemLine[];
  subtotal: number;
  discount: number;
  service: number;
  tax: number;
  /** Signed share of the bill's rounding. */
  rounding: number;
  /** subtotal − discount + service + tax + rounding */
  total: number;
}

export interface BillCalculation {
  billId: Id;
  paidBy: Id | null;
  subtotal: number;
  discount: number;
  service: number;
  tax: number;
  /** Signed rounding printed on the receipt (applied last). */
  rounding: number;
  total: number;
  /** Only participants with a non-zero part of the bill, in participant order. */
  perPerson: PersonBillBreakdown[];
  /** Money nobody is assigned to yet (items + their charge share). */
  unassigned: number;
}

const UNASSIGNED = "__unassigned__";

/**
 * Calculate the per-person breakdown for one bill.
 *
 * 1. Each item is split with {@link splitItem}.
 * 2. Bill charges come from {@link computeChargeTotals}.
 * 3. Each charge kind is shared:
 *    - `proportional`: by each person's item subtotal. Unassigned money takes its share too.
 *    - `even`: equally among the people with items on this bill.
 *
 * Invariant: `Σ perPerson.total + unassigned === total`.
 */
export function calculateBill(bill: Bill, participantIds: readonly Id[]): BillCalculation {
  const lines = new Map<Id, PersonItemLine[]>(participantIds.map((id) => [id, []]));
  let unassignedItems = 0;

  for (const item of bill.items) {
    const split = splitItem(item, participantIds);
    unassignedItems += split.unassigned;
    for (const s of split.shares) {
      if (s.amount === 0 && s.units === 0) continue;
      lines.get(s.participantId)?.push({ itemId: item.id, name: item.name, units: s.units, amount: s.amount });
    }
  }

  const subtotals = participantIds.map((id) => sum((lines.get(id) ?? []).map((l) => l.amount)));
  const subtotal = sum(subtotals) + unassignedItems;
  const charges = computeChargeTotals(subtotal, bill.charges);

  // Who carries the charges, and with what weight.
  const onBill = participantIds.filter((_, i) => subtotals[i] !== 0 || (lines.get(participantIds[i])?.length ?? 0) > 0);
  const carriers: Id[] =
    bill.chargeSplitMode === "even"
      ? onBill
      : [...participantIds, ...(unassignedItems ? [UNASSIGNED] : [])];
  const weights =
    bill.chargeSplitMode === "even"
      ? carriers.map(() => 1)
      : carriers.map((id) => (id === UNASSIGNED ? unassignedItems : subtotals[participantIds.indexOf(id)]));

  const share = (amount: number): Map<Id, number> => {
    const m = new Map<Id, number>();
    if (amount === 0) return m;
    if (sum(weights) === 0) {
      m.set(UNASSIGNED, amount); // nobody to carry it yet
      return m;
    }
    allocate(amount, weights).forEach((v, i) => m.set(carriers[i], v));
    return m;
  };
  const discountBy = share(charges.discount);
  const serviceBy = share(charges.service);
  const taxBy = share(charges.tax);
  const roundingBy = share(charges.rounding);

  const perPerson: PersonBillBreakdown[] = participantIds
    .map((id, i) => {
      const discount = discountBy.get(id) ?? 0;
      const service = serviceBy.get(id) ?? 0;
      const tax = taxBy.get(id) ?? 0;
      const rounding = roundingBy.get(id) ?? 0;
      return {
        participantId: id,
        items: lines.get(id) ?? [],
        subtotal: subtotals[i],
        discount,
        service,
        tax,
        rounding,
        total: subtotals[i] - discount + service + tax + rounding,
      };
    })
    .filter((p) => p.items.length > 0 || p.total !== 0);

  const total = subtotal - charges.discount + charges.service + charges.tax + charges.rounding;
  const unassigned =
    unassignedItems -
    (discountBy.get(UNASSIGNED) ?? 0) +
    (serviceBy.get(UNASSIGNED) ?? 0) +
    (taxBy.get(UNASSIGNED) ?? 0) +
    (roundingBy.get(UNASSIGNED) ?? 0);

  return { billId: bill.id, paidBy: bill.paidBy, subtotal, ...charges, total, perPerson, unassigned };
}
