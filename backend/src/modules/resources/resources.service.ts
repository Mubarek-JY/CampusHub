import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import fs from "node:fs/promises";
import path from "node:path";
import { uploadDirectory } from "./upload.js";
import type {
  CreateResourceInput,
  ListResourcesQuery,
  UpdateResourceInput,
} from "./resources.schemas.js";

const userSummary = { id: true, firstName: true, lastName: true, avatarUrl: true } as const;

async function requireGroupMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) throw AppError.notFound("Group not found");
}

async function findResource(resourceId: string) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      uploader: { select: userSummary },
      group: { select: { id: true, name: true } },
      ratings: { select: { value: true, userId: true } },
    },
  });
  if (!resource) throw AppError.notFound("Resource not found");
  return resource;
}

async function canRead(resource: { uploaderId: string; groupId: string | null; isPublic: boolean }, userId: string) {
  if (resource.uploaderId === userId || resource.isPublic) return true;
  if (resource.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: resource.groupId, userId } },
    });
    return Boolean(membership);
  }
  return false;
}

function presentResource(resource: {
  ratings?: Array<{ value: number; userId: string }>;
  [key: string]: unknown;
}, userId: string) {
  const { ratings = [], ...rest } = resource;
  const ratingTotal = ratings.reduce((sum, rating) => sum + rating.value, 0);
  return {
    ...rest,
    rating: {
      average: ratings.length ? Math.round((ratingTotal / ratings.length) * 10) / 10 : null,
      count: ratings.length,
      mine: ratings.find((rating) => rating.userId === userId)?.value ?? null,
    },
  };
}

export async function createResource(uploaderId: string, input: CreateResourceInput) {
  if (input.groupId) await requireGroupMembership(input.groupId, uploaderId);
  const resource = await prisma.resource.create({
    data: { ...input, uploaderId },
    include: {
      uploader: { select: userSummary },
      group: { select: { id: true, name: true } },
      ratings: { select: { value: true, userId: true } },
    },
  });
  return presentResource(resource, uploaderId);
}

export async function createUploadedResource(
  uploaderId: string,
  input: Omit<CreateResourceInput, "type" | "url">,
  file: { filename: string },
) {
  if (input.groupId) await requireGroupMembership(input.groupId, uploaderId);
  try {
    const resource = await prisma.resource.create({
      data: { ...input, type: "FILE", url: `/uploads/${file.filename}`, uploaderId },
      include: {
        uploader: { select: userSummary },
        group: { select: { id: true, name: true } },
        ratings: { select: { value: true, userId: true } },
      },
    });
    return presentResource(resource, uploaderId);
  } catch (error) {
    await fs.unlink(path.join(uploadDirectory, file.filename)).catch(() => undefined);
    throw error;
  }
}

export async function listResources(userId: string, query: ListResourcesQuery) {
  if (query.groupId) await requireGroupMembership(query.groupId, userId);
  const resources = await prisma.resource.findMany({
    where: {
      ...(query.type ? { type: query.type } : {}),
      ...(query.courseName ? { courseName: query.courseName } : {}),
      ...(query.groupId ? { groupId: query.groupId } : {}),
      AND: [
        ...(query.groupId ? [] : [{ OR: [{ isPublic: true }, { uploaderId: userId }] }]),
        ...(query.search
          ? [{ OR: [{ title: { contains: query.search, mode: "insensitive" as const } }, { description: { contains: query.search, mode: "insensitive" as const } }] }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: userSummary },
      group: { select: { id: true, name: true } },
      ratings: { select: { value: true, userId: true } },
    },
  });
  const visible = [];
  for (const resource of resources) {
    if (await canRead(resource, userId)) visible.push(presentResource(resource, userId));
  }
  return visible;
}

export async function getResource(resourceId: string, userId: string) {
  const resource = await findResource(resourceId);
  if (!(await canRead(resource, userId))) throw AppError.notFound("Resource not found");
  return presentResource(resource, userId);
}

export async function updateResource(resourceId: string, userId: string, input: UpdateResourceInput) {
  const resource = await findResource(resourceId);
  if (resource.uploaderId !== userId) throw AppError.forbidden();
  const updated = await prisma.resource.update({
    where: { id: resourceId },
    data: input,
    include: {
      uploader: { select: userSummary },
      group: { select: { id: true, name: true } },
      ratings: { select: { value: true, userId: true } },
    },
  });
  return presentResource(updated, userId);
}

export async function deleteResource(resourceId: string, userId: string) {
  const resource = await findResource(resourceId);
  if (resource.uploaderId !== userId) throw AppError.forbidden();
  await prisma.resource.delete({ where: { id: resourceId } });
  if (resource.type === "FILE" && resource.url?.startsWith("/uploads/")) {
    await fs.unlink(path.join(uploadDirectory, path.basename(resource.url))).catch(() => undefined);
  }
}

export async function rateResource(resourceId: string, userId: string, value: number) {
  const resource = await findResource(resourceId);
  if (!(await canRead(resource, userId))) throw AppError.notFound("Resource not found");
  await prisma.resourceRating.upsert({
    where: { resourceId_userId: { resourceId, userId } },
    create: { resourceId, userId, value },
    update: { value },
  });
  return getResource(resourceId, userId);
}
