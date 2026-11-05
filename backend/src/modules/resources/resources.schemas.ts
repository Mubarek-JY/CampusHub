import { z } from "zod";

export const resourceParams = z.object({ resourceId: z.uuid() });

const resourceType = z.enum(["LINK", "FILE", "NOTE"]);

export const createResourceSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    type: resourceType,
    url: z.url().optional(),
    content: z.string().trim().max(20000).optional(),
    courseName: z.string().trim().max(120).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    isPublic: z.boolean().default(true),
    groupId: z.uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.type === "LINK" || value.type === "FILE") && !value.url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "A URL is required for links and files" });
    }
    if (value.type === "NOTE" && !value.content) {
      ctx.addIssue({ code: "custom", path: ["content"], message: "Content is required for notes" });
    }
  });

export const updateResourceSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable(),
    url: z.url().nullable(),
    content: z.string().trim().max(20000).nullable(),
    courseName: z.string().trim().max(120).nullable(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20),
    isPublic: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field to update" });

export const listResourcesQuery = z.object({
  type: resourceType.optional(),
  courseName: z.string().trim().max(120).optional(),
  groupId: z.uuid().optional(),
  search: z.string().trim().max(100).optional(),
});

export const rateResourceSchema = z.object({ value: z.number().int().min(1).max(5) });

export const uploadResourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  courseName: z.string().trim().max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  isPublic: z.boolean().default(true),
  groupId: z.uuid().optional(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ListResourcesQuery = z.infer<typeof listResourcesQuery>;
