import { toProductDetailDto, toProductDto } from "@/dtos/product.dto";
import { NotFoundError } from "@/errors";
import { productRepository } from "@/repositories/product.repository";
import type { CreateProductInput, UpdateProductInput } from "@/schemas/product.schema";
import { buildMeta, parsePagination, type PaginationQuery } from "@/utils/pagination";

const PRODUCT_SORT_FIELDS = ["id", "name", "price", "createdAt"];

export const getAllProducts = async (query: PaginationQuery) => {
  const { skip, take, page, orderBy } = parsePagination(query, PRODUCT_SORT_FIELDS);

  const [products, total] = await Promise.all([
    productRepository.findAll({ skip, take, orderBy }),
    productRepository.count(),
  ]);

  return {
    data: products.map(toProductDto),
    meta: buildMeta(total, page, take),
  };
};

export const getProductByIdService = async (id: number) => {
  const product = await productRepository.findById(id);
  if (!product) throw new NotFoundError("Product not found");
  return toProductDetailDto(product);
};

export const createProductService = (data: CreateProductInput, userId: number) =>
  productRepository.create({ ...data, userId });

export const updateProductService = (id: number, data: UpdateProductInput) =>
  productRepository.update(id, data);

export const deleteProductService = (id: number) => productRepository.delete(id);
