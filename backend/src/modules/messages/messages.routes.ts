import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./messages.controller.js";
import { createMessageSchema, listMessagesQuery, messageParams } from "./messages.schemas.js";

export const messagesRouter = Router();
messagesRouter.use(requireAuth);
messagesRouter.get("/", validate({ query: listMessagesQuery }), controller.list);
messagesRouter.post("/", validate({ body: createMessageSchema }), controller.create);
messagesRouter.delete("/:messageId", validate({ params: messageParams }), controller.remove);
