import { describe, expect, it } from "vitest";
import type { BillFormValues } from "@/shared/dto";
import { createTestServices } from "./test-utils";

async function setup() {
  const t = createTestServices();
  const owner = await t.services.auth.register({ email: "o@x.co", password: "secret123" });
  const other = await t.services.auth.register({ email: "x@x.co", password: "secret123" });
  const event = await t.services.events.create(owner.id, { name: "Trip" });
  const ana = await t.services.events.addParticipant(owner.id, { eventId: event.id, name: "Ana" });
  const budi = await t.services.events.addParticipant(owner.id, { eventId: event.id, name: "Budi" });
  const values = (over: Partial<BillFormValues> = {}): BillFormValues => ({
    title: "Dinner",
    billDate: "2026-11-03",
    paidBy: ana.id,
    imagePath: null,
    chargeSplitMode: "proportional",
    items: [
      {
        name: "Sate",
        qty: 2,
        unitPrice: 20000,
        total: 40000,
        splitMode: "custom",
        allocations: [{ participantId: budi.id, units: 2 }],
      },
    ],
    charges: [{ kind: "tax", mode: "percent", value: 10 }],
    ...over,
  });
  return { ...t, owner, other, event, ana, budi, values };
}

describe("BillService", () => {
  it("creates, reads, updates and deletes a bill", async () => {
    const { services, owner, event, values } = await setup();
    const b = await services.bills.create(owner.id, { eventId: event.id, ...values() });
    expect(b).toMatchObject({ title: "Dinner", items: [{ name: "Sate", total: 40000 }], imageUrl: null });
    expect(await services.bills.get(owner.id, { eventId: event.id, billId: b.id })).toEqual(b);

    const u = await services.bills.update(owner.id, {
      eventId: event.id,
      billId: b.id,
      ...values({ title: "Dinner 2", items: [] }),
    });
    expect(u).toMatchObject({ id: b.id, title: "Dinner 2", items: [] });

    const detail = await services.events.getDetail(owner.id, event.id);
    expect(detail.bills).toEqual([expect.objectContaining({ id: b.id, total: 0, itemCount: 0 })]);

    await services.bills.delete(owner.id, { eventId: event.id, billId: b.id });
    await expect(services.bills.get(owner.id, { eventId: event.id, billId: b.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("bill list totals include charges", async () => {
    const { services, owner, event, values } = await setup();
    await services.bills.create(owner.id, { eventId: event.id, ...values() });
    const detail = await services.events.getDetail(owner.id, event.id);
    expect(detail.bills[0].total).toBe(44000);
  });

  it("rejects a payer or allocation from another event", async () => {
    const { services, owner, event, values } = await setup();
    const e2 = await services.events.create(owner.id, { name: "Other" });
    const stranger = await services.events.addParticipant(owner.id, { eventId: e2.id, name: "Zed" });

    await expect(
      services.bills.create(owner.id, { eventId: event.id, ...values({ paidBy: stranger.id }) }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR", fieldErrors: { paidBy: ["invalid"] } });

    const bad = values();
    bad.items[0].allocations = [{ participantId: stranger.id, units: 1 }];
    await expect(services.bills.create(owner.id, { eventId: event.id, ...bad })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      fieldErrors: { "items.0.allocations": ["invalid"] },
    });
  });

  it("rejects an image path outside the event folder", async () => {
    const { services, owner, event, values } = await setup();
    await expect(
      services.bills.create(owner.id, { eventId: event.id, ...values({ imagePath: "other-event/x.jpg" }) }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("hides bills of other users and bills of another event", async () => {
    const { services, owner, other, event, values } = await setup();
    const b = await services.bills.create(owner.id, { eventId: event.id, ...values() });
    await expect(services.bills.get(other.id, { eventId: event.id, billId: b.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const e2 = await services.events.create(owner.id, { name: "Other" });
    await expect(services.bills.get(owner.id, { eventId: e2.id, billId: b.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
