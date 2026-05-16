import redis from "@/config/redis";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { REDIS_KEY } from "../constants";
import { UnauthorizedError } from "../errors";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // lấy token (AT + RT)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new UnauthorizedError("No token provided");

  // decode
  const decoded = jwt.verify(token, env.JWT_SECRET) as {
    id: number;
    email: string;
    role: string;
    jti: string;
  };

  const isBlacklisted = await redis.exists(REDIS_KEY.blacklist(decoded.jti));
  if (isBlacklisted) throw new UnauthorizedError("Token has been revoked");

  req.user = decoded;

  next();
};
