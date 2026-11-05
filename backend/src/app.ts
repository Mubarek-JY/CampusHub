import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { groupsRouter } from "./modules/groups/groups.routes.js";
import { resourcesRouter } from "./modules/resources/resources.routes.js";
import { messagesRouter } from "./modules/messages/messages.routes.js";
import { calendarRouter } from "./modules/calendar/calendar.routes.js";
import path from "node:path";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static(path.resolve("uploads"), { index: false }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
  });

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/groups", groupsRouter);
  app.use("/api/resources", resourcesRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/calendar", calendarRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
