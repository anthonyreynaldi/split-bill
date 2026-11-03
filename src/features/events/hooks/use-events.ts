"use client";
/**
 * Events view logic: queries, mutations and forms around events.actions.
 */
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  AddParticipantInput,
  CreateEventInput,
  CurrencySchema,
  type RenameParticipantInput,
  type UpdateEventInput,
} from "@/shared/dto";
import { errorCodeOf, unwrap } from "@/shared/lib/result";
import {
  addParticipant,
  createEvent,
  deleteEvent,
  getEventDetail,
  listEvents,
  removeParticipant,
  renameParticipant,
  updateEvent,
} from "@/server/actions/events.actions";
import { useRouter } from "@/i18n/navigation";

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

/** Inline "add person" form; resets after each add. */
export function useAddParticipantForm(eventId: string) {
  const qc = useQueryClient();
  const onError = useErrorToast();
  const mutation = useMutation({
    mutationFn: (name: string) => unwrap(addParticipant({ eventId, name })),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) }),
    onError,
  });
  const form = useForm({
    defaultValues: { name: "" },
    validators: { onSubmit: AddParticipantInput.pick({ name: true }) },
    onSubmit: async ({ value, formApi }) => {
      await mutation.mutateAsync(value.name.trim()).catch(() => undefined);
      formApi.reset();
    },
  });
  return { form, mutation };
}

export function useRenameParticipant(eventId: string) {
  const qc = useQueryClient();
  const onError = useErrorToast();
  return useMutation({
    mutationFn: (v: Omit<RenameParticipantInput, "eventId">) => unwrap(renameParticipant({ eventId, ...v })),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) }),
    onError,
  });
}

export function useRemoveParticipant(eventId: string) {
  const qc = useQueryClient();
  const onError = useErrorToast();
  return useMutation({
    mutationFn: (participantId: string) => unwrap(removeParticipant({ eventId, participantId })),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) }),
    onError,
  });
}
