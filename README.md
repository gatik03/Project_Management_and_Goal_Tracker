# Goal Setting & Tracking Portal

Enterprise-grade goal setting and tracking portal built phase-by-phase for a hackathon.

## Phase 1 Scope

Phase 1 created the project foundation:

- React + Vite + TailwindCSS frontend
- Node.js + Express backend
- PostgreSQL data model managed by Prisma
- Axios API client
- Backend health-check route
- Light corporate dashboard shell
- Reusable UI components
- Environment-based configuration

Goal workflows, quarterly check-ins, reporting, audit logs, and advanced role-specific screens are intentionally left for later phases.

## Phase 2 Scope

Phase 2 adds authentication and role access only:

- PostgreSQL `User` schema with `EMPLOYEE`, `MANAGER`, and `ADMIN` roles
- Password hashing with `bcryptjs`
- JWT generation after login
- Secure httpOnly JWT cookie storage
- Session persistence through `/api/auth/me`
- Logout through `/api/auth/logout`
- Protected route middleware
- Role-based access middleware
- Seed users for all three roles
- Professional login page and role-aware dashboard shell

Goals are not implemented in this phase.

## Phase 3 Scope

Phase 3 adds employee goal creation only:

- `Goal` database model related to `User`
- Employee-only CRUD APIs for draft goals
- Create, edit, and delete draft goals
- Save-as-draft behavior
- Submit goal plan when draft weightage totals exactly 100%
- Maximum 8 goals per employee
- Minimum 10% weightage per goal
- Modern employee dashboard with cards, table, progress indicator, and create/edit modal

Manager approvals, admin goal controls, check-ins, reports, and audit logs are not implemented in this phase.

## Phase 4 Scope

Phase 4 adds the employee-to-manager approval workflow:

- Employees can submit editable goals when total weightage is exactly `100%`.
- Submitted goals become read-only for employees.
- Managers can view submitted goals for their direct reports.
- Managers can edit target and weightage inline before approval.
- Managers can approve goals.
- Managers can reject goals and send them back as `REWORK_REQUIRED`.
- Approved goals store a lock timestamp and cannot be edited by employees.
- Approval status badges are shown across employee and manager views.

Admin approval controls, quarterly check-ins, reporting, and audit logs are not implemented in this phase.

## Phase 5 Scope

Phase 5 adds quarterly check-ins:

- Employees can update quarterly progress for submitted, approved, or locked goals.
- Each update tracks planned target, actual achievement, status, and an employee note.
- Status options are `NOT_STARTED`, `ON_TRACK`, and `COMPLETED`.
- Managers can review direct-report quarterly updates and add comments.
- Employee and manager dashboards include quarterly timeline cards and progress bars.
- Progress calculations are centralized in the backend progress engine.

Reporting and audit logs are not implemented in this phase.

## Phase 6 Scope

Phase 6 adds the admin portal:

- Admin dashboard with analytics cards
- User management for roles, active status, and reporting managers
- Organization hierarchy view
- Goal unlock workflow
- Completion tracking dashboard
- Quarterly cycle configuration
- Audit log table
- Admin-only REST APIs
- Audit logging for admin data mutations

## Phase 7 Scope

Phase 7 adds reporting and analytics:

- Achievement reports
- CSV export
- Excel-compatible export
- Team completion dashboard
- Progress analytics
- Goal distribution charts
- Quarterly trend charts
- Filterable reporting by department, goal status, and quarter
- Recharts-based frontend visualization

## Phase 8 Scope

Phase 8 adds production polish and deployment preparation:

- Shared toast notifications
- Reusable confirmation dialog
- Improved workflow error handling
- Production API compression
- API rate limiting
- Dockerfiles and Docker Compose
- Vercel frontend configuration
- Render backend blueprint
- Architecture, API, environment, and deployment documentation

Additional docs:

```text
ARCHITECTURE.md
API.md
ENVIRONMENT.md
DEPLOYMENT.md
```

## Folder Structure

```text
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI and layout components
│   │   ├── lib/            # API client and helpers
│   │   ├── pages/          # Page-level views
│   │   └── App.jsx
│   └── tailwind.config.js
├── server/                 # Express backend
│   ├── prisma/             # Prisma schema and seed
│   └── src/
│       ├── config/         # Environment configuration
│       ├── middleware/     # Express middleware
│       ├── modules/        # Domain modules
│       └── server.js
└── package.json            # npm workspaces
```

## Setup Commands

1. Install dependencies:

```bash
npm install
```

2. Configure environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Update `server/.env` with your PostgreSQL connection string.

4. Generate Prisma client and run the first migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed demo users:

```bash
npm run seed
```

6. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Demo Users

```text
Employee: employee@atomberg.local / Password123!
Manager:  manager@atomberg.local  / Password123!
Admin:    admin@atomberg.local    / Password123!
```

## Frontend and Backend Communication

The frontend uses an Axios client in `client/src/lib/api.js`. The base URL comes from `VITE_API_BASE_URL`, which should point to the Express API namespace:

```text
VITE_API_BASE_URL=http://localhost:4000/api
```

The backend enables CORS for `CLIENT_ORIGIN`, so the Vite dev server can call the Express server during local development.

Axios is configured with `withCredentials: true` so the browser sends the httpOnly JWT cookie to the API on authenticated requests.

## JWT Flow

1. The user submits email and password from the login page.
2. The frontend calls `POST /api/auth/login`.
3. The backend validates the payload, finds the user, and compares the password with the stored bcrypt hash.
4. On success, the backend signs a JWT with the user id as `sub` and role in the payload.
5. The JWT is written to an httpOnly cookie, so client-side JavaScript cannot read it.
6. On refresh, the frontend calls `GET /api/auth/me`.
7. The auth middleware verifies the JWT cookie, loads the active user, and attaches it to `request.user`.
8. Logout calls `POST /api/auth/logout`, which clears the cookie.

## Middleware Logic

- `requireAuth` checks for a JWT in the httpOnly cookie, with Bearer token support kept for API tooling.
- It verifies the token signature using `JWT_SECRET`.
- It loads the active user from PostgreSQL through Prisma.
- It rejects missing, expired, invalid, or inactive-user sessions with `401`.
- `requireRole(...roles)` checks `request.user.role` and rejects unauthorized roles with `403`.

## Role Permissions

```text
EMPLOYEE: ACCESS_EMPLOYEE_PORTAL
MANAGER:  ACCESS_EMPLOYEE_PORTAL, ACCESS_MANAGER_PORTAL
ADMIN:    ACCESS_EMPLOYEE_PORTAL, ACCESS_MANAGER_PORTAL, ACCESS_ADMIN_PORTAL
```

The current dashboard redirects users into the correct role-aware shell after login. Future modules should wrap sensitive APIs with `requireAuth` and `requireRole`.

## Phase 3 API Structure

All goal APIs are protected by `requireAuth` and `requireRole("EMPLOYEE")`.

```text
GET    /api/employee/goals          List current employee goals
POST   /api/employee/goals          Create a draft goal
PUT    /api/employee/goals/:goalId  Edit a draft goal
DELETE /api/employee/goals/:goalId  Delete a draft goal
POST   /api/employee/goals/submit   Submit the draft goal plan
```

## Phase 4 Manager API Structure

All manager APIs are protected by `requireAuth` and `requireRole("MANAGER")`.

```text
GET   /api/manager/goals                   List direct-report submitted goals
PATCH /api/manager/goals/:goalId           Inline edit target and/or weightage
POST  /api/manager/goals/:goalId/approve   Approve and lock a goal
POST  /api/manager/goals/:goalId/reject    Return a goal for rework
```

## Phase 5 Quarterly API Structure

Employee APIs:

```text
GET /api/employee/check-ins
PUT /api/employee/check-ins/:goalId/:quarter
```

Manager APIs:

```text
GET  /api/manager/check-ins
POST /api/manager/check-ins/:checkInId/comment
```

## Phase 6 Admin API Structure

All admin APIs are protected by `requireAuth` and `requireRole("ADMIN")`.

```text
GET   /api/admin/dashboard
GET   /api/admin/users
PATCH /api/admin/users/:userId
GET   /api/admin/hierarchy
GET   /api/admin/goals/unlockable
POST  /api/admin/goals/:goalId/unlock
GET   /api/admin/audit-logs
GET   /api/admin/cycle-configs
POST  /api/admin/cycle-configs
```

## Phase 7 Reporting API Structure

Reporting APIs are protected by `requireAuth` and `requireRole("MANAGER", "ADMIN")`.

```text
GET /api/reports/dashboard
GET /api/reports/export.csv
GET /api/reports/export.xls
```

Supported query filters:

```text
department
status
quarter
```

Managers see only direct-report data. Admins see organization-wide data.

## Phase 7 Reporting Architecture

Reporting logic lives in `server/src/modules/reports`.

- `report.routes.js` exposes dashboard and export endpoints.
- `report.service.js` builds scoped Prisma queries and aggregation datasets.
- `export.service.js` converts report rows into CSV and Excel-compatible HTML table output.
- `ReportingDashboard.jsx` renders filters, analytics cards, Recharts charts, and export buttons.

## Phase 7 Query Optimization

- The reporting service builds a single scoped `where` clause based on the authenticated role.
- Manager queries filter through `goal.employee.managerId`, preventing cross-team data access.
- Admin queries reuse the same aggregation shape without manager scoping.
- Prisma includes only the related employee and check-in fields required for reporting.
- Existing indexes on goal status, employee id, quarterly status, and quarter support common filters.

## Phase 7 Export Generation

- CSV export returns `text/csv` with `Content-Disposition: attachment`.
- Excel export returns an Excel-compatible `.xls` HTML table using `application/vnd.ms-excel`.
- Exports use the same filters and security scope as dashboard analytics, so exported rows match visible report data.

## Phase 6 Audit Architecture

Audit logging is attached through `server/src/middleware/audit.js`. The middleware adds `request.audit(...)`, and admin services call it after successful mutations.

Each audit record captures:

- `actorId` and `actorEmail`
- action, such as `USER_UPDATED`, `GOAL_UNLOCKED`, or `CYCLE_CONFIG_UPDATED`
- entity type and entity id
- old value as JSON
- new value as JSON
- timestamp

Audit logs are stored in the `AuditLog` table and shown in the admin portal.

## Phase 6 Admin Security

- All admin routes require a valid JWT session.
- All admin routes require the `ADMIN` role.
- Admin user updates do not expose or modify passwords.
- Manager assignment requires the selected manager to be an active manager.
- Audit logs are created only after successful admin mutations.

## Phase 6 Unlock Workflow

1. Admin opens the Goal Unlocks panel.
2. Admin chooses a submitted, approved, or locked goal.
3. Admin provides an unlock reason.
4. Backend changes the goal to `REWORK_REQUIRED`.
5. Backend clears `lockedAt`.
6. The employee can edit and resubmit the goal through the existing employee workflow.
7. The old goal state, new goal state, admin identity, and timestamp are written to audit logs.

## Phase 5 Progress Formulas

Progress is calculated in `server/src/modules/checkins/progress.engine.js`.

```text
Achievement / Target % = actualAchievement / plannedTarget * 100
Target / Achievement = plannedTarget / actualAchievement
```

Zero-based logic:

- If planned target is `0` and actual achievement is `0`, progress is `0%`.
- If planned target is `0` and actual achievement is greater than `0`, progress is treated as `100%`.
- If actual achievement is `0`, target-to-achievement ratio is `0` unless planned target is also `0`.
- Progress bars cap visual progress at `100%`, while the numeric percentage can show overachievement.

Timeline completion logic:

```text
completionPercent = completedQuarters / 4 * 100
isComplete = all 4 quarters are COMPLETED
```

## Goal Validation Logic

- Each goal must include title, description, thrust area, UoM type, target, weightage, and deadline.
- Each goal weightage must be at least `10%`.
- Employees can create at most `8` goals.
- Employees can save incomplete draft plans while building their goals.
- Submission is allowed only when the total draft weightage equals exactly `100%`.
- Submitted goals are read-only for employees in this phase.

## Database Relationships

```text
Manager User 1 ─── * Employee User
Employee User 1 ─── * Goal
Goal 1 ─── * QuarterlyCheckIn
Admin Action 1 ─── * AuditLog
```

Each employee may have a `managerId`. Manager goal queries are scoped through that relationship, so a manager can only view and act on goals owned by direct reports.

Each goal belongs to one employee through `Goal.employeeId`. Deleting a user cascades to that user's goals. Goals are indexed by `employeeId`, `status`, and reviewer fields for efficient dashboards.

Each quarterly check-in belongs to one goal. The database enforces one check-in per goal per quarter with a unique `(goalId, quarter)` constraint.

Audit logs are append-only records of admin changes. Quarterly cycle configuration is stored separately in `QuarterlyCycleConfig` with a unique `(year, quarter)` constraint.

## Phase 5 Quarterly Workflow

1. Employee submits a 100% goal plan.
2. Quarterly check-in cards become available for submitted, approved, or locked goals.
3. Employee updates planned target, actual achievement, status, and optional note for each quarter.
4. Backend calculates progress and timeline completion.
5. Manager reviews direct-report quarterly updates.
6. Manager adds comments to created quarterly check-ins.

## Phase 4 State Transitions

```text
DRAFT -> SUBMITTED
SUBMITTED -> APPROVED
SUBMITTED -> REWORK_REQUIRED
REWORK_REQUIRED -> SUBMITTED
APPROVED -> REWORK_REQUIRED
```

`APPROVED` goals are treated as locked because `lockedAt` is set during approval. The `LOCKED` status exists in the database model for future hard-lock workflow phases.

## Phase 4 Security Checks

- Employees can create goals only while their plan is editable.
- Employees can edit/delete only `DRAFT` or `REWORK_REQUIRED` goals.
- Employees cannot edit `SUBMITTED`, `APPROVED`, or `LOCKED` goals.
- Managers can see only goals for users where `User.managerId` equals the manager's id.
- Managers can inline edit only `SUBMITTED` or `REWORK_REQUIRED` goals.
- Managers cannot approve or reject goals outside their direct-report team.

## Architecture Notes

- The monorepo keeps frontend and backend separated while allowing one install and shared scripts.
- Backend code is organized by domain modules so future modules can be added without crowding route files.
- Prisma owns database access and migrations to keep schema changes auditable.
- The first UI phase keeps dashboard data static while proving layout, styling, API configuration, and server structure.
