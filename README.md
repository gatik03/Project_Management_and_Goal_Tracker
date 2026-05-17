# Goal Setting & Tracking Portal

Enterprise-grade goal setting and tracking portal built phase-by-phase for a hackathon.

## Phase 1 Scope

This phase creates the project foundation only:

- React + Vite + TailwindCSS frontend
- Node.js + Express backend
- PostgreSQL data model managed by Prisma
- Axios API client
- Backend health-check route
- Light corporate dashboard shell
- Reusable UI components
- Environment-based configuration

Authentication, goal workflows, quarterly check-ins, reporting, audit logs, and advanced role-specific screens are intentionally left for later phases.

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

## Frontend and Backend Communication

The frontend uses an Axios client in `client/src/lib/api.js`. The base URL comes from `VITE_API_BASE_URL`, which should point to the Express API namespace:

```text
VITE_API_BASE_URL=http://localhost:4000/api
```

The backend enables CORS for `CLIENT_ORIGIN`, so the Vite dev server can call the Express server during local development.

## Architecture Notes

- The monorepo keeps frontend and backend separated while allowing one install and shared scripts.
- Backend code is organized by domain modules so future modules can be added without crowding route files.
- Prisma owns database access and migrations to keep schema changes auditable.
- The first UI phase keeps dashboard data static while proving layout, styling, API configuration, and server structure.
