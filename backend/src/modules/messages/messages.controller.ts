import { asyncHandler } from "../../lib/async-handler.js";
import { param } from "../../lib/http.js";
import { currentUser } from "../../middleware/auth.js";
import * as messagesService from "./messages.service.js";

export const list = asyncHandler(async (req, res) => {
  res.json({ messages: await messagesService.listMessages(currentUser(req).id, res.locals.query ?? {}) });
});
export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ message: await messagesService.createMessage(currentUser(req).id, req.body) });
});
export const remove = asyncHandler(async (req, res) => {
  await messagesService.deleteMessage(param(req, "messageId"), currentUser(req).id);
  res.status(204).send();
});
