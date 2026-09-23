import axios from "axios";

const APP_ENVIRONMENTS = new Set(["development", "staging", "production"]);

export function getAppEnvironment(env = process.env) {
  const configuredEnvironment = env.APP_ENV?.trim().toLowerCase();
  const isProductionRuntime =
    env.NODE_ENV === "production" || env.NODE_ENVIRONMENT === "production";
  const appEnvironment =
    configuredEnvironment || (isProductionRuntime ? "production" : "development");

  if (!APP_ENVIRONMENTS.has(appEnvironment)) {
    throw new Error("APP_ENV must be development, staging, or production.");
  }

  return appEnvironment;
}

export function parseAllowedOrigins(value = "") {
  return [...new Set(value.split(",").map((origin) => origin.trim()).filter(Boolean))];
}

export function isOriginAllowed(origin, { appEnvironment, allowedOrigins }) {
  if (!origin || allowedOrigins.includes(origin)) return true;
  if (appEnvironment !== "development") return false;

  try {
    const parsedOrigin = new URL(origin);
    return (
      parsedOrigin.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsedOrigin.hostname)
    );
  } catch {
    return false;
  }
}

export function createCorsOptions(env = process.env) {
  const appEnvironment = getAppEnvironment(env);
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);

  if (appEnvironment !== "development" && allowedOrigins.length === 0) {
    throw new Error(`ALLOWED_ORIGINS must be configured for ${appEnvironment}.`);
  }

  return {
    origin(origin, callback) {
      // Requests without an Origin header do not need CORS response headers.
      if (!origin) return callback(null, false);
      return callback(null, isOriginAllowed(origin, { appEnvironment, allowedOrigins }));
    },
    credentials: true,
  };
}

export function startWebsitePing(env = process.env, dependencies = {}) {
  const websiteUrl = env.WEBSITE_URL?.trim();
  if (!websiteUrl) return null;

  const requestedInterval = Number(env.RELOAD_INTERVAL);
  const intervalMs =
    Number.isFinite(requestedInterval) && requestedInterval > 0
      ? requestedInterval
      : 30000;
  const request = dependencies.request || ((url) => axios.get(url));
  const schedule = dependencies.schedule || setInterval;

  const timer = schedule(() => {
    Promise.resolve().then(() => request(websiteUrl)).catch(() => {});
  }, intervalMs);
  timer?.unref?.();
  return timer;
}