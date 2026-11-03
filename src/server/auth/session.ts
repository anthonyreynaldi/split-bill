import "server-only";
import { cookies } from "next/headers";
import { env } from "../env";
import { signToken, verifyToken } from "./token";

/** Cookie names. `SESSION_COOKIE` is also checked (presence only) in src/proxy.ts. */
export const SESSION_COOKIE = "sb_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Start a session for `userId` (sets the signed httpOnly cookie). */
export async function startSession(userId: string): Promise<void> {
  const token = await signToken({ sub: userId, purpose: "session" }, env().SESSION_SECRET, SESSION_TTL);
  (await cookies()).set(SESSION_COOKIE, token, { ...baseCookie, maxAge: SESSION_TTL });
}

/** End the session. */
export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The logged-in user id, or null. Verifies the signature and expiry. */
export async function getSessionUserId(): Promise<string | null> {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value, "session", env().SESSION_SECRET);
}

// ── share-link access (one cookie per slug, set after a correct passcode) ──

const SHARE_TTL = 60 * 60 * 12; // 12 hours
const shareCookie = (slug: string) => `sb_share_${slug}`;

/** Remember that this browser entered the right passcode for `slug`. */
export async function grantShareAccess(slug: string): Promise<void> {
  const token = await signToken({ sub: slug, purpose: "share" }, env().SESSION_SECRET, SHARE_TTL);
  (await cookies()).set(shareCookie(slug), token, { ...baseCookie, maxAge: SHARE_TTL });
}

/** True if this browser has a valid access cookie for `slug`. */
export async function hasShareAccess(slug: string): Promise<boolean> {
  const sub = await verifyToken((await cookies()).get(shareCookie(slug))?.value, "share", env().SESSION_SECRET);
  return sub === slug;
}
