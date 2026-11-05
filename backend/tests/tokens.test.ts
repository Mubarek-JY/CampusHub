import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { generateRefreshToken, hashToken, signAccessToken, verifyAccessToken } from "../src/lib/tokens.js";

describe("access tokens", () => {
  it("round-trips subject and role", () => {
    const token = signAccessToken({ sub: "user-1", role: "STUDENT" });
    expect(verifyAccessToken(token)).toMatchObject({ sub: "user-1", role: "STUDENT" });
  });

  it("rejects a token signed with a different secret", () => {
    const forged = jwt.sign({ sub: "user-1", role: "ADMIN" }, "another-secret-another-secret-12345");
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it("rejects a token with an unexpected role", () => {
    const bad = jwt.sign({ sub: "u", role: "SUPERUSER" }, process.env.JWT_ACCESS_SECRET!);
    expect(() => verifyAccessToken(bad)).toThrow();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ sub: "u", role: "STUDENT" }, process.env.JWT_ACCESS_SECRET!, { expiresIn: -10 });
    expect(() => verifyAccessToken(expired)).toThrow();
  });
});

describe("refresh tokens", () => {
  it("generates unique tokens whose hash matches hashToken", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a.token).not.toEqual(b.token);
    expect(a.hash).toEqual(hashToken(a.token));
    expect(a.hash).not.toEqual(a.token);
  });
});
