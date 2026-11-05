import { z } from "zod";

export const messageParams = z.object({ messageId: z.uuid() });
export const listMessagesQuery = z.object({
  groupId: z.uuid().optional(),
  recipientId: z.uuid().optional(),
  before: z.coerce.date().optional(),
});
export const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  groupId: z.uuid().optional(),
  recipientId: z.uuid().optional(),
}).refine((value) => Boolean(value.groupId) !== Boolean(value.recipientId), {
  message: "Provide exactly one of groupId or recipientId",
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuery>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
