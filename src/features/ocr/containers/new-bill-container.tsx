"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { BillDraftDto } from "@/shared/dto";
import { BillEditorContainer } from "@/features/bills/containers/bill-editor-container";
import { ReceiptUpload } from "../components/receipt-upload";
import { useOcrUpload } from "../hooks/use-ocr-upload";

/** /events/[eventId]/bills/new: optional receipt upload above the bill editor. */
export function NewBillContainer({ eventId }: { eventId: string }) {
  const t = useTranslations("ocr");
  const [draft, setDraft] = useState<BillDraftDto | null>(null);
  const upload = useOcrUpload(eventId, setDraft);
  // The picked photo, shown at once while it uploads and is read.
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <BillEditorContainer
      // a new draft remounts the form with the OCR values
      key={draft?.imagePath ?? "empty"}
      eventId={eventId}
      billId={null}
      draft={draft}
      previewUrl={upload.isPending ? preview : null}
      before={
        <ReceiptUpload
          onFile={(f) => {
            setPreview(URL.createObjectURL(f));
            upload.mutate(f);
          }}
          pending={upload.isPending}
          status={draft?.ocrStatus ?? null}
          model={draft?.ocrModel ?? null}
          labels={{
            takePhoto: t("takePhoto"),
            chooseFile: t("chooseFile"),
            hint: t("hint"),
            reading: t("reading"),
            privacy: t("privacy"),
            status: { ok: t("status.ok"), failed: t("status.failed"), disabled: t("status.disabled") },
            readBy: (model) => t("readBy", { model }),
          }}
        />
      }
    />
  );
}
