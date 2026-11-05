"use server";
/**
 * Export Server Actions. Documented in docs/server-actions.md#export.
 * (The PNG export happens in the browser; see features/export/hooks.)
 *
 * @module
 */
import { getTranslations } from "next-intl/server";
import { ExportExcelInput, type FileDto } from "@/shared/dto";
import { getContainer } from "../container";
import { buildSummaryXlsx } from "../exports/summary-xlsx";
import { defineAction, requireUserId } from "./_lib/define-action";

/**
 * The event summary as an .xlsx workbook (People, Transfers, Items, Bills).
 * Errors: `UNAUTHORIZED`, `NOT_FOUND`.
 */
export const exportSummaryExcel = defineAction(ExportExcelInput, async ({ eventId, locale }): Promise<FileDto> => {
  const summary = await getContainer().services.summary.get(await requireUserId(), eventId);
  const t = await getTranslations({ locale, namespace: "export.xlsx" });
  const bytes = await buildSummaryXlsx(summary, {
    sheets: { people: t("sheets.people"), transfers: t("sheets.transfers"), items: t("sheets.items"), bills: t("sheets.bills") },
    person: t("person"),
    consumed: t("consumed"),
    paid: t("paid"),
    balance: t("balance"),
    from: t("from"),
    to: t("to"),
    amount: t("amount"),
    bill: t("bill"),
    item: t("item"),
    portions: t("portions"),
    date: t("date"),
    paidBy: t("paidBy"),
    subtotal: t("subtotal"),
    discount: t("discount"),
    service: t("service"),
    tax: t("tax"),
    rounding: t("rounding"),
    total: t("total"),
    mode: t("mode"),
  });
  return {
    filename: `${slugify(summary.event.name)}-summary.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: Buffer.from(bytes).toString("base64"),
  };
});

function slugify(s: string) {
  return s.normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "split-bill";
}
