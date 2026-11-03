"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { BillChargeInput } from "@/shared/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MoneyInput } from "@/components/form/money-input";
import { SelectField } from "@/components/form/select-field";
import type { BillForm } from "../hooks/use-bills";

const QUICK: BillChargeInput[] = [
  { kind: "tax", mode: "percent", value: 10 },
  { kind: "service", mode: "percent", value: 5 },
  { kind: "discount", mode: "amount", value: 0 },
];

/** Tax / service / discount rows + how they are shared. */
export function BillChargesSection({ form, currency }: { form: BillForm; currency: string }) {
  const t = useTranslations("bills");

  return (
    <div className="space-y-4">
      <form.Field name="charges" mode="array">
        {(charges) => (
          <div className="space-y-2">
            {charges.state.value.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_6rem_7rem_auto] items-center gap-2">
                <form.Field name={`charges[${i}].kind`}>
                  {(f) => (
                    <SelectField
                      id={`charge-${i}-kind`}
                      value={f.state.value}
                      onChange={(v) => v && f.handleChange(v as BillChargeInput["kind"])}
                      options={(["tax", "service", "discount"] as const).map((k) => ({ value: k, label: t(`charges.${k}`) }))}
                    />
                  )}
                </form.Field>
                <form.Field name={`charges[${i}].mode`}>
                  {(f) => (
                    <SelectField
                      id={`charge-${i}-mode`}
                      value={f.state.value}
                      onChange={(v) => {
                        if (!v) return;
                        f.handleChange(v as BillChargeInput["mode"]);
                        form.setFieldValue(`charges[${i}].value`, 0);
                      }}
                      options={[
                        { value: "percent", label: "%" },
                        { value: "amount", label: t("charges.amount") },
                      ]}
                    />
                  )}
                </form.Field>
                <form.Field name={`charges[${i}].value`}>
                  {(f) =>
                    c.mode === "percent" ? (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        aria-label={t("charges.value")}
                        value={f.state.value}
                        onChange={(e) => f.handleChange(Number(e.target.value) || 0)}
                      />
                    ) : (
                      <MoneyInput aria-label={t("charges.value")} currency={currency} value={f.state.value} onChange={f.handleChange} />
                    )
                  }
                </form.Field>
                <Button type="button" variant="ghost" size="icon" aria-label={t("charges.remove")} onClick={() => charges.removeValue(i)}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <Button key={q.kind} type="button" size="sm" variant="outline" onClick={() => charges.pushValue({ ...q })}>
                  <Plus /> {t(`charges.quick.${q.kind}`)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </form.Field>

      <form.Field name="chargeSplitMode">
        {(f) => (
          <div className="space-y-2">
            <Label>{t("charges.splitMode")}</Label>
            <RadioGroup value={f.state.value} onValueChange={(v) => f.handleChange(v as "proportional" | "even")}>
              {(["proportional", "even"] as const).map((m) => (
                <div key={m} className="flex items-start gap-2">
                  <RadioGroupItem value={m} id={`csm-${m}`} />
                  <Label htmlFor={`csm-${m}`} className="flex flex-col items-start gap-0.5 font-normal">
                    <span className="font-medium">{t(`charges.${m}`)}</span>
                    <span className="text-xs text-muted-foreground">{t(`charges.${m}Hint`)}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </form.Field>
    </div>
  );
}
