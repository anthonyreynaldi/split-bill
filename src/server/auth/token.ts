import { jwtVerify, SignJWT } from "jose";

/**
 * Signed tokens (HS256) for the session cookie and share-link access cookies.
 * Pure functions: no Next.js, so they are unit-testable.
 */

const key = (secret: string) => new TextEncoder().encode(secret);

/** Sign `{ sub, purpose }`, valid for `ttlSeconds`. */
export async function signToken(
  payload: { sub: string; purpose: "session" | "share" },
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  return new SignJWT({ purpose: payload.purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key(secret));
}

/** Return `sub` if the token is valid, not expired and for `purpose`, else null. */
export async function verifyToken(
  token: string | undefined,
  purpose: "session" | "share",
  secret: string,
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    return payload.purpose === purpose && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
