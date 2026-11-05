# CampusHub frontend

A responsive React + TypeScript frontend for the CampusHub university collaboration API. This project lives in `frontend/` and consumes the existing backend; it does not implement or modify backend routes. Tailwind CSS styles the interface, and `components.json` configures the shadcn/ui component conventions and aliases; the reusable UI primitives are kept in `src/components/ui/`.

## Requirements

- Node.js 20.19+ or 22.12+ (Vite 7 requirement)
- npm
- CampusHub API running locally or a configured API URL

## Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The Vite development server is configured for `http://localhost:5173`. The backend must allow this exact CORS origin. Set `VITE_API_URL` in `.env` to the backend origin; it defaults to `http://localhost:4000`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 5173 |
| `npm run build` | Run strict TypeScript project checks and build production assets |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run format` | Format files with Prettier |
| `npm run format:check` | Check Prettier formatting |

## Implemented screens

- **Authentication:** registration and login with client-side Zod validation, server field-error mapping, and graceful handling of rate-limit errors.
- **Dashboard:** group cards, create-group dialog, and join-by-code dialog.
- **Group workspace:** Tasks (three-column Kanban board, drag/drop, mobile status selector, assignee filter, edit/create/delete, priority and overdue indicators), Members (owner role changes and role-aware member removal), and Settings (invite code, leave, owner-only deletion).
- **Profile:** view and update profile fields.
- **Resources:** Each group has a Resources tab for sharing links, notes, and files up to 10 MB, with search, ratings, and deletion of your own resources.
- **Messages:** Group conversation history and message sending.
- **Calendar:** Personal and group event creation, display, and deletion.

## Authentication and API behavior

- The access token is held in module memory; it is not written to browser storage.
- The refresh token is held in `localStorage` under `campushub.refreshToken`.
- On app startup the client rotates the stored refresh token through `POST /api/auth/refresh`, stores the returned refresh token immediately, and then calls `GET /api/auth/me`.
- Protected requests that receive a 401 share a single in-flight refresh promise and retry the original request once. Refresh failure clears both tokens and the authenticated user.
- Logout attempts `POST /api/auth/logout`, ignores network/API failures, clears local auth state, and clears the TanStack Query cache.
- API errors are normalized to `ApiError` with HTTP status, server code, message, and field errors.

## Project structure

```text
src/
├── app/                    # Route tree, guards, not-found page, error boundary
├── components/
│   ├── layout/             # Authenticated app shell and sidebar
│   └── ui/                 # Reusable buttons, cards, fields, dialogs, states
├── features/
│   ├── auth/               # Auth context and login/register screens
│   ├── dashboard/          # Group list and group actions
│   ├── groups/             # Group tabs, task board, members, settings
│   ├── profile/             # Profile editor
│   └── placeholders/       # No-API coming-soon screens
├── hooks/                  # Toast provider
├── lib/
│   ├── api/                # Typed endpoint functions, client, schemas, tokens
│   └── query/              # TanStack Query client
└── test/                   # Vitest setup
```

## API contract assumptions

All requests use JSON and the documented `/api/auth`, `/api/groups`, and `/api/groups/:groupId/tasks` routes only. The frontend treats group-route 404 responses as inaccessible or not found. The API contract does not define a task-level permission endpoint, password-reset route, group ownership transfer, or resource/message/calendar endpoints; none are invented here.

## Tests

The test suite covers refresh-token rotation serialization (including the rotated token being persisted), login form submission, and changing a task's status through the accessible status selector used as the drag-and-drop fallback.
