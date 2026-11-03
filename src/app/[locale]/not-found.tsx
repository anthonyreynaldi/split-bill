import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <div className="mt-16 flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">{t("notFound")}</h1>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        {t("backHome")}
      </Link>
    </div>
  );
}
