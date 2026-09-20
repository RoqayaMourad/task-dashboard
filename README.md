# Task Management Dashboard

A Kanban-style task management dashboard built with Angular 21 for the Senior Angular Developer assignment: task CRUD, search/filtering, drag-and-drop status changes, and a small analytics dashboard, backed by a mock JSON Server API.

## Features

- Create, edit, and delete tasks through a reactive form with validation
- Real-time search across title and description
- Filter by status, priority, and assignee
- Kanban board (To Do / In Progress / Done) with drag-and-drop status changes
- Dashboard with stat cards, a recent activity feed, and priority/status charts
- Analytics page with the same charts, full-size
- Team page listing assignable users
- Loading, error, retry, and empty states throughout
- Responsive layout with a mobile nav drawer

Calendar and Settings exist as nav destinations only. See [Known Limitations](#known-limitations).

## Tech Stack

Angular 21 (standalone components, Signals, `httpResource`) · TypeScript · Tailwind CSS v4 · PrimeNG · Angular CDK Drag & Drop · Chart.js · JSON Server · Vitest · ESLint / Prettier / Husky + lint-staged

## Getting Started

### Prerequisites

Node.js `^20.19.0 || ^22.12.0 || >=24.0.0` and npm `^6.11.0 || ^7.5.6 || >=8.0.0` (Angular 21's own engine requirement).

### Installation

```bash
npm install
```

### Running locally

**Terminal 1** (mock API):

```bash
npm run mock-api
```

**Terminal 2** (dev server):

```bash
npm start
```

Open `http://localhost:4200`. The dev server proxies `/api/*` to JSON Server on port 3000 (`proxy.conf.json`), so `/api/tasks`, `/api/statistics`, and `/api/users` all just work.

### Scripts

| Script                            | Description                    |
| --------------------------------- | ------------------------------ |
| `npm start`                       | Angular dev server (port 4200) |
| `npm run mock-api`                | JSON Server (port 3000)        |
| `npm run build`                   | Production build               |
| `npm test`                        | Run unit tests                 |
| `npm run test:coverage`           | Run tests with coverage        |
| `npm run lint` / `lint:fix`       | ESLint                         |
| `npm run format` / `format:check` | Prettier                       |

## Architecture

- Standalone components throughout, no `NgModule`s
- Every feature route is lazy-loaded via `loadComponent()`
- Smart/presentational split: `TaskBoardPage`/`DashboardPage` own state and injection; `TaskCard`, `TaskColumn`, `StatCard`, etc. only take inputs and emit outputs
- `TaskStore`'s `httpResource` (`GET /api/tasks`) is the single authoritative task collection; no external state library. Search, filters, and Kanban grouping are `computed()` derivations over it, never a second copy. Mutations reconcile the server's response back into the resource
- A small, explicit allowlist of GET endpoints is cached by an interceptor; task mutations invalidate the entry they affect
- JSON Server sits behind the Angular dev proxy, so the app only ever calls `/api/*`
- OnPush everywhere, tracked `@for` loops by id, and Signal-based derivations keep re-renders targeted

## Technical Decisions

- **Kanban ordering**: To Do/In Progress sort by due date ascending, Done sorts by completion time descending. This matches the pattern in the supplied Figma reference rather than being arbitrary.
- **Drag-and-drop changes status only.** Manual reordering within a column is not persisted because the task model has no order/position field.
- **Overdue state is derived from `dueDate` and status** rather than the generated fixture `isOverdue` value.
- **`completedAt`** is set and cleared by one function covering all four status-transition cases, used identically whether a task is completed via the edit form or by dragging it into Done.
- **Stat cards vs. task data**: the dashboard's four stat cards come from the supplied `/statistics` fixture as-is; the board, charts, and activity feed are derived from `/tasks`. They're independent datasets, so creating/editing/deleting a task doesn't recompute the stat cards.
- **Mock data**: `mock-api/db.json` is committed and ready to use; normal setup only needs `npm run mock-api`. `mock-api:build` regenerates it from the assignment's own data generator, which lives outside this repo, so that script isn't part of normal setup. Its dates are relative to when it was generated, so labels like "overdue by 2 days" will drift over time.

## Design & UX

- The supplied desktop Figma design is the source of truth for layout and styling. No mobile/tablet design was supplied, so those breakpoints were built by adapting the desktop layout, as the assignment asks.
- Assignee filtering isn't in the Figma but is required by the assignment, so it was added using the existing filter dropdown's style.
- The topbar avatar is a generic icon; there's no authentication or current-user concept in this assignment.
- Keyboard users can change a task's status from the Edit dialog instead of dragging.
- Accessible labels and errors (`aria-invalid`/`aria-describedby`), managed focus on dialogs/menus/the mobile drawer, `aria-hidden` decorative icons, contrast-checked badge colors, and a reduced-motion guard.

## Testing

- Vitest, via Angular's own test builder
- 80% global coverage threshold (statements/branches/functions/lines)
- 261 tests across 33 spec files. Statements 95.95%, Branches 97.62%, Functions 89.17%, Lines 97.18%
- ESLint + Prettier, enforced on commit via Husky/lint-staged
- GitHub Actions runs formatting, lint, tests with coverage, and the production build on every push and pull request

## Known Limitations

- Dashboard stat cards don't update from task CRUD (separate fixture; see Technical Decisions)
- Calendar and Settings are unimplemented nav placeholders
- No authentication or current-user system
- No persisted manual reordering within a column
- Mock data dates drift over time without regeneration (generator not included)
