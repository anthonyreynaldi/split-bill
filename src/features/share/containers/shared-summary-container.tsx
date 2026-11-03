"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { ActionError, errorCodeOf } from "@/shared/lib/result";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatters } from "@/components/format/use-formatters";
import { ExportActionsContainer } from "@/features/export/containers/export-actions-container";
import { SummaryView, type SettlementMode } from "@/features/summary/components/summary-view";
import { PasscodeGate } from "../components/passcode-gate";
import { useSharedSummary, useVerifyPasscode } from "../hooks/use-share";

/** /s/[slug]: public, read-only. Switching nett/per-bill here is local only (not saved). */
export function SharedSummaryContainer({ slug }: { slug: string }) {
  const t = useTranslations("share");
  const tErr = useTranslations("errors");
  const summary = useSharedSummary(slug);
  const verify = useVerifyPasscode(slug);
  const [mode, setMode] = useState<SettlementMode | null>(null);
  const [captureEl, setCaptureEl] = useState<HTMLDivElement | null>(null);
  const fmt = useFormatters(summary.data?.event.currency ?? "IDR");

  if (summary.isPending) return <Skeleton className="h-96 w-full" />;
  if (summary.isError) {
    if (summary.error instanceof ActionError && summary.error.code === "PASSCODE_REQUIRED") {
      return (
        <PasscodeGate
          onSubmit={(code) => verify.mutate(code)}
          pending={verify.isPending}
          error={verify.error ? tErr(errorCodeOf(verify.error)) : null}
          labels={{ title: t("gate.title"), description: t("gate.description"), passcode: t("passcode"), submit: t("gate.submit") }}
        />
      );
    }
    return (
      <Alert variant="destructive" className="mx-auto mt-8 max-w-md">
        <AlertDescription>{summary.error instanceof ActionError && summary.error.code === "NOT_FOUND" ? t("notFound") : tErr(errorCodeOf(summary.error))}</AlertDescription>
      </Alert>
    );
  }

  return (
    <SummaryView
      summary={summary.data}
      mode={mode ?? summary.data.event.settlementMode}
      onModeChange={setMode}
      money={fmt.money}
      date={fmt.date}
      onCaptureEl={setCaptureEl}
      actions={
        <>
          <Badge variant="secondary"><Eye /> {t("readOnly")}</Badge>
          <ExportActionsContainer captureEl={captureEl} name={summary.data.event.name} />
        </>
      }
    />
  );
}
