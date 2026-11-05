import { vi } from "vitest";

/**
 * A hand-rolled Prisma double. Tests mock "src/lib/prisma.js" with this so no
 * database (and no generated client) is needed.
 */
const model = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
});

export const prismaMock = {
  user: model(),
  refreshToken: model(),
  group: model(),
  groupMember: model(),
  groupTask: model(),
  resource: model(),
  resourceRating: model(),
  message: model(),
  calendarEvent: model(),
  $disconnect: vi.fn(),
};

export function resetPrismaMock() {
  for (const value of Object.values(prismaMock)) {
    if (typeof value === "function") {
      value.mockReset();
      continue;
    }
    for (const fn of Object.values(value)) fn.mockReset();
  }
}
