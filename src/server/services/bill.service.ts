import type { BillDto, BillFormValues, BillRefInput, CreateBillInput, UpdateBillInput } from "@/shared/dto";
import { AppError, type FieldErrors } from "@/shared/lib/result";
import type { Bill } from "@/domain/types";
import type { Repositories } from "../repositories/interfaces";
import { requireOwnedEvent } from "./ownership";

/** Item/charge ids are internal (they change on every save), so DTOs don't carry them. */
function withoutId<T extends { id: string }>(row: T): Omit<T, "id"> {
  const copy: Partial<T> = { ...row };
  delete copy.id;
  return copy as Omit<T, "id">;
}

/** How long a receipt image URL stays valid. */
export const IMAGE_URL_TTL_SECONDS = 60 * 30;

/** Bills of an event. Every method checks event ownership. */
export class BillService {
  constructor(private readonly repos: Pick<Repositories, "events" | "participants" | "bills" | "images">) {}

  async get(userId: string, ref: BillRefInput): Promise<BillDto> {
    return this.toDto(await this.requireBill(userId, ref));
  }

  async create(userId: string, input: CreateBillInput): Promise<BillDto> {
    await requireOwnedEvent(this.repos.events, userId, input.eventId);
    await this.validateReferences(input.eventId, input);
    const { eventId, ...values } = input;
    return this.toDto(await this.repos.bills.save({ eventId, ...values }));
  }

  /** Replace the whole bill (items/charges included). */
  async update(userId: string, input: UpdateBillInput): Promise<BillDto> {
    const existing = await this.requireBill(userId, input);
    await this.validateReferences(input.eventId, input);
    const { eventId, billId, ...values } = input;
    const saved = await this.repos.bills.save({ id: billId, eventId, ...values });
    if (existing.imagePath && existing.imagePath !== saved.imagePath) {
      await this.repos.images.remove([existing.imagePath]).catch(() => undefined);
    }
    return this.toDto(saved);
  }

  async delete(userId: string, ref: BillRefInput): Promise<void> {
    const bill = await this.requireBill(userId, ref);
    await this.repos.bills.delete(bill.id);
    if (bill.imagePath) await this.repos.images.remove([bill.imagePath]).catch(() => undefined);
  }

  private async requireBill(userId: string, ref: BillRefInput): Promise<Bill> {
    await requireOwnedEvent(this.repos.events, userId, ref.eventId);
    const bill = await this.repos.bills.findById(ref.billId);
    if (!bill || bill.eventId !== ref.eventId) throw new AppError("NOT_FOUND");
    return bill;
  }

  /**
   * The DB can't check these (see DEVELOPER.md): the payer and every allocated
   * participant must belong to this event, and the image must live in this event's folder.
   */
  private async validateReferences(eventId: string, v: BillFormValues): Promise<void> {
    const ids = new Set((await this.repos.participants.listByEvent(eventId)).map((p) => p.id));
    const errors: FieldErrors = {};
    if (v.paidBy && !ids.has(v.paidBy)) errors.paidBy = ["invalid"];
    v.items.forEach((it, i) => {
      if (it.allocations.some((a) => !ids.has(a.participantId))) errors[`items.${i}.allocations`] = ["invalid"];
    });
    if (v.imagePath && !v.imagePath.startsWith(`${eventId}/`)) errors.imagePath = ["invalid"];
    if (Object.keys(errors).length) throw new AppError("VALIDATION_ERROR", "invalid references", errors);
  }

  private async toDto(b: Bill): Promise<BillDto> {
    const imageUrl = b.imagePath
      ? await this.repos.images.signedUrl(b.imagePath, IMAGE_URL_TTL_SECONDS).catch(() => null)
      : null;
    return {
      id: b.id,
      eventId: b.eventId,
      title: b.title,
      billDate: b.billDate,
      paidBy: b.paidBy,
      imagePath: b.imagePath,
      imageUrl,
      chargeSplitMode: b.chargeSplitMode,
      createdAt: b.createdAt,
      items: b.items.map(withoutId),
      charges: b.charges.map(withoutId),
    };
  }
}
