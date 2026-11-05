import { z } from "zod";
import { CurrencySchema, IdSchema, MoneySchema, NameSchema, SettlementModeSchema } from "./common";

// ── Inputs ───────────────────────────────────────────────────────────────

/** Input for `createEvent`. */
export const CreateEventInput = z.object({
  name: NameSchema,
  currency: CurrencySchema.default("IDR"),
});
export type CreateEventInput = z.input<typeof CreateEventInput>;

/** Input for `updateEvent`. Only the provided fields change. */
export const UpdateEventInput = z.object({
  eventId: IdSchema,
  name: NameSchema.optional(),
  currency: CurrencySchema.optional(),
  settlementMode: SettlementModeSchema.optional(),
});
export type UpdateEventInput = z.infer<typeof UpdateEventInput>;

/** Input for `addParticipant`. */
export const AddParticipantInput = z.object({ eventId: IdSchema, name: NameSchema });
export type AddParticipantInput = z.infer<typeof AddParticipantInput>;

/** Input for `renameParticipant`. */
export const RenameParticipantInput = z.object({
  eventId: IdSchema,
  participantId: IdSchema,
  name: NameSchema,
});
export type RenameParticipantInput = z.infer<typeof RenameParticipantInput>;

/** Input for `removeParticipant`. */
export const RemoveParticipantInput = z.object({ eventId: IdSchema, participantId: IdSchema });
export type RemoveParticipantInput = z.infer<typeof RemoveParticipantInput>;

/** Most people one save may add, rename or remove (per list). */
export const MAX_PEOPLE_CHANGES = 200;

/**
 * Input for `saveParticipants`: every people edit made on the event page, saved at once.
 * - `add`: names of new people, in order
 * - `rename`: existing people with their new name
 * - `remove`: existing people to delete (they leave every split; bills they paid lose the payer)
 */
export const SaveParticipantsInput = z.object({
  eventId: IdSchema,
  add: z.array(NameSchema).max(MAX_PEOPLE_CHANGES),
  rename: z.array(z.object({ participantId: IdSchema, name: NameSchema })).max(MAX_PEOPLE_CHANGES),
  remove: z.array(IdSchema).max(MAX_PEOPLE_CHANGES),
});
export type SaveParticipantsInput = z.infer<typeof SaveParticipantsInput>;

// ── Outputs ──────────────────────────────────────────────────────────────

export const ParticipantDto = z.object({ id: z.string(), name: z.string() });
export type ParticipantDto = z.infer<typeof ParticipantDto>;

export const EventDto = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  settlementMode: SettlementModeSchema,
  createdAt: z.string(),
});
export type EventDto = z.infer<typeof EventDto>;

/** Row in the "my events" list. */
export const EventListItemDto = EventDto.extend({
  participantCount: z.number(),
  billCount: z.number(),
});
export type EventListItemDto = z.infer<typeof EventListItemDto>;

/** Row in an event's bill list. */
export const BillListItemDto = z.object({
  id: z.string(),
  title: z.string(),
  billDate: z.string().nullable(),
  paidBy: z.string().nullable(),
  itemCount: z.number(),
  total: MoneySchema,
});
export type BillListItemDto = z.infer<typeof BillListItemDto>;

/** Everything the event page needs, in one action call. */
export const EventDetailDto = z.object({
  event: EventDto,
  participants: z.array(ParticipantDto),
  bills: z.array(BillListItemDto),
});
export type EventDetailDto = z.infer<typeof EventDetailDto>;
