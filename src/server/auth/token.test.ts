import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "./token";

const secret = "x".repeat(32);

describe("signed tokens", () => {
  it("round-trips the subject for the same purpose", async () => {
    const t = await signToken({ sub: "user-1", purpose: "session" }, secret, 60);
    expect(await verifyToken(t, "session", secret)).toBe("user-1");
  });

  it("rejects another purpose, a wrong secret, garbage and expiry", async () => {
    const t = await signToken({ sub: "user-1", purpose: "session" }, secret, 60);
    expect(await verifyToken(t, "share", secret)).toBeNull();
    expect(await verifyToken(t, "session", "y".repeat(32))).toBeNull();
    expect(await verifyToken("not-a-jwt", "session", secret)).toBeNull();
    expect(await verifyToken(undefined, "session", secret)).toBeNull();
    const expired = await signToken({ sub: "u", purpose: "session" }, secret, -10);
    expect(await verifyToken(expired, "session", secret)).toBeNull();
  });
});
