# API Documentation

Base URL:

```text
/api
```

## Auth

```text
POST /auth/login
GET  /auth/me
POST /auth/logout
GET  /auth/permissions
GET  /cycles/active
```

## Notifications (employee and manager)

```text
GET   /notifications?limit=20&cursor=<notification-id>
PATCH /notifications/:id/read
POST  /notifications/read-all
```

The list returns `{ notifications, nextCursor, unreadCount }`, newest first. Each notification includes a title, detail, actor name, destination path, creation time and optional read time. Mark-read actions only affect the signed-in recipient and are audited. New notifications begin with actions after the notification migration; historic audit rows are not backfilled.

## Employee Goals

```text
GET    /employee/goals
POST   /employee/goals
PUT    /employee/goals/:goalId
DELETE /employee/goals/:goalId
POST   /employee/goals/submit
```

## Manager Goals

```text
GET   /manager/goals
PATCH /manager/goals/:goalId
PUT   /manager/employees/:employeeId/weights
POST  /manager/goals/:goalId/approve
POST  /manager/goals/:goalId/reject
```

`PUT /manager/employees/:employeeId/weights` accepts `{ "changes": [{ "goalId": "<uuid>", "weightage": 45, "expectedUpdatedAt": "<ISO timestamp>" }, ...] }` for at least two goals. It returns `{ goals }`. All changed goals must belong to the manager's direct report and be submitted or returned for rework. The entire plan must finish at exactly 100%; approved and locked weights cannot change. A stale timestamp, a hidden draft goal, or an ineligible state returns 409. The update, per-goal audit rows and employee notification commit together.

## Quarterly Check-ins

```text
GET /employee/check-ins
PUT /employee/check-ins/:goalId/:quarter

GET  /manager/check-ins
POST /manager/check-ins/:checkInId/comment
```

## Admin

```text
GET   /admin/dashboard
GET   /admin/users
PATCH /admin/users/:userId
GET   /admin/hierarchy
GET   /admin/goals/unlockable
POST  /admin/goals/:goalId/unlock
GET   /admin/audit-logs
GET   /admin/cycle-configs
POST  /admin/cycle-configs
```

## Reports

```text
GET /reports/dashboard
GET /reports/export.csv
GET /reports/export.xls
```

`/reports/export.xls` remains the existing route for client compatibility, but now returns a real `.xlsx` workbook with the matching MIME type and filename. CSV and spreadsheet cells that begin with formula markers are escaped. Export requests exceeding 2,000 rows return 413; narrow the filters and retry.

The existing JSON arrays remain unchanged. `GET /employee/goals`, `GET /manager/goals`, and `GET /admin/users` accept optional `limit` (1–100) and UUID `cursor` query parameters. `GET /admin/audit-logs` accepts the same parameters and defaults to 100 rows. Pass the last returned row's `id` as the next cursor. The reporting dashboard keeps its existing object shape; its `achievementRows` list is limited to 200 recent rows while `summary` totals cover the full filtered set.

Supported report filters:

```text
department
status
quarter
```
