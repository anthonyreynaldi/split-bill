"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Receipt, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { BillPreview } from "../components/bill-preview";
import { ReceiptViewer } from "../components/receipt-viewer";
import { emptyBillValues, useBill, useBillForm, useBillPreview, useDeleteBill } from "../hooks/use-bills";
import { BillChargesSection } from "./bill-charges-section";
import { BillItemsSection } from "./bill-items-section";

/**
 * /events/[eventId]/bills/new and /events/[eventId]/bills/[billId].
 * Loads the event (people, currency) and the bill, then renders the form.
 * `draft` (from OCR) prefills a new bill. `before` renders above the form (e.g. the upload box).
 * `previewUrl` (a local object URL) shows a just-picked photo before the upload finishes.
 */
export function BillEditorContainer(props: {
  eventId: string;
  billId: string | null;
  draft?: (BillFormValues & { receiptTotal?: number | null; imageUrl?: string | null }) | null;
  before?: ReactNode;
  previewUrl?: string | null;
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
      imageUrl={bill.data?.imageUrl ?? props.previewUrl ?? props.draft?.imageUrl ?? null}
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
  const [showReceipt, setShowReceipt] = useState(false); // phones/tablets only; always shown on lg+
  const hasReceipt = !!props.imageUrl;
  const submitted = () => form.state.submissionAttempts > 0;

  return (
    <form
      noValidate
      className={cn(
        "space-y-4",
        // with a receipt, grow past the 56rem page column (up to 72rem) to fit it beside the form
        hasReceipt && "lg:mx-[calc((100%_-_min(72rem,100vw_-_2rem))/2)]",
      )}
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

      <div className={hasReceipt ? "grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "contents"}>
        {hasReceipt && (
          <aside
            className={cn(
              "flex flex-col gap-2 self-start",
              // phones: pinned edge to edge at the top while the items scroll underneath
              showReceipt && "sticky top-0 z-20 -mx-4 h-[45vh] bg-background px-4 pt-2 pb-2 shadow-md",
              "lg:sticky lg:top-4 lg:z-auto lg:mx-0 lg:h-[calc(100dvh-2rem)] lg:p-0 lg:shadow-none",
            )}
          >
            <Button
              type="button"
              variant="outline"
              className="w-full lg:hidden"
              aria-expanded={showReceipt}
              onClick={() => setShowReceipt((v) => !v)}
            >
              <Receipt /> {showReceipt ? t("receipt.hide") : t("receipt.show")}
            </Button>
            <ReceiptViewer
              src={props.imageUrl!}
              alt={t("receiptImage")}
              className={cn("flex-1", showReceipt ? "flex" : "hidden lg:flex")}
              labels={{
                zoomIn: t("receipt.zoomIn"),
                zoomOut: t("receipt.zoomOut"),
                fit: t("receipt.fit"),
                rotate: t("receipt.rotate"),
                openFull: t("receipt.openFull"),
              }}
            />
          </aside>
        )}

        <div className={cn("grid gap-4", hasReceipt ? "xl:grid-cols-[minmax(0,1fr)_18rem]" : "lg:grid-cols-[1fr_18rem]")}>
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

          <div className={cn("space-y-3", hasReceipt ? "xl:sticky xl:top-4 xl:self-start" : "lg:sticky lg:top-4 lg:self-start")}>
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
        rounding: t("rounding"),
        total: t("total"),
        perPerson: t("perPerson"),
        unassigned: (amount) => t("unassigned", { amount }),
        receiptMismatch: (receipt) => t("receiptMismatch", { receipt }),
      }}
    />
  );
}
