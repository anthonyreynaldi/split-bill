"use client";

import { useTranslations } from "next-intl";
import { ExportButtons } from "../components/export-buttons";
import { useExportExcel, useImageExport } from "../hooks/use-export";

/**
 * Export buttons for a summary. `eventId` enables Excel (owner only);
 * the image menu works anywhere a rendered summary element exists (also on share pages).
 */
export function ExportActionsContainer(props: { eventId?: string; captureEl: HTMLElement | null; name: string }) {
  const t = useTranslations("export");
  const excel = useExportExcel(props.eventId ?? "");
  const image = useImageExport(props.captureEl, `${props.name}-summary.png`, props.name);
  return (
    <ExportButtons
      onExcel={props.eventId ? () => excel.mutate() : undefined}
      excelPending={excel.isPending}
      image={
        props.captureEl
          ? {
              pending: image.pending,
              onOpenChange: (open) => (open ? image.prepare() : image.reset()),
              onDownload: image.download,
              onCopy: image.canCopy ? image.copy : undefined,
              onShare: image.canShare ? image.share : undefined,
            }
          : undefined
      }
      labels={{
        excel: t("excel"),
        image: t("image"),
        download: t("imageDownload"),
        copy: t("imageCopy"),
        share: t("imageShare"),
      }}
    />
  );
}
