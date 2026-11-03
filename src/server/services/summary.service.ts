import type { SummaryDto } from "@/shared/dto";
import { sum } from "@/shared/lib/money";
import { calculateEvent } from "@/domain/settlement";
import type { Event } from "@/domain/types";
import type { Repositories } from "../repositories/interfaces";
import { requireOwnedEvent } from "./ownership";

type Repos = Pick<Repositories, "events" | "participants" | "bills">;

/**
 * Build the summary for an event (no ownership check, so call it only after one).
 * Shared by `SummaryService` (owner) and `ShareService` (public link).
 */
export async function buildSummary(repos: Repos, event: Event): Promise<SummaryDto> {
  const [participants, bills] = await Promise.all([
    repos.participants.listByEvent(event.id),
    repos.bills.listByEvent(event.id),
  ]);
  const calc = calculateEvent(participants, bills);
  return {
    event: { name: event.name, currency: event.currency, settlementMode: event.settlementMode },
    participants: participants.map((p) => ({ id: p.id, name: p.name })),
    bills: calc.bills.map((c) => {
      const b = bills.find((x) => x.id === c.billId)!;
      return {
        id: c.billId,
        title: b.title,
        billDate: b.billDate,
        paidBy: c.paidBy,
        subtotal: c.subtotal,
        discount: c.discount,
        service: c.service,
        tax: c.tax,
        total: c.total,
        unassigned: c.unassigned,
        perPerson: c.perPerson,
      };
    }),
    people: calc.people,
    perBillTransfers: calc.perBillTransfers,
    nettTransfers: calc.nettTransfers,
    billsWithoutPayer: calc.billsWithoutPayer,
    unassigned: calc.unassigned,
    grandTotal: sum(calc.bills.map((b) => b.total)),
  };
}

/** Per-person summary and settlement for the event owner. */
export class SummaryService {
  constructor(private readonly repos: Repos) {}

  async get(userId: string, eventId: string): Promise<SummaryDto> {
    const event = await requireOwnedEvent(this.repos.events, userId, eventId);
    return buildSummary(this.repos, event);
  }
}
