import { env } from "@/config/env";
import { AppError } from "@/errors";
import type { NextFunction, Request, Response } from "express";

export const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[${req.requestId}]`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
  }

  const message = env.NODE_ENV === "production" ? "Internal server error" : err.message;

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      statusCode: 500,
      message,
    },
  });
};
