import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Next.js config.
 * - cacheComponents is OFF: every page is user-specific and data is loaded
 *   client-side via TanStack Query + Server Actions (see docs/decisions/0001).
 */
const nextConfig: NextConfig = {
  // Dev logs Server Action arguments by default, which would print passwords
  // and passcodes in the terminal. Keep it off.
  logging: { serverFunctions: false },
  // Receipt photos are compressed in the browser (~0.5 MB) but allow up to the 5 MB service limit.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
