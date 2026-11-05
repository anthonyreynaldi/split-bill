"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
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

const renderPng = async (el: HTMLElement): Promise<Blob> => {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(el, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
  if (!blob) throw new Error("render failed");
  // ClipboardItem / share need an explicit PNG type
  return blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
};

/** What this browser can do with an image. Client-only, so the server snapshot says "nothing". */
function detectImageCapabilities() {
  const copy =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof ClipboardItem !== "undefined" &&
    typeof navigator.clipboard?.write === "function";
  let share = false;
  try {
    share =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [new File([new Uint8Array(1)], "x.png", { type: "image/png" })] });
  } catch {
    share = false;
  }
  return { copy, share };
}
const NO_CAPS = { copy: false, share: false };
let capsCache: typeof NO_CAPS | undefined;
const getCaps = () => (capsCache ??= detectImageCapabilities());
const noSubscribe = () => () => {};

/**
 * Turn a rendered element (the summary card) into a PNG and **download**, **copy** it
 * to the clipboard, or **share** it with the phone's share sheet.
 *
 * Call `prepare()` when the menu opens. It starts rendering right away, so that
 * copy/share still run inside the click's user gesture (Safari requires that for
 * the clipboard, and many browsers for `navigator.share`).
 */
export function useImageExport(el: HTMLElement | null, filename: string, title: string) {
  const t = useTranslations("export");
  const onError = useErrorToast();
  const caps = useSyncExternalStore(noSubscribe, getCaps, () => NO_CAPS);
  const [pending, setPending] = useState(false);
  const cache = useRef<{ el: HTMLElement; blob: Promise<Blob> } | null>(null);

  const blobFor = (target: HTMLElement) => {
    if (cache.current?.el !== target) {
      const blob = renderPng(target);
      blob.catch(() => undefined); // avoid unhandled rejection; the action that awaits it reports
      cache.current = { el: target, blob };
    }
    return cache.current.blob;
  };

  const run = (action: (blob: Promise<Blob>) => Promise<void>) => {
    if (!el) return;
    setPending(true);
    action(blobFor(el))
      .catch(onError)
      .finally(() => setPending(false));
  };

  return {
    pending,
    canCopy: caps.copy,
    canShare: caps.share,
    /** Start rendering (menu opened). */
    prepare: () => {
      if (el) blobFor(el);
    },
    /** Forget the rendered image (menu closed), so the next export reflects current data. */
    reset: () => {
      cache.current = null;
    },
    download: () => run(async (blob) => download(await blob, filename)),
    copy: () =>
      run(async (blob) => {
        try {
          // called synchronously in the click; ClipboardItem accepts the still-rendering blob
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          toast.success(t("imageCopied"));
        } catch {
          toast.error(t("imageCopyFailed"));
        }
      }),
    share: () =>
      run(async (blob) => {
        const file = new File([await blob], filename, { type: "image/png" });
        try {
          await navigator.share({ files: [file], title });
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return; // user closed the sheet
          download(file, filename); // e.g. NotAllowedError: fall back to a download
        }
      }),
  };
}
