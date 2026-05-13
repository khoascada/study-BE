import { Request, Response } from "express";
import { register, login } from "../services/auth.service";

export const registerController = async (req: Request, res: Response) => {
  try {
    const user = await register(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
