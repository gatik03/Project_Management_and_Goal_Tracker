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
```

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
POST  /manager/goals/:goalId/approve
POST  /manager/goals/:goalId/reject
```

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
