"use client";

import { useTranslations } from "next-intl";

/**
 * Translate TanStack Form field errors. With zod (Standard Schema) validators,
 * each error is an issue whose `message` is an i18n key from `VALIDATION`.
 * Only shows errors after the field was touched or the form was submitted.
 */
export function useFieldErrors() {
  const t = useTranslations("validation");
  return (meta: { errors: unknown[]; isTouched: boolean }, submitted: boolean): string[] => {
    if (!meta.isTouched && !submitted) return [];
    return meta.errors
      .map((e) => (typeof e === "string" ? e : (e as { message?: string } | undefined)?.message))
      .filter((m): m is string => !!m)
      .map((key) => (t.has(key) ? t(key) : key));
  };
}
