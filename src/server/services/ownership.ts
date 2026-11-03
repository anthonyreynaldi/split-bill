import { AppError } from "@/shared/lib/result";
import type { Event } from "@/domain/types";
import type { EventRepository } from "../repositories/interfaces";

/**
 * Load an event and make sure `userId` owns it.
 * Answers `NOT_FOUND` for both "missing" and "someone else's", so ids can't be probed.
 */
export async function requireOwnedEvent(events: EventRepository, userId: string, eventId: string): Promise<Event> {
  const event = await events.findById(eventId);
  if (!event || event.ownerId !== userId) throw new AppError("NOT_FOUND");
  return event;
}
