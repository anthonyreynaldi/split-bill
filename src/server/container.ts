import "server-only";
import { env } from "./env";
import type { Repositories } from "./repositories/interfaces";
import { createMemoryRepositories } from "./repositories/memory";
import { createSupabaseRepositories } from "./repositories/supabase";

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
}

// Keep one instance across dev hot-reloads (otherwise the memory backend
// would lose its data on every file save).
const globalForContainer = globalThis as unknown as { __splitBillContainer?: Container };

/** Lazily build and cache the container. Call from Server Actions only. */
export function getContainer(): Container {
  globalForContainer.__splitBillContainer ??= { repos: createRepositories() };
  return globalForContainer.__splitBillContainer;
}
