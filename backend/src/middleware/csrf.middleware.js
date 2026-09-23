import { getAppEnvironment, isOriginAllowed, parseAllowedOrigins } from "../config/runtimeConfig.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getRequestOrigin(req) {
  const origin = req.get("origin");
  if (origin) return origin;
  const referer = req.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function isAuthMutation(pathname) {
  return /(?:^|\/)auth(?:\/|$)/.test(pathname);
}

export function createCsrfProtection(env = process.env) {
  const policy = {
    appEnvironment: getAppEnvironment(env),
    allowedOrigins: parseAllowedOrigins(env.ALLOWED_ORIGINS),
  };

  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) return next();

    const hasAuthCookie = Boolean(req.cookies?.token);
    if (!hasAuthCookie && !isAuthMutation(req.path)) return next();

    const origin = getRequestOrigin(req);
    if (!origin || !isOriginAllowed(origin, policy)) {
      return res.status(403).json({ message: "Request origin is not allowed." });
    }

    next();
  };
}

export default createCsrfProtection;
