import crypto from "node:crypto";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateGroupInput, CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./groups.schemas.js";

type Role = "OWNER" | "ADMIN" | "MEMBER";
const ROLE_RANK: Record<Role, number> = { MEMBER: 1, ADMIN: 2, OWNER: 3 };

const userSummary = { id: true, firstName: true, lastName: true, avatarUrl: true } as const;

const JOIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function generateJoinCode(length = 8): string {
  return Array.from(crypto.randomBytes(length), (b) => JOIN_ALPHABET[b % JOIN_ALPHABET.length]).join("");
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/** Non-members get 404 so group existence is not leaked. */
async function requireMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) throw AppError.notFound("Group not found");
  return membership as { role: Role; userId: string; groupId: string };
}

function assertAtLeast(membership: { role: Role }, min: Role) {
  if (ROLE_RANK[membership.role] < ROLE_RANK[min]) throw AppError.forbidden();
}

// ───────────── Groups ─────────────

export async function createGroup(ownerId: string, input: CreateGroupInput) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.group.create({
        data: {
          ...input,
          joinCode: generateJoinCode(),
          ownerId,
          members: { create: { userId: ownerId, role: "OWNER" } },
        },
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err; // retry only on join-code collision
    }
  }
  throw new AppError(500, "JOIN_CODE_EXHAUSTED", "Could not generate a unique join code");
}

export async function listMyGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          courseName: true,
          createdAt: true,
          _count: { select: { members: true, tasks: true } },
        },
      },
    },
  });
  return memberships.map((m: { role: Role; group: object }) => ({ ...m.group, myRole: m.role }));
}

export async function getGroup(groupId: string, userId: string) {
  const membership = await requireMembership(groupId, userId);
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: userSummary } }, orderBy: { joinedAt: "asc" } },
      _count: { select: { tasks: true, resources: true } },
    },
  });
  if (!group) throw AppError.notFound("Group not found");

  // Only admins/owners can see the invite code.
  const { joinCode, ...rest } = group;
  return {
    ...rest,
    myRole: membership.role,
    ...(ROLE_RANK[membership.role] >= ROLE_RANK.ADMIN ? { joinCode } : {}),
  };
}

export async function joinGroup(userId: string, joinCode: string) {
  const group = await prisma.group.findUnique({ where: { joinCode } });
  if (!group) throw AppError.notFound("Invalid join code");

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId } },
  });
  if (existing) throw AppError.conflict("You are already a member of this group");

  await prisma.groupMember.create({ data: { groupId: group.id, userId, role: "MEMBER" } });
  return { id: group.id, name: group.name };
}

export async function leaveGroup(groupId: string, userId: string) {
  const membership = await requireMembership(groupId, userId);
  if (membership.role === "OWNER") {
    throw AppError.badRequest("Owners cannot leave their group; delete the group instead");
  }
  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
}

export async function deleteGroup(groupId: string, userId: string) {
  const membership = await requireMembership(groupId, userId);
  assertAtLeast(membership, "OWNER");
  await prisma.group.delete({ where: { id: groupId } });
}

// ───────────── Members ─────────────

export async function updateMemberRole(
  groupId: string,
  actorId: string,
  targetUserId: string,
  role: "ADMIN" | "MEMBER",
) {
  const actor = await requireMembership(groupId, actorId);
  assertAtLeast(actor, "OWNER");

  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!target) throw AppError.notFound("Member not found");
  if (target.role === "OWNER") throw AppError.badRequest("The owner's role cannot be changed");

  return prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role },
  });
}

export async function removeMember(groupId: string, actorId: string, targetUserId: string) {
  if (actorId === targetUserId) throw AppError.badRequest("Use the leave endpoint to leave a group");

  const actor = await requireMembership(groupId, actorId);
  assertAtLeast(actor, "ADMIN");

  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!target) throw AppError.notFound("Member not found");
  if (target.role === "OWNER") throw AppError.forbidden("The owner cannot be removed");
  if (actor.role === "ADMIN" && target.role === "ADMIN") {
    throw AppError.forbidden("Only the owner can remove an admin");
  }

  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: targetUserId } } });
}

// ───────────── Tasks ─────────────

async function assertAssigneeIsMember(groupId: string, assigneeId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: assigneeId } },
  });
  if (!member) throw AppError.badRequest("Assignee must be a member of the group");
}

export async function createTask(groupId: string, actorId: string, input: CreateTaskInput) {
  await requireMembership(groupId, actorId);
  if (input.assigneeId) await assertAssigneeIsMember(groupId, input.assigneeId);

  return prisma.groupTask.create({
    data: { ...input, groupId, createdById: actorId },
  });
}

export async function listTasks(groupId: string, actorId: string, query: ListTasksQuery) {
  await requireMembership(groupId, actorId);
  return prisma.groupTask.findMany({
    where: { groupId, ...query },
    orderBy: [{ status: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: { assignee: { select: userSummary } },
  });
}

async function findTask(groupId: string, taskId: string) {
  const task = await prisma.groupTask.findFirst({ where: { id: taskId, groupId } });
  if (!task) throw AppError.notFound("Task not found");
  return task;
}

export async function updateTask(groupId: string, taskId: string, actorId: string, input: UpdateTaskInput) {
  await requireMembership(groupId, actorId);
  await findTask(groupId, taskId);
  if (input.assigneeId) await assertAssigneeIsMember(groupId, input.assigneeId);

  return prisma.groupTask.update({ where: { id: taskId }, data: input });
}

export async function deleteTask(groupId: string, taskId: string, actorId: string) {
  const membership = await requireMembership(groupId, actorId);
  const task = await findTask(groupId, taskId);

  const isCreator = task.createdById === actorId;
  if (!isCreator && ROLE_RANK[membership.role] < ROLE_RANK.ADMIN) throw AppError.forbidden();

  await prisma.groupTask.delete({ where: { id: taskId } });
}
