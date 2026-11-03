"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpsertShareLinkInput } from "@/shared/dto";
import { unwrap } from "@/shared/lib/result";
import { getShareLink, getSharedSummary, upsertShareLink, verifySharePasscode } from "@/server/actions/share.actions";
import { eventKeys, useErrorToast } from "@/features/events/hooks/use-events";

export const shareKeys = {
  settings: (eventId: string) => [...eventKeys.detail(eventId), "share"] as const,
  public: (slug: string) => ["shared", slug] as const,
};

/** Owner: link settings (`null` = not shared yet). */
export function useShareLink(eventId: string, enabled = true) {
  return useQuery({ queryKey: shareKeys.settings(eventId), queryFn: () => unwrap(getShareLink({ eventId })), enabled });
}

/** Owner: create/enable/disable the link, set or remove the passcode. */
export function useUpsertShareLink(eventId: string) {
  const qc = useQueryClient();
  const onError = useErrorToast();
  return useMutation({
    mutationFn: (patch: Omit<UpsertShareLinkInput, "eventId">) => unwrap(upsertShareLink({ eventId, ...patch })),
    onSuccess: (link) => qc.setQueryData(shareKeys.settings(eventId), link),
    onError,
  });
}

/** Public: the shared summary. Fails with PASSCODE_REQUIRED until the passcode was entered. */
export function useSharedSummary(slug: string) {
  return useQuery({
    queryKey: shareKeys.public(slug),
    queryFn: () => unwrap(getSharedSummary({ slug })),
    retry: false,
  });
}

/** Public: submit the passcode, then reload the summary. */
export function useVerifyPasscode(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (passcode: string) => unwrap(verifySharePasscode({ slug, passcode })),
    onSuccess: () => qc.invalidateQueries({ queryKey: shareKeys.public(slug) }),
  });
}
