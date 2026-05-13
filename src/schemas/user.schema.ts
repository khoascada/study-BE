import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  age: z.number().min(18).optional(),
  address: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  age: z.number().min(18).optional(),
  address: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>