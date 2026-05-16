import { env } from "@/config/env";
import redis from "@/config/redis";
import { BCRYPT, REDIS_KEY, TOKEN_TTL } from "@/constants";
import { ConflictError, UnauthorizedError } from "@/errors";
import prisma from "@/prisma";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

export const signAccessToken = (payload: { id: number; email: string; role: string }) => {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti }, env.JWT_SECRET, {
    expiresIn: TOKEN_TTL.ACCESS,
  });
  return { token, jti };
};

export const signRefreshToken = (payload: { id: number }) => {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti }, env.JWT_SECRET, {
    expiresIn: TOKEN_TTL.REFRESH,
  });
  return { token, jti };
};

export const register = async (data: RegisterInput) => {
  // check email exists
  const existing = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existing) {
    throw new ConflictError("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, BCRYPT.SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
    },
    select: { id: true, email: true, name: true }, // không trả về password
  });

  // return user + token
  return user;
};

export const login = async (data: LoginInput) => {
  // tìm user theo email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (!user || !user.password) throw new UnauthorizedError("Invalid credentials");

  // so sánh password
  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new UnauthorizedError("Invalid credentials");

  const { token: accessToken } = signAccessToken({ id: user.id, email: user.email, role: "USER" });
  const { token: refreshToken, jti: rt_jti } = signRefreshToken({ id: user.id });

  // redis RT
  await redis.setex(REDIS_KEY.refreshToken(user.id, rt_jti), TOKEN_TTL.REFRESH, "1");

  return { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } };
};

export const logout = async (
  userId: number,
  atJti: string,
  atTtl: number,
  refreshToken: string,
) => {
  // decode RT để lấy rt_jti — không cần verify vì chỉ cần jti để xóa Redis
  const decoded = jwt.decode(refreshToken) as { jti: string } | null;
  if (decoded?.jti) {
    await redis.del(REDIS_KEY.refreshToken(userId, decoded.jti));
  }

  // blacklist AT với TTL còn lại
  if (atTtl > 0) {
    await redis.setex(REDIS_KEY.blacklist(atJti), atTtl, "1");
  }
};

export const renewTokens = async (refreshToken: string) => {
  // verify RT — tự throw nếu expired hoặc chữ ký sai
  const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { id: number; jti: string };

  // check RT còn trong Redis không (chưa bị revoke/rotation)
  const exists = await redis.exists(REDIS_KEY.refreshToken(decoded.id, decoded.jti));
  if (!exists) throw new UnauthorizedError("Refresh token revoked");

  // lấy thông tin user để sign AT mới
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new UnauthorizedError("User not found");

  // rotation: xóa RT cũ
  await redis.del(REDIS_KEY.refreshToken(decoded.id, decoded.jti));

  // sign AT + RT mới
  const { token: newAccessToken } = signAccessToken({
    id: user.id,
    email: user.email,
    role: "USER",
  });
  const { token: newRefreshToken, jti: newRtJti } = signRefreshToken({ id: user.id });

  // lưu RT mới vào Redis
  await redis.setex(REDIS_KEY.refreshToken(user.id, newRtJti), TOKEN_TTL.REFRESH, "1");

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
