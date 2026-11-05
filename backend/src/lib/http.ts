import type { Request } from "express";
import { AppError } from "./errors.js";

/** Reads a route param, failing loudly instead of returning undefined. */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw AppError.badRequest(`Missing route parameter: ${name}`);
  }
  return value;
}
