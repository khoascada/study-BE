import { Request, Response } from "express";
import {
  getAllUsers,
  getUserByIdService,
  createUserService,
  updateUserService,
  deleteUserService,
} from "../services/user.service";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await getUserByIdService(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, age, address } = req.body;
    const user = await createUserService(name, email, age, address);
    return res.status(200).json({ message: "Successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, email, age, address } = req.body;
    const user = await updateUserService(id, name, email, age, address);
    return res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await deleteUserService(id);
    return res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
