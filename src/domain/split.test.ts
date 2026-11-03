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
});
