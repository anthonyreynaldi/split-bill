"use client";

import { useTranslations } from "next-intl";
import { ExportButtons } from "../components/export-buttons";
import { useExportExcel, useExportImage } from "../hooks/use-export";

/**
 * Export buttons for a summary. `eventId` enables Excel (owner only);
 * the image works anywhere a rendered summary element exists (also on share pages).
 */
export function ExportActionsContainer(props: { eventId?: string; captureEl: HTMLElement | null; name: string }) {
  const t = useTranslations("export");
  const excel = useExportExcel(props.eventId ?? "");
  const image = useExportImage();
  return (
    <ExportButtons
      onExcel={props.eventId ? () => excel.mutate() : undefined}
      onImage={props.captureEl ? () => image.mutate({ el: props.captureEl!, filename: `${props.name}-summary.png` }) : undefined}
      excelPending={excel.isPending}
      imagePending={image.isPending}
      labels={{ excel: t("excel"), image: t("image") }}
    />
  );
}
