# Deployment Guide

## Frontend: Vercel

1. Import the repository into Vercel.
2. Set root directory to `client`.
3. Set environment variable:

```env
VITE_API_BASE_URL=https://your-api-domain/api
```

4. Build command:

```bash
npm run build
```

5. Output directory:

```text
dist
```

## Backend: Render

Use `render.yaml` or create a web service manually.

Manual settings:

```text
Root directory: server
Build command: npm install && npx prisma generate
Start command: node src/server.js
```

Required environment variables:

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=8h
JWT_COOKIE_NAME=goal_portal_token
JWT_COOKIE_SAME_SITE=none
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
CLIENT_ORIGINS=https://your-vercel-app.vercel.app
NODE_ENV=production
```

## Backend: Railway

1. Create a Railway service from the repository.
2. Set service root to `server`.
3. Add the same backend environment variables.
4. Set start command:

```bash
node src/server.js
```

## Database: Neon PostgreSQL

1. Create Neon project and database.
2. Copy the PostgreSQL connection string.
3. Set `DATABASE_URL` on the backend host.
4. Run:

```bash
npm run prisma:migrate --workspace server
npm run seed --workspace server
```

## Docker

Local full-stack run:

```bash
docker compose up --build
```

The compose file starts PostgreSQL, backend, and frontend.

## Security Considerations

- Use HTTPS in production.
- Use `JWT_COOKIE_SAME_SITE=none` only with `NODE_ENV=production`, which sets secure cookies.
- Keep `JWT_SECRET` private and high entropy.
- Restrict `CLIENT_ORIGINS` to known frontend domains.
- Do not expose Prisma Studio or database credentials publicly.
- Run migrations from trusted CI or an operator machine.

## Performance Optimizations

- Express compression is enabled.
- API rate limiting is enabled.
- Reporting APIs use scoped Prisma queries and selected includes.
- Database indexes support common filters on goal status, employee id, quarter, and audit timestamps.
- Recharts increases frontend bundle size; future production work can code-split reporting panels.
