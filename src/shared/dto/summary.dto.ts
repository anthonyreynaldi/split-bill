import { z } from "zod";
import { EventIdInput, SettlementModeSchema } from "./common";
import { ParticipantDto } from "./event.dto";

export { EventIdInput as GetSummaryInput };

const PersonItemLineDto = z.object({
  itemId: z.string(),
  name: z.string(),
  units: z.number(),
  amount: z.number(),
});

const PersonBillDto = z.object({
  participantId: z.string(),
  items: z.array(PersonItemLineDto),
  subtotal: z.number(),
  discount: z.number(),
  service: z.number(),
  tax: z.number(),
  total: z.number(),
});

export const SummaryBillDto = z.object({
  id: z.string(),
  title: z.string(),
  billDate: z.string().nullable(),
  paidBy: z.string().nullable(),
  subtotal: z.number(),
  discount: z.number(),
  service: z.number(),
  tax: z.number(),
  total: z.number(),
  unassigned: z.number(),
  perPerson: z.array(PersonBillDto),
});
export type SummaryBillDto = z.infer<typeof SummaryBillDto>;

export const TransferDto = z.object({
  from: z.string(),
  to: z.string(),
  amount: z.number(),
  billId: z.string().optional(),
});
export type TransferDto = z.infer<typeof TransferDto>;

export const PersonSummaryDto = z.object({
  participantId: z.string(),
  owed: z.number(),
  paid: z.number(),
  balance: z.number(),
});
export type PersonSummaryDto = z.infer<typeof PersonSummaryDto>;

/**
 * Everything the summary screen, the exports and the public share view need.
 * Contains no ids of the owner and no internal fields.
 */
export const SummaryDto = z.object({
  event: z.object({
    name: z.string(),
    currency: z.string(),
    settlementMode: SettlementModeSchema,
  }),
  participants: z.array(ParticipantDto),
  bills: z.array(SummaryBillDto),
  people: z.array(PersonSummaryDto),
  perBillTransfers: z.array(TransferDto),
  nettTransfers: z.array(TransferDto),
  billsWithoutPayer: z.array(z.string()),
  unassigned: z.number(),
  grandTotal: z.number(),
});
export type SummaryDto = z.infer<typeof SummaryDto>;
