import type { SummaryDto } from "@/shared/dto";
import { sum } from "@/shared/lib/money";
import { calculateEvent } from "@/domain/settlement";
import type { Event } from "@/domain/types";
import type { Repositories } from "../repositories/interfaces";
import { IMAGE_URL_TTL_SECONDS } from "./bill.service";
import { requireOwnedEvent } from "./ownership";

type Repos = Pick<Repositories, "events" | "participants" | "bills" | "images">;

/** `photos`: sign each bill's receipt image URL (off for exports and hidden-photo links). */
export type SummaryOptions = { photos: boolean };

/**
 * Build the summary for an event (no ownership check, so call it only after one).
 * Shared by `SummaryService` (owner) and `ShareService` (public link).
 */
export async function buildSummary(repos: Repos, event: Event, opts: SummaryOptions): Promise<SummaryDto> {
  const [participants, bills] = await Promise.all([
    repos.participants.listByEvent(event.id),
    repos.bills.listByEvent(event.id),
  ]);
  const calc = calculateEvent(participants, bills);
  const imageUrls = new Map(
    await Promise.all(
      bills.map(async (b) => {
        if (!opts.photos || !b.imagePath) return [b.id, null] as const;
        const url = await repos.images.signedUrl(b.imagePath, IMAGE_URL_TTL_SECONDS).catch((err) => {
          console.warn("[summary] could not sign receipt image", err instanceof Error ? err.message : err);
          return null;
        });
        return [b.id, url] as const;
      }),
    ),
  );
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
        rounding: c.rounding,
        total: c.total,
        unassigned: c.unassigned,
        perPerson: c.perPerson,
        items: b.items.map((it) => ({
          id: it.id,
          name: it.name,
          qty: it.qty,
          unitPrice: it.unitPrice,
          total: it.total,
          splitMode: it.splitMode,
          allocations: it.allocations.map((a) => ({
            participantId: a.participantId,
            units: a.units,
            ...(a.unit != null && { unit: a.unit }),
          })),
        })),
        imageUrl: imageUrls.get(b.id) ?? null,
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

  /** `opts.photos` defaults to true (the Summary page shows the receipts). */
  async get(userId: string, eventId: string, opts: SummaryOptions = { photos: true }): Promise<SummaryDto> {
    const event = await requireOwnedEvent(this.repos.events, userId, eventId);
    return buildSummary(this.repos, event, opts);
  }
}
