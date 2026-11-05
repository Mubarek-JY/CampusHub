# CampusHub Backend

API for a university student platform: academic collaboration, group assignments, resource sharing, messaging, and a calendar.

**Stack:** Node 22, Express 5, TypeScript, Prisma 7 + PostgreSQL, Zod, JWT access tokens + rotating refresh tokens, Vitest + Supertest.

## Status

| Area | Schema | API |
| --- | --- | --- |
| Auth & profiles | done | **done** |
| Groups, members, tasks | done | **done** |
| Resource sharing | done | **done** |
| Messaging (group + DM) | done | **done** |
| Calendar | done | **done** |

## Getting started

```bash
cp .env.example .env          # then set JWT_ACCESS_SECRET (32+ chars)
docker compose up -d          # PostgreSQL on :5432
npm install
npx prisma generate           # builds src/generated/prisma (git-ignored)
npx prisma migrate dev --name init
npm run dev                   # http://localhost:4000
```

```bash
npm test          # no database needed; Prisma is mocked
npm run typecheck # needs `prisma generate` first
npm run build && npm start
```

## Layout

```
prisma/schema.prisma        all models for the five feature areas
src/config/env.ts           validated environment
src/lib/                    prisma client, tokens, errors, helpers
src/middleware/             auth, validation, error handling
src/modules/<feature>/      schemas -> service -> controller -> routes
tests/                      Vitest + Supertest, Prisma mocked
```

Each module follows the same shape: Zod `schemas`, a `service` holding all business rules and DB access, a thin `controller`, and `routes`.

## API

All responses are JSON. Errors look like `{ "error": { "code", "message", "details?" } }`.

### Auth (`/api/auth`)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/register` | returns `{ user, accessToken, refreshToken }` |
| POST | `/login` | same shape |
| POST | `/refresh` | body `{ refreshToken }`; rotates the token |
| POST | `/logout` | body `{ refreshToken }`; revokes it |
| GET / PATCH | `/me` | profile (Bearer token) |

Refresh tokens are single-use. Re-presenting a used token revokes all of that user's sessions.

### Groups (`/api/groups`, Bearer token required)

| Method | Path | Who |
| --- | --- | --- |
| POST | `/` | any user; creator becomes OWNER |
| GET | `/` | groups I belong to |
| POST | `/join` | body `{ joinCode }` |
| GET | `/:groupId` | members; join code visible to admins/owner only |
| DELETE | `/:groupId` | owner |
| POST | `/:groupId/leave` | members (not the owner) |
| PATCH | `/:groupId/members/:userId` | owner; body `{ role: "ADMIN" \| "MEMBER" }` |
| DELETE | `/:groupId/members/:userId` | admin+ (admins can't remove admins) |
| POST / GET | `/:groupId/tasks` | members; GET accepts `?status=&assigneeId=` |
| PATCH | `/:groupId/tasks/:taskId` | members |
| DELETE | `/:groupId/tasks/:taskId` | task creator or admin+ |

Non-members receive `404` for group routes so group existence isn't leaked.

### Resources (`/api/resources`, ****** required)

Resources support `LINK`, `FILE`, and `NOTE` types. Links require `url`; notes require `content`.
Files can be uploaded as multipart form data and are stored locally under `uploads/` with a
10 MB limit and a document/image allowlist.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/` | Create a resource; optional `groupId`, `tags`, `courseName`, and `isPublic` |
| POST | `/upload` | Upload a file with multipart field `file` and resource metadata |
| GET | `/` | List visible resources; accepts `type`, `courseName`, `groupId`, and `search` |
| GET | `/:resourceId` | Get a visible resource |
| PATCH | `/:resourceId` | Uploader only |
| DELETE | `/:resourceId` | Uploader only |
| POST | `/:resourceId/rating` | Upsert a 1-5 rating |

### Messages (`/api/messages`, ****** required)

Messages target exactly one group or direct recipient. Group messages require membership;
direct-message history includes messages sent in either direction.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | List messages; accepts `groupId`, `recipientId`, and `before` |
| POST | `/` | Send a message with exactly one of `groupId` or `recipientId` |
| DELETE | `/:messageId` | Sender only |

### Calendar (`/api/calendar`, ****** required)

Users can create personal events or share events with a group. Group events are visible to
group members; only the event owner can update or delete an event.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | List personal and group events; accepts `from`, `to`, and `groupId` |
| POST | `/` | Create an event |
| PATCH | `/:eventId` | Owner only |
| DELETE | `/:eventId` | Owner only |

## Notes

- Prisma is pinned to 7.10.1 (stable). Prisma 8 is still a release candidate on npm.
- Resource ratings are validated to 1-5. Local uploads are suitable for development; production deployments should move file storage to object storage.
