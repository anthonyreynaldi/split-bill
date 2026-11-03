/* Test helpers for building domain objects with sensible defaults. Not used by app code. */
import type { Bill, BillCharge, BillItem, Participant } from "./types";

export const people = (...names: string[]): Participant[] =>
  names.map((name) => ({ id: name, eventId: "e1", name }));

let seq = 0;
export const item = (p: Partial<BillItem> & Pick<BillItem, "total">): BillItem => ({
  id: `i${++seq}`,
  name: p.name ?? `Item ${seq}`,
  qty: 1,
  unitPrice: p.total,
  splitMode: "even",
  allocations: [],
  ...p,
});

export const charge = (kind: BillCharge["kind"], mode: BillCharge["mode"], value: number): BillCharge => ({
  id: `c${++seq}`,
  kind,
  mode,
  value,
});

export const bill = (p: Partial<Bill> & Pick<Bill, "items">): Bill => ({
  id: `b${++seq}`,
  eventId: "e1",
  title: "Bill",
  billDate: null,
  paidBy: null,
  imagePath: null,
  chargeSplitMode: "proportional",
  charges: [],
  createdAt: "2026-11-03T00:00:00Z",
  ...p,
});
