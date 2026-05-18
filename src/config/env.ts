import "dotenv/config";
import pino from "pino";
import { z } from "zod";

// Minimal bootstrap logger — cannot import from logger.ts (circular: logger → env → logger)
const bootLogger = pino({ transport: { target: "pino-pretty", options: { colorize: true } } });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  bootLogger.error({ errors: parsed.error.flatten().fieldErrors }, "Invalid environment variables");
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
