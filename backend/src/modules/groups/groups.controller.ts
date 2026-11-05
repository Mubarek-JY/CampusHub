import { asyncHandler } from "../../lib/async-handler.js";
import { param } from "../../lib/http.js";
import { currentUser } from "../../middleware/auth.js";
import * as groupsService from "./groups.service.js";

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ group: await groupsService.createGroup(currentUser(req).id, req.body) });
});

export const listMine = asyncHandler(async (req, res) => {
  res.json({ groups: await groupsService.listMyGroups(currentUser(req).id) });
});

export const get = asyncHandler(async (req, res) => {
  res.json({ group: await groupsService.getGroup(param(req, "groupId"), currentUser(req).id) });
});

export const join = asyncHandler(async (req, res) => {
  res.json({ group: await groupsService.joinGroup(currentUser(req).id, req.body.joinCode) });
});

export const leave = asyncHandler(async (req, res) => {
  await groupsService.leaveGroup(param(req, "groupId"), currentUser(req).id);
  res.status(204).send();
});

export const remove = asyncHandler(async (req, res) => {
  await groupsService.deleteGroup(param(req, "groupId"), currentUser(req).id);
  res.status(204).send();
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const member = await groupsService.updateMemberRole(
    param(req, "groupId"),
    currentUser(req).id,
    param(req, "userId"),
    req.body.role,
  );
  res.json({ member });
});

export const removeMember = asyncHandler(async (req, res) => {
  await groupsService.removeMember(param(req, "groupId"), currentUser(req).id, param(req, "userId"));
  res.status(204).send();
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await groupsService.createTask(param(req, "groupId"), currentUser(req).id, req.body);
  res.status(201).json({ task });
});

export const listTasks = asyncHandler(async (req, res) => {
  const tasks = await groupsService.listTasks(param(req, "groupId"), currentUser(req).id, res.locals.query ?? {});
  res.json({ tasks });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await groupsService.updateTask(
    param(req, "groupId"),
    param(req, "taskId"),
    currentUser(req).id,
    req.body,
  );
  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  await groupsService.deleteTask(param(req, "groupId"), param(req, "taskId"), currentUser(req).id);
  res.status(204).send();
});
