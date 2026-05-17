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

Supported report filters:

```text
department
status
quarter
```
