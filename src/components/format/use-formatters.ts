"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import { formatMoney } from "@/shared/lib/money";

/** Locale-aware money and date formatting for views. Money is integer minor units. */
export function useFormatters(currency: string) {
  const locale = useLocale();
  return useMemo(
    () => ({
      money: (minor: number) => formatMoney(minor, currency, locale),
      date: (iso: string | null) =>
        iso ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso)) : "",
      number: (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n),
    }),
    [currency, locale],
  );
}

export type Formatters = ReturnType<typeof useFormatters>;
