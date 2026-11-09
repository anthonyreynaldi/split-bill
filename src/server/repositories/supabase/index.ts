/**
 * Supabase implementation of every repository (ADR 0002).
 * This folder is the ONLY place in the app that imports `@supabase/*`.
 *
 * @module
 */
import { AppError } from "@/shared/lib/result";
import type { Repositories } from "../interfaces";
import { check, createSupabaseClient, UNIQUE_VIOLATION, type Db } from "./client";
import {
  BILL_SELECT,
  toBill,
  toEvent,
  toParticipant,
  toSaveBillPayload,
  toShareLink,
  toUser,
  type BillRowWithChildren,
} from "./mappers";

export const BILL_IMAGES_BUCKET = "bill-images";

/** Build all repositories on top of one Supabase client. */
export function createSupabaseRepositories(config: { url: string; serviceKey: string }): Repositories {
  const db: Db = createSupabaseClient(config.url, config.serviceKey);

  const listParticipants = async (eventId: string) => {
    const rows = check(
      await db.from("participants").select("*").eq("event_id", eventId).order("position").order("created_at"),
      "participants.listByEvent",
    );
    return rows.map(toParticipant);
  };

  const findBill = async (id: string) => {
    const res = await db.from("bills").select(BILL_SELECT).eq("id", id).maybeSingle();
    const row = check(res, "bills.findById") as BillRowWithChildren | null;
    return row ? toBill(row) : null;
  };

  return {
    users: {
      async findById(id) {
        const row = check(await db.from("users").select("*").eq("id", id).maybeSingle(), "users.findById");
        return row ? toUser(row) : null;
      },
      async findByEmail(email) {
        const row = check(await db.from("users").select("*").eq("email", email).maybeSingle(), "users.findByEmail");
        return row ? toUser(row) : null;
      },
      async create({ email, passwordHash }) {
        const res = await db.from("users").insert({ email, password_hash: passwordHash }).select().single();
        if (res.error?.code === UNIQUE_VIOLATION) throw new AppError("EMAIL_TAKEN");
        return toUser(check(res, "users.create"));
      },
    },

    events: {
      async listByOwner(ownerId) {
        const rows = check(
          await db
            .from("events")
            .select("*, participants(count), bills(count)")
            .eq("owner_id", ownerId)
            .order("created_at", { ascending: false }),
          "events.listByOwner",
        );
        return rows.map((r) => ({
          ...toEvent(r),
          participantCount: (r.participants as unknown as { count: number }[])[0]?.count ?? 0,
          billCount: (r.bills as unknown as { count: number }[])[0]?.count ?? 0,
        }));
      },
      async findById(id) {
        const row = check(await db.from("events").select("*").eq("id", id).maybeSingle(), "events.findById");
        return row ? toEvent(row) : null;
      },
      async create({ ownerId, name, currency }) {
        return toEvent(
          check(
            await db.from("events").insert({ owner_id: ownerId, name, currency }).select().single(),
            "events.create",
          ),
        );
      },
      async update(id, patch) {
        const row = check(
          await db
            .from("events")
            .update({ name: patch.name, currency: patch.currency, settlement_mode: patch.settlementMode })
            .eq("id", id)
            .select()
            .single(),
          "events.update",
        );
        return toEvent(row);
      },
      async delete(id) {
        check(await db.from("events").delete().eq("id", id), "events.delete");
      },
    },

    participants: {
      listByEvent: listParticipants,
      async create(eventId, name) {
        const { count } = await db
          .from("participants")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId);
        return toParticipant(
          check(
            await db
              .from("participants")
              .insert({ event_id: eventId, name, position: count ?? 0 })
              .select()
              .single(),
            "participants.create",
          ),
        );
      },
      async rename(id, name) {
        return toParticipant(
          check(await db.from("participants").update({ name }).eq("id", id).select().single(), "participants.rename"),
        );
      },
      async delete(id) {
        // FKs: bills.paid_by → set null, item_allocations → cascade
        check(await db.from("participants").delete().eq("id", id), "participants.delete");
      },
      async applyChanges(eventId, changes) {
        // one RPC = one transaction (migration 20261105000001_save_participants.sql)
        check(
          await db.rpc("save_participants", { p_event_id: eventId, p_changes: changes }),
          "participants.applyChanges",
        );
        return listParticipants(eventId);
      },
    },

    bills: {
      async listByEvent(eventId) {
        const rows = check(
          await db.from("bills").select(BILL_SELECT).eq("event_id", eventId).order("created_at"),
          "bills.listByEvent",
        ) as BillRowWithChildren[];
        return rows.map(toBill);
      },
      findById: findBill,
      async save(data) {
        const id = check(await db.rpc("save_bill", { p_bill: toSaveBillPayload(data) }), "bills.save");
        const bill = await findBill(id);
        if (!bill) throw new Error("[supabase] bills.save: saved bill not found");
        return bill;
      },
      async delete(id) {
        check(await db.from("bills").delete().eq("id", id), "bills.delete");
      },
    },

    shareLinks: {
      async findByEventId(eventId) {
        const row = check(
          await db.from("share_links").select("*").eq("event_id", eventId).maybeSingle(),
          "shareLinks.findByEventId",
        );
        return row ? toShareLink(row) : null;
      },
      async findBySlug(slug) {
        const row = check(
          await db.from("share_links").select("*").eq("slug", slug).maybeSingle(),
          "shareLinks.findBySlug",
        );
        return row ? toShareLink(row) : null;
      },
      async create({ eventId, slug, passcodeHash, enabled, showPhotos = true }) {
        return toShareLink(
          check(
            await db
              .from("share_links")
              .insert({ event_id: eventId, slug, passcode_hash: passcodeHash, enabled, show_photos: showPhotos })
              .select()
              .single(),
            "shareLinks.create",
          ),
        );
      },
      async update(id, patch) {
        return toShareLink(
          check(
            await db
              .from("share_links")
              .update({
                passcode_hash: patch.passcodeHash,
                enabled: patch.enabled,
                show_photos: patch.showPhotos,
                failed_attempts: patch.failedAttempts,
                locked_until: patch.lockedUntil,
              })
              .eq("id", id)
              .select()
              .single(),
            "shareLinks.update",
          ),
        );
      },
    },

    images: {
      async put(path, data, contentType) {
        check(
          await db.storage.from(BILL_IMAGES_BUCKET).upload(path, data, { contentType, upsert: false }),
          "images.put",
        );
      },
      async signedUrl(path, expiresInSeconds) {
        const res = await db.storage.from(BILL_IMAGES_BUCKET).createSignedUrl(path, expiresInSeconds);
        return check(res, "images.signedUrl").signedUrl;
      },
      async remove(paths) {
        if (paths.length) check(await db.storage.from(BILL_IMAGES_BUCKET).remove(paths), "images.remove");
      },
    },
  };
}
