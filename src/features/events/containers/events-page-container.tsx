"use client";

import { useTranslations } from "next-intl";
import { SUPPORTED_CURRENCIES } from "@/shared/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { useFieldErrors } from "@/components/form/use-field-errors";
import { useFormatters } from "@/components/format/use-formatters";
import { EventList } from "../components/event-list";
import { useCreateEventForm, useEvents } from "../hooks/use-events";

/** /events: my events + "new event" form. */
export function EventsPageContainer() {
  const t = useTranslations("events");
  const fieldErrors = useFieldErrors();
  const events = useEvents();
  const { form } = useCreateEventForm();
  const fmt = useFormatters("IDR");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("new.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <TextField
                  id="event-name"
                  label={t("new.name")}
                  placeholder={t("new.namePlaceholder")}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={fieldErrors(field.state.meta, form.state.submissionAttempts > 0)}
                />
              )}
            </form.Field>
            <form.Field name="currency">
              {(field) => (
                <SelectField
                  id="event-currency"
                  label={t("new.currency")}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v ?? "IDR")}
                  options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
              )}
            </form.Field>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(busy) => (
                <Button type="submit" disabled={busy}>
                  {t("new.submit")}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h1 className="text-xl font-semibold">{t("list.title")}</h1>
        {events.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <EventList
            events={events.data ?? []}
            formatDate={(iso) => fmt.date(iso)}
            labels={{
              empty: t("list.empty"),
              people: (n) => t("list.people", { count: n }),
              bills: (n) => t("list.bills", { count: n }),
            }}
          />
        )}
      </section>
    </div>
  );
}
