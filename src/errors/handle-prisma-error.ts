import { Prisma } from "@prisma/client";
import { ConflictError, NotFoundError } from "@/errors";
import { PRISMA_ERROR_CODES } from "@/errors/prisma-errors";

interface PrismaErrorMessages {
  uniqueConstraint?: string;
  recordNotFound?: string;
}

export const handlePrismaError = (
  error: unknown,
  messages: PrismaErrorMessages = {},
): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT)
      throw new ConflictError(messages.uniqueConstraint ?? "Resource already exists");
    if (error.code === PRISMA_ERROR_CODES.RECORD_NOT_FOUND)
      throw new NotFoundError(messages.recordNotFound ?? "Record not found");
  }
  throw error;
};
