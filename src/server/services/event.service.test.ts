import { describe, expect, it } from "vitest";
import { createTestServices } from "./test-utils";

async function setup() {
  const t = createTestServices();
  const owner = await t.services.auth.register({ email: "owner@x.co", password: "secret123" });
  const other = await t.services.auth.register({ email: "other@x.co", password: "secret123" });
  const event = await t.services.events.create(owner.id, { name: "Bali", currency: "IDR" });
  return { ...t, owner, other, event };
}

describe("EventService", () => {
  it("creates and lists the owner's events only", async () => {
    const { services, owner, other } = await setup();
    expect((await services.events.list(owner.id)).map((e) => e.name)).toEqual(["Bali"]);
    expect(await services.events.list(other.id)).toEqual([]);
  });

  it("manages participants", async () => {
    const { services, owner, event } = await setup();
    const ana = await services.events.addParticipant(owner.id, { eventId: event.id, name: "Ana" });
    await services.events.addParticipant(owner.id, { eventId: event.id, name: "Budi" });
    await services.events.renameParticipant(owner.id, { eventId: event.id, participantId: ana.id, name: "Ana B" });
    let d = await services.events.getDetail(owner.id, event.id);
    expect(d.participants.map((p) => p.name)).toEqual(["Ana B", "Budi"]);
    await services.events.removeParticipant(owner.id, { eventId: event.id, participantId: ana.id });
    d = await services.events.getDetail(owner.id, event.id);
    expect(d.participants.map((p) => p.name)).toEqual(["Budi"]);
  });

  it("hides other users' events (NOT_FOUND, not FORBIDDEN)", async () => {
    const { services, other, event } = await setup();
    for (const call of [
      () => services.events.getDetail(other.id, event.id),
      () => services.events.update(other.id, { eventId: event.id, name: "x" }),
      () => services.events.delete(other.id, event.id),
      () => services.events.addParticipant(other.id, { eventId: event.id, name: "x" }),
    ]) {
      await expect(call()).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
  });

  it("rejects a participant id from another event", async () => {
    const { services, owner, event } = await setup();
    const e2 = await services.events.create(owner.id, { name: "Other" });
    const p2 = await services.events.addParticipant(owner.id, { eventId: e2.id, name: "Zed" });
    await expect(
      services.events.removeParticipant(owner.id, { eventId: event.id, participantId: p2.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("updates settings and deletes", async () => {
    const { services, owner, event } = await setup();
    const u = await services.events.update(owner.id, { eventId: event.id, settlementMode: "per_bill" });
    expect(u.settlementMode).toBe("per_bill");
    await services.events.delete(owner.id, event.id);
    expect(await services.events.list(owner.id)).toEqual([]);
  });
});
