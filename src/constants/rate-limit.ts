export const RATE_LIMIT = {
  GLOBAL: { windowMs: 15 * 60 * 1000, max: 100 },
  AUTH: { windowMs: 15 * 60 * 1000, max: 10 },
} as const;
