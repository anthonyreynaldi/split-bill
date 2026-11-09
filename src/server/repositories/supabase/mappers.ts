/**
 * DB row ⇄ domain mappers. This is the only place that knows column names.
 * Postgres `numeric`/`bigint` come back as JSON numbers; `Number()` guards
 * against drivers returning strings.
 */
import type {
  Bill,
  ChargeKind,
  ChargeMode,
  ChargeSplitMode,
  Event,
  Participant,
  SettlementMode,
  ShareLink,
  SplitMode,
  User,
} from "@/domain/types";
import type { SaveBillData } from "../interfaces";
import type { Json, Tables } from "./db.types";

export const toUser = (r: Tables<"users">): User => ({
  id: r.id,
  email: r.email,
  passwordHash: r.password_hash,
  createdAt: r.created_at,
});

export const toEvent = (r: Tables<"events">): Event => ({
  id: r.id,
  ownerId: r.owner_id,
  name: r.name,
  currency: r.currency,
  settlementMode: r.settlement_mode as SettlementMode,
  createdAt: r.created_at,
});

export const toParticipant = (r: Tables<"participants">): Participant => ({
  id: r.id,
  eventId: r.event_id,
  name: r.name,
});

export const toShareLink = (r: Tables<"share_links">): ShareLink => ({
  id: r.id,
  eventId: r.event_id,
  slug: r.slug,
  passcodeHash: r.passcode_hash,
  failedAttempts: r.failed_attempts,
  lockedUntil: r.locked_until,
  enabled: r.enabled,
  showPhotos: r.show_photos,
  createdAt: r.created_at,
});

/** Shape returned by `BILL_SELECT`. */
export type BillRowWithChildren = Tables<"bills"> & {
  bill_items: (Tables<"bill_items"> & { item_allocations: Tables<"item_allocations">[] })[];
  bill_charges: Tables<"bill_charges">[];
};

export const BILL_SELECT = "*, bill_items(*, item_allocations(*)), bill_charges(*)" as const;

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

export const toBill = (r: BillRowWithChildren): Bill => ({
  id: r.id,
  eventId: r.event_id,
  title: r.title,
  billDate: r.bill_date,
  paidBy: r.paid_by,
  imagePath: r.image_path,
  chargeSplitMode: r.charge_split_mode as ChargeSplitMode,
  createdAt: r.created_at,
  items: [...r.bill_items].sort(byPosition).map((it) => ({
    id: it.id,
    name: it.name,
    qty: Number(it.qty),
    unitPrice: Number(it.unit_price),
    total: Number(it.total),
    splitMode: it.split_mode as SplitMode,
    allocations: it.item_allocations.map((a) =>
      a.unit_index === null
        ? { participantId: a.participant_id, units: Number(a.units) }
        : { participantId: a.participant_id, units: Number(a.units), unit: a.unit_index },
    ),
  })),
  charges: [...r.bill_charges].sort(byPosition).map((c) => ({
    id: c.id,
    kind: c.kind as ChargeKind,
    mode: c.mode as ChargeMode,
    value: Number(c.value),
  })),
});

/** Domain → `save_bill(p_bill jsonb)` payload (see the migration). */
export const toSaveBillPayload = (d: SaveBillData): Json => ({
  id: d.id ?? null,
  event_id: d.eventId,
  title: d.title,
  bill_date: d.billDate,
  paid_by: d.paidBy,
  image_path: d.imagePath,
  charge_split_mode: d.chargeSplitMode,
  ocr_raw: (d.ocrRaw ?? null) as Json,
  items: d.items.map((it) => ({
    name: it.name,
    qty: it.qty,
    unit_price: it.unitPrice,
    total: it.total,
    split_mode: it.splitMode,
    allocations: it.allocations.map((a) => ({
      participant_id: a.participantId,
      units: a.units,
      unit_index: a.unit ?? null,
    })),
  })),
  charges: d.charges.map((c) => ({ kind: c.kind, mode: c.mode, value: c.value })),
});
