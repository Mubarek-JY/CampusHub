import { asyncHandler } from "../../lib/async-handler.js";
import { param } from "../../lib/http.js";
import { currentUser } from "../../middleware/auth.js";
import * as resourcesService from "./resources.service.js";
import { AppError } from "../../lib/errors.js";
import { uploadResourceSchema } from "./resources.schemas.js";

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ resource: await resourcesService.createResource(currentUser(req).id, req.body) });
});

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest("A file is required");
  const body = req.body as Record<string, string | undefined>;
  let tags: unknown = [];
  try { tags = body.tags ? JSON.parse(body.tags) : []; } catch { throw AppError.badRequest("Tags must be a JSON array"); }
  const parsed = uploadResourceSchema.safeParse({
    ...body,
    tags,
    isPublic: body.isPublic !== "false",
  });
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Request validation failed", parsed.error.flatten());
  const resource = await resourcesService.createUploadedResource(currentUser(req).id, parsed.data, req.file);
  res.status(201).json({ resource, filePath: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` });
});

export const list = asyncHandler(async (req, res) => {
  res.json({ resources: await resourcesService.listResources(currentUser(req).id, res.locals.query ?? {}) });
});

export const get = asyncHandler(async (req, res) => {
  res.json({ resource: await resourcesService.getResource(param(req, "resourceId"), currentUser(req).id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ resource: await resourcesService.updateResource(param(req, "resourceId"), currentUser(req).id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await resourcesService.deleteResource(param(req, "resourceId"), currentUser(req).id);
  res.status(204).send();
});

export const rate = asyncHandler(async (req, res) => {
  res.json({ resource: await resourcesService.rateResource(param(req, "resourceId"), currentUser(req).id, req.body.value) });
});
