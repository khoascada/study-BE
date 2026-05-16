import z from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const logoutSchema = z.object({
  refreshToken: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
