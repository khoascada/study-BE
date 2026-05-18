import type { User } from "@prisma/client";

export type RegisterDto = {
  id: number;
  email: string;
  name: string | null;
};

export const toRegisterDto = (user: Pick<User, "id" | "email" | "name">): RegisterDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
});
