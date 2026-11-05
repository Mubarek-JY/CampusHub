import { z } from "zod";

export const eventParams = z.object({ eventId: z.uuid() });
const eventType = z.enum(["CLASS", "EXAM", "DEADLINE", "STUDY_SESSION", "MEETING", "OTHER"]);
export const listEventsQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupId: z.uuid().optional(),
});
const eventFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  type: eventType.default("OTHER"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  location: z.string().trim().max(200).optional(),
  groupId: z.uuid().optional(),
};
export const createEventSchema = z.object(eventFields).refine((value) => !value.endsAt || value.endsAt > value.startsAt, {
  path: ["endsAt"], message: "End time must be after start time",
});
export const updateEventSchema = z.object(eventFields).partial().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one field to update",
});
export type ListEventsQuery = z.infer<typeof listEventsQuery>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
