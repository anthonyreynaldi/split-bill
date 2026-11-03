import { describe, expect, it } from "vitest";
import { allocate, formatMoney, fromMinor, sum, toMinor } from "./money";

describe("allocate (largest remainder)", () => {
  it("splits evenly with the extra unit going to the first part", () => {
    expect(allocate(10000, [1, 1, 1])).toEqual([3334, 3333, 3333]);
  });

  it("splits proportionally", () => {
    expect(allocate(3000, [2, 1])).toEqual([2000, 1000]);
  });

  it("supports fractional weights", () => {
    expect(allocate(1000, [0.5, 0.5, 1])).toEqual([250, 250, 500]);
  });

  it("gives zero-weight parts nothing", () => {
    expect(allocate(10, [0, 1, 1])).toEqual([0, 5, 5]);
    expect(allocate(1, [0, 1, 1])).toEqual([0, 1, 0]);
  });

  it("gives leftovers to the largest remainders", () => {
    // exact: 1.666, 3.333 → floors 1, 3, remainder 1 → goes to index 0 (.666 > .333)
    expect(allocate(5, [1, 2])).toEqual([2, 3]);
  });

  it("handles negative totals (discounts)", () => {
    expect(allocate(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
  });

  it("returns zeros when total is 0", () => {
    expect(allocate(0, [0, 0])).toEqual([0, 0]);
  });

  it("throws when nothing can receive a non-zero total", () => {
    expect(() => allocate(5, [0, 0])).toThrow();
    expect(() => allocate(5, [])).toThrow();
  });

  it("rejects non-integer totals and negative weights", () => {
    expect(() => allocate(1.5, [1])).toThrow();
    expect(() => allocate(1, [-1, 2])).toThrow();
  });

  it("always sums exactly to the total (property check)", () => {
    let seed = 42;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let n = 0; n < 500; n++) {
      const total = Math.floor(rand() * 1_000_000) - 200_000;
      const weights = Array.from({ length: 1 + Math.floor(rand() * 8) }, () =>
        Math.round(rand() * 10 * 4) / 4,
      );
      if (sum(weights) === 0) weights[0] = 1;
      const parts = allocate(total, weights);
      expect(sum(parts)).toBe(total);
      parts.forEach((p, i) => weights[i] === 0 && expect(p).toBe(0));
    }
  });
});

describe("currency helpers", () => {
  it("converts IDR without decimals and USD with cents", () => {
    expect(toMinor(10000, "IDR")).toBe(10000);
    expect(toMinor(12.5, "USD")).toBe(1250);
    expect(fromMinor(1250, "USD")).toBe(12.5);
  });

  it("formats IDR without decimals", () => {
    const s = formatMoney(10000, "IDR", "id");
    expect(s).toContain("10.000");
    expect(s).not.toContain(",00");
  });
});
