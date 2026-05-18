import { handlePrismaError } from "@/errors/handle-prisma-error";
import prisma from "@/prisma";
import type { CreateProductInput, UpdateProductInput } from "@/schemas/product.schema";

export const productRepository = {
  findAll(args?: { skip?: number; take?: number; orderBy?: Record<string, "asc" | "desc"> }) {
    return prisma.product.findMany({
      skip: args?.skip,
      take: args?.take,
      orderBy: args?.orderBy,
    });
  },

  count() {
    return prisma.product.count();
  },

  findById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        categories: { select: { id: true, name: true } },
        orders: { select: { id: true, quantity: true } },
      },
    });
  },

  create(data: CreateProductInput & { userId: number }) {
    return prisma.product
      .create({ data })
      .catch((e) => handlePrismaError(e, {}));
  },

  update(id: number, data: UpdateProductInput) {
    return prisma.product
      .update({ where: { id }, data })
      .catch((e) => handlePrismaError(e, { recordNotFound: "Product not found" }));
  },

  delete(id: number) {
    return prisma.product
      .delete({ where: { id } })
      .catch((e) => handlePrismaError(e, { recordNotFound: "Product not found" }));
  },
};
