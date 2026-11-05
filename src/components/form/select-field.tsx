"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SelectOption = { value: string; label: string };

/** Labelled select. Pure view. `value: null` shows the placeholder. */
export function SelectField(props: {
  id: string;
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  errors?: string[];
  className?: string;
  disabled?: boolean;
}) {
  const invalid = !!props.errors?.length;
  return (
    <Field data-invalid={invalid || undefined} className={props.className}>
      {props.label && <FieldLabel htmlFor={props.id}>{props.label}</FieldLabel>}
      <Select
        value={props.value}
        onValueChange={(v) => props.onChange((v as string | null) ?? null)}
        items={props.options}
        disabled={props.disabled}
      >
        <SelectTrigger id={props.id} className="w-full" aria-invalid={invalid || undefined}>
          <SelectValue placeholder={props.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError errors={props.errors?.map((message) => ({ message }))} />
    </Field>
  );
}
