"use client";

import { useQuery } from "@tanstack/react-query";
import { unwrap } from "@/shared/lib/result";
import { getSummary } from "@/server/actions/summary.actions";
import { eventKeys } from "@/features/events/hooks/use-events";

export const summaryKeys = { detail: (eventId: string) => [...eventKeys.detail(eventId), "summary"] as const };

/** Summary for the event owner. Invalidated with the event (same key prefix). */
export function useSummary(eventId: string) {
  return useQuery({ queryKey: summaryKeys.detail(eventId), queryFn: () => unwrap(getSummary({ eventId })) });
}
