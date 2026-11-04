"use client";
/**
 * Bill editor view logic: load, form, save/delete, and the live preview.
 */
import { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BillFormValues, type BillItemInput } from "@/shared/dto";
import { unwrap } from "@/shared/lib/result";
import { calculateBill } from "@/domain/bill-calc";
import type { Bill } from "@/domain/types";
import { createBill, deleteBill, getBill, updateBill } from "@/server/actions/bills.actions";
import { useRouter } from "@/i18n/navigation";
import { eventKeys, useErrorToast } from "@/features/events/hooks/use-events";

export const billKeys = {
  detail: (eventId: string, billId: string) => [...eventKeys.detail(eventId), "bills", billId] as const,
};

/** Today as YYYY-MM-DD in the browser's timezone. */
const today = () => new Date().toLocaleDateString("en-CA");

/** Values for a brand-new bill. */
export function emptyBillValues(): BillFormValues {
  return {
    title: "",
    billDate: today(),
    paidBy: null,
    imagePath: null,
    chargeSplitMode: "proportional",
    items: [],
    charges: [],
  };
}

export const emptyItem = (): BillItemInput => ({
  name: "",
  qty: 1,
  unitPrice: 0,
  total: 0,
  splitMode: "even",
  allocations: [],
});

export function useBill(eventId: string, billId: string | null) {
  return useQuery({
    queryKey: billKeys.detail(eventId, billId ?? "new"),
    queryFn: () => unwrap(getBill({ eventId, billId: billId! })),
    enabled: !!billId,
  });
}

/**
 * Drop allocations that don't belong to the item's split mode before saving:
 * per-unit ticks for units beyond the current qty (qty was lowered), and the
 * `unit` field on non-per-unit items.
 */
export function cleanAllocations(values: BillFormValues): BillFormValues {
  return {
    ...values,
    items: values.items.map((it) => ({
      ...it,
      allocations:
        it.splitMode === "per_unit"
          ? it.allocations.filter((a) => a.unit !== undefined && a.unit < it.qty)
          : it.allocations.map(({ participantId, units }) => ({ participantId, units })),
    })),
  };
}

/** The bill form. `billId === null` creates, otherwise replaces. Goes back to the event after saving. */
export function useBillForm(opts: { eventId: string; billId: string | null; initial: BillFormValues }) {
  const qc = useQueryClient();
  const router = useRouter();
  const onError = useErrorToast();
  const save = useMutation({
    mutationFn: (raw: BillFormValues) => {
      const values = cleanAllocations(raw);
      return unwrap(
        opts.billId
          ? updateBill({ eventId: opts.eventId, billId: opts.billId, ...values })
          : createBill({ eventId: opts.eventId, ...values }),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(opts.eventId) });
      router.push(`/events/${opts.eventId}`);
    },
    onError,
  });
  const form = useForm({
    defaultValues: opts.initial,
    validators: { onSubmit: BillFormValues },
    onSubmit: ({ value }) => save.mutateAsync(value).catch(() => undefined),
  });
  return { form, save };
}

export type BillForm = ReturnType<typeof useBillForm>["form"];

export function useDeleteBill(eventId: string, billId: string | null) {
  const qc = useQueryClient();
  const router = useRouter();
  const onError = useErrorToast();
  return useMutation({
    mutationFn: () => unwrap(deleteBill({ eventId, billId: billId! })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      router.push(`/events/${eventId}`);
    },
    onError,
  });
}

/**
 * Run the real domain calculation on the form values, so the preview always
 * matches what the server will compute (same pure function).
 */
export function useBillPreview(values: BillFormValues, participantIds: string[]) {
  return useMemo(() => {
    const bill: Bill = {
      id: "preview",
      eventId: "preview",
      createdAt: "",
      ...values,
      items: values.items.map((it, i) => ({ ...it, id: String(i), qty: it.qty || 0, total: it.total || 0 })),
      charges: values.charges.map((c, i) => ({ ...c, id: String(i), value: c.value || 0 })),
    };
    try {
      return calculateBill(bill, participantIds);
    } catch {
      return null; // half-typed values (e.g. a fractional rupiah); the form validator reports it
    }
  }, [values, participantIds]);
}
