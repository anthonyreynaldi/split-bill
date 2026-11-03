"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, Plus, Trash2, UserPlus } from "lucide-react";
import type { ParticipantDto } from "@/shared/dto";
import { errorCodeOf } from "@/shared/lib/result";
import { Link } from "@/i18n/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useFieldErrors } from "@/components/form/use-field-errors";
import { useFormatters } from "@/components/format/use-formatters";
import { FieldError } from "@/components/ui/field";
import { BillList } from "../components/bill-list";
import { ParticipantList } from "../components/participant-list";
import {
  useAddParticipantForm,
  useDeleteEvent,
  useEventDetail,
  useRemoveParticipant,
  useRenameParticipant,
} from "../hooks/use-events";

/** /events/[eventId]: people + bills of one event. */
export function EventDetailContainer({ eventId }: { eventId: string }) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const tErr = useTranslations("errors");
  const fieldErrors = useFieldErrors();

  const detail = useEventDetail(eventId);
  const { form: addForm } = useAddParticipantForm(eventId);
  const rename = useRenameParticipant(eventId);
  const remove = useRemoveParticipant(eventId);
  const del = useDeleteEvent(eventId);
  // Keep the person after closing so the dialog title doesn't flash empty during its exit animation.
  const [toRemove, setToRemove] = useState<ParticipantDto | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fmt = useFormatters(detail.data?.event.currency ?? "IDR");

  if (detail.isPending) return <Skeleton className="h-64 w-full" />;
  if (detail.isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{tErr(errorCodeOf(detail.error))}</AlertDescription>
      </Alert>
    );

  const { event, participants, bills } = detail.data;
  const nameOf = (id: string | null) => participants.find((p) => p.id === id)?.name ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-2xl font-semibold">
          {event.name} <Badge variant="secondary">{event.currency}</Badge>
        </h1>
        <Link href={`/events/${eventId}/summary`} className={buttonVariants()}>
          <BarChart3 /> {t("detail.summary")}
        </Link>
        <Button variant="ghost" size="icon" aria-label={t("detail.delete")} onClick={() => setConfirmDelete(true)}>
          <Trash2 />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.people", { count: participants.length })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ParticipantList
            participants={participants}
            onRename={(participantId, name) => rename.mutate({ participantId, name })}
            onRemove={(p) => {
              setToRemove(p);
              setRemoveOpen(true);
            }}
            labels={{
              empty: t("detail.noPeople"),
              rename: tc("edit"),
              remove: tc("delete"),
              save: tc("save"),
              cancel: tc("cancel"),
            }}
          />
          <form
            noValidate
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addForm.handleSubmit();
            }}
          >
            <addForm.Field name="name">
              {(field) => (
                <div className="flex-1">
                  <Input
                    aria-label={t("detail.addPerson")}
                    placeholder={t("detail.addPersonPlaceholder")}
                    value={field.state.value}
                    maxLength={100}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError
                    errors={fieldErrors(field.state.meta, addForm.state.submissionAttempts > 0).map((message) => ({
                      message,
                    }))}
                  />
                </div>
              )}
            </addForm.Field>
            <Button type="submit" variant="secondary">
              <UserPlus /> {tc("add")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.bills", { count: bills.length })}</CardTitle>
          <CardAction>
            <Link href={`/events/${eventId}/bills/new`} className={buttonVariants({ size: "sm" })}>
              <Plus /> {t("detail.addBill")}
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {participants.length === 0 && bills.length === 0 && (
            <p className="mb-2 text-sm text-muted-foreground">{t("detail.addPeopleFirst")}</p>
          )}
          <BillList
            eventId={eventId}
            bills={bills}
            participantName={nameOf}
            money={fmt.money}
            date={fmt.date}
            labels={{
              empty: t("detail.noBills"),
              paidBy: (name) => t("detail.paidBy", { name }),
              noPayer: t("detail.noPayer"),
              items: (n) => t("detail.items", { count: n }),
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={t("detail.removePersonTitle", { name: toRemove?.name ?? "" })}
        description={t("detail.removePersonDescription")}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        pending={remove.isPending}
        onConfirm={() => toRemove && remove.mutate(toRemove.id, { onSettled: () => setRemoveOpen(false) })}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("detail.deleteTitle", { name: event.name })}
        description={t("detail.deleteDescription")}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        pending={del.isPending}
        onConfirm={() => del.mutate()}
      />
    </div>
  );
}
