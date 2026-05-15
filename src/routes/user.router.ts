import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../schemas/user.schema";
const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", validate(createUserSchema), createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
