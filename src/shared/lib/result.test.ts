import { describe, expect, it } from "vitest";
import { ActionError, errorCodeOf, fail, ok, unwrap } from "./result";

describe("unwrap", () => {
  it("returns data for ok results", async () => {
    await expect(unwrap(ok(42))).resolves.toBe(42);
  });

  it("throws ActionError with the code for failures", async () => {
    const err = await unwrap(fail("NOT_FOUND")).catch((e) => e);
    expect(err).toBeInstanceOf(ActionError);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("keeps field errors", async () => {
    const err = await unwrap(
      Promise.resolve(fail("VALIDATION_ERROR", { name: ["Required"] })),
    ).catch((e) => e);
    expect(err.fieldErrors).toEqual({ name: ["Required"] });
  });
});

describe("errorCodeOf", () => {
  it("maps unknown errors to INTERNAL_ERROR", () => {
    expect(errorCodeOf(new Error("boom"))).toBe("INTERNAL_ERROR");
    expect(errorCodeOf(new ActionError("FORBIDDEN"))).toBe("FORBIDDEN");
  });
});
