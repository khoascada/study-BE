import { toUserDetailDto, toUserDto } from "@/dtos/user.dto";
import { NotFoundError } from "@/errors";
import { userRepository } from "@/repositories/user.repository";
import type { CreateUserInput, UpdateUserInput } from "@/schemas/user.schema";
import { buildMeta, parsePagination, type PaginationQuery } from "@/utils/pagination";

const USER_SORT_FIELDS = ["id", "name", "email", "createdAt"];

export const getAllUsers = async (query: PaginationQuery) => {
  const { skip, take, page, orderBy } = parsePagination(query, USER_SORT_FIELDS);

  const [users, total] = await Promise.all([
    userRepository.findAll({ skip, take, orderBy }),
    userRepository.count(),
  ]);

  return {
    data: users.map(toUserDto),
    meta: buildMeta(total, page, take),
  };
};

export const getUserByIdService = async (id: number) => {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError("User not found");
  return toUserDetailDto(user);
};

export const createUserService = (data: CreateUserInput) =>
  userRepository.create(data);

export const updateUserService = (id: number, data: UpdateUserInput) =>
  userRepository.update(id, data);

export const deleteUserService = (id: number) => userRepository.delete(id);
