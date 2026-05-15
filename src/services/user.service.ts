import { handlePrismaError } from "@/errors/handle-prisma-error";
import prisma from "@/prisma";

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });
};

export const getUserByIdService = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
    include: { products: true },
  });
};

export const createUserService = async (
  name: string,
  email: string,
  age: number,
  address: string,
) => {
  return prisma.user
    .create({ data: { name, email, age, address } })
    .catch((e) => handlePrismaError(e, { uniqueConstraint: "Email already exists" }));
};

export const updateUserService = async (
  id: number,
  name: string,
  email: string,
  age: number,
  address: string,
) => {
  return prisma.user
    .update({ where: { id }, data: { name, email, age, address } })
    .catch((e) => handlePrismaError(e, { recordNotFound: "Không tìm thấy ai hết!" }));
};

export const deleteUserService = async (id: number) => {
  return prisma.user.delete({ where: { id } }).catch(handlePrismaError);
};
