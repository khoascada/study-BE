import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { createUserSchema } from "../schemas/user.schema";
const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", validate(createUserSchema), createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
