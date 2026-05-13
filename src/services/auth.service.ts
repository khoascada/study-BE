import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = async (data: RegisterInput) => {
  // check email exists
  const existing = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existing) {
    throw new Error("Email already exists");
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
  if (!user || !user.password) throw new Error("Invalid credentials");

  // so sánh password
  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  // tạo JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

  return { token, user: { id: user.id, email: user.email, name: user.name } };
};
