import { describe, expect, it } from "vitest";
import { sum } from "@/shared/lib/money";
import { calculateEvent, settleNett } from "./settlement";
import { bill, item, people } from "./test-fixtures";

describe("calculateEvent", () => {
  // A paid lunch (300, split A/B/C), B paid dinner (600, split A/B/C).
  const participants = people("A", "B", "C");
  const lunch = bill({ title: "Lunch", paidBy: "A", items: [item({ total: 300 })] });
  const dinner = bill({ title: "Dinner", paidBy: "B", items: [item({ total: 600 })] });
  const r = calculateEvent(participants, [lunch, dinner]);

  it("computes owed / paid / balance per person", () => {
    expect(r.people).toEqual([
      { participantId: "A", owed: 300, paid: 300, balance: 0 },
      { participantId: "B", owed: 300, paid: 600, balance: 300 },
      { participantId: "C", owed: 300, paid: 0, balance: -300 },
    ]);
    expect(sum(r.people.map((p) => p.balance))).toBe(0);
  });

  it("per-bill: everyone pays each bill's payer", () => {
    expect(r.perBillTransfers).toEqual([
      { from: "B", to: "A", amount: 100, billId: lunch.id },
      { from: "C", to: "A", amount: 100, billId: lunch.id },
      { from: "A", to: "B", amount: 200, billId: dinner.id },
      { from: "C", to: "B", amount: 200, billId: dinner.id },
    ]);
  });

  it("nett: debts cancel out across bills → one transfer", () => {
    expect(r.nettTransfers).toEqual([{ from: "C", to: "B", amount: 300 }]);
  });

  it("excludes bills without a payer from settlement but still counts consumption", () => {
    const noPayer = bill({ items: [item({ total: 900 })] });
    const r2 = calculateEvent(participants, [noPayer]);
    expect(r2.billsWithoutPayer).toEqual([noPayer.id]);
    expect(r2.people.map((p) => p.owed)).toEqual([300, 300, 300]);
    expect(r2.people.map((p) => p.balance)).toEqual([0, 0, 0]);
    expect(r2.nettTransfers).toEqual([]);
  });

  it("unassigned money stays with the payer (nobody owes it)", () => {
    const b = bill({ paidBy: "A", items: [item({ total: 500, splitMode: "custom" })] });
    const r3 = calculateEvent(participants, [b]);
    expect(r3.unassigned).toBe(500);
    expect(r3.people.map((p) => p.balance)).toEqual([0, 0, 0]);
  });
});

describe("settleNett", () => {
  it("needs at most n−1 transfers and clears every balance", () => {
    const balances = [
      { participantId: "A", balance: 500 },
      { participantId: "B", balance: -200 },
      { participantId: "C", balance: -250 },
      { participantId: "D", balance: 100 },
      { participantId: "E", balance: -150 },
    ];
    const t = settleNett(balances);
    expect(t.length).toBeLessThanOrEqual(balances.length - 1);
    const net = new Map(balances.map((b) => [b.participantId, b.balance]));
    for (const x of t) {
      net.set(x.from, net.get(x.from)! + x.amount);
      net.set(x.to, net.get(x.to)! - x.amount);
    }
    expect([...net.values()].every((v) => v === 0)).toBe(true);
  });

  it("rejects balances that don't sum to zero", () => {
    expect(() => settleNett([{ participantId: "A", balance: 1 }])).toThrow();
  });
});
