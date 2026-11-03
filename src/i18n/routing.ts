import { defineRouting } from "next-intl/routing";

/**
 * Supported locales and URL strategy.
 * Every route is prefixed: `/id/...` (default) and `/en/...`.
 * To add a language: add it here, add `messages/<locale>.json`, done.
 */
export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
});

export type Locale = (typeof routing.locales)[number];
