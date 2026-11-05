import { asyncHandler } from "../../lib/async-handler.js";
import { param } from "../../lib/http.js";
import { currentUser } from "../../middleware/auth.js";
import * as calendarService from "./calendar.service.js";
export const list = asyncHandler(async (req, res) => res.json({ events: await calendarService.listEvents(currentUser(req).id, res.locals.query ?? {}) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ event: await calendarService.createEvent(currentUser(req).id, req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ event: await calendarService.updateEvent(param(req, "eventId"), currentUser(req).id, req.body) }));
export const remove = asyncHandler(async (req, res) => { await calendarService.deleteEvent(param(req, "eventId"), currentUser(req).id); res.status(204).send(); });
