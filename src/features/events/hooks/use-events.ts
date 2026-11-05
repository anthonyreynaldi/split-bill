"use client";
/**
 * Events view logic: queries, mutations and forms around events.actions.
 */
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CreateEventInput,
  CurrencySchema,
  type EventDetailDto,
  type ParticipantDto,
  type UpdateEventInput,
} from "@/shared/dto";
import { errorCodeOf, unwrap } from "@/shared/lib/result";
import {
  createEvent,
  deleteEvent,
  getEventDetail,
  listEvents,
  saveParticipants,
  updateEvent,
} from "@/server/actions/events.actions";
import { useRouter } from "@/i18n/navigation";
import {
  changeCount,
  draftChanges,
  draftFromServer,
  duplicateKeys,
  nameError,
  splitNames,
} from "./people-draft";

/** Query keys. Everything about one event lives under `['events', id]`. */
export const eventKeys = {
  all: ["events"] as const,
  detail: (eventId: string) => ["events", eventId] as const,
};

/** Toast the translated error of a failed mutation. */
export function useErrorToast() {
  const t = useTranslations("errors");
  return (err: unknown) => toast.error(t(errorCodeOf(err)));
}

export function useEvents() {
  return useQuery({ queryKey: eventKeys.all, queryFn: () => unwrap(listEvents(undefined)) });
}

export function useEventDetail(eventId: string) {
  return useQuery({ queryKey: eventKeys.detail(eventId), queryFn: () => unwrap(getEventDetail({ eventId })) });
}

/** "New event" form. Navigates to the event after creating it. */
export function useCreateEventForm() {
  const qc = useQueryClient();
  const router = useRouter();
  const onError = useErrorToast();
  const mutation = useMutation({
    mutationFn: (v: CreateEventInput) => unwrap(createEvent(v)),
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
      router.push(`/events/${event.id}`);
    },
    onError,
  });
  const form = useForm({
    defaultValues: { name: "", currency: "IDR" },
    // same DTO, but currency is always present in the form
    validators: { onSubmit: CreateEventInput.extend({ currency: CurrencySchema }) },
    onSubmit: ({ value }) => mutation.mutateAsync(value).catch(() => undefined),
  });
  return { form, mutation };
}

export function useUpdateEvent(eventId: string) {
  const qc = useQueryClient();
  const onError = useErrorToast();
  return useMutation({
    mutationFn: (patch: Omit<UpdateEventInput, "eventId">) => unwrap(updateEvent({ eventId, ...patch })),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
    onError,
  });
}

export function useDeleteEvent(eventId: string) {
  const qc = useQueryClient();
  const router = useRouter();
  const onError = useErrorToast();
  return useMutation({
    mutationFn: () => unwrap(deleteEvent({ eventId })),
    onSuccess: () => {
      qc.removeQueries({ queryKey: eventKeys.detail(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.all });
      router.push("/events");
    },
    onError,
  });
}

/**
 * People editor for the event page: edits are a local draft (instant, no
 * round-trip per person) and **Save** sends them all in one atomic call.
 * - `add(text)` appends one name, or several when `text` is a pasted list
 * - `rename`, `toggleRemove` (new rows vanish, saved rows are marked and can be undone)
 * - while there are unsaved changes, server refetches don't overwrite the draft
 *   and leaving the page asks for confirmation
 */
export function usePeopleEditor(eventId: string, people: ParticipantDto[]) {
  const qc = useQueryClient();
  const onError = useErrorToast();
  const [rows, setRows] = useState(() => draftFromServer(people));
  const [source, setSource] = useState(people);
  const nextKey = useRef(0);

  const changes = useMemo(() => draftChanges(rows), [rows]);
  const count = changeCount(changes);
  const dirty = count > 0;

  // Adopt fresh server data (refetch, other tab) unless the user is mid-edit.
  if (source !== people && !dirty) {
    setSource(people);
    setRows(draftFromServer(people));
  }

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const mutation = useMutation({
    mutationFn: () => unwrap(saveParticipants({ eventId, ...changes })),
    onSuccess: (saved) => {
      setRows(draftFromServer(saved));
      qc.setQueryData<EventDetailDto>(eventKeys.detail(eventId), (d) => (d ? { ...d, participants: saved } : d));
      // removed people may have been a bill's payer; the list shows people counts
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.all, exact: true });
    },
    onError,
  });

  const errors = new Map(rows.flatMap((r) => (nameError(r) ? [[r.key, nameError(r)!] as const] : [])));
  const duplicates = duplicateKeys(rows);

  return {
    rows,
    changes,
    count,
    dirty,
    errors,
    duplicates,
    pending: mutation.isPending,
    /** Add one name or a pasted list. Returns how many rows were added. */
    add(text: string) {
      const names = splitNames(text);
      if (names.length) {
        setRows((rs) => [...rs, ...names.map((name) => ({ key: `new-${++nextKey.current}`, name, removed: false }))]);
      }
      return names.length;
    },
    rename: (key: string, name: string) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, name } : r))),
    toggleRemove: (key: string) =>
      setRows((rs) =>
        rs.flatMap((r) => (r.key !== key ? [r] : r.id ? [{ ...r, removed: !r.removed }] : [])),
      ),
    discard: () => setRows(draftFromServer(people)),
    /** Saves when the draft is valid. Resolves to whether it saved. */
    save: async () => {
      if (!dirty || errors.size > 0 || mutation.isPending) return false;
      return mutation.mutateAsync().then(
        () => true,
        () => false,
      );
    },
  };
}
