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

  it("hides other users' events", async () => {
    const { services } = createTestServices();
    const u = await services.auth.register({ email: "a@b.co", password: "secret123" });
    const x = await services.auth.register({ email: "x@b.co", password: "secret123" });
    const e = await services.events.create(u.id, { name: "Trip" });
    await expect(services.summary.get(x.id, e.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
