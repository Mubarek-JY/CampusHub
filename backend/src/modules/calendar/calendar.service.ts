import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from "./calendar.schemas.js";

async function requireMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!membership) throw AppError.notFound("Group not found");
}
async function findEvent(eventId: string) {
  const event = await prisma.calendarEvent.findUnique({ where: { id: eventId }, include: { group: { select: { id: true, name: true } } } });
  if (!event) throw AppError.notFound("Calendar event not found");
  return event;
}
export async function listEvents(userId: string, query: ListEventsQuery) {
  if (query.groupId) await requireMembership(query.groupId, userId);
  const memberships = query.groupId ? [] : await prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } });
  const groupIds = query.groupId ? [query.groupId] : memberships.map((membership: { groupId: string }) => membership.groupId);
  return prisma.calendarEvent.findMany({
    where: {
      OR: [{ ownerId: userId }, ...groupIds.map((groupId) => ({ groupId }))],
      ...(query.from || query.to ? { startsAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
    },
    orderBy: { startsAt: "asc" },
    include: { group: { select: { id: true, name: true } } },
  });
}
export async function createEvent(ownerId: string, input: CreateEventInput) {
  if (input.groupId) await requireMembership(input.groupId, ownerId);
  return prisma.calendarEvent.create({ data: { ...input, ownerId }, include: { group: { select: { id: true, name: true } } } });
}
export async function updateEvent(eventId: string, ownerId: string, input: UpdateEventInput) {
  const event = await findEvent(eventId);
  if (event.ownerId !== ownerId) throw AppError.forbidden();
  if (input.groupId) await requireMembership(input.groupId, ownerId);
  return prisma.calendarEvent.update({ where: { id: eventId }, data: input, include: { group: { select: { id: true, name: true } } } });
}
export async function deleteEvent(eventId: string, ownerId: string) {
  const event = await findEvent(eventId);
  if (event.ownerId !== ownerId) throw AppError.forbidden();
  await prisma.calendarEvent.delete({ where: { id: eventId } });
}
