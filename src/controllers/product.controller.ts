import {
  createProductService,
  deleteProductService,
  getAllProducts,
  getProductByIdService,
  updateProductService,
} from "@/services/product.service";
import { sendSuccess } from "@/utils/response";
import type { Request, Response } from "express";

export const getProducts = async (req: Request, res: Response) => {
  const result = await getAllProducts(req.query);
  sendSuccess(res, result);
};

export const getProductById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await getProductByIdService(id);
  sendSuccess(res, result);
};

export const createProduct = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const product = await createProductService(req.body, userId);
  sendSuccess(res, product, 201);
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const product = await updateProductService(id, req.body);
  sendSuccess(res, product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const product = await deleteProductService(id);
  sendSuccess(res, product);
};
