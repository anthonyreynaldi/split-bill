"use server";
/**
 * Bill Server Actions. Documented in docs/server-actions.md#bills.
 * Call these from `features/bills/hooks` only.
 *
 * @module
 */
import { BillRefInput, CreateBillInput, UpdateBillInput } from "@/shared/dto";
import { getContainer } from "../container";
import { defineAction, requireUserId } from "./_lib/define-action";

const bills = () => getContainer().services.bills;

/** One bill with items, allocations, charges and a signed image URL. Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const getBill = defineAction(BillRefInput, async (ref) => bills().get(await requireUserId(), ref));

/**
 * Save a new bill (all items and charges at once).
 * Errors: `UNAUTHORIZED`, `NOT_FOUND` (event), `VALIDATION_ERROR` (unknown payer/participant).
 */
export const createBill = defineAction(CreateBillInput, async (input) => bills().create(await requireUserId(), input));

/** Replace a bill completely. Same errors as `createBill`. */
export const updateBill = defineAction(UpdateBillInput, async (input) => bills().update(await requireUserId(), input));

/** Delete a bill and its image. Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const deleteBill = defineAction(BillRefInput, async (ref) => {
  await bills().delete(await requireUserId(), ref);
  return null;
});
