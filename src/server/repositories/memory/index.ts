/**
 * In-memory implementation of every repository.
 * Used by tests and by `DATA_BACKEND=memory` (demo without a database;
 * data is lost on restart). Kept deliberately simple: Maps + structuredClone
 * so callers can never mutate stored objects.
 *
 * @module
 */
import { AppError } from "@/shared/lib/result";
import type { Bill, Event, Participant, ShareLink, User } from "@/domain/types";
import type { Repositories, SaveBillData } from "../interfaces";

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const clone = <T>(v: T): T => structuredClone(v);

/** Create a fresh, isolated set of in-memory repositories. */
export function createMemoryRepositories(): Repositories {
  const users = new Map<string, User>();
  const events = new Map<string, Event>();
  const participants = new Map<string, Participant>();
  const bills = new Map<string, Bill>();
  const shareLinks = new Map<string, ShareLink>();
  const files = new Map<string, { data: Uint8Array; contentType: string }>();
  // Monotonic counter so "oldest first" is stable even within the same millisecond.
  let seq = 0;
  const order = new Map<string, number>();
  const stamp = (id: string) => order.set(id, ++seq);
  const byOrder = (a: { id: string }, b: { id: string }) => order.get(a.id)! - order.get(b.id)!;

  /** Delete a person; bills they paid lose the payer and their allocations go. */
  const removeParticipant = (id: string) => {
    participants.delete(id);
    for (const b of bills.values()) {
      if (b.paidBy === id) b.paidBy = null;
      for (const it of b.items) it.allocations = it.allocations.filter((a) => a.participantId !== id);
    }
  };

  const get = <T>(map: Map<string, T>, id: string, what: string): T => {
    const v = map.get(id);
    if (!v) throw new AppError("NOT_FOUND", `${what} ${id} not found`);
    return v;
  };

  return {
    users: {
      async findById(id) {
        return clone(users.get(id) ?? null);
      },
      async findByEmail(email) {
        return clone([...users.values()].find((u) => u.email === email) ?? null);
      },
      async create({ email, passwordHash }) {
        if ([...users.values()].some((u) => u.email === email)) throw new AppError("EMAIL_TAKEN");
        const u: User = { id: uuid(), email, passwordHash, createdAt: now() };
        users.set(u.id, u);
        return clone(u);
      },
    },

    events: {
      async listByOwner(ownerId) {
        return [...events.values()]
          .filter((e) => e.ownerId === ownerId)
          .sort((a, b) => byOrder(b, a))
          .map((e) => ({
            ...clone(e),
            participantCount: [...participants.values()].filter((p) => p.eventId === e.id).length,
            billCount: [...bills.values()].filter((b) => b.eventId === e.id).length,
          }));
      },
      async findById(id) {
        return clone(events.get(id) ?? null);
      },
      async create({ ownerId, name, currency }) {
        const e: Event = { id: uuid(), ownerId, name, currency, settlementMode: "nett", createdAt: now() };
        events.set(e.id, e);
        stamp(e.id);
        return clone(e);
      },
      async update(id, patch) {
        const e = { ...get(events, id, "event"), ...patch };
        events.set(id, e);
        return clone(e);
      },
      async delete(id) {
        events.delete(id);
        for (const [pid, p] of participants) if (p.eventId === id) participants.delete(pid);
        for (const [bid, b] of bills) if (b.eventId === id) bills.delete(bid);
        for (const [sid, s] of shareLinks) if (s.eventId === id) shareLinks.delete(sid);
      },
    },

    participants: {
      async listByEvent(eventId) {
        return [...participants.values()].filter((p) => p.eventId === eventId).sort(byOrder).map(clone);
      },
      async create(eventId, name) {
        const p: Participant = { id: uuid(), eventId, name };
        participants.set(p.id, p);
        stamp(p.id);
        return clone(p);
      },
      async rename(id, name) {
        const p = { ...get(participants, id, "participant"), name };
        participants.set(id, p);
        return clone(p);
      },
      async delete(id) {
        removeParticipant(id);
      },
      async applyChanges(eventId, { add, rename, remove }) {
        const inEvent = (id: string) => participants.get(id)?.eventId === eventId;
        for (const id of remove) if (inEvent(id)) removeParticipant(id);
        for (const { id, name } of rename) if (inEvent(id)) participants.set(id, { ...participants.get(id)!, name });
        for (const name of add) {
          const p: Participant = { id: uuid(), eventId, name };
          participants.set(p.id, p);
          stamp(p.id);
        }
        return [...participants.values()].filter((p) => p.eventId === eventId).sort(byOrder).map(clone);
      },
    },

    bills: {
      async listByEvent(eventId) {
        return [...bills.values()].filter((b) => b.eventId === eventId).sort(byOrder).map(clone);
      },
      async findById(id) {
        return clone(bills.get(id) ?? null);
      },
      async save(data: SaveBillData) {
        const existing = data.id ? bills.get(data.id) : undefined;
        if (data.id && existing && existing.eventId !== data.eventId) {
          throw new AppError("FORBIDDEN", "bill belongs to another event");
        }
        const { ocrRaw: _ocrRaw, ...rest } = data;
        void _ocrRaw;
        const bill: Bill = {
          ...rest,
          id: data.id ?? uuid(),
          createdAt: existing?.createdAt ?? now(),
          items: data.items.map((it) => ({ ...clone(it), id: uuid(), allocations: mergeUnits(it.allocations) })),
          charges: data.charges.map((c) => ({ ...c, id: uuid() })),
        };
        bills.set(bill.id, bill);
        if (!existing) stamp(bill.id);
        return clone(bill);
      },
      async delete(id) {
        bills.delete(id);
      },
    },

    shareLinks: {
      async findByEventId(eventId) {
        return clone([...shareLinks.values()].find((s) => s.eventId === eventId) ?? null);
      },
      async findBySlug(slug) {
        return clone([...shareLinks.values()].find((s) => s.slug === slug) ?? null);
      },
      async create({ eventId, slug, passcodeHash, enabled, showPhotos = true }) {
        const s: ShareLink = {
          id: uuid(),
          eventId,
          slug,
          passcodeHash,
          enabled,
          showPhotos,
          failedAttempts: 0,
          lockedUntil: null,
          createdAt: now(),
        };
        shareLinks.set(s.id, s);
        return clone(s);
      },
      async update(id, patch) {
        const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
        const s = { ...get(shareLinks, id, "share link"), ...defined };
        shareLinks.set(id, s);
        return clone(s);
      },
    },

    images: {
      async put(path, data, contentType) {
        files.set(path, { data, contentType });
      },
      async signedUrl(path) {
        if (!files.has(path)) throw new AppError("NOT_FOUND", `file ${path} not found`);
        const f = files.get(path)!;
        return `data:${f.contentType};base64,${Buffer.from(f.data).toString("base64")}`;
      },
      async remove(paths) {
        for (const p of paths) files.delete(p);
      },
    },
  };
}

/** Same semantics as the SQL `group by participant_id, unit_index` with `sum(units)`. */
function mergeUnits(list: { participantId: string; units: number; unit?: number }[]) {
  const m = new Map<string, { participantId: string; units: number; unit?: number }>();
  for (const a of list) {
    const key = `${a.participantId}|${a.unit ?? ""}`;
    const acc = m.get(key);
    if (acc) acc.units += a.units;
    else m.set(key, a.unit === undefined ? { participantId: a.participantId, units: a.units } : { ...a });
  }
  return [...m.values()];
}
