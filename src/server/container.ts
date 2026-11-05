import "server-only";
import { bcryptHasher } from "./auth/password";
import { env } from "./env";
import type { OcrProvider } from "./providers/ocr/ocr-provider";
import { createOpenRouterOcrProvider, parseModelList } from "./providers/ocr/openrouter";
import type { Repositories } from "./repositories/interfaces";
import { createMemoryRepositories } from "./repositories/memory";
import { createSupabaseRepositories } from "./repositories/supabase";
import { createServices, type Services } from "./services";

/**
 * ════════════════════════════════════════════════════════════════════
 *  THE single wiring point (ADR 0002).
 *  To switch databases: write repositories/<db>/ and change
 *  `createRepositories()` below. Nothing else needs to change.
 * ════════════════════════════════════════════════════════════════════
 */
function createRepositories(): Repositories {
  const e = env();
  switch (e.DATA_BACKEND) {
    case "memory":
      return createMemoryRepositories();
    case "supabase":
      return createSupabaseRepositories({ url: e.SUPABASE_URL!, serviceKey: e.SUPABASE_SERVICE_ROLE_KEY! });
  }
}

/**
 * OCR is optional: without a key + model, uploads still work and the user types the bill.
 * `OPENROUTER_MODEL` may list several models (comma-separated) to fall back on.
 */
function createOcrProvider(): OcrProvider | null {
  const e = env();
  const models = parseModelList(e.OPENROUTER_MODEL);
  if (!e.OPENROUTER_API_KEY || models.length === 0) return null;
  return createOpenRouterOcrProvider({ apiKey: e.OPENROUTER_API_KEY, models, appUrl: e.APP_URL });
}

export interface Container {
  repos: Repositories;
  services: Services;
}

// Repositories survive dev hot-reloads (so DATA_BACKEND=memory keeps its data);
// services are rebuilt per module load so code edits take effect.
const g = globalThis as unknown as { __splitBillRepos?: Repositories };
let container: Container | undefined;

/** Lazily build and cache the container. Call from Server Actions only. */
export function getContainer(): Container {
  if (!container) {
    g.__splitBillRepos ??= createRepositories();
    const repos = g.__splitBillRepos;
    container = { repos, services: createServices({ repos, hasher: bcryptHasher, ocr: createOcrProvider() }) };
  }
  return container;
}
