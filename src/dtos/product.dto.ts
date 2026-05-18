import type { Category, Order, Product } from "@prisma/client";

export type ProductDto = {
  id: number;
  name: string;
  description: string | null;
};

export type ProductDetailDto = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  userId: number;
  categories: Pick<Category, "id" | "name">[];
  orders: Pick<Order, "id" | "quantity">[];
};

export const toProductDto = (
  product: Pick<Product, "id" | "name" | "description">,
): ProductDto => ({
  id: product.id,
  name: product.name,
  description: product.description,
});

export const toProductDetailDto = (
  product: Product & { categories: Pick<Category, "id" | "name">[] } & {
    orders: Pick<Order, "id" | "quantity">[];
  },
): ProductDetailDto => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  stock: product.stock,
  userId: product.userId,
  categories: product.categories.map(({ id, name }) => ({ id, name })),
  orders: product.orders.map(({ id, quantity }) => ({ id, quantity })),
});
