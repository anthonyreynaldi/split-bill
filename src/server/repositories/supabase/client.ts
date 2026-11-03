import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db.types";

export type Db = SupabaseClient<Database>;

/**
 * Server-side Supabase client using the **service-role / secret key**.
 * It bypasses RLS, so it must never reach the browser. The env vars have no
 * `NEXT_PUBLIC_` prefix, and only `container.ts` (server-only) creates it.
 */
export function createSupabaseClient(url: string, serviceKey: string): Db {
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Throw a readable error for a failed Supabase call. */
export function check<T>(
  res: { data: T; error: { message: string; code?: string } | null },
  op: string,
): NonNullable<T> {
  if (res.error) {
    const err = new Error(`[supabase] ${op}: ${res.error.message}`) as Error & { code?: string };
    err.code = res.error.code;
    throw err;
  }
  return res.data as NonNullable<T>;
}

/** Postgres unique_violation. */
export const UNIQUE_VIOLATION = "23505";
