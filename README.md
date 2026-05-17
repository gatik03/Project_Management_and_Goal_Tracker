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
```

Each employee may have a `managerId`. Manager goal queries are scoped through that relationship, so a manager can only view and act on goals owned by direct reports.

Each goal belongs to one employee through `Goal.employeeId`. Deleting a user cascades to that user's goals. Goals are indexed by `employeeId`, `status`, and reviewer fields for efficient dashboards.

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
