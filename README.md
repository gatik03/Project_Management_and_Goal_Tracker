# Atomberg Goal & Performance Tracker

An enterprise-grade platform designed for organizations to seamlessly manage, align, and track employee goals across all departments. Built with a focus on usability, security, and real-time performance analytics, the platform empowers employees, managers, and administrators to drive organizational success.

## Key Features

### For Employees
*   **Intuitive Goal Setting:** Create and manage quarterly or annual goals with defined metrics, weightages, and clear deadlines.
*   **Draft & Submit Workflow:** Draft goals over time and submit a comprehensive plan (totaling 100% weightage) when ready.
*   **Progress Check-ins:** Update progress quarterly with actual achievements against planned targets, status indicators, and context notes.
*   **Personal Dashboard:** Track personal performance via visual timelines, progress bars, and status badges.

### For Managers
*   **Team Oversight:** View, inline-edit, and manage all goals submitted by direct reports.
*   **Approval Workflows:** Approve goals to lock them in for the quarter, or return them to employees for rework with actionable feedback.
*   **Performance Reviews:** Review quarterly check-ins and add managerial comments to employee progress updates.
*   **Team Analytics:** Access team-wide performance reports and completion tracking dashboards.

### For Administrators
*   **Organization Management:** Oversee the entire organizational hierarchy, user roles, and reporting lines.
*   **Cycle Configuration:** Define and manage quarterly performance cycles.
*   **Goal Unlocking:** Manage exceptions with secure goal unlock workflows that require justification and are fully audited.
*   **Global Analytics:** Access comprehensive reports, goal distribution charts, and export data in CSV or Excel formats.
*   **Security & Auditing:** View immutable audit logs for all administrative actions and critical data mutations.

## Technology Stack

*   **Frontend:** React, Vite, TailwindCSS, Recharts
*   **Backend:** Node.js, Express
*   **Database:** PostgreSQL, Prisma ORM
*   **Authentication:** JWT (JSON Web Tokens) via secure, HTTP-only cookies
*   **Deployment ready:** Docker, Docker Compose, Vercel & Render configurations included

## Enterprise Security Features

The platform is fortified with robust, production-ready security measures suitable for internal corporate networks and external deployments:

*   **HTTP Header Security:** `Helmet` is utilized to secure Express apps by setting various HTTP headers (e.g., Content Security Policy, X-XSS-Protection, Strict-Transport-Security).
*   **Authentication & Session Management:** JWTs are stored in `httpOnly`, `Secure` (in production), and `SameSite` cookies to prevent XSS and CSRF attacks.
*   **Role-Based Access Control (RBAC):** Strict middleware enforcement of `EMPLOYEE`, `MANAGER`, and `ADMIN` roles across all API endpoints.
*   **Rate Limiting & Brute-Force Protection:** Global rate limiting protects APIs against DDoS attacks, with strict endpoint-specific limits (e.g., on `/login`) to prevent credential stuffing and brute-force attacks.
*   **Input Validation:** Strict payload parsing and sanitization using `zod` to prevent injection attacks and guarantee data integrity.
*   **HTTP Parameter Pollution Protection:** `hpp` middleware defends against parameter pollution vulnerabilities.
*   **Cross-Origin Resource Sharing (CORS):** Strictly configured CORS policies ensuring the API only accepts requests from trusted origins.
*   **Comprehensive Audit Logging:** All sensitive state changes and administrative actions are logged immutably, including the actor's identity, timestamp, and the exact state changes (before/after).

## Current Status

Production-ready enterprise full-stack application with completed authentication, goal planning, manager review, quarterly check-in workflows, admin portal, auditing, and analytics reporting.

## Getting Started

### Prerequisites

* Node.js (v18.19.0+)
* PostgreSQL (v14+) or Neon PostgreSQL instance
* Docker & Docker Compose (optional, for containerized deployment)

### Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Update `server/.env` with your PostgreSQL connection string and a secure `JWT_SECRET`.

3. **Database Initialization:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run seed
   ```

4. **Start Development Servers:**
   ```bash
   npm run dev
   ```

* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:4000`

### Important Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both client and server in watch/development mode |
| `npm run dev:client` | Start client only via Vite |
| `npm run dev:server` | Start server only via Nodemon |
| `npm run build` | Build client bundle via Vite and syntax check server |
| `npm run lint` | Run ESLint checks across both client and server workspaces |
| `npm run prisma:generate` | Generate Prisma client bindings |
| `npm run prisma:migrate` | Run database migrations |
| `npm run seed` | Seed database with initial roles, users, and cycle data |

### Testing & Verification

Run the lint suite and production build to verify codebase health:
```bash
npm run lint
npm run build
```

### Demo Credentials

* **Employee:** `employee@atomberg.local` / `Password123!`
* **Manager:** `manager@atomberg.local` / `Password123!`
* **Admin:** `admin@atomberg.local` / `Password123!`

## Architecture & Documentation

For detailed information regarding the system's architecture, APIs, and deployment strategies, please refer to the following documents:

* [Architecture Overview](ARCHITECTURE.md)
* [API Documentation](API.md)
* [Environment Variables](ENVIRONMENT.md)
* [Deployment Guide](DEPLOYMENT.md)
* [Agent Development Context](AGENTS.md)

