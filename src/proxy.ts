import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next.js 16 "proxy" (formerly middleware).
 * Adds/validates the locale prefix (`/` → `/id`).
 * Auth is NOT enforced here — every Server Action checks the session itself.
 */
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and files with an extension (favicon.ico, images…)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
