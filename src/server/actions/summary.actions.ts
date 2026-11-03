"use server";
/**
 * Summary Server Actions. Documented in docs/server-actions.md#summary.
 *
 * @module
 */
import { EventIdInput } from "@/shared/dto";
import { getContainer } from "../container";
import { defineAction, requireUserId } from "./_lib/define-action";

/**
 * Per-person totals, per-bill breakdown and both settlement plans (per bill + nett).
 * Errors: `UNAUTHORIZED`, `NOT_FOUND`.
 */
export const getSummary = defineAction(EventIdInput, async ({ eventId }) =>
  getContainer().services.summary.get(await requireUserId(), eventId),
);
