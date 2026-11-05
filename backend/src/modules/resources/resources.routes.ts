import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./resources.controller.js";
import {
  createResourceSchema,
  listResourcesQuery,
  rateResourceSchema,
  resourceParams,
  updateResourceSchema,
} from "./resources.schemas.js";
import { resourceUpload } from "./upload.js";

export const resourcesRouter = Router();

resourcesRouter.use(requireAuth);
resourcesRouter.post("/", validate({ body: createResourceSchema }), controller.create);
resourcesRouter.post("/upload", resourceUpload.single("file"), controller.upload);
resourcesRouter.get("/", validate({ query: listResourcesQuery }), controller.list);
resourcesRouter.get("/:resourceId", validate({ params: resourceParams }), controller.get);
resourcesRouter.patch("/:resourceId", validate({ params: resourceParams, body: updateResourceSchema }), controller.update);
resourcesRouter.delete("/:resourceId", validate({ params: resourceParams }), controller.remove);
resourcesRouter.post("/:resourceId/rating", validate({ params: resourceParams, body: rateResourceSchema }), controller.rate);
