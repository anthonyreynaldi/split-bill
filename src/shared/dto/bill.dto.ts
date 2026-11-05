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

/** Largest qty that can use the `per_unit` split (one row per unit in the editor). */
export const MAX_PER_UNIT_QTY = 50;

/**
 * One person's part of an item.
 * - `custom`: `units` = portions (weights).
 * - `per_unit`: `unit` = 0-based unit index this person shared; `units` is 1.
 */
export const AllocationInput = z.object({
  participantId: IdSchema,
  units: z.number().positive({ error: VALIDATION.mustBePositive }).max(100_000),
  unit: z.number().int().min(0).max(MAX_PER_UNIT_QTY - 1).optional(),
});
export type AllocationInput = z.infer<typeof AllocationInput>;

/**
 * One receipt line. `total` is authoritative; `unitPrice` is informational.
 * `per_unit` needs a whole-number qty from 1 to {@link MAX_PER_UNIT_QTY}.
 */
export const BillItemInput = z
  .object({
    name: z.string().trim().min(1, { error: VALIDATION.required }).max(200, { error: VALIDATION.tooLong }),
    qty: QtySchema,
    unitPrice: MoneySchema,
    total: MoneySchema,
    splitMode: SplitModeSchema,
    allocations: z.array(AllocationInput).max(500),
  })
  .refine((it) => it.splitMode !== "per_unit" || isPerUnitQty(it.qty), {
    error: VALIDATION.perUnitQty,
    path: ["qty"],
  });
export type BillItemInput = z.infer<typeof BillItemInput>;

/** True when `qty` can be split per unit (whole number, 1…{@link MAX_PER_UNIT_QTY}). */
export function isPerUnitQty(qty: number): boolean {
  return Number.isInteger(qty) && qty >= 1 && qty <= MAX_PER_UNIT_QTY;
}

const MAX_CHARGE_AMOUNT = 1_000_000_000_000;

/**
 * Tax / service / discount / rounding. `percent`: 10 = 10%. `amount`: minor units.
 *
 * - tax / service / discount: value ≥ 0; amount → integer; percent → ≤ 100.
 * - rounding: **amount only**, integer, may be **negative** (e.g. "Pembulatan −200").
 */
export const BillChargeInput = z
  .object({
    kind: ChargeKindSchema,
    mode: ChargeModeSchema,
    value: z.number({ error: VALIDATION.required }),
  })
  .refine((c) => c.kind === "rounding" || c.value >= 0, {
    error: VALIDATION.mustBePositive,
    path: ["value"],
  })
  .refine(
    (c) =>
      c.kind === "rounding"
        ? c.mode === "amount" && Number.isInteger(c.value) && Math.abs(c.value) <= MAX_CHARGE_AMOUNT
        : c.mode === "amount"
          ? Number.isInteger(c.value) && c.value <= MAX_CHARGE_AMOUNT
          : c.value <= 100,
    { error: VALIDATION.invalid, path: ["value"] },
  );
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
