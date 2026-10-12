# Environment Setup Guide

## Frontend

`client/.env`

```env
VITE_API_BASE_URL=/api
```

For Vercel, set:

```env
VITE_API_BASE_URL=/api
```

## Backend

`server/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/goal_portal?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="8h"
JWT_COOKIE_NAME="goal_portal_token"
JWT_COOKIE_SAME_SITE="lax"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
CLIENT_ORIGINS="http://localhost:5173"
NODE_ENV="development"
```

For the Vercel frontend and Render API, use the first-party `/api` rewrite in `client/vercel.json` and set:

```env
NODE_ENV=production
JWT_COOKIE_SAME_SITE=lax
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
CLIENT_ORIGINS=https://your-vercel-app.vercel.app
TRUST_PROXY_HOPS=2
```

Use a strong random `JWT_SECRET` in production.

## Database

Local PostgreSQL:

```bash
sudo -u postgres createdb goal_portal
npm run prisma:migrate
npm run seed
```

Neon:

1. Create a Neon project.
2. Copy the pooled PostgreSQL connection string.
3. Set it as `DATABASE_URL` on Render/Railway.
4. Run `npm run prisma:deploy` during deployment or from a trusted machine.
