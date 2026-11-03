import type { ComponentProps } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Already-translated error messages. */
  errors?: string[];
} & Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange" | "onBlur">;

/** Labelled input + error list. Pure view: no form library inside. */
export function TextField({ id, label, value, onChange, onBlur, errors, ...inputProps }: TextFieldProps) {
  const invalid = !!errors?.length;
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        {...inputProps}
      />
      <FieldError errors={errors?.map((message) => ({ message }))} />
    </Field>
  );
}
