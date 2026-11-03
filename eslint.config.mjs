import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * ── Layer boundaries (see CLAUDE.md "Architecture" and docs/architecture.md) ──
 * no-restricted-imports does not merge between config blocks: the LAST block
 * matching a file wins. So every block repeats the global Supabase ban.
 */
const supabaseBan = {
  group: ["@supabase/*"],
  message:
    "Supabase may only be imported in src/server/repositories/supabase/ (ADR 0002).",
};

/** Build a no-restricted-imports rule = Supabase ban + extra patterns. */
const restrict = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns: [supabaseBan, ...patterns] }],
});

const frameworkBan = (message) => ({
  group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*"],
  message,
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "docs/api/**"]),

  // 1. Everything in src: no Supabase.
  { files: ["src/**/*.{ts,tsx}"], rules: restrict() },

  // 2. View components: no server code at all. Data comes in via props/hooks.
  {
    files: ["src/components/**/*.{ts,tsx}", "src/features/*/components/**/*.{ts,tsx}"],
    rules: restrict({
      group: ["@/server", "@/server/**"],
      message: "View components must not import server code. Use a hook in features/<name>/hooks.",
    }),
  },

  // 3. Hooks: may call Server Actions, but never services/repositories directly.
  {
    files: ["src/features/*/hooks/**/*.{ts,tsx}"],
    rules: restrict({
      group: [
        "@/server/services/**",
        "@/server/repositories/**",
        "@/server/providers/**",
        "@/server/auth/**",
        "@/server/container",
      ],
      message: "Hooks talk to the server only through @/server/actions/*.",
    }),
  },

  // 4. Services: business rules only. Depend on repository INTERFACES.
  {
    files: ["src/server/services/**/*.ts"],
    ignores: ["src/server/services/**/*.test.ts"],
    rules: restrict(
      {
        group: [
          "@/server/repositories/supabase/**",
          "@/server/repositories/memory/**",
          "@/server/container",
          "@/server/actions/**",
        ],
        message: "Services depend only on repositories/interfaces (ADR 0002).",
      },
      frameworkBan("Services are framework-free. Keep Next/React in actions and hooks."),
    ),
  },

  // 5. Domain: pure TypeScript.
  {
    files: ["src/domain/**/*.ts"],
    rules: restrict(
      {
        group: ["@/server", "@/server/**", "@/features/**", "@/components/**", "@/app/**"],
        message: "Domain is pure: no IO, no UI, no server imports.",
      },
      frameworkBan("Domain is pure TypeScript."),
    ),
  },

  // 6. DTOs: shared by client and server, so no server imports.
  {
    files: ["src/shared/**/*.ts"],
    rules: restrict(
      {
        group: ["@/server", "@/server/**", "@/features/**", "@/components/**"],
        message: "shared/ is used by both client and server; keep it dependency-free.",
      },
      frameworkBan("shared/ must stay framework-free."),
    ),
  },

  // 7. The only places allowed to know about Supabase.
  {
    files: ["src/server/repositories/supabase/**/*.ts", "src/server/container.ts"],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
