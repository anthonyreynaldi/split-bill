"use client";

import { useMutation } from "@tanstack/react-query";
import type { BillDraftDto } from "@/shared/dto";
import { unwrap } from "@/shared/lib/result";
import { uploadReceipt } from "@/server/actions/ocr.actions";
import { useErrorToast } from "@/features/events/hooks/use-events";
import { compressImage } from "./compress-image";

/** Compress → upload → OCR. `onDraft` receives the (unsaved) bill draft. */
export function useOcrUpload(eventId: string, onDraft: (draft: BillDraftDto) => void) {
  const onError = useErrorToast();
  return useMutation({
    mutationFn: async (file: File) => {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.set("eventId", eventId);
      fd.set("file", blob, blob === file ? file.name : "receipt.jpg");
      return unwrap(uploadReceipt(fd));
    },
    onSuccess: onDraft,
    onError,
  });
}
