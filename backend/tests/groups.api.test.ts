import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "./prisma-mock.js";

vi.mock("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const { createApp } = await import("../src/app.js");
const { signAccessToken } = await import("../src/lib/tokens.js");
const { generateJoinCode } = await import("../src/modules/groups/groups.service.js");
const app = createApp();

const ME = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const OTHER = "9b2f3c1e-1d3a-4c55-8f0e-3a2b6d7e8f90";
const GROUP = "1f0d8a52-6a77-4f0b-9d6b-2f0a5c7e1b11";
const TASK = "5e1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";

const auth = () => ({ Authorization: `Bearer ${signAccessToken({ sub: ME, role: "STUDENT" })}` });
const asMember = (role: "OWNER" | "ADMIN" | "MEMBER") =>
  prismaMock.groupMember.findUnique.mockResolvedValueOnce({ groupId: GROUP, userId: ME, role });

beforeEach(() => resetPrismaMock());

describe("authentication", () => {
  it("requires auth on every groups route", async () => {
    expect((await request(app).get("/api/groups")).status).toBe(401);
    expect((await request(app).post("/api/groups").send({ name: "Algo" })).status).toBe(401);
  });
});

describe("POST /api/groups", () => {
  it("validates the body", async () => {
    const res = await request(app).post("/api/groups").set(auth()).send({ name: "x" });
    expect(res.status).toBe(400);
  });

  it("creates the group with the caller as OWNER member and a join code", async () => {
    prismaMock.group.create.mockResolvedValue({ id: GROUP, name: "Algorithms Study" });

    const res = await request(app).post("/api/groups").set(auth()).send({ name: "Algorithms Study" });

    expect(res.status).toBe(201);
    const data = prismaMock.group.create.mock.calls[0]![0].data;
    expect(data.ownerId).toBe(ME);
    expect(data.members.create).toEqual({ userId: ME, role: "OWNER" });
    expect(data.joinCode).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });

  it("retries on a join-code collision", async () => {
    prismaMock.group.create
      .mockRejectedValueOnce(Object.assign(new Error("unique"), { code: "P2002" }))
      .mockResolvedValueOnce({ id: GROUP });

    const res = await request(app).post("/api/groups").set(auth()).send({ name: "Operating Systems" });
    expect(res.status).toBe(201);
    expect(prismaMock.group.create).toHaveBeenCalledTimes(2);
  });
});

describe("GET /api/groups/:groupId", () => {
  it("returns 404 to non-members (no existence leak)", async () => {
    prismaMock.groupMember.findUnique.mockResolvedValue(null);
    const res = await request(app).get(`/api/groups/${GROUP}`).set(auth());
    expect(res.status).toBe(404);
  });

  it("hides the join code from plain members", async () => {
    asMember("MEMBER");
    prismaMock.group.findUnique.mockResolvedValue({ id: GROUP, name: "G", joinCode: "ABCD2345", members: [] });
    const res = await request(app).get(`/api/groups/${GROUP}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.group).not.toHaveProperty("joinCode");
  });

  it("shows the join code to admins", async () => {
    asMember("ADMIN");
    prismaMock.group.findUnique.mockResolvedValue({ id: GROUP, name: "G", joinCode: "ABCD2345", members: [] });
    const res = await request(app).get(`/api/groups/${GROUP}`).set(auth());
    expect(res.body.group.joinCode).toBe("ABCD2345");
  });

  it("rejects a non-uuid group id", async () => {
    const res = await request(app).get("/api/groups/not-a-uuid").set(auth());
    expect(res.status).toBe(400);
  });
});

describe("POST /api/groups/join", () => {
  it("uppercases the code and adds the caller as MEMBER", async () => {
    prismaMock.group.findUnique.mockResolvedValue({ id: GROUP, name: "G" });
    prismaMock.groupMember.findUnique.mockResolvedValue(null);
    prismaMock.groupMember.create.mockResolvedValue({});

    const res = await request(app).post("/api/groups/join").set(auth()).send({ joinCode: " abcd2345 " });

    expect(res.status).toBe(200);
    expect(prismaMock.group.findUnique.mock.calls[0]![0].where).toEqual({ joinCode: "ABCD2345" });
    expect(prismaMock.groupMember.create.mock.calls[0]![0].data).toMatchObject({ userId: ME, role: "MEMBER" });
  });

  it("404s on an unknown code and 409s if already a member", async () => {
    prismaMock.group.findUnique.mockResolvedValueOnce(null);
    expect((await request(app).post("/api/groups/join").set(auth()).send({ joinCode: "ZZZZ9999" })).status).toBe(404);

    prismaMock.group.findUnique.mockResolvedValueOnce({ id: GROUP, name: "G" });
    prismaMock.groupMember.findUnique.mockResolvedValueOnce({ role: "MEMBER" });
    expect((await request(app).post("/api/groups/join").set(auth()).send({ joinCode: "ABCD2345" })).status).toBe(409);
  });
});

describe("leaving and deleting", () => {
  it("stops the owner from leaving", async () => {
    asMember("OWNER");
    const res = await request(app).post(`/api/groups/${GROUP}/leave`).set(auth());
    expect(res.status).toBe(400);
    expect(prismaMock.groupMember.delete).not.toHaveBeenCalled();
  });

  it("lets a member leave", async () => {
    asMember("MEMBER");
    prismaMock.groupMember.delete.mockResolvedValue({});
    const res = await request(app).post(`/api/groups/${GROUP}/leave`).set(auth());
    expect(res.status).toBe(204);
  });

  it("only lets the owner delete the group", async () => {
    asMember("ADMIN");
    expect((await request(app).delete(`/api/groups/${GROUP}`).set(auth())).status).toBe(403);

    asMember("OWNER");
    prismaMock.group.delete.mockResolvedValue({});
    expect((await request(app).delete(`/api/groups/${GROUP}`).set(auth())).status).toBe(204);
  });
});

describe("member management", () => {
  it("only the owner can change roles", async () => {
    asMember("ADMIN");
    const res = await request(app)
      .patch(`/api/groups/${GROUP}/members/${OTHER}`)
      .set(auth())
      .send({ role: "ADMIN" });
    expect(res.status).toBe(403);
  });

  it("cannot change the owner's role", async () => {
    asMember("OWNER");
    prismaMock.groupMember.findUnique.mockResolvedValueOnce({ role: "OWNER" });
    const res = await request(app)
      .patch(`/api/groups/${GROUP}/members/${OTHER}`)
      .set(auth())
      .send({ role: "MEMBER" });
    expect(res.status).toBe(400);
  });

  it("plain members cannot remove anyone", async () => {
    asMember("MEMBER");
    const res = await request(app).delete(`/api/groups/${GROUP}/members/${OTHER}`).set(auth());
    expect(res.status).toBe(403);
  });

  it("admins cannot remove other admins or the owner", async () => {
    asMember("ADMIN");
    prismaMock.groupMember.findUnique.mockResolvedValueOnce({ role: "ADMIN" });
    expect((await request(app).delete(`/api/groups/${GROUP}/members/${OTHER}`).set(auth())).status).toBe(403);

    asMember("ADMIN");
    prismaMock.groupMember.findUnique.mockResolvedValueOnce({ role: "OWNER" });
    expect((await request(app).delete(`/api/groups/${GROUP}/members/${OTHER}`).set(auth())).status).toBe(403);
  });

  it("admins can remove a regular member", async () => {
    asMember("ADMIN");
    prismaMock.groupMember.findUnique.mockResolvedValueOnce({ role: "MEMBER" });
    prismaMock.groupMember.delete.mockResolvedValue({});
    const res = await request(app).delete(`/api/groups/${GROUP}/members/${OTHER}`).set(auth());
    expect(res.status).toBe(204);
  });

  it("refuses self-removal via the remove endpoint", async () => {
    const res = await request(app).delete(`/api/groups/${GROUP}/members/${ME}`).set(auth());
    expect(res.status).toBe(400);
  });
});

describe("tasks", () => {
  it("rejects an assignee who is not a group member", async () => {
    asMember("MEMBER");
    prismaMock.groupMember.findUnique.mockResolvedValueOnce(null);
    const res = await request(app)
      .post(`/api/groups/${GROUP}/tasks`)
      .set(auth())
      .send({ title: "Write intro", assigneeId: OTHER });
    expect(res.status).toBe(400);
    expect(prismaMock.groupTask.create).not.toHaveBeenCalled();
  });

  it("creates a task attributed to the caller, coercing the due date", async () => {
    asMember("MEMBER");
    prismaMock.groupTask.create.mockResolvedValue({ id: TASK });

    const res = await request(app)
      .post(`/api/groups/${GROUP}/tasks`)
      .set(auth())
      .send({ title: "Write intro", dueDate: "2026-12-01T09:00:00Z", priority: "HIGH" });

    expect(res.status).toBe(201);
    const data = prismaMock.groupTask.create.mock.calls[0]![0].data;
    expect(data).toMatchObject({ groupId: GROUP, createdById: ME, priority: "HIGH" });
    expect(data.dueDate).toBeInstanceOf(Date);
  });

  it("passes status/assignee filters from the query string", async () => {
    asMember("MEMBER");
    prismaMock.groupTask.findMany.mockResolvedValue([]);
    const res = await request(app).get(`/api/groups/${GROUP}/tasks?status=DONE`).set(auth());
    expect(res.status).toBe(200);
    expect(prismaMock.groupTask.findMany.mock.calls[0]![0].where).toEqual({ groupId: GROUP, status: "DONE" });
  });

  it("rejects an invalid status filter", async () => {
    const res = await request(app).get(`/api/groups/${GROUP}/tasks?status=NOPE`).set(auth());
    expect(res.status).toBe(400);
  });

  it("404s when the task is not in this group", async () => {
    asMember("MEMBER");
    prismaMock.groupTask.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .patch(`/api/groups/${GROUP}/tasks/${TASK}`)
      .set(auth())
      .send({ status: "DONE" });
    expect(res.status).toBe(404);
  });

  it("lets members update a task's status", async () => {
    asMember("MEMBER");
    prismaMock.groupTask.findFirst.mockResolvedValue({ id: TASK, createdById: OTHER });
    prismaMock.groupTask.update.mockResolvedValue({ id: TASK, status: "DONE" });
    const res = await request(app)
      .patch(`/api/groups/${GROUP}/tasks/${TASK}`)
      .set(auth())
      .send({ status: "DONE" });
    expect(res.status).toBe(200);
  });

  it("only the creator or an admin can delete a task", async () => {
    asMember("MEMBER");
    prismaMock.groupTask.findFirst.mockResolvedValueOnce({ id: TASK, createdById: OTHER });
    expect((await request(app).delete(`/api/groups/${GROUP}/tasks/${TASK}`).set(auth())).status).toBe(403);

    asMember("MEMBER");
    prismaMock.groupTask.findFirst.mockResolvedValueOnce({ id: TASK, createdById: ME });
    prismaMock.groupTask.delete.mockResolvedValue({});
    expect((await request(app).delete(`/api/groups/${GROUP}/tasks/${TASK}`).set(auth())).status).toBe(204);

    asMember("ADMIN");
    prismaMock.groupTask.findFirst.mockResolvedValueOnce({ id: TASK, createdById: OTHER });
    expect((await request(app).delete(`/api/groups/${GROUP}/tasks/${TASK}`).set(auth())).status).toBe(204);
  });
});

describe("generateJoinCode", () => {
  it("produces unambiguous 8-char codes", () => {
    for (let i = 0; i < 200; i++) expect(generateJoinCode()).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });
});
