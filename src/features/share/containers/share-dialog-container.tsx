"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SharePanel } from "../components/share-panel";
import { useShareLink, useUpsertShareLink } from "../hooks/use-share";

/** "Share" button + dialog on the owner's summary page. */
export function ShareDialogContainer({ eventId }: { eventId: string }) {
  const t = useTranslations("share");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const link = useShareLink(eventId, open);
  const upsert = useUpsertShareLink(eventId);
  const url = link.data ? `${window.location.origin}/${locale}/s/${link.data.slug}` : null;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Share2 /> {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          {link.isPending ? null : (
            <SharePanel
              url={url}
              enabled={link.data?.enabled ?? true}
              hasPasscode={link.data?.hasPasscode ?? false}
              showPhotos={link.data?.showPhotos ?? true}
              pending={upsert.isPending}
              onCreate={() => upsert.mutate({})}
              onEnabledChange={(enabled) => upsert.mutate({ enabled })}
              onShowPhotosChange={(showPhotos) => upsert.mutate({ showPhotos })}
              onSetPasscode={(passcode) => upsert.mutate({ passcode })}
              onRemovePasscode={() => upsert.mutate({ passcode: null })}
              labels={{
                create: t("create"), intro: t("intro"), enabled: t("enabled"), copy: t("copy"), copied: t("copied"),
                passcode: t("passcode"), passcodeOn: t("passcodeOn"), passcodeOff: t("passcodeOff"),
                setPasscode: t("setPasscode"), removePasscode: t("removePasscode"), passcodeHint: t("passcodeHint"),
                showPhotos: t("showPhotos"), showPhotosHint: t("showPhotosHint"),
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
