import type { BillChargeInput, BillFormValues, BillItemInput, OcrResult } from "@/shared/dto";
import { toMinor } from "@/shared/lib/money";

/**
 * Turn lenient model output (major units, missing fields) into bill form values
 * (integer minor units, every field present). Pure and deterministic.
 *
 * Rules:
 * - qty defaults to 1; a missing total = qty × unitPrice; a missing unitPrice = total ÷ qty
 * - items with no usable price are dropped
 * - discount/service/tax become **amount** charges (receipts print amounts, not %)
 * - every item starts as "split evenly"; the user refines it
 */
export function ocrToFormValues(
  r: OcrResult,
  currency: string,
  imagePath: string | null,
): BillFormValues & { receiptTotal: number | null } {
  const money = (n: number | undefined) => (n == null || !Number.isFinite(n) ? undefined : Math.abs(toMinor(n, currency)));

  const items: BillItemInput[] = r.items
    .map((it): BillItemInput | null => {
      const qty = it.qty && it.qty > 0 ? it.qty : 1;
      const unit = money(it.unitPrice);
      const total = money(it.total) ?? (unit != null ? Math.round(unit * qty) : undefined);
      if (total == null) return null;
      return {
        name: (it.name || "?").trim().slice(0, 200) || "?",
        qty,
        unitPrice: unit ?? Math.round(total / qty),
        total,
        splitMode: "even",
        allocations: [],
      };
    })
    .filter((x): x is BillItemInput => x !== null)
    .slice(0, 300);

  const charges: BillChargeInput[] = (["discount", "service", "tax"] as const)
    .map((kind) => ({ kind, mode: "amount" as const, value: money(r[kind]) ?? 0 }))
    .filter((c) => c.value > 0);

  return {
    title: (r.merchant ?? "").trim().slice(0, 200) || "Receipt",
    billDate: normaliseDate(r.date),
    paidBy: null,
    imagePath,
    chargeSplitMode: "proportional",
    items,
    charges,
    receiptTotal: money(r.total) ?? null,
  };
}

/** Accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY (Indonesian receipts); otherwise null. */
export function normaliseDate(s: string | null | undefined): string | null {
  if (!s) return null;
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  const dmy = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  let y: number, m: number, d: number;
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (dmy) {
    [d, m, y] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
    if (y < 100) y += 2000;
  } else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}
