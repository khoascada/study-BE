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
