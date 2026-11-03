import { sum } from "@/shared/lib/money";
import { calculateBill, type BillCalculation } from "./bill-calc";
import type { Bill, Id, Participant } from "./types";

/** "from pays to `amount`". */
export interface Transfer {
  from: Id;
  to: Id;
  amount: number;
  /** Set for per-bill transfers. */
  billId?: Id;
}

/** Event-level totals for one participant. */
export interface PersonSummary {
  participantId: Id;
  /** What they consumed across all bills (incl. charges). */
  owed: number;
  /** Total of the bills they paid. */
  paid: number;
  /** + means others owe them, − means they owe. Σ balance over everyone = 0. */
  balance: number;
}

export interface EventCalculation {
  bills: BillCalculation[];
  people: PersonSummary[];
  /** Each debtor pays each bill's payer, per bill (no offsetting). */
  perBillTransfers: Transfer[];
  /** Offset across bills, then the fewest greedy transfers. */
  nettTransfers: Transfer[];
  /** Bills excluded from settlement because no payer is set. */
  billsWithoutPayer: Id[];
  /** Total money on bills that nobody is assigned to yet. */
  unassigned: number;
}

/**
 * Calculate everything the summary screen needs for an event.
 *
 * Balance rules: on each bill with a payer, everyone else owes the payer their
 * part, and the payer's own part is just consumption. Unassigned money stays
 * with the payer (nobody owes it). Bills without a payer don't affect balances.
 */
export function calculateEvent(participants: readonly Participant[], bills: readonly Bill[]): EventCalculation {
  const ids = participants.map((p) => p.id);
  const calcs = bills.map((b) => calculateBill(b, ids));

  const owed = new Map<Id, number>(ids.map((id) => [id, 0]));
  const paid = new Map<Id, number>(ids.map((id) => [id, 0]));
  const balance = new Map<Id, number>(ids.map((id) => [id, 0]));
  const perBillTransfers: Transfer[] = [];
  const billsWithoutPayer: Id[] = [];

  for (const c of calcs) {
    for (const p of c.perPerson) owed.set(p.participantId, (owed.get(p.participantId) ?? 0) + p.total);

    if (!c.paidBy || !balance.has(c.paidBy)) {
      billsWithoutPayer.push(c.billId);
      continue;
    }
    paid.set(c.paidBy, (paid.get(c.paidBy) ?? 0) + c.total);

    for (const p of c.perPerson) {
      if (p.participantId === c.paidBy || p.total === 0) continue;
      balance.set(p.participantId, (balance.get(p.participantId) ?? 0) - p.total);
      balance.set(c.paidBy, (balance.get(c.paidBy) ?? 0) + p.total);
      perBillTransfers.push({ from: p.participantId, to: c.paidBy, amount: p.total, billId: c.billId });
    }
  }

  return {
    bills: calcs,
    people: ids.map((id) => ({
      participantId: id,
      owed: owed.get(id) ?? 0,
      paid: paid.get(id) ?? 0,
      balance: balance.get(id) ?? 0,
    })),
    perBillTransfers,
    nettTransfers: settleNett(ids.map((id) => ({ participantId: id, balance: balance.get(id) ?? 0 }))),
    billsWithoutPayer,
    unassigned: sum(calcs.map((c) => c.unassigned)),
  };
}

/**
 * Greedy nett settlement: repeatedly match the largest debtor with the
 * largest creditor. This gives at most n−1 transfers. Ties are broken by
 * input order, so the result is deterministic.
 *
 * @param balances must sum to 0.
 */
export function settleNett(balances: readonly { participantId: Id; balance: number }[]): Transfer[] {
  if (sum(balances.map((b) => b.balance)) !== 0) throw new Error("settleNett: balances must sum to 0");

  const order = new Map(balances.map((b, i) => [b.participantId, i]));
  const byOrder = (a: { participantId: Id }, b: { participantId: Id }) =>
    order.get(a.participantId)! - order.get(b.participantId)!;
  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b, left: -b.balance }));
  const creditors = balances.filter((b) => b.balance > 0).map((b) => ({ ...b, left: b.balance }));

  const transfers: Transfer[] = [];
  for (;;) {
    debtors.sort((a, b) => b.left - a.left || byOrder(a, b));
    creditors.sort((a, b) => b.left - a.left || byOrder(a, b));
    const d = debtors[0];
    const c = creditors[0];
    if (!d || !c || d.left === 0 || c.left === 0) break;
    const amount = Math.min(d.left, c.left);
    transfers.push({ from: d.participantId, to: c.participantId, amount });
    d.left -= amount;
    c.left -= amount;
  }
  return transfers;
}
