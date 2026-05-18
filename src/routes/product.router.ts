import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", requireAuth, validate(createProductSchema), createProduct);
router.put("/:id", requireAuth, validate(updateProductSchema), updateProduct);
router.delete("/:id", requireAuth, deleteProduct);

export default router;
