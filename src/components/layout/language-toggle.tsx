"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

/** ID / EN switch. Keeps the current page, only swaps the locale prefix. */
export function LanguageToggle() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname(); // current path without the locale prefix
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    startTransition(() => router.replace(pathname, { locale: next }));
  }

  return (
    <div role="group" aria-label={t("language")} className="flex gap-1">
      {routing.locales.map((l) => (
        <Button
          key={l}
          size="sm"
          variant={l === locale ? "default" : "ghost"}
          disabled={isPending}
          onClick={() => switchTo(l)}
          aria-pressed={l === locale}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
