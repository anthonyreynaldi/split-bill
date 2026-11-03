"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { FileDto } from "@/shared/dto";
import { unwrap } from "@/shared/lib/result";
import { exportSummaryExcel } from "@/server/actions/export.actions";
import { useErrorToast } from "@/features/events/hooks/use-events";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fromBase64 = (f: FileDto) =>
  new Blob([Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0))], { type: f.mimeType });

/** Download the summary as Excel (built on the server). */
export function useExportExcel(eventId: string) {
  const locale = useLocale() as "id" | "en";
  const onError = useErrorToast();
  return useMutation({
    mutationFn: () => unwrap(exportSummaryExcel({ eventId, locale })),
    onSuccess: (file) => download(fromBase64(file), file.filename),
    onError,
  });
}

/** Download an element as PNG (rendered in the browser, 2× for sharp text). */
export function useExportImage() {
  const onError = useErrorToast();
  return useMutation({
    mutationFn: async ({ el, filename }: { el: HTMLElement; filename: string }) => {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(el, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
      if (!blob) throw new Error("render failed");
      download(blob, filename);
    },
    onError,
  });
}
