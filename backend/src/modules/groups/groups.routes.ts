import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./groups.controller.js";
import {
  createGroupSchema,
  createTaskSchema,
  groupParams,
  joinGroupSchema,
  listTasksQuery,
  memberParams,
  taskParams,
  updateMemberRoleSchema,
  updateTaskSchema,
} from "./groups.schemas.js";

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

groupsRouter.post("/", validate({ body: createGroupSchema }), controller.create);
groupsRouter.get("/", controller.listMine);
groupsRouter.post("/join", validate({ body: joinGroupSchema }), controller.join);

groupsRouter.get("/:groupId", validate({ params: groupParams }), controller.get);
groupsRouter.delete("/:groupId", validate({ params: groupParams }), controller.remove);
groupsRouter.post("/:groupId/leave", validate({ params: groupParams }), controller.leave);

groupsRouter.patch(
  "/:groupId/members/:userId",
  validate({ params: memberParams, body: updateMemberRoleSchema }),
  controller.updateMemberRole,
);
groupsRouter.delete("/:groupId/members/:userId", validate({ params: memberParams }), controller.removeMember);

groupsRouter.post(
  "/:groupId/tasks",
  validate({ params: groupParams, body: createTaskSchema }),
  controller.createTask,
);
groupsRouter.get(
  "/:groupId/tasks",
  validate({ params: groupParams, query: listTasksQuery }),
  controller.listTasks,
);
groupsRouter.patch(
  "/:groupId/tasks/:taskId",
  validate({ params: taskParams, body: updateTaskSchema }),
  controller.updateTask,
);
groupsRouter.delete("/:groupId/tasks/:taskId", validate({ params: taskParams }), controller.deleteTask);
