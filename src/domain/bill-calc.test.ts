import { describe, expect, it } from "vitest";
import { sum } from "@/shared/lib/money";
import { calculateBill } from "./bill-calc";
import { computeChargeTotals } from "./charges";
import { bill, charge, item } from "./test-fixtures";

const ids = ["A", "B", "C"];

describe("computeChargeTotals", () => {
  it("uses Indonesian receipt order: service on subtotal, tax on subtotal+service", () => {
    expect(
      computeChargeTotals(100000, [charge("service", "percent", 5), charge("tax", "percent", 10)]),
    ).toEqual({ discount: 0, service: 5000, tax: 10500 });
  });

  it("applies discount before service and tax", () => {
    expect(
      computeChargeTotals(100000, [
        charge("discount", "amount", 20000),
        charge("service", "percent", 5),
        charge("tax", "percent", 10),
      ]),
    ).toEqual({ discount: 20000, service: 4000, tax: 8400 });
  });

  it("never discounts more than the subtotal", () => {
    expect(computeChargeTotals(5000, [charge("discount", "amount", 9000)]).discount).toBe(5000);
  });
});

describe("calculateBill", () => {
  it("proportional charges follow each person's item subtotal", () => {
    const b = bill({
      items: [
        item({ total: 60000, splitMode: "custom", allocations: [{ participantId: "A", units: 1 }] }),
        item({ total: 40000, splitMode: "custom", allocations: [{ participantId: "B", units: 1 }] }),
      ],
      charges: [charge("service", "percent", 5), charge("tax", "percent", 10)],
    });
    const r = calculateBill(b, ids);
    expect(r.total).toBe(115500);
    expect(r.perPerson.map((p) => [p.participantId, p.subtotal, p.service, p.tax, p.total])).toEqual([
      ["A", 60000, 3000, 6300, 69300],
      ["B", 40000, 2000, 4200, 46200],
    ]);
    expect(r.unassigned).toBe(0);
  });

  it("even charges are split equally among people on the bill only", () => {
    const b = bill({
      chargeSplitMode: "even",
      items: [
        item({ total: 90000, splitMode: "custom", allocations: [{ participantId: "A", units: 1 }] }),
        item({ total: 10000, splitMode: "custom", allocations: [{ participantId: "B", units: 1 }] }),
      ],
      charges: [charge("service", "amount", 10000)],
    });
    const r = calculateBill(b, ids);
    expect(r.perPerson.map((p) => p.service)).toEqual([5000, 5000]);
    expect(r.perPerson.find((p) => p.participantId === "C")).toBeUndefined();
  });

  it("unassigned items carry their proportional share of charges", () => {
    const b = bill({
      items: [
        item({ total: 50000 }), // even across A, B, C
        item({ total: 50000, splitMode: "custom" }), // nobody yet
      ],
      charges: [charge("tax", "percent", 10)],
    });
    const r = calculateBill(b, ids);
    expect(r.total).toBe(110000);
    expect(r.unassigned).toBe(55000);
    expect(sum(r.perPerson.map((p) => p.total)) + r.unassigned).toBe(r.total);
  });

  it("lists each person's items with units and amounts", () => {
    const b = bill({
      items: [
        item({
          name: "Sate",
          qty: 3,
          total: 45000,
          splitMode: "custom",
          allocations: [
            { participantId: "A", units: 2 },
            { participantId: "C", units: 1 },
          ],
        }),
      ],
    });
    const r = calculateBill(b, ids);
    expect(r.perPerson.find((p) => p.participantId === "A")?.items).toEqual([
      expect.objectContaining({ name: "Sate", units: 2, amount: 30000 }),
    ]);
  });

  it("always reconciles: Σ person totals + unassigned = bill total (property check)", () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let n = 0; n < 300; n++) {
      const items = Array.from({ length: 1 + Math.floor(rand() * 6) }, () => {
        const custom = rand() < 0.6;
        return item({
          total: Math.floor(rand() * 200000),
          qty: 1 + Math.floor(rand() * 4),
          splitMode: custom ? "custom" : "even",
          allocations: custom
            ? ids.filter(() => rand() < 0.6).map((participantId) => ({ participantId, units: 0.5 + Math.floor(rand() * 4) / 2 }))
            : [],
        });
      });
      const charges = [
        charge("service", "percent", Math.floor(rand() * 10)),
        charge("tax", "percent", 10),
        charge("discount", rand() < 0.5 ? "amount" : "percent", Math.floor(rand() * 15000)),
      ];
      const b = bill({ items, charges, chargeSplitMode: rand() < 0.5 ? "even" : "proportional" });
      const r = calculateBill(b, ids);
      expect(sum(r.perPerson.map((p) => p.total)) + r.unassigned).toBe(r.total);
      for (const p of r.perPerson) expect(p.total).toBe(p.subtotal - p.discount + p.service + p.tax);
    }
  });
});
