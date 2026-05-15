import type { NextFunction, Request, Response } from "express";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();

  req.requestId = requestId
  res.setHeader("x-request-id", requestId);

  next();
};
