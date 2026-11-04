import { describe, expect, it } from "vitest";
import type { BillFormValues } from "@/shared/dto";
import { createTestServices } from "./test-utils";

describe("SummaryService", () => {
  it("summarises an event across bills (nett offsets debts)", async () => {
    const { services } = createTestServices();
    const u = await services.auth.register({ email: "a@b.co", password: "secret123" });
    const e = await services.events.create(u.id, { name: "Trip" });
    const [a, b, c] = await Promise.all(
      ["Ana", "Budi", "Citra"].map((name) => services.events.addParticipant(u.id, { eventId: e.id, name })),
    );
    const bill = (title: string, paidBy: string, total: number): BillFormValues => ({
      title,
      billDate: null,
      paidBy,
      imagePath: null,
      chargeSplitMode: "proportional",
      items: [{ name: "x", qty: 1, unitPrice: total, total, splitMode: "even", allocations: [] }],
      charges: [],
    });
    await services.bills.create(u.id, { eventId: e.id, ...bill("Lunch", a.id, 30000) });
    await services.bills.create(u.id, { eventId: e.id, ...bill("Dinner", b.id, 60000) });

    const s = await services.summary.get(u.id, e.id);
    expect(s.grandTotal).toBe(90000);
    expect(s.participants.map((p) => p.name).sort()).toEqual(["Ana", "Budi", "Citra"]);
    expect(s.bills.map((x) => x.title)).toEqual(["Lunch", "Dinner"]);
    expect(s.nettTransfers).toEqual([{ from: c.id, to: b.id, amount: 30000 }]);
    expect(s.perBillTransfers).toHaveLength(4);
    expect(s.people.find((p) => p.participantId === a.id)).toMatchObject({ owed: 30000, paid: 30000, balance: 0 });
  });

  it("per-unit split: qty 2 pizza, unit 1 → 2 people, unit 2 → 3 people", async () => {
    const { services } = createTestServices();
    const u = await services.auth.register({ email: "a@b.co", password: "secret123" });
    const e = await services.events.create(u.id, { name: "Trip" });
    const ppl = [];
    for (const name of ["A", "B", "C", "D", "E"]) ppl.push(await services.events.addParticipant(u.id, { eventId: e.id, name }));
    const [a, b, c, d, x] = ppl;
    const tick = (unit: number, ...ids: string[]) => ids.map((participantId) => ({ participantId, units: 1, unit }));
    const saved = await services.bills.create(u.id, {
      eventId: e.id,
      title: "Pizza night",
      billDate: null,
      paidBy: a.id,
      imagePath: null,
      chargeSplitMode: "proportional",
      items: [
        {
          name: "Pizza",
          qty: 2,
          unitPrice: 30000,
          total: 60000,
          splitMode: "per_unit",
          allocations: [...tick(0, a.id, b.id), ...tick(1, c.id, d.id, x.id)],
        },
      ],
      charges: [],
    });
    expect(saved.items[0].allocations.map((al) => al.unit)).toEqual([0, 0, 1, 1, 1]);

    const s = await services.summary.get(u.id, e.id);
    const owed = Object.fromEntries(s.people.map((p) => [p.participantId, p.owed]));
    expect([a, b, c, d, x].map((p) => owed[p.id])).toEqual([15000, 15000, 10000, 10000, 10000]);
  });

  it("hides other users' events", async () => {
    const { services } = createTestServices();
    const u = await services.auth.register({ email: "a@b.co", password: "secret123" });
    const x = await services.auth.register({ email: "x@b.co", password: "secret123" });
    const e = await services.events.create(u.id, { name: "Trip" });
    await expect(services.summary.get(x.id, e.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
