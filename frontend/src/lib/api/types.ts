import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(), email: z.email(), firstName: z.string(), lastName: z.string(),
  role: z.enum(['STUDENT', 'ADMIN']), university: z.string().nullable().optional(),
  department: z.string().nullable().optional(), yearOfStudy: z.number().int().nullable().optional(),
  bio: z.string().nullable().optional(), avatarUrl: z.string().nullable().optional(), createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export const groupSummarySchema = z.object({
  id: z.string(), name: z.string(), description: z.string().nullable().optional(),
  courseName: z.string().nullable().optional(), createdAt: z.string(), myRole: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  _count: z.object({ members: z.number(), tasks: z.number() }),
});
export type GroupSummary = z.infer<typeof groupSummarySchema>;

export const memberSchema = z.object({
  id: z.string(), groupId: z.string(), userId: z.string(), role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  joinedAt: z.string(), user: z.object({ id: z.string(), firstName: z.string(), lastName: z.string(), avatarUrl: z.string().nullable().optional() }),
});
export type GroupMember = z.infer<typeof memberSchema>;

export const groupSchema = z.object({
  id: z.string(), name: z.string(), description: z.string().nullable().optional(),
  courseName: z.string().nullable().optional(), ownerId: z.string(), createdAt: z.string(), updatedAt: z.string(),
  myRole: z.enum(['OWNER', 'ADMIN', 'MEMBER']), joinCode: z.string().optional(), members: z.array(memberSchema),
  _count: z.object({ tasks: z.number(), resources: z.number() }),
});
export type Group = z.infer<typeof groupSchema>;

export const taskSchema = z.object({
  id: z.string(), groupId: z.string(), title: z.string(), description: z.string().nullable().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']), priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().nullable().optional(), assigneeId: z.string().nullable().optional(), createdById: z.string(),
  createdAt: z.string(), updatedAt: z.string(),
  assignee: z.object({ id: z.string(), firstName: z.string(), lastName: z.string(), avatarUrl: z.string().nullable().optional() }).nullable().optional(),
});
export type Task = z.infer<typeof taskSchema>;

export type AuthResponse = { user: User; accessToken: string; refreshToken: string };
export type RefreshResponse = { accessToken: string; refreshToken: string };
export type ApiErrorBody = { error?: { code?: string; message?: string; details?: { fieldErrors?: Record<string, string[]> } } };
export type RegisterInput = {
  email: string; password: string; firstName: string; lastName: string;
  university?: string; department?: string; yearOfStudy?: number;
};
export type LoginInput = { email: string; password: string };
export type ProfileInput = Partial<Pick<User, 'firstName' | 'lastName' | 'university' | 'department' | 'yearOfStudy' | 'bio' | 'avatarUrl'>>;
export type CreateGroupInput = { name: string; description?: string; courseName?: string };
export type CreateTaskInput = { title: string; description?: string; priority?: TaskPriority; dueDate?: string; assigneeId?: string };
export type UpdateTaskInput = Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assigneeId'>>;
export type ResourceType = 'LINK' | 'FILE' | 'NOTE';
export type Resource = {
  id: string; title: string; description?: string | null; type: ResourceType;
  url?: string | null; content?: string | null; courseName?: string | null; tags: string[];
  isPublic: boolean; uploaderId: string; groupId?: string | null; createdAt: string; updatedAt: string;
  uploader: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  group?: { id: string; name: string } | null;
  rating: { average: number | null; count: number; mine: number | null };
};
export type CreateResourceInput = {
  title: string; description?: string; type: ResourceType; url?: string; content?: string;
  courseName?: string; tags?: string[]; isPublic?: boolean; groupId?: string;
};
export type UpdateResourceInput = Partial<Pick<CreateResourceInput, 'title' | 'description' | 'url' | 'content' | 'courseName' | 'tags' | 'isPublic'>>;
export type Message = { id: string; content: string; senderId: string; groupId?: string | null; recipientId?: string | null; createdAt: string; sender: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>; recipient?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'> | null };
export type EventType = 'CLASS' | 'EXAM' | 'DEADLINE' | 'STUDY_SESSION' | 'MEETING' | 'OTHER';
export type CalendarEvent = { id: string; title: string; description?: string | null; type: EventType; startsAt: string; endsAt?: string | null; location?: string | null; ownerId: string; groupId?: string | null; createdAt: string; updatedAt: string; group?: { id: string; name: string } | null };
export type CreateMessageInput = { content: string; groupId?: string; recipientId?: string };
export type CreateEventInput = { title: string; description?: string; type?: EventType; startsAt: string; endsAt?: string; location?: string; groupId?: string };
