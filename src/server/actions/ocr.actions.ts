"use server";
/**
 * Receipt upload + OCR. Documented in docs/server-actions.md#ocr.
 *
 * @module
 */
import { UploadReceiptInput, type BillDraftDto } from "@/shared/dto";
import { getContainer } from "../container";
import { defineAction, requireUserId } from "./_lib/define-action";

/**
 * Upload a receipt photo and read it. Returns a **draft** (not saved) to prefill the bill form.
 * `draft.ocrStatus`: `ok` | `failed` (empty draft, photo kept) | `disabled` (no OCR configured).
 * Errors: `UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION_ERROR` (type/size).
 *
 * @example
 * const fd = new FormData(); fd.set("eventId", id); fd.set("file", blob);
 * const draft = await unwrap(uploadReceipt(fd));
 */
export const uploadReceipt = defineAction(UploadReceiptInput, async ({ eventId, file }): Promise<BillDraftDto> => {
  const userId = await requireUserId();
  const data = new Uint8Array(await file.arrayBuffer());
  return getContainer().services.ocr.uploadAndExtract(userId, eventId, { data, contentType: file.type });
});
