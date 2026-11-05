import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "./prisma-mock.js";

vi.mock("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const { signAccessToken, hashToken } = await import("../src/lib/tokens.js");
const app = createApp();

const USER_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const publicUser = {
  id: USER_ID,
  email: "abel@example.com",
  firstName: "Abel",
  lastName: "Tesfaye",
  role: "STUDENT",
};

beforeEach(() => resetPrismaMock());

describe("POST /api/auth/register", () => {
  it("rejects invalid input with field details", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "nope", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.fieldErrors).toHaveProperty("email");
    expect(res.body.error.details.fieldErrors).toHaveProperty("password");
  });

  it("creates a user, normalises the email and returns tokens without a password hash", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(publicUser);
    prismaMock.refreshToken.create.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "  Abel@Example.com ", password: "correct-horse", firstName: "Abel", lastName: "Tesfaye" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");

    const createArgs = prismaMock.user.create.mock.calls[0]![0];
    expect(createArgs.data.email).toBe("abel@example.com");
    expect(createArgs.data.passwordHash).not.toBe("correct-horse");
    expect(createArgs.data).not.toHaveProperty("password");
  });

  it("returns 409 for a duplicate email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(publicUser);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "abel@example.com", password: "correct-horse", firstName: "A", lastName: "T" });
    expect(res.status).toBe(409);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/login", () => {
  it("returns 401 for an unknown email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await request(app).post("/api/auth/login").send({ email: "x@example.com", password: "whatever1" });
    expect(res.status).toBe(401);
  });

  it("returns 401 for a wrong password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...publicUser,
      passwordHash: await bcrypt.hash("right-password", 4),
    });
    const res = await request(app).post("/api/auth/login").send({ email: publicUser.email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("returns tokens and omits the password hash on success", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...publicUser,
      passwordHash: await bcrypt.hash("right-password", 4),
    });
    prismaMock.refreshToken.create.mockResolvedValue({});

    const res = await request(app).post("/api/auth/login").send({ email: publicUser.email, password: "right-password" });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(publicUser.email);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });
});

describe("POST /api/auth/refresh", () => {
  const future = new Date(Date.now() + 60_000);

  it("rotates a valid refresh token", async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: USER_ID,
      revokedAt: null,
      expiresAt: future,
      user: { id: USER_ID, role: "STUDENT" },
    });
    prismaMock.refreshToken.update.mockResolvedValue({});
    prismaMock.refreshToken.create.mockResolvedValue({});

    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "token-abc" });

    expect(res.status).toBe(200);
    expect(prismaMock.refreshToken.findUnique.mock.calls[0]![0].where.tokenHash).toBe(hashToken("token-abc"));
    expect(prismaMock.refreshToken.update.mock.calls[0]![0].data.revokedAt).toBeInstanceOf(Date);
    expect(res.body.refreshToken).not.toBe("token-abc");
  });

  it("treats reuse of a revoked token as theft and revokes all sessions", async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: USER_ID,
      revokedAt: new Date(),
      expiresAt: future,
      user: { id: USER_ID, role: "STUDENT" },
    });
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "token-abc" });

    expect(res.status).toBe(401);
    expect(prismaMock.refreshToken.updateMany.mock.calls[0]![0].where).toMatchObject({ userId: USER_ID });
    expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt-1",
      userId: USER_ID,
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      user: { id: USER_ID, role: "STUDENT" },
    });
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "token-abc" });
    expect(res.status).toBe(401);
  });
});

describe("/api/auth/me", () => {
  it("requires a bearer token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a garbage token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-jwt");
    expect(res.status).toBe(401);
  });

  it("returns the profile for a valid token", async () => {
    prismaMock.user.findUnique.mockResolvedValue(publicUser);
    const token = signAccessToken({ sub: USER_ID, role: "STUDENT" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(USER_ID);
  });

  it("rejects an empty profile update", async () => {
    const token = signAccessToken({ sub: USER_ID, role: "STUDENT" });
    const res = await request(app).patch("/api/auth/me").set("Authorization", `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });
});

describe("misc", () => {
  it("serves /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
  });
});
