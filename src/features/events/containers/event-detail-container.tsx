"use client";

import { useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { EventDetailDto } from "@/shared/dto";
import { errorCodeOf } from "@/shared/lib/result";
import { Link } from "@/i18n/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useFormatters } from "@/components/format/use-formatters";
import { BillList } from "../components/bill-list";
import { ParticipantEditor } from "../components/participant-editor";
import { useDeleteEvent, useEventDetail, usePeopleEditor } from "../hooks/use-events";

/** /events/[eventId]: people + bills of one event. */
export function EventDetailContainer({ eventId }: { eventId: string }) {
  const tErr = useTranslations("errors");

  const detail = useEventDetail(eventId);
  if (detail.isPending) return <Skeleton className="h-64 w-full" />;
  if (detail.isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{tErr(errorCodeOf(detail.error))}</AlertDescription>
      </Alert>
    );
  return <EventDetail eventId={eventId} detail={detail.data} />;
}

function EventDetail({ eventId, detail }: { eventId: string; detail: EventDetailDto }) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const people = usePeopleEditor(eventId, detail.participants);
  const del = useDeleteEvent(eventId);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fmt = useFormatters(detail.event.currency);

  const { event, participants, bills } = detail;
  const nameOf = (id: string | null) => participants.find((p) => p.id === id)?.name ?? null;
  // Snapshot for the dialog so its title doesn't change during the exit animation.
  const [removedNames, setRemovedNames] = useState("");
  const removing = people.rows.filter((r) => r.removed).map((r) => r.original ?? r.name).join(", ");
  if (confirmRemove && removing && removing !== removedNames) setRemovedNames(removing);

  const savePeople = async () => {
    if (await people.save()) toast.success(t("detail.peopleSaved"));
  };

  // In-app links would drop the unsaved draft silently (beforeunload doesn't fire), so stop them.
  const guardLinks = (e: MouseEvent) => {
    if (!people.dirty || !(e.target as HTMLElement).closest("a[href]")) return;
    e.preventDefault();
    e.stopPropagation();
    toast.warning(t("detail.saveFirst"));
  };

  return (
    <div className="space-y-6" onClickCapture={guardLinks}>
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
        <CardContent>
          <ParticipantEditor
            rows={people.rows.map((r) => {
              const error = people.errors.get(r.key);
              return {
                key: r.key,
                name: r.name,
                isNew: !r.id,
                removed: r.removed,
                changed: !!r.id && r.name.trim() !== r.original,
                error: error && (tv.has(error) ? tv(error) : error),
                duplicate: people.duplicates.has(r.key),
              };
            })}
            pending={people.pending}
            changeCount={people.count}
            canSave={people.errors.size === 0}
            onAdd={people.add}
            onRename={people.rename}
            onToggleRemove={people.toggleRemove}
            onSave={() => (people.changes.remove.length > 0 ? setConfirmRemove(true) : savePeople())}
            onDiscard={people.discard}
            labels={{
              empty: t("detail.noPeople"),
              name: (n) => t("detail.personName", { n }),
              addPerson: t("detail.addPerson"),
              addPlaceholder: t("detail.addPersonPlaceholder"),
              addHint: t("detail.addPersonHint"),
              add: tc("add"),
              remove: (name) => t("detail.removePerson", { name }),
              undo: (name) => t("detail.undoRemove", { name }),
              isNew: t("detail.newPerson"),
              duplicate: t("detail.duplicateName"),
              unsaved: (count) => t("detail.unsaved", { count }),
              save: tc("save"),
              discard: t("detail.discard"),
            }}
          />
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
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={t("detail.removePersonTitle", { name: removedNames })}
        description={t("detail.removePersonDescription")}
        confirmLabel={tc("save")}
        cancelLabel={tc("cancel")}
        pending={people.pending}
        onConfirm={() => void savePeople().then(() => setConfirmRemove(false))}
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
