import { describe, expect, it } from "vitest";
import { fakeHasher } from "../auth/password";
import type { OcrProvider } from "../providers/ocr/ocr-provider";
import { createMemoryRepositories } from "../repositories/memory";
import { createServices } from "./index";

const jpeg = { data: new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]), contentType: "image/jpeg" };

async function setup(ocr: OcrProvider | null) {
  const repos = createMemoryRepositories();
  const services = createServices({ repos, hasher: fakeHasher, ocr });
  const user = await services.auth.register({ email: "a@b.co", password: "secret123" });
  const event = await services.events.create(user.id, { name: "Trip" });
  return { repos, services, user, event };
}

describe("OcrService", () => {
  it("stores the image and returns a prefilled draft", async () => {
    const provider: OcrProvider = {
      extract: async () => ({
        data: { merchant: "Warung", items: [{ name: "Nasi", qty: 2, unitPrice: 20000 }], tax: 4000, total: 44000 },
        model: "b:free",
      }),
    };
    const { services, user, event } = await setup(provider);
    const d = await services.ocr.uploadAndExtract(user.id, event.id, jpeg);
    expect(d).toMatchObject({
      ocrStatus: "ok",
      ocrModel: "b:free",
      title: "Warung",
      receiptTotal: 44000,
      items: [{ name: "Nasi", qty: 2, total: 40000 }],
      charges: [{ kind: "tax", mode: "amount", value: 4000 }],
    });
    expect(d.imagePath).toMatch(new RegExp(`^${event.id}/.+\\.jpg$`));
    expect(d.imageUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("keeps the image and returns an empty draft when OCR fails or returns junk", async () => {
    const extracts: OcrProvider["extract"][] = [
      async () => {
        throw new Error("rate limited");
      },
      async () => ({ data: { hello: "world" }, model: "a:free" }),
      async () => ({ data: { items: [] }, model: "a:free" }),
    ];
    for (const extract of extracts) {
      const { services, user, event } = await setup({ extract });
      const d = await services.ocr.uploadAndExtract(user.id, event.id, jpeg);
      expect(d).toMatchObject({ ocrStatus: "failed", ocrModel: null, items: [], title: "" });
      expect(d.imagePath).toBeTruthy();
    }
  });

  it("reports disabled when no provider is configured", async () => {
    const { services, user, event } = await setup(null);
    expect((await services.ocr.uploadAndExtract(user.id, event.id, jpeg)).ocrStatus).toBe("disabled");
  });

  it("rejects wrong types, huge files, and other users' events", async () => {
    const { services, user, event } = await setup(null);
    await expect(
      services.ocr.uploadAndExtract(user.id, event.id, { data: new Uint8Array(5), contentType: "application/pdf" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(
      services.ocr.uploadAndExtract(user.id, event.id, { data: new Uint8Array(6 * 1024 * 1024), contentType: "image/png" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    const other = await services.auth.register({ email: "x@b.co", password: "secret123" });
    await expect(services.ocr.uploadAndExtract(other.id, event.id, jpeg)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
