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
