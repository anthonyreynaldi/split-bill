import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/shared/lib/money";

/**
 * Shared zod building blocks.
 *
 * Validation messages are **i18n keys** (e.g. `"required"`), not English text.
 * The UI renders them via `t('validation.<key>')`.
 *
 * @module
 */

export const VALIDATION = {
  required: "required",
  invalidEmail: "invalidEmail",
  passwordTooShort: "passwordTooShort",
  tooLong: "tooLong",
  mustBePositive: "mustBePositive",
  mustBeWhole: "mustBeWhole",
  invalid: "invalid",
  passcodeLength: "passcodeLength",
} as const;

export const IdSchema = z.uuid({ error: VALIDATION.invalid });

/** Trimmed, non-empty name with a sensible max length. */
export const NameSchema = z
  .string()
  .trim()
  .min(1, { error: VALIDATION.required })
  .max(100, { error: VALIDATION.tooLong });

/** Integer money in minor units, ≥ 0 (ADR 0004). */
export const MoneySchema = z
  .number({ error: VALIDATION.required })
  .int({ error: VALIDATION.mustBeWhole })
  .min(0, { error: VALIDATION.mustBePositive })
  .max(1_000_000_000_000, { error: VALIDATION.invalid });

export const CurrencySchema = z.enum(SUPPORTED_CURRENCIES as [string, ...string[]], {
  error: VALIDATION.invalid,
});

export const SplitModeSchema = z.enum(["even", "custom"]);
export const ChargeKindSchema = z.enum(["tax", "service", "discount"]);
export const ChargeModeSchema = z.enum(["percent", "amount"]);
export const ChargeSplitModeSchema = z.enum(["proportional", "even"]);
export const SettlementModeSchema = z.enum(["per_bill", "nett"]);

/** `YYYY-MM-DD` or null. */
export const DateOnlySchema = z.iso.date({ error: VALIDATION.invalid }).nullable();

/** Input that only identifies an event. */
export const EventIdInput = z.object({ eventId: IdSchema });
export type EventIdInput = z.infer<typeof EventIdInput>;
