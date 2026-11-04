/**
 * Repository CONTRACT tests: the same expectations for every backend.
 * - The memory backend always runs.
 * - Supabase runs only when SUPABASE_TEST_URL + SUPABASE_TEST_SERVICE_ROLE_KEY are set
 *   (use a throwaway project; the tests create and delete rows).
 * A new backend (e.g. Postgres, MySQL) passes when it is added to `backends` and this file is green.
 */
import { describe, expect, it } from "vitest";
import type { Repositories, SaveBillData } from "./interfaces";
import { createMemoryRepositories } from "./memory";
import { createSupabaseRepositories } from "./supabase";

const backends: [string, () => Repositories][] = [["memory", createMemoryRepositories]];
if (process.env.SUPABASE_TEST_URL && process.env.SUPABASE_TEST_SERVICE_ROLE_KEY) {
  const cfg = { url: process.env.SUPABASE_TEST_URL, serviceKey: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY };
  backends.push(["supabase", () => createSupabaseRepositories(cfg)]);
}

const email = () => `t-${crypto.randomUUID()}@example.com`;

describe.each(backends)("%s repositories", (_name, make) => {
  const setup = async () => {
    const r = make();
    const user = await r.users.create({ email: email(), passwordHash: "hash" });
    const event = await r.events.create({ ownerId: user.id, name: "Bali", currency: "IDR" });
    const ana = await r.participants.create(event.id, "Ana");
    const budi = await r.participants.create(event.id, "Budi");
    const billData = (over: Partial<SaveBillData> = {}): SaveBillData => ({
      eventId: event.id,
      title: "Lunch",
      billDate: "2026-11-03",
      paidBy: ana.id,
      imagePath: null,
      chargeSplitMode: "proportional",
      items: [
        {
          name: "Sate",
          qty: 3,
          unitPrice: 15000,
          total: 45000,
          splitMode: "custom",
          allocations: [
            { participantId: ana.id, units: 2 },
            { participantId: budi.id, units: 1 },
          ],
        },
        { name: "Teh", qty: 2, unitPrice: 5000, total: 10000, splitMode: "even", allocations: [] },
      ],
      charges: [{ kind: "tax", mode: "percent", value: 10 }],
      ...over,
    });
    return { r, user, event, ana, budi, billData };
  };

  it("users: create, find, reject duplicate email", async () => {
    const r = make();
    const e = email();
    const u = await r.users.create({ email: e, passwordHash: "h" });
    expect(await r.users.findByEmail(e)).toMatchObject({ id: u.id, passwordHash: "h" });
    expect(await r.users.findById(u.id)).toMatchObject({ email: e });
    await expect(r.users.create({ email: e, passwordHash: "x" })).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
    expect(await r.users.findByEmail("nobody@example.com")).toBeNull();
  });

  it("events: defaults, counts, update", async () => {
    const { r, user, event, billData } = await setup();
    expect(event).toMatchObject({ currency: "IDR", settlementMode: "nett" });
    await r.bills.save(billData());
    const [listed] = await r.events.listByOwner(user.id);
    expect(listed).toMatchObject({ id: event.id, participantCount: 2, billCount: 1 });
    const updated = await r.events.update(event.id, { settlementMode: "per_bill" });
    expect(updated).toMatchObject({ name: "Bali", settlementMode: "per_bill" });
  });

  it("participants: keep insertion order, rename", async () => {
    const { r, event, ana } = await setup();
    expect((await r.participants.listByEvent(event.id)).map((p) => p.name)).toEqual(["Ana", "Budi"]);
    await r.participants.rename(ana.id, "Ana B");
    expect((await r.participants.listByEvent(event.id))[0].name).toBe("Ana B");
  });

  it("bills: save creates with items/charges in order and merges duplicate allocations", async () => {
    const { r, ana, billData } = await setup();
    const data = billData();
    data.items[0].allocations.push({ participantId: ana.id, units: 0.5 });
    const b = await r.bills.save(data);
    expect(b.items.map((i) => i.name)).toEqual(["Sate", "Teh"]);
    expect(b.items[0].allocations.find((a) => a.participantId === ana.id)?.units).toBe(2.5);
    expect(b.charges).toEqual([expect.objectContaining({ kind: "tax", mode: "percent", value: 10 })]);
    expect(await r.bills.findById(b.id)).toEqual(b);
  });

  it("bills: per-unit allocations keep their unit index (and dedupe per unit)", async () => {
    const { r, ana, budi, billData } = await setup();
    const data = billData({
      items: [
        {
          name: "Pizza",
          qty: 2,
          unitPrice: 30000,
          total: 60000,
          splitMode: "per_unit",
          allocations: [
            { participantId: ana.id, units: 1, unit: 0 },
            { participantId: budi.id, units: 1, unit: 0 },
            { participantId: ana.id, units: 1, unit: 1 },
          ],
        },
      ],
    });
    const b = await r.bills.save(data);
    const sortKey = (a: { participantId: string; unit?: number }) => `${a.unit}|${a.participantId}`;
    const got = [...b.items[0].allocations].sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
    const want = [...data.items[0].allocations].sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
    expect(b.items[0].splitMode).toBe("per_unit");
    expect(got).toEqual(want);
    expect(await r.bills.findById(b.id)).toEqual(b);
  });

  it("bills: save with id replaces items and charges", async () => {
    const { r, billData } = await setup();
    const b = await r.bills.save(billData());
    const b2 = await r.bills.save(billData({ id: b.id, title: "Edited", items: [], charges: [] }));
    expect(b2).toMatchObject({ id: b.id, title: "Edited", items: [], charges: [], createdAt: b.createdAt });
  });

  it("bills: cannot move a bill to another event", async () => {
    const { r, user, billData } = await setup();
    const b = await r.bills.save(billData());
    const other = await r.events.create({ ownerId: user.id, name: "Other", currency: "IDR" });
    await expect(r.bills.save(billData({ id: b.id, eventId: other.id }))).rejects.toBeTruthy();
  });

  it("deleting a participant clears paidBy and their allocations", async () => {
    const { r, ana, billData } = await setup();
    const b = await r.bills.save(billData());
    await r.participants.delete(ana.id);
    const after = (await r.bills.findById(b.id))!;
    expect(after.paidBy).toBeNull();
    expect(after.items[0].allocations.map((a) => a.participantId)).not.toContain(ana.id);
  });

  it("deleting an event cascades", async () => {
    const { r, event, billData } = await setup();
    const b = await r.bills.save(billData());
    await r.shareLinks.create({ eventId: event.id, slug: `s-${crypto.randomUUID()}`, passcodeHash: null, enabled: true });
    await r.events.delete(event.id);
    expect(await r.events.findById(event.id)).toBeNull();
    expect(await r.bills.findById(b.id)).toBeNull();
    expect(await r.participants.listByEvent(event.id)).toEqual([]);
    expect(await r.shareLinks.findByEventId(event.id)).toBeNull();
  });

  it("share links: create, find by slug/event, update", async () => {
    const { r, event } = await setup();
    const slug = `s-${crypto.randomUUID()}`;
    const s = await r.shareLinks.create({ eventId: event.id, slug, passcodeHash: "h", enabled: true });
    expect(s).toMatchObject({ failedAttempts: 0, lockedUntil: null });
    expect((await r.shareLinks.findBySlug(slug))?.id).toBe(s.id);
    const u = await r.shareLinks.update(s.id, { failedAttempts: 3, passcodeHash: null });
    expect(u).toMatchObject({ failedAttempts: 3, passcodeHash: null, enabled: true, slug });
    expect((await r.shareLinks.findByEventId(event.id))?.id).toBe(s.id);
  });

  it("returned objects are copies (mutating them does not change storage)", async () => {
    const { r, event } = await setup();
    const e = (await r.events.findById(event.id))!;
    e.name = "hacked";
    expect((await r.events.findById(event.id))!.name).toBe("Bali");
  });
});
