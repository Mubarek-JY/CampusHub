import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateMessageInput, ListMessagesQuery } from "./messages.schemas.js";

const userSummary = { id: true, firstName: true, lastName: true, avatarUrl: true } as const;

async function requireMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!membership) throw AppError.notFound("Group not found");
}

export async function listMessages(userId: string, query: ListMessagesQuery) {
  if (query.groupId) await requireMembership(query.groupId, userId);
  if (query.recipientId === userId) throw AppError.badRequest("You cannot message yourself");
  const where = query.groupId
    ? { groupId: query.groupId }
    : query.recipientId
      ? { OR: [{ senderId: userId, recipientId: query.recipientId }, { senderId: query.recipientId, recipientId: userId }] }
      : { OR: [{ senderId: userId }, { recipientId: userId }] };
  return prisma.message.findMany({
    where: { ...where, ...(query.before ? { createdAt: { lt: query.before } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { sender: { select: userSummary }, recipient: { select: userSummary } },
  });
}

export async function createMessage(senderId: string, input: CreateMessageInput) {
  if (input.groupId) await requireMembership(input.groupId, senderId);
  if (input.recipientId) {
    if (input.recipientId === senderId) throw AppError.badRequest("You cannot message yourself");
    const recipient = await prisma.user.findUnique({ where: { id: input.recipientId } });
    if (!recipient) throw AppError.notFound("Recipient not found");
  }
  return prisma.message.create({
    data: { content: input.content, senderId, groupId: input.groupId, recipientId: input.recipientId },
    include: { sender: { select: userSummary }, recipient: { select: userSummary } },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw AppError.notFound("Message not found");
  if (message.senderId !== userId) throw AppError.forbidden();
  await prisma.message.delete({ where: { id: messageId } });
}
