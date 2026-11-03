import { z } from "zod";
import { BillFormValues } from "./bill.dto";

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
  /** Total printed on the receipt, so the user can compare with the calculated one. */
  receiptTotal: z.number().nullable(),
  /** Signed URL to show the image next to the draft. */
  imageUrl: z.string().nullable(),
});
export type BillDraftDto = z.infer<typeof BillDraftDto>;
