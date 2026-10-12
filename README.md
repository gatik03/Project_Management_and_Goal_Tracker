# Goal tracker

Goal tracker is a full-stack workspace for weighted employee goals, manager reviews, quarterly check-ins and HR administration. An employee can submit a plan when its goal weights total exactly 100%. Managers review direct reports; HR administrators manage people, cycles, goal unlocks and the audit trail.

These screenshots show the current interface before the redesign. See the [design brief](docs/design-brief.md) for the planned UI direction and the complete [before screenshots](docs/ui/before/).

| 1440 px baseline | 390 px baseline |
| --- | --- |
| ![Employee plan before the redesign at desktop width](docs/ui/before/employee-desktop.png) | ![Employee plan before the redesign at phone width](docs/ui/before/employee-phone.png) |

## Stack

- Client: React 18, Vite 5, Tailwind CSS 3.4 and Recharts.
- Server: Node.js, Express and Prisma.
- Database: PostgreSQL.
- Sign-in: JWT in an HTTP-only cookie with role checks on protected API routes.

## Run locally

Use Node.js 18.19 or newer and PostgreSQL 14 or newer. Copy `server/.env.example` to `server/.env`, then set `DATABASE_URL` and a development `JWT_SECRET`. Copy `client/.env.example` to `client/.env` and set `VITE_API_BASE_URL=http://localhost:4000/api`.

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed:demo
npm run dev
```

The client runs at `http://localhost:5173` and the API at `http://localhost:4000`. `npm run seed:demo` uses the existing schema and refuses to run when `NODE_ENV=production`. It upserts a repeatable local fixture with 28 users, 92 goals, quarterly progress and audit history. It is intended for a development database: re-running it restores its owned demo records and marks the current quarter active.

The three primary demo accounts share the development password `Password123!`:

| Role | Email |
| --- | --- |
| Employee | `employee@atomberg.local` |
| Manager | `manager@atomberg.local` |
| HR administrator | `admin@atomberg.local` |

Use `npm run seed` for the original minimal three-user seed. Run `npm run lint` and `npm run build` before committing.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [API routes and filters](API.md)
- [Environment variables](ENVIRONMENT.md)
- [Deployment](DEPLOYMENT.md)
- [Agent guidelines](AGENTS.md)
