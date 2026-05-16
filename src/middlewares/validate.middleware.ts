import { ValidationError } from "@/errors";
import type { NextFunction, Request, Response } from "express";

export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success)
      throw new ValidationError("validation_failed", result.error.flatten().fieldErrors);
    req.body = result.data;
    next();
  };
};
