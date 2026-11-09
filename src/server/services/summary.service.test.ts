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

  it("lists each bill's items with their split and a signed photo URL (only when photos are on)", async () => {
    const { services } = createTestServices();
    const u = await services.auth.register({ email: "p@b.co", password: "secret123" });
    const e = await services.events.create(u.id, { name: "Trip" });
    const [a, b] = await Promise.all(
      ["Ana", "Budi"].map((name) => services.events.addParticipant(u.id, { eventId: e.id, name })),
    );
    const jpeg = { data: new Uint8Array([0xff, 0xd8, 0xff, 1]), contentType: "image/jpeg" };
    const draft = await services.ocr.uploadAndExtract(u.id, e.id, jpeg); // stores the photo
    await services.bills.create(u.id, {
      eventId: e.id,
      title: "Dinner",
      billDate: null,
      paidBy: a.id,
      imagePath: draft.imagePath,
      chargeSplitMode: "proportional",
      items: [
        { name: "Rice", qty: 1, unitPrice: 10000, total: 10000, splitMode: "even", allocations: [] },
        {
          name: "Satay",
          qty: 3,
          unitPrice: 10000,
          total: 30000,
          splitMode: "custom",
          allocations: [
            { participantId: a.id, units: 2 },
            { participantId: b.id, units: 1 },
          ],
        },
        {
          name: "Pizza",
          qty: 2,
          unitPrice: 30000,
          total: 60000,
          splitMode: "per_unit",
          allocations: [
            { participantId: a.id, units: 1, unit: 0 },
            { participantId: b.id, units: 1, unit: 0 },
            { participantId: b.id, units: 1, unit: 1 },
          ],
        },
      ],
      charges: [],
    });

    const s = await services.summary.get(u.id, e.id);
    const bill = s.bills[0];
    expect(bill.imageUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(bill.items.map((i) => [i.name, i.splitMode])).toEqual([
      ["Rice", "even"],
      ["Satay", "custom"],
      ["Pizza", "per_unit"],
    ]);
    expect(bill.items[1].allocations).toEqual([
      { participantId: a.id, units: 2 },
      { participantId: b.id, units: 1 },
    ]);
    expect(bill.items[2].allocations.map((x) => x.unit).sort()).toEqual([0, 0, 1]);

    const noPhotos = await services.summary.get(u.id, e.id, { photos: false });
    expect(noPhotos.bills[0].imageUrl).toBeNull();
    expect(noPhotos.bills[0].items).toHaveLength(3);
  });
});
