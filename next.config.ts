import type { NextConfig } from "next";

/**
 * Next.js config.
 * - cacheComponents is OFF: every page is user-specific and data is loaded
 *   client-side via TanStack Query + Server Actions (see docs/decisions/0001).
 */
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
