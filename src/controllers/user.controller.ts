import type { Request, Response } from "express";
import { NotFoundError } from "@/errors";
import {
  createUserService,
  deleteUserService,
  getAllUsers,
  getUserByIdService,
  updateUserService,
} from "@/services/user.service";
import { sendSuccess } from "@/utils/response";

export const getUsers = async (_req: Request, res: Response) => {
  const users = await getAllUsers();
  sendSuccess(res, users);
};

export const getUserById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await getUserByIdService(id);
  if (!user) throw new NotFoundError("User not found");
  sendSuccess(res, user);
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, age, address } = req.body;
  const user = await createUserService(name, email, age, address);
  sendSuccess(res, user, 201);
};

export const updateUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, age, address } = req.body;
  const user = await updateUserService(id, name, email, age, address);
  sendSuccess(res, user);
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await deleteUserService(id);
  sendSuccess(res, user);
};
