import ExcelJS from "exceljs";
import type { SummaryDto } from "@/shared/dto";
import { currencyDecimals, fromMinor } from "@/shared/lib/money";

/** Translated column/sheet labels, resolved by the action for the user's locale. */
export interface XlsxLabels {
  sheets: { people: string; transfers: string; items: string; bills: string };
  person: string;
  consumed: string;
  paid: string;
  balance: string;
  from: string;
  to: string;
  amount: string;
  bill: string;
  item: string;
  portions: string;
  date: string;
  paidBy: string;
  subtotal: string;
  discount: string;
  service: string;
  tax: string;
  total: string;
  mode: string;
}

/**
 * Build the summary workbook (4 sheets). Money cells are real numbers in
 * major units with a currency number format, so totals can be re-summed in Excel.
 */
export async function buildSummaryXlsx(s: SummaryDto, l: XlsxLabels): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Split Bill";
  const cur = s.event.currency;
  const fmt = `#,##0${currencyDecimals(cur) ? "." + "0".repeat(currencyDecimals(cur)) : ""} "${cur}"`;
  const m = (minor: number) => fromMinor(minor, cur);
  const name = (id: string | null) => s.participants.find((p) => p.id === id)?.name ?? "";
  const title = (id?: string) => s.bills.find((b) => b.id === id)?.title ?? "";

  const sheet = (label: string, cols: { header: string; key: string; width: number; money?: boolean }[]) => {
    const ws = wb.addWorksheet(label.slice(0, 31));
    ws.columns = cols.map((c) => ({ header: c.header, key: c.key, width: c.width, style: c.money ? { numFmt: fmt } : {} }));
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    return ws;
  };

  const people = sheet(l.sheets.people, [
    { header: l.person, key: "name", width: 24 },
    { header: l.consumed, key: "owed", width: 16, money: true },
    { header: l.paid, key: "paid", width: 16, money: true },
    { header: l.balance, key: "balance", width: 16, money: true },
  ]);
  for (const p of s.people) people.addRow({ name: name(p.participantId), owed: m(p.owed), paid: m(p.paid), balance: m(p.balance) });

  const transfers = sheet(l.sheets.transfers, [
    { header: l.from, key: "from", width: 20 },
    { header: l.to, key: "to", width: 20 },
    { header: l.amount, key: "amount", width: 16, money: true },
    { header: l.bill, key: "bill", width: 28 },
  ]);
  const list = s.event.settlementMode === "nett" ? s.nettTransfers : s.perBillTransfers;
  for (const x of list) transfers.addRow({ from: name(x.from), to: name(x.to), amount: m(x.amount), bill: x.billId ? title(x.billId) : undefined });
  transfers.addRow({});
  transfers.addRow({ from: `${l.mode}: ${s.event.settlementMode}` });

  const items = sheet(l.sheets.items, [
    { header: l.bill, key: "bill", width: 28 },
    { header: l.person, key: "person", width: 20 },
    { header: l.item, key: "item", width: 28 },
    { header: l.portions, key: "units", width: 10 },
    { header: l.amount, key: "amount", width: 16, money: true },
  ]);
  for (const b of s.bills)
    for (const p of b.perPerson) {
      for (const it of p.items) items.addRow({ bill: b.title, person: name(p.participantId), item: it.name, units: it.units, amount: m(it.amount) });
      const extra = p.service + p.tax - p.discount;
      if (extra) items.addRow({ bill: b.title, person: name(p.participantId), item: `${l.service} + ${l.tax} − ${l.discount}`, amount: m(extra) });
    }

  const bills = sheet(l.sheets.bills, [
    { header: l.bill, key: "title", width: 28 },
    { header: l.date, key: "date", width: 12 },
    { header: l.paidBy, key: "paidBy", width: 20 },
    { header: l.subtotal, key: "subtotal", width: 14, money: true },
    { header: l.discount, key: "discount", width: 14, money: true },
    { header: l.service, key: "service", width: 14, money: true },
    { header: l.tax, key: "tax", width: 14, money: true },
    { header: l.total, key: "total", width: 16, money: true },
  ]);
  for (const b of s.bills)
    bills.addRow({
      title: b.title,
      date: b.billDate ?? "",
      paidBy: name(b.paidBy),
      subtotal: m(b.subtotal),
      discount: m(b.discount),
      service: m(b.service),
      tax: m(b.tax),
      total: m(b.total),
    });
  const totalRow = bills.addRow({ title: l.total, total: m(s.grandTotal) });
  totalRow.font = { bold: true };

  return new Uint8Array(await wb.xlsx.writeBuffer());
}
