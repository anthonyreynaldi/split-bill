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
  rounding: z.number(),
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
  rounding: z.number(),
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

/** Input for `exportSummaryExcel`. `locale` picks the language of sheet names and headers. */
export const ExportExcelInput = z.object({
  eventId: z.uuid(),
  locale: z.enum(["id", "en"]),
});
export type ExportExcelInput = z.infer<typeof ExportExcelInput>;

/** A generated file, base64-encoded so it travels safely through a Server Action. */
export const FileDto = z.object({ filename: z.string(), mimeType: z.string(), base64: z.string() });
export type FileDto = z.infer<typeof FileDto>;
