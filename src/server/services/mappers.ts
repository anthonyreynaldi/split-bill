/** Domain → output DTO mappers shared by services. */
import type { BillListItemDto, EventDto, ParticipantDto } from "@/shared/dto";
import type { Bill, Event, Participant } from "@/domain/types";
import { calculateBill } from "@/domain/bill-calc";

export const toEventDto = (e: Event): EventDto => ({
  id: e.id,
  name: e.name,
  currency: e.currency,
  settlementMode: e.settlementMode,
  createdAt: e.createdAt,
});

export const toParticipantDto = (p: Participant): ParticipantDto => ({ id: p.id, name: p.name });

export const toBillListItemDto = (b: Bill, participantIds: string[]): BillListItemDto => ({
  id: b.id,
  title: b.title,
  billDate: b.billDate,
  paidBy: b.paidBy,
  itemCount: b.items.length,
  total: calculateBill(b, participantIds).total,
});
