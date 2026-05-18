import { handlePrismaError } from "@/errors/handle-prisma-error";
import prisma from "@/prisma";

export const userRepository = {
  findAll(args?: { skip?: number; take?: number; orderBy?: Record<string, "asc" | "desc"> }) {
    return prisma.user.findMany({
      skip: args?.skip,
      take: args?.take,
      orderBy: args?.orderBy,
    });
  },

  count() {
    return prisma.user.count();
  },

  findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: { products: true },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  create(data: { name?: string; email: string; age?: number; address?: string; password?: string }) {
    return prisma.user
      .create({ data })
      .catch((e) => handlePrismaError(e, { uniqueConstraint: "Email already exists" }));
  },

  update(id: number, data: { name?: string; email?: string; age?: number; address?: string }) {
    return prisma.user
      .update({ where: { id }, data })
      .catch((e) => handlePrismaError(e, { recordNotFound: "Không tìm thấy ai hết!" }));
  },

  delete(id: number) {
    return prisma.user.delete({ where: { id } }).catch(handlePrismaError);
  },
};
