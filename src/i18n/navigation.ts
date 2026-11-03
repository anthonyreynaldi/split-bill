import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for `next/link` and `next/navigation`.
 * Always import `Link`, `useRouter`, `redirect`… from here, not from Next,
 * so the current locale prefix is kept automatically.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
