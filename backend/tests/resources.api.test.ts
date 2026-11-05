import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "./prisma-mock.js";

vi.mock("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const { signAccessToken } = await import("../src/lib/tokens.js");
const app = createApp();

const ME = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const RESOURCE = "5e1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";

const auth = () => ({ Authorization: `Bearer ${signAccessToken({ sub: ME, role: "STUDENT" })}` });

beforeEach(() => resetPrismaMock());

describe("resources API", () => {
  it("requires authentication", async () => {
    expect((await request(app).get("/api/resources")).status).toBe(401);
  });

  it("validates type-specific fields", async () => {
    const res = await request(app).post("/api/resources").set(auth()).send({ title: "Lecture", type: "LINK" });
    expect(res.status).toBe(400);
  });

  it("creates a group resource for a member", async () => {
    prismaMock.groupMember.findUnique.mockResolvedValue({ groupId: RESOURCE, userId: ME, role: "MEMBER" });
    prismaMock.resource.create.mockResolvedValue({
      id: RESOURCE,
      title: "Lecture link",
      type: "LINK",
      url: "https://example.com/lecture",
      uploaderId: ME,
      groupId: RESOURCE,
      isPublic: false,
      tags: [],
      ratings: [],
      uploader: { id: ME, firstName: "Ada", lastName: "Lovelace", avatarUrl: null },
      group: { id: RESOURCE, name: "Algorithms" },
    });

    const res = await request(app).post("/api/resources").set(auth()).send({
      title: "Lecture link",
      type: "LINK",
      url: "https://example.com/lecture",
      groupId: RESOURCE,
      isPublic: false,
    });

    expect(res.status).toBe(201);
    expect(prismaMock.resource.create.mock.calls[0]![0].data).toMatchObject({
      uploaderId: ME,
      groupId: RESOURCE,
      type: "LINK",
    });
  });

  it("rejects invalid ratings", async () => {
    const res = await request(app).post(`/api/resources/${RESOURCE}/rating`).set(auth()).send({ value: 6 });
    expect(res.status).toBe(400);
  });
});
