import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

export type AuthUser = { id: string; role: "STUDENT" | "ADMIN" };

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(AppError.unauthorized());

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired access token"));
  }
};

export const requireRole =
  (...roles: AuthUser["role"][]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };

/** Returns the authenticated user or throws; use inside handlers behind requireAuth. */
export function currentUser(req: Express.Request & { user?: AuthUser }): AuthUser {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}
