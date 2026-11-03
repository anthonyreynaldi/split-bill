import { z } from "zod";
import {
  ChargeKindSchema,
  ChargeModeSchema,
  ChargeSplitModeSchema,
  DateOnlySchema,
  IdSchema,
  MoneySchema,
  SplitModeSchema,
  VALIDATION,
} from "./common";

const QtySchema = z
  .number({ error: VALIDATION.required })
  .positive({ error: VALIDATION.mustBePositive })
  .max(100_000, { error: VALIDATION.invalid });

/** One person's portion of an item (custom split). */
export const AllocationInput = z.object({
  participantId: IdSchema,
  units: z.number().positive({ error: VALIDATION.mustBePositive }).max(100_000),
});
export type AllocationInput = z.infer<typeof AllocationInput>;

/** One receipt line. `total` is authoritative; `unitPrice` is informational. */
export const BillItemInput = z.object({
  name: z.string().trim().min(1, { error: VALIDATION.required }).max(200, { error: VALIDATION.tooLong }),
  qty: QtySchema,
  unitPrice: MoneySchema,
  total: MoneySchema,
  splitMode: SplitModeSchema,
  allocations: z.array(AllocationInput).max(200),
});
export type BillItemInput = z.infer<typeof BillItemInput>;

/** Tax / service / discount. `percent`: 10 = 10%. `amount`: minor units. */
export const BillChargeInput = z
  .object({
    kind: ChargeKindSchema,
    mode: ChargeModeSchema,
    value: z.number({ error: VALIDATION.required }).min(0, { error: VALIDATION.mustBePositive }),
  })
  .refine((c) => c.mode === "amount" ? Number.isInteger(c.value) : c.value <= 100, {
    error: VALIDATION.invalid,
    path: ["value"],
  });
export type BillChargeInput = z.infer<typeof BillChargeInput>;

/** The editable part of a bill (used by the form and the OCR draft). */
export const BillFormValues = z.object({
  title: z.string().trim().min(1, { error: VALIDATION.required }).max(200, { error: VALIDATION.tooLong }),
  billDate: DateOnlySchema,
  paidBy: IdSchema.nullable(),
  imagePath: z.string().max(500).nullable(),
  chargeSplitMode: ChargeSplitModeSchema,
  items: z.array(BillItemInput).max(300),
  charges: z.array(BillChargeInput).max(20),
});
export type BillFormValues = z.infer<typeof BillFormValues>;

/** Input for `createBill`. The whole bill is saved at once. */
export const CreateBillInput = BillFormValues.extend({ eventId: IdSchema });
export type CreateBillInput = z.infer<typeof CreateBillInput>;

/** Input for `updateBill`. Replaces items/charges entirely (simple and predictable). */
export const UpdateBillInput = BillFormValues.extend({ eventId: IdSchema, billId: IdSchema });
export type UpdateBillInput = z.infer<typeof UpdateBillInput>;

/** Input for `getBill` / `deleteBill`. */
export const BillRefInput = z.object({ eventId: IdSchema, billId: IdSchema });
export type BillRefInput = z.infer<typeof BillRefInput>;

/** A saved bill as returned to the client. */
export const BillDto = BillFormValues.extend({
  id: z.string(),
  eventId: z.string(),
  /** Short-lived signed URL of the receipt image, if any. */
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type BillDto = z.infer<typeof BillDto>;
