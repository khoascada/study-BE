import {
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
} from "@/controllers/auth.controller";
import { validate } from "@/middlewares/validate.middleware";
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from "@/schemas/auth.schema";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middlewares/auth.middleware";

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
router.post("/logout", requireAuth, validate(logoutSchema), logoutController);
router.post("/refresh-token", validate(refreshTokenSchema), refreshTokenController);

export default router;
