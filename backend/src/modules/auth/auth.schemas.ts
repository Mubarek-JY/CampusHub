import { z } from "zod";

// Trim and lowercase first, then validate, so pasted whitespace doesn't fail validation.
const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  university: z.string().trim().min(1).max(120).optional(),
  department: z.string().trim().min(1).max(120).optional(),
  yearOfStudy: z.number().int().min(1).max(10).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    university: z.string().trim().min(1).max(120).nullable(),
    department: z.string().trim().min(1).max(120).nullable(),
    yearOfStudy: z.number().int().min(1).max(10).nullable(),
    bio: z.string().trim().max(500).nullable(),
    avatarUrl: z.url().max(500).nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
