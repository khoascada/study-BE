import { userRepository } from "@/repositories/user.repository";

export const getAllUsers = () => userRepository.findAll();

export const getUserByIdService = (id: number) => userRepository.findById(id);

export const createUserService = (name: string, email: string, age: number, address: string) =>
  userRepository.create({ name, email, age, address });

export const updateUserService = (id: number, name: string, email: string, age: number, address: string) =>
  userRepository.update(id, { name, email, age, address });

export const deleteUserService = (id: number) => userRepository.delete(id);
