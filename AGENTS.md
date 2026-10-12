# Developer & Agent Guidelines — Atomberg Goal & Performance Tracker

## Project Summary
The **Atomberg Goal & Performance Tracker** is a full-stack monorepo application implementing an enterprise goal-setting and quarterly review workflow for three user roles: Employees, Managers, and Administrators.

## Directory Structure & Important Files
- `client/`: Frontend single-page application built with React 18, Vite, and Tailwind CSS.
  - `src/pages/`: Role-specific views (`EmployeeGoalsPage.jsx`, `ManagerApprovalPage.jsx`, `AdminPortalPage.jsx`, `DashboardPage.jsx`, `LandingPage.jsx`, `LoginPage.jsx`).
  - `src/components/`: Reusable UI modules (`ReportingDashboard.jsx`, `EmployeeQuarterlyPanel.jsx`, `ManagerQuarterlyPanel.jsx`, `AppShell.jsx`).
  - `src/lib/api.js`: Centralized Axios HTTP client configuring credentials and API endpoints.
- `server/`: Backend REST API built with Node.js, Express, and Prisma ORM.
  - `src/server.js`: Entry point initializing Express HTTP server.
  - `src/app.js`: Express middleware pipeline (Helmet, HPP, CORS, rate limiting, JSON parser, cookie parser).
  - `src/modules/`: Domain modularization (`auth`, `goals`, `checkins`, `admin`, `reports`).
  - `src/middleware/`: Authentication and role-based access control (`auth.js`), validation, and audit logging.
  - `prisma/schema.prisma`: Database schemas and relations.
  - `prisma/seed.js`: Initial database seeding script.
- `ARCHITECTURE.md`, `API.md`, `ENVIRONMENT.md`, `DEPLOYMENT.md`: Detailed system documentation.

## Running and Testing
- Install dependencies: `npm install`
- Dev mode: `npm run dev` (starts client on port 5173 and server on port 4000)
- Build check: `npm run build`
- Linter check: `npm run lint`
- Database migration: `npm run prisma:migrate`
- Database seed: `npm run seed`

## Key Business Logic & State Transitions
- **Goal Status Flow**: `DRAFT` -> `SUBMITTED` -> `APPROVED` (locked) or `REWORK_REQUIRED` -> `SUBMITTED`.
- **Goal Constraints**:
  - Minimum goal weightage is 10%.
  - Maximum 8 goals per employee.
  - Total weightage across all goals in a plan must equal exactly 100% to permit submission.
- **Quarterly Check-Ins**:
  - Exactly one check-in per goal per quarter enforced by database constraints `(goalId, quarter)`.
  - Progress formulas are calculated in `server/src/modules/checkins/progress.engine.js`.
- **Role Isolation**:
  - Managers can only view/edit/approve goals belonging to their direct reports (`User.managerId`).
  - Admins can unlock locked goals but must provide an audit justification note.
  - Employees cannot modify goals once submitted unless sent back for rework.

## Sensitive Files & Configuration
- `server/.env` contains sensitive database connection strings and JWT signing secrets. **Never commit `.env` files.** Always configure from `server/.env.example`.
- `server/prisma/dev.db*`: Ignored local SQLite or scratch files if used in dev.

## Important Constraints for AI Agents
1. **Preserve RBAC and Audit Logging**: Any mutation to goals, reviews, or cycles must be authenticated and audited.
2. **Do Not Bypass Zod Schemas**: All incoming API requests must be validated through existing Zod schemas.
3. **Database Migrations**: Whenever changing `prisma/schema.prisma`, generate Prisma client and migration scripts (`npm run prisma:generate`, `npm run prisma:migrate`).
4. **Cookie Security**: Auth cookies require `httpOnly: true`, `sameSite: 'lax'`, and `secure: true` in production.

## UI rules

- Use the semantic colour, type, spacing, radius and motion tokens defined in `docs/design-brief.md`. Keep light and dark values together in CSS variables and wire them into Tailwind. Feature code must not use raw hex colours or one-off pixel values.
- Build actions with the shared `Button` and `IconButton` variants in `client/src/ui`. Do not create one-off button styles or copy utility-class strings across features.
- Every goal state must use `StatusGlyph` with both a glyph and a readable label. Never use colour alone to identify a state.
- Motion budget: one short Plan Bar entrance on first load, about 500 ms. Other motion may only answer an action, should normally finish within 220 ms, and must respect reduced-motion preferences.
- Avoid gradient washes or text, glassmorphism, purple-to-blue gradients, a centred hero with three feature cards, identical shadow cards, icons in tinted squares, KPI-card rows, uppercase tracked eyebrows, middle-dot metadata, “WORD - fragment” labels, tiny monospace labels, arrows appended to links, a single accented headline word, decorative sequence numbers, cream/serif/terracotta styling, black/acid-accent styling, broadsheet hairline decoration, emoji, “Welcome back” and stock illustrations.
