import { asyncHandler } from "../../lib/async-handler.js";
import { currentUser } from "../../middleware/auth.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.register(req.body));
});

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body));
});

export const refresh = asyncHandler(async (req, res) => {
  res.json(await authService.refresh(req.body.refreshToken));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: await authService.getProfile(currentUser(req).id) });
});

export const updateMe = asyncHandler(async (req, res) => {
  res.json({ user: await authService.updateProfile(currentUser(req).id, req.body) });
});
