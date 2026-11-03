"use server";
/**
 * Share-link Server Actions. Documented in docs/server-actions.md#share.
 * `getSharedSummary` and `verifySharePasscode` are PUBLIC (no login).
 *
 * @module
 */
import { EventIdInput, SharedSummaryInput, UpsertShareLinkInput, VerifyPasscodeInput } from "@/shared/dto";
import { getContainer } from "../container";
import { grantShareAccess, hasShareAccess } from "../auth/session";
import { defineAction, requireUserId } from "./_lib/define-action";

const share = () => getContainer().services.share;

/** Owner: the event's link settings, or `null` if never shared. Errors: `UNAUTHORIZED`, `NOT_FOUND`. */
export const getShareLink = defineAction(EventIdInput, async ({ eventId }) =>
  share().getSettings(await requireUserId(), eventId),
);

/**
 * Owner: create the link or change it. `passcode`: string = set, null = remove, omitted = keep.
 * Errors: `UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION_ERROR` (passcode 4–32 chars).
 */
export const upsertShareLink = defineAction(UpsertShareLinkInput, async (input) =>
  share().upsert(await requireUserId(), input),
);

/**
 * PUBLIC: the read-only summary behind a link.
 * Errors: `NOT_FOUND` (unknown/disabled), `PASSCODE_REQUIRED`.
 */
export const getSharedSummary = defineAction(SharedSummaryInput, async ({ slug }) =>
  share().getPublic(slug, await hasShareAccess(slug)),
);

/**
 * PUBLIC: check the passcode; on success this browser gets a 12-hour access cookie for the link.
 * Errors: `NOT_FOUND`, `PASSCODE_INVALID`, `TOO_MANY_ATTEMPTS`.
 */
export const verifySharePasscode = defineAction(VerifyPasscodeInput, async ({ slug, passcode }) => {
  await share().verifyPasscode(slug, passcode);
  await grantShareAccess(slug);
  return null;
});
