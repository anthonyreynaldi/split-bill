"use client";

import { useState, type ComponentProps } from "react";
import { currencyDecimals, fromMinor, toMinor } from "@/shared/lib/money";
import { Input } from "@/components/ui/input";

/**
 * Number input for money. The value is **integer minor units** (ADR 0004);
 * the user types major units (Rp 12500 or $12.50). Pure view.
 */
export function MoneyInput({
  value,
  currency,
  onChange,
  ...props
}: {
  value: number;
  currency: string;
  onChange: (minor: number) => void;
} & Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const decimals = currencyDecimals(currency);
  // Keep what the user is typing (e.g. "12." or "") instead of re-formatting mid-edit.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      type="number"
      inputMode={decimals ? "decimal" : "numeric"}
      min={0}
      step={decimals ? 1 / 10 ** decimals : 1}
      value={draft ?? String(fromMinor(value, currency))}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== "" && Number.isFinite(n)) onChange(Math.max(0, toMinor(n, currency)));
        if (e.target.value === "") onChange(0);
      }}
      onBlur={(e) => {
        setDraft(null);
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
}
