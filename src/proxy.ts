import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

/**
 * Next.js 16 "proxy" (formerly middleware).
 * 1. Optimistic auth redirect: no session cookie on a private page → /login.
 *    (Presence check only. Every Server Action verifies the session itself.)
 * 2. next-intl: adds or validates the locale prefix (`/` → `/id`).
 */
const intl = createMiddleware(routing);
const SESSION_COOKIE = "sb_session"; // keep in sync with src/server/auth/session.ts
const PRIVATE = new RegExp(`^/(${routing.locales.join("|")})/events(/|$)`);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PRIVATE.test(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    const locale = pathname.split("/")[1];
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  return intl(request);
}

export const config = {
  // Skip API routes, Next internals and files with an extension (favicon.ico, images…)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
