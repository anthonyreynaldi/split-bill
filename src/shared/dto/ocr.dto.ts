import { z } from "zod";
import { BillFormValues } from "./bill.dto";
import { IdSchema } from "./common";

/**
 * What we ask the vision model to return. This is **lenient** on purpose:
 * models sometimes send numbers as strings ("12.500") or leave fields out.
 * The service normalises it into a {@link BillDraftDto}.
 */
const looseNumber = z.preprocess((v) => {
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.,-]/g, "");
    // "12.500" / "12,500" (thousands) → 12500 ; "12,5" → 12.5
    const normal = /^-?\d{1,3}([.,]\d{3})+$/.test(cleaned)
      ? cleaned.replace(/[.,]/g, "")
      : cleaned.replace(",", ".");
    const n = Number(normal);
    return Number.isFinite(n) ? n : undefined;
  }
  return v;
}, z.number().optional());

export const OcrResult = z.object({
  merchant: z.string().nullish(),
  date: z.string().nullish(),
  currency: z.string().nullish(),
  items: z
    .array(
      z.object({
        name: z.string().default("?"),
        qty: looseNumber,
        unitPrice: looseNumber,
        total: looseNumber,
      }),
    )
    .default([]),
  subtotal: looseNumber,
  discount: looseNumber,
  service: looseNumber,
  tax: looseNumber,
  total: looseNumber,
});
export type OcrResult = z.infer<typeof OcrResult>;

/** OCR output after normalisation: ready to prefill the bill form. Not saved yet. */
export const BillDraftDto = BillFormValues.extend({
  /** ok = prefilled; failed = model error / unreadable (form is empty); disabled = no OCR configured. */
  ocrStatus: z.enum(["ok", "failed", "disabled"]),
  /** Total printed on the receipt, so the user can compare with the calculated one. */
  receiptTotal: z.number().nullable(),
  /** Signed URL to show the image next to the draft. */
  imageUrl: z.string().nullable(),
});
export type BillDraftDto = z.infer<typeof BillDraftDto>;

/**
 * Input for `uploadReceipt`: a FormData with `eventId` and `file` (image/jpeg|png|webp, ≤ 5 MB).
 * The browser compresses photos before upload (see features/ocr/hooks/compress-image.ts).
 */
export const UploadReceiptInput = z
  .instanceof(FormData)
  // FormData values are untyped; the pipe below does the real checking.
  .transform((fd) => ({ eventId: String(fd.get("eventId") ?? ""), file: fd.get("file") as Blob }))
  .pipe(z.object({ eventId: IdSchema, file: z.instanceof(Blob, { error: "required" }) }));
export type UploadReceiptInput = z.input<typeof UploadReceiptInput>;
