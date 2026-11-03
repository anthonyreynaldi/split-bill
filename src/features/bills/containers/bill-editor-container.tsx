"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { BillFormValues, ParticipantDto } from "@/shared/dto";
import { errorCodeOf } from "@/shared/lib/result";
import { Link } from "@/i18n/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { useFieldErrors } from "@/components/form/use-field-errors";
import { useFormatters, type Formatters } from "@/components/format/use-formatters";
import { useEventDetail } from "@/features/events/hooks/use-events";
import { BillPreview } from "../components/bill-preview";
import { emptyBillValues, useBill, useBillForm, useBillPreview, useDeleteBill } from "../hooks/use-bills";
import { BillChargesSection } from "./bill-charges-section";
import { BillItemsSection } from "./bill-items-section";

/**
 * /events/[eventId]/bills/new and /events/[eventId]/bills/[billId].
 * Loads the event (people, currency) and the bill, then renders the form.
 * `draft` (from OCR) prefills a new bill. `before` renders above the form (e.g. the upload box).
 */
export function BillEditorContainer(props: {
  eventId: string;
  billId: string | null;
  draft?: (BillFormValues & { receiptTotal?: number | null; imageUrl?: string | null }) | null;
  before?: ReactNode;
}) {
  const tErr = useTranslations("errors");
  const event = useEventDetail(props.eventId);
  const bill = useBill(props.eventId, props.billId);

  const loading = event.isPending || (!!props.billId && bill.isPending);
  const error = event.error ?? bill.error;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{tErr(errorCodeOf(error))}</AlertDescription>
      </Alert>
    );
  if (loading || !event.data) return <Skeleton className="h-96 w-full" />;

  const initial: BillFormValues = bill.data ?? props.draft ?? emptyBillValues();
  return (
    <BillFormView
      // remount when the source of initial values changes (e.g. OCR draft arrives)
      key={props.billId ?? `new-${props.draft ? "draft" : "empty"}`}
      eventId={props.eventId}
      billId={props.billId}
      initial={initial}
      imageUrl={bill.data?.imageUrl ?? props.draft?.imageUrl ?? null}
      receiptTotal={props.draft?.receiptTotal ?? null}
      participants={event.data.participants}
      currency={event.data.event.currency}
      before={props.before}
    />
  );
}

function BillFormView(props: {
  eventId: string;
  billId: string | null;
  initial: BillFormValues;
  imageUrl: string | null;
  receiptTotal: number | null;
  participants: ParticipantDto[];
  currency: string;
  before?: ReactNode;
}) {
  const t = useTranslations("bills");
  const tc = useTranslations("common");
  const fieldErrors = useFieldErrors();
  const fmt = useFormatters(props.currency);
  const { form } = useBillForm({ eventId: props.eventId, billId: props.billId, initial: props.initial });
  const del = useDeleteBill(props.eventId, props.billId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const submitted = () => form.state.submissionAttempts > 0;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="flex items-center gap-2">
        <Link href={`/events/${props.eventId}`} className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={tc("back")}>
          <ArrowLeft />
        </Link>
        <h1 className="flex-1 text-xl font-semibold">{props.billId ? t("editTitle") : t("newTitle")}</h1>
        {props.billId && (
          <Button type="button" variant="ghost" size="icon" aria-label={t("delete")} onClick={() => setConfirmDelete(true)}>
            <Trash2 />
          </Button>
        )}
      </div>

      {props.before}

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 sm:grid-cols-[1fr_10rem]">
              <form.Field name="title">
                {(f) => (
                  <TextField
                    id="bill-title"
                    label={t("title")}
                    placeholder={t("titlePlaceholder")}
                    value={f.state.value}
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    errors={fieldErrors(f.state.meta, submitted())}
                  />
                )}
              </form.Field>
              <form.Field name="billDate">
                {(f) => (
                  <TextField
                    id="bill-date"
                    type="date"
                    label={t("date")}
                    value={f.state.value ?? ""}
                    onChange={(v) => f.handleChange(v || null)}
                  />
                )}
              </form.Field>
              <form.Field name="paidBy">
                {(f) => (
                  <SelectField
                    id="bill-paid-by"
                    className="sm:col-span-2"
                    label={t("paidBy")}
                    placeholder={t("paidByPlaceholder")}
                    value={f.state.value}
                    onChange={f.handleChange}
                    options={props.participants.map((p) => ({ value: p.id, label: p.name }))}
                  />
                )}
              </form.Field>
            </CardContent>
          </Card>

          {props.imageUrl && (
            <Card>
              <CardContent>
                {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                <img src={props.imageUrl} alt={t("receiptImage")} className="mx-auto max-h-96 rounded-md object-contain" />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("items.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <BillItemsSection form={form} participants={props.participants} currency={props.currency} fmt={fmt} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("charges.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <BillChargesSection form={form} currency={props.currency} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardContent>
              <form.Subscribe selector={(s) => s.values}>
                {(values) => (
                  <LivePreview values={values} participants={props.participants} fmt={fmt} receiptTotal={props.receiptTotal} />
                )}
              </form.Subscribe>
            </CardContent>
          </Card>
          <form.Subscribe selector={(s) => [s.isSubmitting, s.submissionAttempts > 0 && !s.isValid] as const}>
            {([busy, invalid]) => (
              <>
                {invalid && (
                  <Alert variant="destructive">
                    <AlertDescription>{t("fixErrors")}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? tc("loading") : tc("save")}
                </Button>
              </>
            )}
          </form.Subscribe>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        pending={del.isPending}
        onConfirm={() => del.mutate()}
      />
    </form>
  );
}

/** Separate component so the preview hook re-runs only when values change. */
function LivePreview(props: {
  values: BillFormValues;
  participants: ParticipantDto[];
  fmt: Formatters;
  receiptTotal: number | null;
}) {
  const t = useTranslations("bills.preview");
  const ids = props.participants.map((p) => p.id);
  const calc = useBillPreview(props.values, ids);
  if (!calc) return null;
  return (
    <BillPreview
      calc={calc}
      participants={props.participants}
      money={props.fmt.money}
      receiptTotal={props.receiptTotal}
      labels={{
        title: t("title"),
        subtotal: t("subtotal"),
        discount: t("discount"),
        service: t("service"),
        tax: t("tax"),
        total: t("total"),
        perPerson: t("perPerson"),
        unassigned: (amount) => t("unassigned", { amount }),
        receiptMismatch: (receipt) => t("receiptMismatch", { receipt }),
      }}
    />
  );
}
