/**
 * The contract between Server Actions and the client.
 *
 * - Services throw {@link AppError} with a stable {@link ErrorCode}.
 * - Server Actions catch it and return an {@link ActionResult} (they never throw).
 * - Hooks call {@link unwrap} so TanStack Query sees data or a thrown {@link ActionError}.
 * - The UI translates `error.code` via `messages/*.json → errors.<CODE>`.
 *
 * @module
 */

/** Every error code the server can return. Add new codes to both message files. */
export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "EMAIL_TAKEN",
  "INVALID_CREDENTIALS",
  "PASSCODE_REQUIRED",
  "PASSCODE_INVALID",
  "TOO_MANY_ATTEMPTS",
  "OCR_FAILED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Field name → list of messages (zod-style). */
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionErrorPayload = {
  code: ErrorCode;
  fieldErrors?: FieldErrors;
};

/** What every Server Action returns. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionErrorPayload };

/** Build a success result. */
export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

/** Build a failure result. */
export const fail = (
  code: ErrorCode,
  fieldErrors?: FieldErrors,
): ActionResult<never> => ({ ok: false, error: { code, fieldErrors } });

/**
 * Domain/service error with a stable code. Throw this from services;
 * the action wrapper converts it to `ActionResult`.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message ?? code);
    this.name = "AppError";
  }
}

/** Client-side error thrown by {@link unwrap}; carries the server code. */
export class ActionError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(code);
    this.name = "ActionError";
  }
}

/**
 * Turn an `ActionResult` into data, or throw `ActionError`.
 * Use inside TanStack `queryFn` / `mutationFn`.
 *
 * @example
 * useQuery({ queryKey: ['events'], queryFn: () => unwrap(listEvents()) })
 */
export async function unwrap<T>(
  result: ActionResult<T> | Promise<ActionResult<T>>,
): Promise<T> {
  const r = await result;
  if (r.ok) return r.data;
  throw new ActionError(r.error.code, r.error.fieldErrors);
}

/** Read the error code from anything a hook may catch. */
export function errorCodeOf(error: unknown): ErrorCode {
  return error instanceof ActionError ? error.code : "INTERNAL_ERROR";
}
