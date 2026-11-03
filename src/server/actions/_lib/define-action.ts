import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { AppError, fail, ok, type ActionResult } from "@/shared/lib/result";
import { getSessionUserId } from "../../auth/session";

/**
 * Wrap a Server Action so that it:
 * 1. validates its single argument with a zod DTO (→ `VALIDATION_ERROR` + fieldErrors),
 * 2. runs the handler,
 * 3. converts `AppError` → `{ ok: false, error: { code } }`,
 * 4. logs unexpected errors and returns `INTERNAL_ERROR` (no stack traces leak to the client),
 * 5. lets Next.js `redirect()` / `notFound()` pass through.
 *
 * @example
 * export const createEvent = defineAction(CreateEventInput, async (input) => {
 *   const userId = await requireUserId();
 *   return getContainer().services.events.create(userId, input);
 * });
 */
export function defineAction<S extends z.ZodType, R>(
  schema: S,
  handler: (input: z.output<S>) => Promise<R>,
): (input: z.input<S>) => Promise<ActionResult<R>> {
  return async (input) => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", z.flattenError(parsed.error).fieldErrors as Record<string, string[]>);
    }
    try {
      return ok(await handler(parsed.data));
    } catch (err) {
      unstable_rethrow(err);
      if (err instanceof AppError) return fail(err.code, err.fieldErrors);
      console.error("[action] unexpected error:", err);
      return fail("INTERNAL_ERROR");
    }
  };
}

/** Schema for actions that take no argument. */
export const NoInput = z.undefined();

/** The logged-in user id. @throws AppError(`UNAUTHORIZED`) */
export async function requireUserId(): Promise<string> {
  const id = await getSessionUserId();
  if (!id) throw new AppError("UNAUTHORIZED");
  return id;
}
