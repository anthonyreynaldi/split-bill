"use server";
/**
 * Event + participant Server Actions. Documented in docs/server-actions.md#events.
 * Call these from `features/events/hooks` only.
 *
 * @module
 */
import {
  AddParticipantInput,
  CreateEventInput,
  EventIdInput,
  RemoveParticipantInput,
  RenameParticipantInput,
  UpdateEventInput,
} from "@/shared/dto";
import { getContainer } from "../container";
import { defineAction, NoInput, requireUserId } from "./_lib/define-action";

const events = () => getContainer().services.events;

/** The logged-in user's events, newest first. Errors: `UNAUTHORIZED`. */
export const listEvents = defineAction(NoInput, async () => events().list(await requireUserId()));

/** Create an event. Input {@link CreateEventInput}. Errors: `UNAUTHORIZED`. */
export const createEvent = defineAction(CreateEventInput, async (input) =>
  events().create(await requireUserId(), input),
);

/** Event + participants + bill list for the event page. Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const getEventDetail = defineAction(EventIdInput, async ({ eventId }) =>
  events().getDetail(await requireUserId(), eventId),
);

/** Rename, change currency or settlement mode. Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const updateEvent = defineAction(UpdateEventInput, async (input) =>
  events().update(await requireUserId(), input),
);

/** Delete an event and everything in it. Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const deleteEvent = defineAction(EventIdInput, async ({ eventId }) => {
  await events().delete(await requireUserId(), eventId);
  return null;
});

/** Add a person. Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const addParticipant = defineAction(AddParticipantInput, async (input) =>
  events().addParticipant(await requireUserId(), input),
);

/** Rename a person. Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const renameParticipant = defineAction(RenameParticipantInput, async (input) =>
  events().renameParticipant(await requireUserId(), input),
);

/** Remove a person (their splits are removed; bills they paid lose the payer). Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const removeParticipant = defineAction(RemoveParticipantInput, async (input) => {
  await events().removeParticipant(await requireUserId(), input);
  return null;
});
