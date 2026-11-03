import { OcrResult, type BillDraftDto } from "@/shared/dto";
import { AppError } from "@/shared/lib/result";
import type { OcrProvider } from "../providers/ocr/ocr-provider";
import type { Repositories } from "../repositories/interfaces";
import { IMAGE_URL_TTL_SECONDS } from "./bill.service";
import { ocrToFormValues } from "./ocr-normalize";
import { requireOwnedEvent } from "./ownership";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Receipt upload + OCR (ADR 0005).
 * The image is always stored, so the bill keeps its photo even when OCR fails
 * or is disabled. Nothing else is saved: the result is a **draft**.
 */
export class OcrService {
  constructor(
    private readonly repos: Pick<Repositories, "events" | "images">,
    /** null = OCR not configured (no OPENROUTER_API_KEY / OPENROUTER_MODEL). */
    private readonly provider: OcrProvider | null,
  ) {}

  async uploadAndExtract(
    userId: string,
    eventId: string,
    file: { data: Uint8Array; contentType: string },
  ): Promise<BillDraftDto> {
    const event = await requireOwnedEvent(this.repos.events, userId, eventId);
    const ext = EXT[file.contentType];
    if (!ext) throw new AppError("VALIDATION_ERROR", "unsupported image type", { file: ["invalid"] });
    if (file.data.byteLength === 0 || file.data.byteLength > MAX_IMAGE_BYTES) {
      throw new AppError("VALIDATION_ERROR", "image too large", { file: ["tooLong"] });
    }

    const imagePath = `${eventId}/${crypto.randomUUID()}.${ext}`;
    await this.repos.images.put(imagePath, file.data, file.contentType);
    const imageUrl = await this.repos.images.signedUrl(imagePath, IMAGE_URL_TTL_SECONDS).catch(() => null);

    const empty = { ...ocrToFormValues(OcrResult.parse({}), event.currency, imagePath), title: "", imageUrl };
    if (!this.provider) return { ...empty, ocrStatus: "disabled" };

    try {
      const parsed = OcrResult.safeParse(await this.provider.extract(file));
      if (!parsed.success || parsed.data.items.length === 0) return { ...empty, ocrStatus: "failed" };
      return { ...ocrToFormValues(parsed.data, event.currency, imagePath), imageUrl, ocrStatus: "ok" };
    } catch (err) {
      console.warn("[ocr] extraction failed:", err instanceof Error ? err.message : err);
      return { ...empty, ocrStatus: "failed" };
    }
  }
}
