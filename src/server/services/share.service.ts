import type { SharedSummaryDto, ShareLinkDto, UpsertShareLinkInput } from "@/shared/dto";
import { AppError } from "@/shared/lib/result";
import type { ShareLink } from "@/domain/types";
import type { PasswordHasher } from "../auth/password";
import type { Repositories } from "../repositories/interfaces";
import { requireOwnedEvent } from "./ownership";
import { buildSummary } from "./summary.service";

export const MAX_PASSCODE_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

type Repos = Pick<Repositories, "events" | "participants" | "bills" | "shareLinks">;

const toDto = (s: ShareLink): ShareLinkDto => ({
  slug: s.slug,
  enabled: s.enabled,
  hasPasscode: !!s.passcodeHash,
  showPhotos: s.showPhotos,
});

/** 128-bit random, URL-safe. Unguessable, so the link itself is the first secret. */
const newSlug = () => Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");

/**
 * Read-only public links. One link per event; optional passcode (bcrypt) with
 * attempt limiting. Whether a browser already entered the passcode is decided
 * by the caller (a signed cookie) and passed in as `hasAccess`.
 */
export class ShareService {
  constructor(
    private readonly repos: Repos,
    private readonly hasher: PasswordHasher,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Owner: current link settings, or null if never shared. */
  async getSettings(userId: string, eventId: string): Promise<ShareLinkDto | null> {
    await requireOwnedEvent(this.repos.events, userId, eventId);
    const link = await this.repos.shareLinks.findByEventId(eventId);
    return link ? toDto(link) : null;
  }

  /** Owner: create the link or change enabled/passcode. A new passcode resets the lock. */
  async upsert(userId: string, input: UpsertShareLinkInput): Promise<ShareLinkDto> {
    await requireOwnedEvent(this.repos.events, userId, input.eventId);
    const passcodeHash =
      input.passcode === undefined ? undefined : input.passcode === null ? null : await this.hasher.hash(input.passcode);
    const existing = await this.repos.shareLinks.findByEventId(input.eventId);
    if (!existing) {
      return toDto(
        await this.repos.shareLinks.create({
          eventId: input.eventId,
          slug: newSlug(),
          passcodeHash: passcodeHash ?? null,
          enabled: input.enabled ?? true,
          showPhotos: input.showPhotos ?? true,
        }),
      );
    }
    return toDto(
      await this.repos.shareLinks.update(existing.id, {
        enabled: input.enabled ?? existing.enabled,
        showPhotos: input.showPhotos ?? existing.showPhotos,
        ...(passcodeHash !== undefined && { passcodeHash, failedAttempts: 0, lockedUntil: null }),
      }),
    );
  }

  /**
   * Public: the read-only summary.
   * @throws `NOT_FOUND` (unknown or disabled link), `PASSCODE_REQUIRED`
   */
  async getPublic(slug: string, hasAccess: boolean): Promise<SharedSummaryDto> {
    const link = await this.requireLink(slug);
    if (link.passcodeHash && !hasAccess) throw new AppError("PASSCODE_REQUIRED");
    const event = await this.repos.events.findById(link.eventId);
    if (!event) throw new AppError("NOT_FOUND");
    return buildSummary(this.repos, event);
  }

  /**
   * Public: check a passcode. After {@link MAX_PASSCODE_ATTEMPTS} wrong tries the
   * link is locked for {@link LOCK_MINUTES} minutes.
   * @throws `NOT_FOUND`, `PASSCODE_INVALID`, `TOO_MANY_ATTEMPTS`
   */
  async verifyPasscode(slug: string, passcode: string): Promise<void> {
    const link = await this.requireLink(slug);
    if (!link.passcodeHash) return; // nothing to check
    const now = this.now();
    if (link.lockedUntil && new Date(link.lockedUntil) > now) throw new AppError("TOO_MANY_ATTEMPTS");

    if (await this.hasher.verify(passcode, link.passcodeHash)) {
      if (link.failedAttempts || link.lockedUntil) {
        await this.repos.shareLinks.update(link.id, { failedAttempts: 0, lockedUntil: null });
      }
      return;
    }
    const failed = link.failedAttempts + 1;
    if (failed >= MAX_PASSCODE_ATTEMPTS) {
      await this.repos.shareLinks.update(link.id, {
        failedAttempts: 0,
        lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString(),
      });
      throw new AppError("TOO_MANY_ATTEMPTS");
    }
    await this.repos.shareLinks.update(link.id, { failedAttempts: failed, lockedUntil: null });
    throw new AppError("PASSCODE_INVALID");
  }

  private async requireLink(slug: string): Promise<ShareLink> {
    const link = await this.repos.shareLinks.findBySlug(slug);
    if (!link || !link.enabled) throw new AppError("NOT_FOUND");
    return link;
  }
}
