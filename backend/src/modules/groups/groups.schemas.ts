import { z } from "zod";

export const groupParams = z.object({ groupId: z.uuid() });
export const memberParams = z.object({ groupId: z.uuid(), userId: z.uuid() });
export const taskParams = z.object({ groupId: z.uuid(), taskId: z.uuid() });

export const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  courseName: z.string().trim().min(1).max(120).optional(),
});

export const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(4)
    .max(20)
    .transform((v) => v.toUpperCase()),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

const taskStatus = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
const taskPriority = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: taskPriority.optional(),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.uuid().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable(),
    status: taskStatus,
    priority: taskPriority,
    dueDate: z.coerce.date().nullable(),
    assigneeId: z.uuid().nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export const listTasksQuery = z.object({
  status: taskStatus.optional(),
  assigneeId: z.uuid().optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuery>;
