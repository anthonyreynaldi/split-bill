import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import type { SummaryDto } from "@/shared/dto";
import { buildSummaryXlsx, type XlsxLabels } from "./summary-xlsx";

const labels = new Proxy({} as XlsxLabels, {
  get: (_, k) => (k === "sheets" ? { people: "People", transfers: "Transfers", items: "Items", bills: "Bills" } : String(k)),
});

const summary: SummaryDto = {
  event: { name: "Trip", currency: "IDR", settlementMode: "nett" },
  participants: [
    { id: "a", name: "Ana" },
    { id: "b", name: "Budi" },
  ],
  bills: [
    {
      id: "b1",
      title: "Lunch",
      billDate: "2026-11-03",
      paidBy: "a",
      subtotal: 20000,
      discount: 0,
      service: 0,
      tax: 2000,
      total: 22000,
      unassigned: 0,
      perPerson: [
        { participantId: "a", items: [{ itemId: "i", name: "Soto", units: 1, amount: 10000 }], subtotal: 10000, discount: 0, service: 0, tax: 1000, total: 11000 },
        { participantId: "b", items: [{ itemId: "i", name: "Soto", units: 1, amount: 10000 }], subtotal: 10000, discount: 0, service: 0, tax: 1000, total: 11000 },
      ],
    },
  ],
  people: [
    { participantId: "a", owed: 11000, paid: 22000, balance: 11000 },
    { participantId: "b", owed: 11000, paid: 0, balance: -11000 },
  ],
  perBillTransfers: [{ from: "b", to: "a", amount: 11000, billId: "b1" }],
  nettTransfers: [{ from: "b", to: "a", amount: 11000 }],
  billsWithoutPayer: [],
  unassigned: 0,
  grandTotal: 22000,
};

describe("buildSummaryXlsx", () => {
  it("writes 4 sheets with numeric money cells", async () => {
    const bytes = await buildSummaryXlsx(summary, labels);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(bytes.buffer as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(["People", "Transfers", "Items", "Bills"]);
    const people = wb.getWorksheet("People")!;
    expect(people.getRow(2).values).toEqual([, "Ana", 11000, 22000, 11000]);
    expect(wb.getWorksheet("Transfers")!.getRow(2).values).toEqual([, "Budi", "Ana", 11000]);
    const items = wb.getWorksheet("Items")!;
    expect(items.rowCount).toBe(1 + 4); // header + (item + tax row) × 2 people
    expect(wb.getWorksheet("Bills")!.getRow(3).getCell(8).value).toBe(22000);
  });
});
