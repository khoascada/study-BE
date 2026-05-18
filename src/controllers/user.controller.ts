import type { Request, Response } from "express";
import {
  createUserService,
  deleteUserService,
  getAllUsers,
  getUserByIdService,
  updateUserService,
} from "@/services/user.service";
import { sendSuccess } from "@/utils/response";

export const getUsers = async (req: Request, res: Response) => {
  const result = await getAllUsers(req.query);
  sendSuccess(res, result);
};

export const getUserById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await getUserByIdService(id);
  sendSuccess(res, user);
};

export const createUser = async (req: Request, res: Response) => {
  const user = await createUserService(req.body);
  sendSuccess(res, user, 201);
};

export const updateUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await updateUserService(id, req.body);
  sendSuccess(res, user);
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await deleteUserService(id);
  sendSuccess(res, user);
};
