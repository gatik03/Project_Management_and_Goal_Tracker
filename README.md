# Goal tracker

Goal tracker is a full-stack workspace for weighted employee goals, manager reviews, quarterly check-ins and HR administration. An employee can submit a plan when its goal weights total exactly 100%. Managers review direct reports; HR administrators manage people, cycles, goal unlocks and the audit trail.

The interface gives each role a focused workspace. Plans show the exact weight and review state; managers work through direct reports; administrators use separate routes for people, hierarchy, cycles, unlocks, and audit history. The public example Plan Bar can be rebalanced without saving.

| Plan at desktop width | Plan at phone width |
| --- | --- |
| ![Goal tracker employee plan on desktop](docs/ui/after/plan-light-1536.png) | ![Goal tracker employee plan on phone](docs/ui/after/plan-light-390.png) |

| Team review | Reports in dark mode |
| --- | --- |
| ![Goal tracker manager review](docs/ui/after/team-light-1536.png) | ![Goal tracker reports on phone in dark mode](docs/ui/after/admin-reports-dark-390.png) |

The [design brief](docs/design-brief.md) explains the Plan Bar, visual tokens, interaction rules, and layout decisions. [Before screenshots](docs/ui/before/) and [after screenshots](docs/ui/after/) show every main route at four widths in both themes. [UI critique](docs/ui/critique.md) records the changes made after screenshot and accessibility review.

## Stack

- Client: React 18, Vite 5, Tailwind CSS 3.4 and Recharts.
- Server: Node.js, Express and Prisma.
- Database: PostgreSQL.
- Sign-in: JWT in an HTTP-only cookie with role checks on protected API routes.

## Run locally

Use Node.js 18.19 or newer and PostgreSQL 14 or newer. Copy `server/.env.example` to `server/.env`, then set `DATABASE_URL` and a development `JWT_SECRET`. Copy `client/.env.example` to `client/.env`; its `/api` base URL uses the Vite development proxy.

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run seed:demo
npm run dev
```

The client runs at `http://localhost:5173` and the API at `http://localhost:4000`. Open `/` for the interactive example or `/login` to sign in. Set `VITE_DEMO_MODE=true` in `client/.env` and restart Vite to make the public role chooser sign in as the seeded demo accounts; leave it false for a regular sign-in link. The interface remembers a manual light/dark choice and otherwise follows the system preference.

Run `npm run prisma:deploy` again after pulling server changes so an existing local database has the latest committed migrations. `npm run seed:demo` uses the existing schema and refuses to run when `NODE_ENV=production`. It upserts a repeatable local fixture with 28 users, 92 goals, quarterly progress and audit history. It is intended for a development database: re-running it restores its owned demo records and marks the current quarter active.

The three primary demo accounts share the development password `Password123!`:

| Role | Email |
| --- | --- |
| Employee | `employee@atomberg.local` |
| Manager | `manager@atomberg.local` |
| HR administrator | `admin@atomberg.local` |

Use `npm run seed` for the original minimal three-user seed. Run `npm run lint` and `npm run build` before committing.

## Frontend checks

With the client and API running, `node client/scripts/verify-ui.mjs` captures responsive light/dark screenshots and runs axe on every main route. Use `UI_BASE_URL` to point it at another local origin and `CHROME_PATH` if Brave is not installed at `/usr/bin/brave-browser`. It uses six demo sign-ins, so run it against a fresh local API process if its login limiter has already seen other tests. `npm run test:contrast --workspace client` checks text and control contrast for both themes; `npm run test:ui --workspace client` checks Plan Bar transfer rules.

`UI_E2E_MUTATE_DEMO=true node client/scripts/flow-check.mjs` exercises create, rebalance, submit, send-back, resubmit, approve, admin unlock, report filtering and CSV export. Run it only against a disposable seeded demo database; it changes goals and writes immutable audit records.

The production build starts with **88.4 kB gzipped JavaScript**; the reports chart code loads only on `/reports`. Lighthouse mobile scores from the production preview are **97 performance / 100 accessibility on `/login`** and **95 performance / 100 accessibility on `/plan`**. The `/plan` audit used a demo session cookie passed through Lighthouse's local extra-headers file.

## Backend checks

The integration suite requires a separate PostgreSQL database whose name ends in `_test`; it refuses any other database. With Docker, start the test service, then run the tests:

```bash
docker compose --profile test up -d postgres_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/goal_tracker_test?schema=public npm test
```

Tests apply pending migrations and truncate the dedicated database before each case. `npm run prisma:migrate` creates development migrations; `npm run prisma:deploy` applies committed migrations in deployment. Existing `init` migrations have been left intact. Audit rows reject UPDATE and DELETE through a PostgreSQL trigger; a database administrator can still truncate during recovery or test resets. API writes require an allowed Origin, and cookie-authenticated writes also send `X-Requested-With: XMLHttpRequest`.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [API routes and filters](API.md)
- [Environment variables](ENVIRONMENT.md)
- [Deployment](DEPLOYMENT.md)
- [Agent guidelines](AGENTS.md)
