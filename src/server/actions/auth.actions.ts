"use server";
/**
 * Auth Server Actions. Documented in docs/server-actions.md#auth.
 * Call these from `features/auth/hooks` only.
 *
 * @module
 */
import { LoginInput, RegisterInput, type SessionUserDto } from "@/shared/dto";
import { getContainer } from "../container";
import { endSession, getSessionUserId, startSession } from "../auth/session";
import { defineAction, NoInput } from "./_lib/define-action";

/**
 * Create an account and log in.
 * @param input {@link RegisterInput} `{ email, password }`
 * @returns the new user. Errors: `VALIDATION_ERROR`, `EMAIL_TAKEN`.
 */
export const register = defineAction(RegisterInput, async (input): Promise<SessionUserDto> => {
  const user = await getContainer().services.auth.register(input);
  await startSession(user.id);
  return user;
});

/**
 * Log in with email and password.
 * @param input {@link LoginInput} `{ email, password }`
 * @returns the user. Errors: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`.
 */
export const login = defineAction(LoginInput, async (input): Promise<SessionUserDto> => {
  const user = await getContainer().services.auth.login(input);
  await startSession(user.id);
  return user;
});

/** End the session. Always succeeds. */
export const logout = defineAction(NoInput, async (): Promise<null> => {
  await endSession();
  return null;
});

/** The logged-in user, or `null` if logged out. Never fails with UNAUTHORIZED. */
export const getCurrentUser = defineAction(NoInput, async (): Promise<SessionUserDto | null> => {
  const id = await getSessionUserId();
  return id ? getContainer().services.auth.getUser(id) : null;
});
