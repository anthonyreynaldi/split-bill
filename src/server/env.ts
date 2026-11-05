import { z } from "zod";

/**
 * Server environment, validated once on first use.
 * See `.env.example` and docs/DEVELOPER.md → Environment variables.
 */
const EnvSchema = z
  .object({
    DATA_BACKEND: z.enum(["supabase", "memory"]).default("supabase"),
    SUPABASE_URL: z.url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
    /**
     * Vision-capable model id, or a comma-separated priority list used as fallbacks
     * (see `createOpenRouterOcrProvider`). Free ones: openrouter.ai/models?input_modalities=image&max_price=0
     */
    OPENROUTER_MODEL: z.string().min(1).optional(),
    APP_URL: z.url().default("http://localhost:3000"),
  })
  .refine((e) => e.DATA_BACKEND !== "supabase" || (e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY), {
    message: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when DATA_BACKEND=supabase",
  });

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/** Parsed env. Throws a readable error listing every problem. */
export function env(): Env {
  if (cached) return cached;
  // Treat `KEY=` (empty) in .env files as "not set".
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}\nSee .env.example`);
  }
  cached = parsed.data;
  return cached;
}
