export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const COOKIE = {
  TOKEN: "token",
  MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
} as const;

export const BCRYPT = {
  SALT_ROUNDS: 10,
} as const;

export const TOKEN_TTL = {
  ACCESS: 15 * 60, // 15 phút (giây)
  REFRESH: 7 * 24 * 3600, // 7 ngày (giây)
} as const;

export const REDIS_KEY = {
  refreshToken: (userId: number, jti: string) => `refresh:${userId}:${jti}`,
  blacklist: (jti: string) => `blacklist:${jti}`,
} as const;

export { ROLES } from "./roles";
export type { Role } from "./roles";
export { AUTH } from "./auth";
export { RATE_LIMIT } from "./rate-limit";
