/**
 * Domain entities. Plain data, no behaviour, no framework.
 * Money fields are integer minor units (ADR 0004).
 * Repositories map DB rows ⇄ these types; services map these ⇄ DTOs.
 *
 * @module
 */

export type Id = string;

/** How an item is shared: by all event participants equally, or by explicit units. */
export type SplitMode = "even" | "custom";
export type ChargeKind = "tax" | "service" | "discount";
/** `percent`: value 10 = 10%. `amount`: value in minor units. */
export type ChargeMode = "percent" | "amount";
/** How a bill's charges are shared among the people on that bill. */
export type ChargeSplitMode = "proportional" | "even";
export type SettlementMode = "per_bill" | "nett";

export interface User {
  id: Id;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Event {
  id: Id;
  ownerId: Id;
  name: string;
  currency: string;
  settlementMode: SettlementMode;
  createdAt: string;
}

export interface Participant {
  id: Id;
  eventId: Id;
  name: string;
}

/**
 * Who consumed an item. `units` are **portions/weights**: shares are
 * proportional to units. Typically units add up to the item qty
 * (qty 3 → A: 2, B: 1), and fractions are allowed (0.5).
 */
export interface Allocation {
  participantId: Id;
  units: number;
}

export interface BillItem {
  id: Id;
  name: string;
  qty: number;
  /** Price per unit (informational; `total` is authoritative). */
  unitPrice: number;
  /** Line total as printed on the receipt. */
  total: number;
  splitMode: SplitMode;
  /** Used when `splitMode === 'custom'`. */
  allocations: Allocation[];
}

export interface BillCharge {
  id: Id;
  kind: ChargeKind;
  mode: ChargeMode;
  value: number;
}

export interface Bill {
  id: Id;
  eventId: Id;
  title: string;
  billDate: string | null;
  /** Participant who paid the bill; null = not set yet (excluded from settlement). */
  paidBy: Id | null;
  imagePath: string | null;
  chargeSplitMode: ChargeSplitMode;
  items: BillItem[];
  charges: BillCharge[];
  createdAt: string;
}

export interface ShareLink {
  id: Id;
  eventId: Id;
  slug: string;
  passcodeHash: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  enabled: boolean;
  createdAt: string;
}
