import { describe, expect, it } from "vitest";
import {
  BillChargeInput,
  BillItemInput,
  CreateEventInput,
  OcrResult,
  RegisterInput,
  SaveParticipantsInput,
  UpsertShareLinkInput,
} from "./index";

describe("auth DTOs", () => {
  it("normalises email and enforces password length", () => {
    expect(RegisterInput.parse({ email: "  Ana@Mail.COM ", password: "12345678" }).email).toBe("ana@mail.com");
    const r = RegisterInput.safeParse({ email: "nope", password: "123" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message).sort()).toEqual(["invalidEmail", "passwordTooShort"]);
  });
});

describe("event DTOs", () => {
  it("defaults currency to IDR and trims the name", () => {
    expect(CreateEventInput.parse({ name: "  Bali  " })).toEqual({ name: "Bali", currency: "IDR" });
  });

  it("rejects an empty name with the i18n key", () => {
    expect(CreateEventInput.safeParse({ name: "  " }).error?.issues[0].message).toBe("required");
  });

  it("validates a batch of people edits", () => {
    const eventId = "6f1c2c47-6c7e-4b8e-9a1e-2f4b8f0c1d2e";
    const ok = SaveParticipantsInput.parse({
      eventId,
      add: [" Ana ", "Budi"],
      rename: [{ participantId: eventId, name: " Citra " }],
      remove: [],
    });
    expect(ok.add).toEqual(["Ana", "Budi"]);
    expect(ok.rename[0].name).toBe("Citra");
    const bad = SaveParticipantsInput.safeParse({ eventId, add: ["  "], rename: [], remove: ["nope"] });
    expect(bad.error?.issues.map((i) => i.path.join("."))).toEqual(["add.0", "remove.0"]);
  });
});

describe("bill DTOs", () => {
  it("rejects non-integer money and zero qty", () => {
    const r = BillItemInput.safeParse({
      name: "Teh",
      qty: 0,
      unitPrice: 1.5,
      total: 3000,
      splitMode: "even",
      allocations: [],
    });
    expect(r.success).toBe(false);
  });

  it("per_unit needs a whole qty from 1 to 50 and accepts unit indexes", () => {
    const pid = "8f0c2a1e-4b5d-4c6e-9f70-1a2b3c4d5e6f";
    const base = { name: "Pizza", unitPrice: 30000, total: 60000, splitMode: "per_unit" as const };
    const ok = BillItemInput.safeParse({ ...base, qty: 2, allocations: [{ participantId: pid, units: 1, unit: 1 }] });
    expect(ok.success).toBe(true);
    expect(ok.data?.allocations[0].unit).toBe(1);
    const frac = BillItemInput.safeParse({ ...base, qty: 1.5, allocations: [] });
    expect(frac.error?.issues.map((i) => [i.path.join("."), i.message])).toEqual([["qty", "perUnitQty"]]);
    expect(BillItemInput.safeParse({ ...base, qty: 51, allocations: [] }).success).toBe(false);
    expect(
      BillItemInput.safeParse({ ...base, qty: 2, allocations: [{ participantId: pid, units: 1, unit: 0.5 }] }).success,
    ).toBe(false);
    // other modes keep accepting fractional qty
    expect(BillItemInput.safeParse({ ...base, splitMode: "even", qty: 1.5, allocations: [] }).success).toBe(true);
  });

  it("percent charges must be ≤ 100, amount charges must be integers", () => {
    expect(BillChargeInput.safeParse({ kind: "tax", mode: "percent", value: 11 }).success).toBe(true);
    expect(BillChargeInput.safeParse({ kind: "tax", mode: "percent", value: 150 }).success).toBe(false);
    expect(BillChargeInput.safeParse({ kind: "discount", mode: "amount", value: 10.5 }).success).toBe(false);
  });

  it("rounding is a signed integer amount; other kinds stay ≥ 0", () => {
    expect(BillChargeInput.safeParse({ kind: "rounding", mode: "amount", value: -200 }).success).toBe(true);
    expect(BillChargeInput.safeParse({ kind: "rounding", mode: "amount", value: 300 }).success).toBe(true);
    expect(BillChargeInput.safeParse({ kind: "rounding", mode: "amount", value: -0.5 }).success).toBe(false);
    expect(BillChargeInput.safeParse({ kind: "rounding", mode: "percent", value: 1 }).success).toBe(false);
    expect(BillChargeInput.safeParse({ kind: "tax", mode: "amount", value: -100 }).success).toBe(false);
    expect(BillChargeInput.safeParse({ kind: "discount", mode: "percent", value: -5 }).success).toBe(false);
  });
});

describe("OcrResult (lenient model output)", () => {
  it("parses numbers sent as receipt-formatted strings", () => {
    const r = OcrResult.parse({
      merchant: "Warung",
      items: [
        { name: "Nasi", qty: "2", unitPrice: "Rp 12.500", total: "25.000" },
        { name: "Es", qty: 1, unitPrice: "7,5", total: "1,234,567" },
      ],
      tax: "2.500",
    });
    expect(r.items[0]).toEqual({ name: "Nasi", qty: 2, unitPrice: 12500, total: 25000 });
    expect(r.items[1].unitPrice).toBe(7.5);
    expect(r.items[1].total).toBe(1234567);
    expect(r.tax).toBe(2500);
  });

  it("tolerates missing fields", () => {
    expect(OcrResult.parse({}).items).toEqual([]);
  });

  it("accepts null for unknown numbers and names (the prompt asks for null when unsure)", () => {
    const r = OcrResult.parse({
      merchant: null,
      date: null,
      items: [{ name: null, qty: null, unitPrice: null, total: 50000 }],
      subtotal: 163000,
      discount: null,
      service: null,
      tax: null,
      total: null,
    });
    expect(r.items[0]).toEqual({ name: "?", qty: undefined, unitPrice: undefined, total: 50000 });
    expect(r.discount).toBeUndefined();
    expect(r.subtotal).toBe(163000);
  });
});

describe("share DTOs", () => {
  it("distinguishes keep (undefined), remove (null) and set (string) passcode", () => {
    const id = "6f1c2c47-6c7e-4b8e-9a1e-2f4b8f0c1d2e";
    expect(UpsertShareLinkInput.parse({ eventId: id }).passcode).toBeUndefined();
    expect(UpsertShareLinkInput.parse({ eventId: id, passcode: null }).passcode).toBeNull();
    expect(UpsertShareLinkInput.safeParse({ eventId: id, passcode: "12" }).success).toBe(false);
    // omitted = keep the current value (a passcode change must not re-enable a disabled link)
    expect(UpsertShareLinkInput.parse({ eventId: id, showPhotos: false }).enabled).toBeUndefined();
  });
});
