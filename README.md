# SprintFlow

A full-stack project management app — projects, tasks, roles, deadlines and metrics — built on the Fusion Starter template (React SPA + Express, single dev server, shared TypeScript types end to end).

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&labelColor=20232a)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6-CA4245?logo=reactrouter&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-components-161618?logo=radixui&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-validation-3E67B1?logo=zod&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?logo=vitest&logoColor=white)
![PNPM](https://img.shields.io/badge/PNPM-package_manager-F69220?logo=pnpm&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-optional-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)

**Tags:** `react` `typescript` `express` `vite` `tailwindcss` `spa` `react-router` `radix-ui` `zod` `vitest` `jwt-auth` `rbac` `project-management` `kanban` `dashboard` `full-stack` `pnpm` `postgresql`

---

## Screenshots

| Landing page | Sign in | Dashboard |
|---|---|---|
| ![Welcome screen](docs/screenshots/01-welcome.png) | ![Sign in screen](docs/screenshots/02-login.png) | ![Project dashboard](docs/screenshots/03-dashboard.png) |

The dashboard shows live project stats, a status donut chart, a mini Kanban board, and a recent-tasks feed, all backed by the Express API.

## Features

- **Auth** — JWT-based login with role-aware access (`ADMIN`, `MANAGER`, `DEVELOPER`); routes are guarded client-side (`ProtectedRoute`) and server-side (`requireAuth` / `requireRole` middleware).
- **Projects** — create, list, update and delete projects, each with members, a deadline and a computed completion percentage.
- **Tasks** — create, update, delete, and comment on tasks; drag tasks between `TODO` / `IN_PROGRESS` / `DONE` from the dashboard's mini Kanban board.
- **Users** — admin-only user management (create, update, delete, role assignment).
- **Metrics** — a live dashboard: total projects/tasks, in-progress count, overdue count, and a task-status distribution chart.
- **Demo mode** — falls back to an in-memory seeded dataset (4 demo users, 1 project, 3 tasks) when no database is configured, so the app runs with zero setup.
- **Optional PostgreSQL** — set `DATABASE_URL` and the server persists users to Postgres instead of memory (auto-creates the table and seeds it on first boot).

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 18 · React Router 6 (SPA, hash routing) · TypeScript · TailwindCSS 3 · Radix UI · TanStack Query · Recharts |
| Backend | Express 5, integrated into the Vite dev server on a single port |
| Validation | Zod schemas shared between client expectations and server input handling |
| Auth | JSON Web Tokens (`jsonwebtoken`), bcrypt-less salted hashing for demo passwords |
| Data | In-memory store by default, optional PostgreSQL (`pg`) |
| Testing | Vitest |
| Tooling | Vite 7, SWC, Prettier, pnpm |

## Getting started

```bash
pnpm install
pnpm dev
```

The app runs at whatever port Vite prints (defaults to `5173` unless `PORT` is set) — both the React frontend and the Express API (`/api/*`) are served from that single port.

### Demo accounts

Sign in with any seeded user and the password `password`:

| Email | Role |
|---|---|
| `alex.admin@example.com` | ADMIN |
| `morgan.manager@example.com` | MANAGER |
| `devon.dev@example.com` | DEVELOPER |
| `riley.dev@example.com` | DEVELOPER |

### Other scripts

```bash
pnpm build      # production build (client + server bundles)
pnpm start      # run the production build
pnpm test       # run the Vitest suite
pnpm typecheck  # TypeScript project-wide check
pnpm format.fix # Prettier
```

### Optional: PostgreSQL

By default the app seeds and stores users in memory (data resets on restart). To persist to Postgres instead, set `DATABASE_URL` in `.env`:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/sprintflow
```

On boot the server creates the `users` table if it doesn't exist and seeds the same four demo accounts.

## Project structure

```
client/                   # React SPA frontend
├── pages/                # Route components (Intro, Login, Index/Dashboard, Projects, Tasks, Users)
├── components/
│   ├── ui/                # Radix + Tailwind component library
│   ├── layout/AppLayout   # App shell: header nav, role-aware links, sign in/out
│   └── ProtectedRoute     # Client-side route guard
├── hooks/useAuth.tsx      # Auth context: login/logout, token persistence, /api/auth/me refresh
├── lib/api.ts             # Small fetch wrapper (auth header, JSON, error surfacing)
└── App.tsx                # Router + providers setup

server/                   # Express API backend
├── index.ts               # App factory: middleware, route registration
├── node-build.ts          # Production entrypoint (serves dist/spa + API)
├── db/client.ts           # Optional PostgreSQL client (users table)
├── middleware/authMiddleware.ts  # requireAuth / requireRole
└── routes/                # auth, users, projects, tasks, metrics, demo, validation (Zod), store (in-memory db + seed)

shared/                   # Types shared by client & server (User, Project, Task, DTOs, metrics)
```

## API overview

All endpoints are under `/api`. Public GETs allow the dashboard to render without signing in; writes require a bearer token, and some require a specific role.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Log in with email + password, returns `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Resolve the current user from a token |
| GET / POST | `/api/projects` | POST needs ADMIN/MANAGER | List / create projects |
| GET / PATCH / DELETE | `/api/projects/:id` | PATCH: ADMIN/MANAGER, DELETE: ADMIN | Read, update, delete a project |
| GET / POST | `/api/tasks` | POST needs ADMIN/MANAGER | List (filterable by `projectId`, `assigneeId`, `status`) / create tasks |
| GET / PATCH / DELETE | `/api/tasks/:id` | Bearer | Read, update, delete a task |
| POST | `/api/tasks/:id/comments` | Bearer | Add a comment to a task |
| GET / POST | `/api/users` | POST needs ADMIN | List / create users |
| GET / PATCH / DELETE | `/api/users/:id` | ADMIN | Read, update, delete a user |
| GET | `/api/metrics` | — | Aggregate dashboard metrics |
| GET | `/api/ping` | — | Health check |

## Path aliases

- `@/*` → `client/*`
- `@shared/*` → `shared/*`

## Deployment

`pnpm build` produces `dist/spa` (static frontend) and `dist/server` (Express server). Deploy either as a Node process (`pnpm start`) or to Netlify/Vercel.
