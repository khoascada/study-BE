import { env } from "@/config/env";
import { ConflictError, UnauthorizedError } from "@/errors";
import prisma from "@/prisma";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";

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

  const hashedPassword = await bcrypt.hash(data.password, 10);

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

  // tạo JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

  return { token, user: { id: user.id, email: user.email, name: user.name } };
};
