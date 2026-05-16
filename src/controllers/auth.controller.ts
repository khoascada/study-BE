import { login, logout, register, renewTokens } from "@/services/auth.service";
import { UnauthorizedError } from "@/errors";
import { sendSuccess } from "@/utils/response";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

export const registerController = async (req: Request, res: Response) => {
  const user = await register(req.body);
  sendSuccess(res, user, 201);
};

export const loginController = async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await login(req.body);
  // TODO: chuyển sang cookie sau khi chốt strategy
  sendSuccess(res, { accessToken, refreshToken, user });
};

export const logoutController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const atJti = req.user?.jti;
  const { refreshToken } = req.body;

  if (!userId || !atJti) throw new UnauthorizedError("Unauthorized");

  // tính TTL còn lại của AT để blacklist đúng thời gian
  const atPayload = jwt.decode(req.headers.authorization!.slice(7)) as { exp: number } | null;
  const atTtl = atPayload ? atPayload.exp - Math.floor(Date.now() / 1000) : 0;

  await logout(userId, atJti, atTtl, refreshToken);
  sendSuccess(res, { message: "Logout successfully" });
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await renewTokens(refreshToken);
  sendSuccess(res, result);
};
