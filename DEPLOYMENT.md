# Deployment Guide

## Frontend: Vercel

1. Import the repository into Vercel.
2. Set root directory to `client`.
3. Set environment variable:

```env
VITE_API_BASE_URL=/api
```

4. Build command:

```bash
npm run build
```

5. Output directory:

```text
dist
```

Before deploying, replace the clearly marked `REPLACE_WITH_RENDER_SERVICE` host in `client/vercel.json` with the actual Render hostname. Keep its `/api/:path*` rule before the SPA fallback. Vercel proxies `/api` on the frontend origin to Render, so the auth cookie remains first-party. Do not leave the placeholder in a live deployment.

## Backend: Render

Use `render.yaml` or create a web service manually.

Manual settings:

```text
Root directory: server
Build command: npm install && npx prisma generate
Start command: npm run prisma:deploy && node src/server.js
```

Required environment variables:

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=8h
JWT_COOKIE_NAME=goal_portal_token
JWT_COOKIE_SAME_SITE=lax
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
CLIENT_ORIGINS=https://your-vercel-app.vercel.app
TRUST_PROXY_HOPS=2
NODE_ENV=production
```

## Backend: Railway

1. Create a Railway service from the repository.
2. Set service root to `server`.
3. Add the same backend environment variables.
4. Set start command:

```bash
npm run prisma:deploy && node src/server.js
```

## Database: Neon PostgreSQL

1. Create Neon project and database.
2. Copy the PostgreSQL connection string.
3. Set `DATABASE_URL` on the backend host.
4. Run:

```bash
npm run prisma:deploy --workspace server
```

## Docker

Local full-stack run:

```bash
docker compose up --build
```

The compose file starts PostgreSQL, migrates on API startup, then starts backend and frontend after health checks. The API container runs as the non-root `node` user. For integration tests, use `docker compose --profile test up -d postgres_test` and point `DATABASE_URL` at port 5433.

Do not edit the five previously deployed `init` migrations. Create future migrations with a descriptive name using `npm run prisma:migrate --workspace server -- --name <change_name>`, review the SQL, and deploy it with `npm run prisma:deploy`.

## Security Considerations

- Use HTTPS in production.
- Keep `JWT_COOKIE_SAME_SITE=lax`; production also sets `Secure` and `HttpOnly`.
- Set `TRUST_PROXY_HOPS=2` for the Vercel-to-Render path, or `1` for the single nginx hop in Docker. Confirm the structured request log's `ip` field during deployment. Restrict direct access to the Render service where the hosting setup permits, because a shorter path than the configured hop count can make forwarded IP headers spoofable.
- Keep `JWT_SECRET` private and high entropy.
- Restrict `CLIENT_ORIGINS` to known frontend domains.
- Do not expose Prisma Studio or database credentials publicly.
- Run migrations from trusted CI or an operator machine.

## Performance Optimizations

- Express compression is enabled.
- API rate limiting is enabled.
- Reporting totals use scoped Prisma groupBy and aggregate queries. Dashboard rows are capped at 200 and exports at 2,000; narrow filters for larger exports.
- Database indexes support common filters on goal status, employee id, quarter, and audit timestamps.
- Recharts increases frontend bundle size; future production work can code-split reporting panels.
