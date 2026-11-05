import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { generateRefreshToken, hashToken, signAccessToken } from "../../lib/tokens.js";
import type { LoginInput, RegisterInput, UpdateProfileInput } from "./auth.schemas.js";

const BCRYPT_COST = env.NODE_ENV === "test" ? 4 : 12;
// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);

/** Never select passwordHash into API responses. */
export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  university: true,
  department: true,
  yearOfStudy: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
} as const;

type TokenSubject = { id: string; role: "STUDENT" | "ADMIN" };

async function issueTokens(user: TokenSubject) {
  const { token, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken: token,
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict("An account with this email already exists");

  const { password, ...profile } = input;
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: { ...profile, passwordHash },
    select: publicUserSelect,
  });

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

export async function login(input: LoginInput) {
  const found = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = await bcrypt.compare(input.password, found?.passwordHash ?? DUMMY_HASH);
  if (!found || !passwordOk) throw AppError.unauthorized("Invalid email or password");

  const { passwordHash: _omit, ...user } = found;
  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

/**
 * Rotating refresh tokens: each token is single-use. Presenting an already-used
 * token is treated as theft and revokes every active session for that user.
 */
export async function refresh(refreshToken: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!record) throw AppError.unauthorized("Invalid refresh token");

  if (record.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw AppError.unauthorized("Refresh token reuse detected; please sign in again");
  }
  if (record.expiresAt < new Date()) throw AppError.unauthorized("Refresh token expired");

  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  return issueTokens(record.user);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw AppError.notFound("User not found");
  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return prisma.user.update({ where: { id: userId }, data: input, select: publicUserSelect });
}
