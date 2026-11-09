import { z } from "zod";
import { IdSchema, VALIDATION } from "./common";
import { SummaryDto } from "./summary.dto";

const PasscodeSchema = z
  .string()
  .trim()
  .min(4, { error: VALIDATION.passcodeLength })
  .max(32, { error: VALIDATION.passcodeLength });

/**
 * Input for `upsertShareLink`.
 * - `passcode: string`: set or replace the passcode
 * - `passcode: null`: remove it (the link is open to anyone who has it)
 * - `passcode` omitted: keep the current one
 */
export const UpsertShareLinkInput = z.object({
  eventId: IdSchema,
  /** Omit to keep the current value (new links: true). */
  enabled: z.boolean().optional(),
  passcode: PasscodeSchema.nullable().optional(),
  /** Show receipt photos to link viewers. Omit to keep the current setting (new links: true). */
  showPhotos: z.boolean().optional(),
});
export type UpsertShareLinkInput = z.input<typeof UpsertShareLinkInput>;

/** Share link settings as seen by the owner. Never includes the passcode or its hash. */
export const ShareLinkDto = z.object({
  slug: z.string(),
  enabled: z.boolean(),
  hasPasscode: z.boolean(),
  showPhotos: z.boolean(),
});
export type ShareLinkDto = z.infer<typeof ShareLinkDto>;

/** Input for `verifySharePasscode`. */
export const VerifyPasscodeInput = z.object({
  slug: z.string().min(1).max(64),
  passcode: z.string().min(1, { error: VALIDATION.required }).max(64),
});
export type VerifyPasscodeInput = z.infer<typeof VerifyPasscodeInput>;

/** Input for `getSharedSummary`. */
export const SharedSummaryInput = z.object({ slug: z.string().min(1).max(64) });
export type SharedSummaryInput = z.infer<typeof SharedSummaryInput>;

/** Public read-only view. */
export const SharedSummaryDto = SummaryDto;
export type SharedSummaryDto = z.infer<typeof SharedSummaryDto>;
