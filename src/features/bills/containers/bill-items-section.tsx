"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { ParticipantDto } from "@/shared/dto";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/form/money-input";
import { useFieldErrors } from "@/components/form/use-field-errors";
import type { Formatters } from "@/components/format/use-formatters";
import { AllocationEditor } from "../components/allocation-editor";
import { emptyItem, type BillForm } from "../hooks/use-bills";

/** The item rows of the bill form (TanStack array field). */
export function BillItemsSection(props: {
  form: BillForm;
  participants: ParticipantDto[];
  currency: string;
  fmt: Formatters;
}) {
  const { form, participants, currency, fmt } = props;
  const t = useTranslations("bills");
  const fieldErrors = useFieldErrors();
  const submitted = () => form.state.submissionAttempts > 0;

  return (
    <form.Field name="items" mode="array">
      {(itemsField) => (
        // container query: rows follow the card's width, which is narrow next to the receipt
        <div className="@container space-y-3">
          {itemsField.state.value.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("items.empty")}</p>
          )}
          {itemsField.state.value.map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border bg-background p-3">
              <div className="grid grid-cols-2 gap-2 @md:grid-cols-[1fr_4.5rem_7rem_7rem_auto] @md:items-start">
                <form.Field name={`items[${i}].name`}>
                  {(f) => (
                    <Field className="col-span-2 @md:col-span-1">
                      <FieldLabel htmlFor={`item-${i}-name`}>{t("items.name")}</FieldLabel>
                      <Input
                        id={`item-${i}-name`}
                        value={f.state.value}
                        onChange={(e) => f.handleChange(e.target.value)}
                        onBlur={f.handleBlur}
                      />
                      <FieldError errors={fieldErrors(f.state.meta, submitted()).map((message) => ({ message }))} />
                    </Field>
                  )}
                </form.Field>
                <form.Field
                  name={`items[${i}].qty`}
                  listeners={{
                    onChange: ({ value }) =>
                      form.setFieldValue(`items[${i}].total`, Math.round((value || 0) * form.getFieldValue(`items[${i}].unitPrice`))),
                  }}
                >
                  {(f) => (
                    <Field>
                      <FieldLabel htmlFor={`item-${i}-qty`}>{t("items.qty")}</FieldLabel>
                      <Input
                        id={`item-${i}-qty`}
                        type="number"
                        min={0}
                        step="any"
                        value={Number.isFinite(f.state.value) ? f.state.value : ""}
                        onChange={(e) => f.handleChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                      <FieldError errors={fieldErrors(f.state.meta, submitted()).map((message) => ({ message }))} />
                    </Field>
                  )}
                </form.Field>
                <form.Field
                  name={`items[${i}].unitPrice`}
                  listeners={{
                    onChange: ({ value }) =>
                      form.setFieldValue(`items[${i}].total`, Math.round(value * (form.getFieldValue(`items[${i}].qty`) || 0))),
                  }}
                >
                  {(f) => (
                    <Field>
                      <FieldLabel htmlFor={`item-${i}-price`}>{t("items.unitPrice")}</FieldLabel>
                      <MoneyInput id={`item-${i}-price`} currency={currency} value={f.state.value} onChange={f.handleChange} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name={`items[${i}].total`}>
                  {(f) => (
                    <Field>
                      <FieldLabel htmlFor={`item-${i}-total`}>{t("items.total")}</FieldLabel>
                      <MoneyInput id={`item-${i}-total`} currency={currency} value={f.state.value} onChange={f.handleChange} />
                    </Field>
                  )}
                </form.Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="justify-self-end @md:mt-6"
                  aria-label={t("items.remove")}
                  onClick={() => itemsField.removeValue(i)}
                >
                  <Trash2 />
                </Button>
              </div>

              <form.Subscribe
                selector={(s) => ({
                  qty: s.values.items[i]?.qty ?? 0,
                  splitMode: s.values.items[i]?.splitMode ?? "even",
                  allocations: s.values.items[i]?.allocations ?? [],
                })}
              >
                {({ qty, splitMode, allocations }) => (
                  <AllocationEditor
                    idPrefix={`item-${i}`}
                    participants={participants}
                    qty={qty}
                    splitMode={splitMode}
                    allocations={allocations}
                    onModeChange={(m) => {
                      // custom portions and per-unit ticks mean different things: never mix them
                      if ((m === "per_unit") !== (splitMode === "per_unit")) form.setFieldValue(`items[${i}].allocations`, []);
                      form.setFieldValue(`items[${i}].splitMode`, m);
                    }}
                    onAllocationsChange={(a) => form.setFieldValue(`items[${i}].allocations`, a)}
                    format={fmt.number}
                    labels={{
                      even: t("split.even"),
                      custom: t("split.custom"),
                      perUnit: t("split.perUnit"),
                      perUnitHint: t("split.perUnitHint"),
                      unit: (n) => t("split.unit", { n }),
                      everyone: t("split.allOnUnit"),
                      portions: t("split.portions"),
                      assigned: (a, q) => t("split.assigned", { assigned: a, qty: q }),
                      unitsAssigned: (a, q) => t("split.unitsAssigned", { assigned: a, total: q }),
                      nobody: t("split.nobody"),
                      noPeople: t("split.noPeople"),
                    }}
                  />
                )}
              </form.Subscribe>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => itemsField.pushValue(emptyItem())}>
            <Plus /> {t("items.add")}
          </Button>
        </div>
      )}
    </form.Field>
  );
}
