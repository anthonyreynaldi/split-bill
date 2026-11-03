import "server-only";
import { bcryptHasher } from "./auth/password";
import { env } from "./env";
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
    container = { repos, services: createServices({ repos, hasher: bcryptHasher }) };
  }
  return container;
}
