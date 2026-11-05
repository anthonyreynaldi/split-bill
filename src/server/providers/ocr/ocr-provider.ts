/**
 * Port for receipt reading (ADR 0005). Implementations return the model's
 * **raw parsed JSON**; `OcrService` validates it with the `OcrResult` zod DTO.
 * Add a new provider (Tesseract, Google Vision…) by implementing this and
 * choosing it in `container.ts`.
 */
export interface OcrProvider {
  /** @throws on network/model errors or non-JSON output */
  extract(image: { data: Uint8Array; contentType: string }): Promise<unknown>;
}

/** Instructions shared by LLM-based providers. Keep the JSON shape in sync with `OcrResult`. */
export const RECEIPT_PROMPT = `You read photos of shop and restaurant receipts (often Indonesian).
Return ONLY a JSON object, no prose, no markdown fences, with this shape:
{
  "merchant": string | null,
  "date": "YYYY-MM-DD" | null,
  "currency": "IDR" | "USD" | ... | null,
  "items": [{ "name": string, "qty": number, "unitPrice": number, "total": number }],
  "subtotal": number | null,
  "discount": number | null,
  "service": number | null,
  "tax": number | null,
  "rounding": number | null,
  "total": number | null
}
Rules:
- Numbers are plain numbers in the receipt currency, without thousand separators (Rp 25.000 → 25000).
- One entry per printed line item; "total" is the line total (qty × unitPrice).
- "service" = service charge; "tax" = PB1/PPN/tax; "discount" = total discounts as a positive number.
- "rounding" = the rounding line (Pembulatan / Rounding / Round off / Pembulatan harga), SIGNED:
  negative when it lowers the total (Pembulatan -200 → -200), positive when it raises it. null if there is none.
- Do not invent items. Use null when unsure.`;
