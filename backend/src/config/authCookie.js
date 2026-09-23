import { getAppEnvironment } from "./runtimeConfig.js";

export const AUTH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getAuthCookieOptions(env = process.env) {
  const isSecureEnvironment = getAppEnvironment(env) !== "development";
  return {
    httpOnly: true,
    secure: isSecureEnvironment,
    sameSite: isSecureEnvironment ? "none" : "lax",
    path: "/",
    maxAge: AUTH_TOKEN_MAX_AGE_MS,
  };
}

export function getClearAuthCookieOptions(env = process.env) {
  const { maxAge, ...options } = getAuthCookieOptions(env);
  return options;
}
