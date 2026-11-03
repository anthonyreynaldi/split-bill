import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import id from "../../messages/id.json";
import { ERROR_CODES } from "@/shared/lib/result";
import { VALIDATION } from "@/shared/dto/common";

const keys = (o: object, prefix = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

describe("message files", () => {
  it("id.json and en.json have exactly the same keys", () => {
    expect(keys(id).sort()).toEqual(keys(en).sort());
  });

  it("every server error code has a translation", () => {
    for (const code of ERROR_CODES) expect(en.errors).toHaveProperty(code);
  });

  it("every validation key has a translation", () => {
    for (const key of Object.values(VALIDATION)) expect(en.validation).toHaveProperty(key);
  });
});
