import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { z } from "zod";
import { AppError } from "../lib/errors.js";

type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/**
 * Validates and replaces req.body / req.params with parsed values.
 * Parsed query is stored on res.locals.query (req.query is read-only in Express 5).
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, res, next) => {
    for (const key of ["body", "params", "query"] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return next(
          new AppError(400, "VALIDATION_ERROR", "Request validation failed", z.flattenError(result.error)),
        );
      }
      if (key === "query") res.locals.query = result.data;
      else (req as unknown as Record<string, unknown>)[key] = result.data;
    }
    next();
  };
