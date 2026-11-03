import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Landing page (public). */
export default function HomePage() {
  const t = useTranslations();
  const features = ["feature1", "feature2", "feature3", "feature4"] as const;

  return (
    <Card className="mx-auto mt-8 max-w-xl">
      <CardHeader>
        <CardTitle className="text-3xl">{t("common.appName")}</CardTitle>
        <p className="text-muted-foreground">{t("common.tagline")}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              {t(`home.${key}`)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
