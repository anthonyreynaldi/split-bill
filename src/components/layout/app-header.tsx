import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageToggle } from "./language-toggle";

/** Top bar shown on every page. App-shell component (not a feature). */
export function AppHeader() {
  const t = useTranslations("common");
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          {t("appName")}
        </Link>
        <LanguageToggle />
      </div>
    </header>
  );
}
