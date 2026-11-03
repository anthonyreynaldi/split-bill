import { describe, expect, it } from "vitest";
import { createTestServices } from "./test-utils";

describe("AuthService", () => {
  it("registers and logs in", async () => {
    const { services, repos } = createTestServices();
    const u = await services.auth.register({ email: "ana@mail.com", password: "secret123" });
    expect(u).toEqual({ id: expect.any(String), email: "ana@mail.com" });
    expect((await repos.users.findById(u.id))?.passwordHash).not.toBe("secret123");
    await expect(services.auth.login({ email: "ana@mail.com", password: "secret123" })).resolves.toEqual(u);
  });

  it("never returns the password hash", async () => {
    const { services } = createTestServices();
    const u = await services.auth.register({ email: "a@b.co", password: "secret123" });
    expect(Object.keys(u).sort()).toEqual(["email", "id"]);
  });

  it("rejects a duplicate email", async () => {
    const { services } = createTestServices();
    await services.auth.register({ email: "a@b.co", password: "secret123" });
    await expect(services.auth.register({ email: "a@b.co", password: "other1234" })).rejects.toMatchObject({
      code: "EMAIL_TAKEN",
    });
  });

  it("uses the same error for a wrong password and an unknown email", async () => {
    const { services } = createTestServices();
    await services.auth.register({ email: "a@b.co", password: "secret123" });
    await expect(services.auth.login({ email: "a@b.co", password: "nope" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    await expect(services.auth.login({ email: "x@b.co", password: "secret123" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });
});
