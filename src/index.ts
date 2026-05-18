import { env } from "@/config/env";
import logger from "@/config/logger";
import { RATE_LIMIT } from "@/constants";
import redis from "@/config/redis";
import authRouter from "@/routes/auth.router";
import healthRouter from "@/routes/health.router";
import userRouter from "@/routes/user.router";
import productRouter from "@/routes/product.router";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { notFoundMiddleware } from "@/middlewares/not-found.middleware";
import { requestIdMiddleware } from "@/middlewares/request-id.middleware";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { requireAuth } from "./middlewares/auth.middleware";

const httpLogger = pinoHttp({
  logger,
  // Dùng lại req.requestId đã gán từ requestIdMiddleware thay vì tạo id mới
  genReqId: (req) => (req as express.Request).requestId ?? crypto.randomUUID(),
  // Chỉ log khi response hoàn tất (không log từng chunk)
  autoLogging: true,
  // Customize fields ghi vào log
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

const globalLimiter = rateLimit({
  ...RATE_LIMIT.GLOBAL,
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.use(requestIdMiddleware);
app.use(httpLogger);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(globalLimiter);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Prisma Practice API" });
});

app.use(healthRouter);
app.use("/users", requireAuth, userRouter);
app.use("/auth", authRouter);
app.use('/products', productRouter)

app.use(notFoundMiddleware);
app.use(errorMiddleware);

async function start() {
  await redis.connect();
  app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
  });
}

start();
