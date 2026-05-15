import type { Request, Response } from "express";
import { register, login } from "@/services/auth.service";
import { env } from "@/config/env";
import { COOKIE } from "@/constants";
import { sendSuccess } from "@/utils/response";

export const registerController = async (req: Request, res: Response) => {
  const user = await register(req.body);
  sendSuccess(res, user, 201);
};

export const loginController = async (req: Request, res: Response) => {
  const { token, user } = await login(req.body);
  res.cookie(COOKIE.TOKEN, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE.MAX_AGE,
  });
  sendSuccess(res, { user });
};

export const logoutController = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE.TOKEN);
  sendSuccess(res, { message: "Logout successfully" });
};
