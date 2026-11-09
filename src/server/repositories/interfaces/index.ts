/**
 * Repository interfaces: the ONLY way services touch persistence.
 *
 * To support another database, implement every interface below in
 * `repositories/<db>/` and return it from `container.ts`. Services, actions
 * and UI stay unchanged (ADR 0002). Run `repositories/contract.test.ts`
 * against the new implementation to prove it behaves the same.
 *
 * Conventions for every implementation:
 * - Return **domain types** (`@/domain/types`), never DB rows.
 * - `find*` returns `null` when nothing is found. It doesn't throw.
 * - Duplicate unique keys throw `AppError` with a meaningful code (e.g. `EMAIL_TAKEN`).
 * - Deleting a parent removes its children (cascade). Deleting a participant
 *   clears `bill.paidBy` and removes their allocations.
 *
 * @module
 */
import type {
  Bill,
  BillCharge,
  BillItem,
  Event,
  Id,
  Participant,
  SettlementMode,
  ShareLink,
  User,
} from "@/domain/types";

/** Users for the temporary custom auth (ADR 0003). */
export interface UserRepository {
  findById(id: Id): Promise<User | null>;
  /** `email` must already be lower-cased. */
  findByEmail(email: string): Promise<User | null>;
  /** @throws AppError(`EMAIL_TAKEN`) if the email exists. */
  create(data: { email: string; passwordHash: string }): Promise<User>;
}

export type EventWithCounts = Event & { participantCount: number; billCount: number };

export interface EventRepository {
  /** Newest first. */
  listByOwner(ownerId: Id): Promise<EventWithCounts[]>;
  findById(id: Id): Promise<Event | null>;
  create(data: { ownerId: Id; name: string; currency: string }): Promise<Event>;
  update(
    id: Id,
    patch: Partial<{ name: string; currency: string; settlementMode: SettlementMode }>,
  ): Promise<Event>;
  /** Cascades to participants, bills, share link. */
  delete(id: Id): Promise<void>;
}

export interface ParticipantRepository {
  /** In the order they were added. */
  listByEvent(eventId: Id): Promise<Participant[]>;
  create(eventId: Id, name: string): Promise<Participant>;
  rename(id: Id, name: string): Promise<Participant>;
  /** Also clears `paidBy` on bills and removes the participant's allocations. */
  delete(id: Id): Promise<void>;
  /**
   * Apply a batch of edits to one event's people **atomically** (all or nothing):
   * removes first (same side effects as {@link delete}), then renames, then
   * appends `add` in order after the existing people. Ids that are not in this
   * event are ignored, so callers must check ownership first.
   * @returns the event's people afterwards, in order.
   */
  applyChanges(eventId: Id, changes: ParticipantChanges): Promise<Participant[]>;
}

/** Batch of people edits for {@link ParticipantRepository.applyChanges}. */
export type ParticipantChanges = {
  add: string[];
  rename: { id: Id; name: string }[];
  remove: Id[];
};

/** Data needed to create or fully replace a bill. Item/charge ids are assigned by the repository. */
export type SaveBillData = Omit<Bill, "id" | "createdAt" | "items" | "charges"> & {
  /** Omit to create; set to replace an existing bill of the same event. */
  id?: Id;
  items: Omit<BillItem, "id">[];
  charges: Omit<BillCharge, "id">[];
  /** Raw OCR output, kept for debugging. Only written when provided. */
  ocrRaw?: unknown;
};

export interface BillRepository {
  /** Full bills (items, allocations, charges), oldest first. */
  listByEvent(eventId: Id): Promise<Bill[]>;
  findById(id: Id): Promise<Bill | null>;
  /** Create or replace atomically, then return the saved bill. */
  save(data: SaveBillData): Promise<Bill>;
  delete(id: Id): Promise<void>;
}

export interface ShareLinkRepository {
  findByEventId(eventId: Id): Promise<ShareLink | null>;
  findBySlug(slug: string): Promise<ShareLink | null>;
  /** `showPhotos` defaults to true. */
  create(data: {
    eventId: Id;
    slug: string;
    passcodeHash: string | null;
    enabled: boolean;
    showPhotos?: boolean;
  }): Promise<ShareLink>;
  /** Only the given fields change. */
  update(
    id: Id,
    patch: Partial<Pick<ShareLink, "passcodeHash" | "enabled" | "showPhotos" | "failedAttempts" | "lockedUntil">>,
  ): Promise<ShareLink>;
}

/** Private file storage for receipt images. */
export interface ImageStorage {
  put(path: string, data: Uint8Array, contentType: string): Promise<void>;
  /** Short-lived URL the browser can load. */
  signedUrl(path: string, expiresInSeconds: number): Promise<string>;
  remove(paths: string[]): Promise<void>;
}

/** Everything a backend must provide. Built by `repositories/<db>/index.ts`. */
export interface Repositories {
  users: UserRepository;
  events: EventRepository;
  participants: ParticipantRepository;
  bills: BillRepository;
  shareLinks: ShareLinkRepository;
  images: ImageStorage;
}
