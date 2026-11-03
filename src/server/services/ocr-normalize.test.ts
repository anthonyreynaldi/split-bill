import { describe, expect, it } from "vitest";
import { OcrResult } from "@/shared/dto";
import { normaliseDate, ocrToFormValues } from "./ocr-normalize";

describe("ocrToFormValues", () => {
  it("fills missing totals/prices and converts to minor units", () => {
    const r = OcrResult.parse({
      merchant: " Warung Made ",
      date: "03/11/2026",
      items: [
        { name: "Nasi goreng", qty: 2, unitPrice: "25.000" },
        { name: "Es teh", total: 8000, qty: 2 },
        { name: "Mystery" },
      ],
      service: 2900,
      tax: "6.090",
      total: "64.990",
    });
    const v = ocrToFormValues(r, "IDR", "e1/img.jpg");
    expect(v.title).toBe("Warung Made");
    expect(v.billDate).toBe("2026-11-03");
    expect(v.items).toEqual([
      { name: "Nasi goreng", qty: 2, unitPrice: 25000, total: 50000, splitMode: "even", allocations: [] },
      { name: "Es teh", qty: 2, unitPrice: 4000, total: 8000, splitMode: "even", allocations: [] },
    ]);
    expect(v.charges).toEqual([
      { kind: "service", mode: "amount", value: 2900 },
      { kind: "tax", mode: "amount", value: 6090 },
    ]);
    expect(v.receiptTotal).toBe(64990);
    expect(v.imagePath).toBe("e1/img.jpg");
  });

  it("uses cents for USD and a fallback title", () => {
    const v = ocrToFormValues(OcrResult.parse({ items: [{ name: "Coffee", total: 4.5 }] }), "USD", null);
    expect(v.items[0].total).toBe(450);
    expect(v.title).toBe("Receipt");
  });

  it("treats negative discounts as positive amounts", () => {
    const v = ocrToFormValues(OcrResult.parse({ items: [], discount: -5000 }), "IDR", null);
    expect(v.charges).toEqual([{ kind: "discount", mode: "amount", value: 5000 }]);
  });
});

describe("normaliseDate", () => {
  it("parses common receipt formats and rejects nonsense", () => {
    expect(normaliseDate("2026-11-03 19:20")).toBe("2026-11-03");
    expect(normaliseDate("3-11-26")).toBe("2026-11-03");
    expect(normaliseDate("31/02/2026")).toBeNull();
    expect(normaliseDate("yesterday")).toBeNull();
    expect(normaliseDate(null)).toBeNull();
  });
});
