import { env } from "@/config/env";
import authRouter from "@/routes/auth.router";
import userRouter from "@/routes/user.router";
// import productRouter from "@/routes/product.router";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { requestIdMiddleware } from "@/middlewares/request-id.middleware";
import { notFoundMiddleware } from "@/middlewares/not-found.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // tối đa 100 request / 15 phút / IP
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true, // Trả về info trong header `RateLimit-*`
  legacyHeaders: false, // Tắt header `X-RateLimit-*` cũ
});

const app = express();
app.use(requestIdMiddleware);
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

app.use("/users", userRouter);
app.use("/auth", authRouter);
// app.use('/products', productRouter)

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
