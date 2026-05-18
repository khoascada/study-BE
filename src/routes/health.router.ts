import prisma from "@/prisma";
import redis from "@/config/redis";
import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

router.get("/ready", async (_req: Request, res: Response) => {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const db = checks[0].status === "fulfilled";
  const cache = checks[1].status === "fulfilled";
  const ready = db && cache;

  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "degraded",
    checks: {
      db: db ? "ok" : "fail",
      cache: cache ? "ok" : "fail",
    },
  });
});

export default router;
