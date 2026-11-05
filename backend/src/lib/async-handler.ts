import type { NextFunction, Request, RequestHandler, Response } from "express";

// Express 5 forwards rejected promises to the error handler, but this keeps
// handler signatures explicit and typed in one place.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
