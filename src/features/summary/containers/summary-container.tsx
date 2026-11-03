"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { errorCodeOf } from "@/shared/lib/result";
import { Link } from "@/i18n/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatters } from "@/components/format/use-formatters";
import { useUpdateEvent } from "@/features/events/hooks/use-events";
import { ExportActionsContainer } from "@/features/export/containers/export-actions-container";
import { ShareDialogContainer } from "@/features/share/containers/share-dialog-container";
import { SummaryView, type SettlementMode } from "../components/summary-view";
import { useSummary } from "../hooks/use-summary";

/** /events/[eventId]/summary. The settlement mode is saved on the event. */
export function SummaryContainer(props: { eventId: string }) {
  const tc = useTranslations("common");
  const tErr = useTranslations("errors");
  const summary = useSummary(props.eventId);
  const update = useUpdateEvent(props.eventId);
  const [mode, setMode] = useState<SettlementMode | null>(null);
  // callback ref → state, so actions get the element without reading refs during render
  const [captureEl, setCaptureEl] = useState<HTMLDivElement | null>(null);
  const fmt = useFormatters(summary.data?.event.currency ?? "IDR");

  if (summary.isPending) return <Skeleton className="h-96 w-full" />;
  if (summary.isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{tErr(errorCodeOf(summary.error))}</AlertDescription>
      </Alert>
    );

  const current = mode ?? summary.data.event.settlementMode;
  return (
    <div className="space-y-3">
      <Link href={`/events/${props.eventId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft /> {tc("back")}
      </Link>
      <SummaryView
        summary={summary.data}
        mode={current}
        onModeChange={(m) => {
          setMode(m);
          update.mutate({ settlementMode: m });
        }}
        money={fmt.money}
        date={fmt.date}
        onCaptureEl={setCaptureEl}
        actions={
          <>
            <ExportActionsContainer eventId={props.eventId} captureEl={captureEl} name={summary.data.event.name} />
            <ShareDialogContainer eventId={props.eventId} />
          </>
        }
      />
    </div>
  );
}
