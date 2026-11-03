import type {
  AddParticipantInput,
  CreateEventInput,
  EventDetailDto,
  EventDto,
  EventListItemDto,
  ParticipantDto,
  RemoveParticipantInput,
  RenameParticipantInput,
  UpdateEventInput,
} from "@/shared/dto";
import { AppError } from "@/shared/lib/result";
import type { Repositories } from "../repositories/interfaces";
import { toBillListItemDto, toEventDto, toParticipantDto } from "./mappers";
import { requireOwnedEvent } from "./ownership";

/** Events and their participants. Every method checks that `userId` owns the event. */
export class EventService {
  constructor(private readonly repos: Pick<Repositories, "events" | "participants" | "bills" | "images">) {}

  /** The user's events, newest first. */
  async list(userId: string): Promise<EventListItemDto[]> {
    const rows = await this.repos.events.listByOwner(userId);
    return rows.map((e) => ({ ...toEventDto(e), participantCount: e.participantCount, billCount: e.billCount }));
  }

  async create(userId: string, input: CreateEventInput): Promise<EventDto> {
    const event = await this.repos.events.create({
      ownerId: userId,
      name: input.name,
      currency: input.currency ?? "IDR",
    });
    return toEventDto(event);
  }

  /** Event + participants + bill list (with calculated totals), for the event page. */
  async getDetail(userId: string, eventId: string): Promise<EventDetailDto> {
    const event = await requireOwnedEvent(this.repos.events, userId, eventId);
    const [participants, bills] = await Promise.all([
      this.repos.participants.listByEvent(eventId),
      this.repos.bills.listByEvent(eventId),
    ]);
    const ids = participants.map((p) => p.id);
    return {
      event: toEventDto(event),
      participants: participants.map(toParticipantDto),
      bills: bills.map((b) => toBillListItemDto(b, ids)),
    };
  }

  async update(userId: string, input: UpdateEventInput): Promise<EventDto> {
    await requireOwnedEvent(this.repos.events, userId, input.eventId);
    const { eventId, ...patch } = input;
    return toEventDto(await this.repos.events.update(eventId, patch));
  }

  /** Delete the event, everything in it, and its receipt images. */
  async delete(userId: string, eventId: string): Promise<void> {
    await requireOwnedEvent(this.repos.events, userId, eventId);
    const bills = await this.repos.bills.listByEvent(eventId);
    const images = bills.map((b) => b.imagePath).filter((p): p is string => !!p);
    await this.repos.events.delete(eventId);
    await this.repos.images.remove(images).catch((err) => console.warn("[events] image cleanup failed", err));
  }

  async addParticipant(userId: string, input: AddParticipantInput): Promise<ParticipantDto> {
    await requireOwnedEvent(this.repos.events, userId, input.eventId);
    return toParticipantDto(await this.repos.participants.create(input.eventId, input.name));
  }

  async renameParticipant(userId: string, input: RenameParticipantInput): Promise<ParticipantDto> {
    await this.requireParticipant(userId, input.eventId, input.participantId);
    return toParticipantDto(await this.repos.participants.rename(input.participantId, input.name));
  }

  /** Removes the person from all splits; bills they paid get no payer. */
  async removeParticipant(userId: string, input: RemoveParticipantInput): Promise<void> {
    await this.requireParticipant(userId, input.eventId, input.participantId);
    await this.repos.participants.delete(input.participantId);
  }

  private async requireParticipant(userId: string, eventId: string, participantId: string) {
    await requireOwnedEvent(this.repos.events, userId, eventId);
    const list = await this.repos.participants.listByEvent(eventId);
    if (!list.some((p) => p.id === participantId)) throw new AppError("NOT_FOUND");
  }
}
