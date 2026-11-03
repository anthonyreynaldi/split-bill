"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { errorCodeOf } from "@/shared/lib/result";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/text-field";
import { useFieldErrors } from "@/components/form/use-field-errors";
import { AuthCard } from "../components/auth-card";
import { useAuthForm } from "../hooks/use-auth";

/** Login or register page content: wires the form hook to the views. */
export function AuthFormContainer({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const tErr = useTranslations("errors");
  const fieldErrors = useFieldErrors();
  const { form, mutation } = useAuthForm(mode);

  return (
    <AuthCard
      title={t(`${mode}.title`)}
      description={t(`${mode}.description`)}
      error={mutation.error ? tErr(errorCodeOf(mutation.error)) : null}
      footer={
        <span>
          {t(`${mode}.switchPrompt`)}{" "}
          <Link href={mode === "login" ? "/register" : "/login"} className="font-medium text-primary underline">
            {t(`${mode}.switchLink`)}
          </Link>
        </span>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <TextField
              id="email"
              type="email"
              autoComplete="email"
              label={t("email")}
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              errors={fieldErrors(field.state.meta, form.state.submissionAttempts > 0)}
            />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <TextField
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              label={t("password")}
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              errors={fieldErrors(field.state.meta, form.state.submissionAttempts > 0)}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("submitting") : t(`${mode}.submit`)}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}
