import { getContext } from "@/utils/context";
import pino from "pino";
import { env } from "@/config/env";

const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: ["*.password", "*.token", "req.headers.authorization", "req.headers.cookie"],
    censor: "[Redacted]",
  },
  // Tự động gắn requestId vào mọi log entry nếu đang trong request context
  mixin: () => {
    const ctx = getContext();
    return ctx ? { requestId: ctx.requestId } : {};
  },
  ...(env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;
