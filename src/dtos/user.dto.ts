import type { Product, User } from "@prisma/client";

export type UserDto = {
  id: number;
  email: string;
  name: string | null;
};

export type UserDetailDto = {
  id: number;
  email: string;
  name: string | null;
  age: number | null;
  address: string | null;
  role: string;
  createdAt: Date;
  products: Pick<Product, "id" | "name" | "price">[];
};

export const toUserDto = (user: Pick<User, "id" | "email" | "name">): UserDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
});

export const toUserDetailDto = (
  user: Pick<User, "id" | "email" | "name" | "age" | "address" | "role" | "createdAt"> & {
    products: Pick<Product, "id" | "name" | "price">[];
  },
): UserDetailDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  age: user.age,
  address: user.address,
  role: user.role,
  createdAt: user.createdAt,
  products: user.products.map(({ id, name, price }) => ({ id, name, price })),
});
