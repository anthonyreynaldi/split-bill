import { describe, expect, it } from "vitest";
import { splitItem } from "./split";
import { item } from "./test-fixtures";

const ids = ["A", "B", "C"];

describe("splitItem", () => {
  it("even: shares equally among all participants", () => {
    const r = splitItem(item({ total: 10000, qty: 3 }), ids);
    expect(r.shares.map((s) => s.amount)).toEqual([3334, 3333, 3333]);
    expect(r.shares.map((s) => s.units)).toEqual([1, 1, 1]);
    expect(r.unassigned).toBe(0);
  });

  it("custom: proportional to units (qty 3 → A 2, B 1)", () => {
    const r = splitItem(
      item({
        total: 30000,
        qty: 3,
        splitMode: "custom",
        allocations: [
          { participantId: "A", units: 2 },
          { participantId: "B", units: 1 },
        ],
      }),
      ids,
    );
    expect(r.shares).toEqual([
      { participantId: "A", units: 2, amount: 20000 },
      { participantId: "B", units: 1, amount: 10000 },
    ]);
  });

  it("custom: supports half portions", () => {
    const r = splitItem(
      item({
        total: 25000,
        splitMode: "custom",
        allocations: [
          { participantId: "A", units: 0.5 },
          { participantId: "B", units: 0.5 },
        ],
      }),
      ids,
    );
    expect(r.shares.map((s) => s.amount)).toEqual([12500, 12500]);
  });

  it("custom: merges duplicates and ignores unknown people / zero units", () => {
    const r = splitItem(
      item({
        total: 900,
        splitMode: "custom",
        allocations: [
          { participantId: "A", units: 1 },
          { participantId: "ghost", units: 5 },
          { participantId: "B", units: 0 },
          { participantId: "A", units: 2 },
        ],
      }),
      ids,
    );
    expect(r.shares).toEqual([{ participantId: "A", units: 3, amount: 900 }]);
  });

  it("custom with nobody assigned → everything unassigned", () => {
    const r = splitItem(item({ total: 5000, splitMode: "custom" }), ids);
    expect(r.shares).toEqual([]);
    expect(r.unassigned).toBe(5000);
  });

  it("even with no participants → unassigned", () => {
    expect(splitItem(item({ total: 5000 }), []).unassigned).toBe(5000);
  });

  describe("per_unit", () => {
    const five = ["A", "B", "C", "D", "E"];
    const pizza = (allocations: { participantId: string; unit?: number }[], p: { total?: number; qty?: number } = {}) =>
      item({
        total: p.total ?? 60000,
        qty: p.qty ?? 2,
        splitMode: "per_unit",
        allocations: allocations.map((a) => ({ ...a, units: 1 })),
      });
    const tick = (unit: number, ...ps: string[]) => ps.map((participantId) => ({ participantId, unit }));

    it("each unit is split among its own people (qty 2: A+B, C+D+E)", () => {
      const r = splitItem(pizza([...tick(0, "A", "B"), ...tick(1, "C", "D", "E")]), five);
      expect(r.shares).toEqual([
        { participantId: "A", units: 0.5, amount: 15000 },
        { participantId: "B", units: 0.5, amount: 15000 },
        { participantId: "C", units: 0.3333, amount: 10000 },
        { participantId: "D", units: 0.3333, amount: 10000 },
        { participantId: "E", units: 0.3333, amount: 10000 },
      ]);
      expect(r.unassigned).toBe(0);
    });

    it("someone on several units gets the sum of their parts", () => {
      const r = splitItem(pizza([...tick(0, "A", "B"), ...tick(1, "A")]), five);
      expect(r.shares).toEqual([
        { participantId: "A", units: 1.5, amount: 45000 },
        { participantId: "B", units: 0.5, amount: 15000 },
      ]);
    });

    it("uneven totals still add up exactly", () => {
      const r = splitItem(pizza([...tick(0, "A", "B", "C"), ...tick(1, "D", "E", "A")], { total: 10001 }), five);
      const sum = r.shares.reduce((s, x) => s + x.amount, 0);
      expect(sum + r.unassigned).toBe(10001);
      expect(r.unassigned).toBe(0);
    });

    it("a unit with nobody ticked is unassigned", () => {
      const r = splitItem(pizza(tick(0, "A")), five);
      expect(r.shares).toEqual([{ participantId: "A", units: 1, amount: 30000 }]);
      expect(r.unassigned).toBe(30000);
    });

    it("ignores duplicates, unknown people, missing and out-of-range units", () => {
      const r = splitItem(
        pizza([...tick(0, "A", "A", "ghost"), { participantId: "B" }, ...tick(2, "C"), ...tick(-1, "D"), ...tick(1, "B")]),
        five,
      );
      expect(r.shares).toEqual([
        { participantId: "A", units: 1, amount: 30000 },
        { participantId: "B", units: 1, amount: 30000 },
      ]);
    });

    it("no ticks at all → everything unassigned", () => {
      const r = splitItem(pizza([], { qty: 3, total: 9000 }), five);
      expect(r.shares).toEqual([]);
      expect(r.unassigned).toBe(9000);
    });
  });
});
