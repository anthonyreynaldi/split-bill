import { describe, expect, it } from "vitest";
import { fakeHasher } from "../auth/password";
import { createMemoryRepositories } from "../repositories/memory";
import { createServices } from "./index";
import { LOCK_MINUTES, MAX_PASSCODE_ATTEMPTS, ShareService } from "./share.service";

async function setup() {
  const repos = createMemoryRepositories();
  const services = createServices({ repos, hasher: fakeHasher });
  const owner = await services.auth.register({ email: "o@x.co", password: "secret123" });
  const other = await services.auth.register({ email: "x@x.co", password: "secret123" });
  const event = await services.events.create(owner.id, { name: "Bali" });
  let now = new Date("2026-11-03T10:00:00Z");
  const share = new ShareService(repos, fakeHasher, () => now);
  return { repos, services, share, owner, other, event, tick: (min: number) => (now = new Date(now.getTime() + min * 60_000)) };
}

describe("ShareService", () => {
  it("creates one unguessable link per event and never exposes the hash", async () => {
    const { share, owner, event } = await setup();
    expect(await share.getSettings(owner.id, event.id)).toBeNull();
    const a = await share.upsert(owner.id, { eventId: event.id });
    const b = await share.upsert(owner.id, { eventId: event.id });
    expect(a.slug).toBe(b.slug);
    expect(a.slug).toMatch(/^[\w-]{22}$/);
    expect(a).toEqual({ slug: a.slug, enabled: true, hasPasscode: false, showPhotos: true });
  });

  it("keeps the photo setting unless it is changed", async () => {
    const { share, owner, event } = await setup();
    await share.upsert(owner.id, { eventId: event.id });
    expect((await share.upsert(owner.id, { eventId: event.id, showPhotos: false })).showPhotos).toBe(false);
    // other edits (passcode, enabled) don't reset it
    expect((await share.upsert(owner.id, { eventId: event.id, passcode: "1234" })).showPhotos).toBe(false);
    expect((await share.getSettings(owner.id, event.id))?.showPhotos).toBe(false);
  });

  it("serves the summary publicly without a passcode", async () => {
    const { share, owner, event } = await setup();
    const { slug } = await share.upsert(owner.id, { eventId: event.id });
    const s = await share.getPublic(slug, false);
    expect(s.event.name).toBe("Bali");
    expect(JSON.stringify(s)).not.toContain(owner.id);
  });

  it("requires the passcode until access is granted", async () => {
    const { share, owner, event } = await setup();
    const { slug, hasPasscode } = await share.upsert(owner.id, { eventId: event.id, passcode: "1234" });
    expect(hasPasscode).toBe(true);
    await expect(share.getPublic(slug, false)).rejects.toMatchObject({ code: "PASSCODE_REQUIRED" });
    await expect(share.verifyPasscode(slug, "0000")).rejects.toMatchObject({ code: "PASSCODE_INVALID" });
    await expect(share.verifyPasscode(slug, "1234")).resolves.toBeUndefined();
    await expect(share.getPublic(slug, true)).resolves.toBeTruthy();
  });

  it("locks after too many wrong passcodes, then unlocks after the lock time", async () => {
    const { share, owner, event, tick } = await setup();
    const { slug } = await share.upsert(owner.id, { eventId: event.id, passcode: "1234" });
    for (let i = 1; i < MAX_PASSCODE_ATTEMPTS; i++) {
      await expect(share.verifyPasscode(slug, "bad")).rejects.toMatchObject({ code: "PASSCODE_INVALID" });
    }
    await expect(share.verifyPasscode(slug, "bad")).rejects.toMatchObject({ code: "TOO_MANY_ATTEMPTS" });
    // even the right passcode is refused while locked
    await expect(share.verifyPasscode(slug, "1234")).rejects.toMatchObject({ code: "TOO_MANY_ATTEMPTS" });
    tick(LOCK_MINUTES + 1);
    await expect(share.verifyPasscode(slug, "1234")).resolves.toBeUndefined();
  });

  it("removing the passcode opens the link; disabling hides it", async () => {
    const { share, owner, event } = await setup();
    const { slug } = await share.upsert(owner.id, { eventId: event.id, passcode: "1234" });
    await share.upsert(owner.id, { eventId: event.id, passcode: null });
    await expect(share.getPublic(slug, false)).resolves.toBeTruthy();
    await share.upsert(owner.id, { eventId: event.id, enabled: false });
    await expect(share.getPublic(slug, true)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(share.getPublic("nope", true)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("only the owner can manage the link", async () => {
    const { share, other, event } = await setup();
    await expect(share.upsert(other.id, { eventId: event.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(share.getSettings(other.id, event.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("hides receipt photos from link viewers when the owner turns them off", async () => {
    const { services, share, owner, event } = await setup();
    const ana = await services.events.addParticipant(owner.id, { eventId: event.id, name: "Ana" });
    const draft = await services.ocr.uploadAndExtract(owner.id, event.id, {
      data: new Uint8Array([0xff, 0xd8, 0xff, 1]),
      contentType: "image/jpeg",
    });
    await services.bills.create(owner.id, {
      eventId: event.id,
      title: "Lunch",
      billDate: null,
      paidBy: ana.id,
      imagePath: draft.imagePath,
      chargeSplitMode: "proportional",
      items: [{ name: "Soto", qty: 1, unitPrice: 10000, total: 10000, splitMode: "even", allocations: [] }],
      charges: [],
    });
    const { slug } = await share.upsert(owner.id, { eventId: event.id });
    expect((await share.getPublic(slug, false)).bills[0].imageUrl).toBeTruthy();
    await share.upsert(owner.id, { eventId: event.id, showPhotos: false });
    const hidden = await share.getPublic(slug, false);
    expect(hidden.bills[0].imageUrl).toBeNull();
    expect(hidden.bills[0].items[0].name).toBe("Soto"); // the breakdown itself still shows
    expect(JSON.stringify(hidden)).not.toContain(draft.imagePath!); // nor the storage path
  });
});
