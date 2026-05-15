import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  loginController,
  logoutController,
  registerController,
} from "@/controllers/auth.controller";
import { validate } from "@/middlewares/validate";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // tối đa 10 lần / 15 phút / IP
  message: { error: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), registerController);
router.post("/login", authLimiter, validate(loginSchema), loginController);
router.post("/logout", logoutController);

export default router;
