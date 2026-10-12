# Backend security review

Reviewed before and after the hardening pass using the `security-best-practices` Express and React guidance. The review covered Express middleware and routes, Prisma writes, exports, cookie handling, the browser API client, and deployment configuration. No critical finding remains in the application code reviewed here. The remaining production risks depend on deployment topology and operational controls.

## High

### 1. A direct Render request can spoof the client IP when two proxy hops are trusted

- **Rule:** EXPRESS-PROXY-001. **Status:** Open deployment risk.
- **Evidence:** `server/src/app.js:25` trusts `TRUST_PROXY_HOPS`; `render.yaml` sets it to `2`. `server/src/modules/auth/auth.routes.js:10` rate-limits login by `req.ip`. A request sent straight to the public Render hostname takes fewer hops than the Vercel → Render path, so an attacker may supply extra `X-Forwarded-For` values and evade the per-IP login limit.
- **Impact:** Brute-force traffic sent directly to Render could rotate its apparent IP and bypass the login limiter.
- **Fix:** Restrict direct traffic to Render or introduce a trusted edge-authenticated forwarding mechanism, then validate actual `req.ip` and limiter behavior in deployment. The two-hop behavior is covered by `server/test/integration.test.js`; `DEPLOYMENT.md` calls out the required runtime check. An allowed `Origin` is useful for browser CSRF protection but is not proof that a non-browser request came through Vercel.

## Medium

### 2. Login rate limits use process memory

- **Rule:** EXPRESS-AUTH-001. **Status:** Open scaling risk.
- **Evidence:** `server/src/modules/auth/auth.routes.js:10` creates an `express-rate-limit` instance without a shared store; `server/src/app.js:29` does the same for the general limit.
- **Impact:** Separate API replicas have separate counters, so limits weaken as replica count grows. A restart resets counters.
- **Fix:** Use a shared rate-limit store before scaling Render beyond one API process. Keep the current limits for a single-process deployment.

### 3. The Vercel upstream is intentionally a placeholder

- **Rule:** REACT-CONFIG-001 / deployment integrity. **Status:** Deployment action required.
- **Evidence:** `client/vercel.json:6` points `/api/:path*` at `REPLACE_WITH_RENDER_SERVICE.onrender.com`.
- **Impact:** The frontend cannot reach the API if deployed without replacing this host.
- **Fix:** Set the actual Render hostname before deployment, as documented in `DEPLOYMENT.md`. The placeholder carries no secret.

## Resolved in this pass

### 4. Mutations and audits could diverge or race

- **Rule:** EXPRESS-INPUT-001 / transactional integrity. **Status:** Resolved.
- **Evidence:** Goal and admin mutations now use serializable transactions with retry in `server/src/config/transaction.js:4`; the audit callback uses the same transaction in `server/src/middleware/audit.js:11`. PostgreSQL rejects AuditLog UPDATE and DELETE in `server/prisma/migrations/20261012082508_backend_hardening/migration.sql:32`.
- **Verification:** Integration tests cover concurrent eighth-goal creation, audit rollback, state transitions, and the audit trigger.

### 5. Spreadsheet exports could execute persisted content

- **Rule:** EXPRESS-INPUT-001. **Status:** Resolved.
- **Evidence:** `server/src/modules/reports/export.service.js:5` prefixes CSV cells beginning with formula characters; `server/src/modules/reports/export.service.js:27` writes an actual `.xlsx` workbook with text cells. `server/src/modules/reports/report.service.js:8` caps exports at 2,000 rows.
- **Verification:** Integration tests request both formats with a goal title starting with `=`.

### 6. Authentication and request handling had avoidable exposure

- **Rule:** EXPRESS-AUTH-001, EXPRESS-COOKIE-001, EXPRESS-ERROR-001. **Status:** Resolved.
- **Evidence:** Unknown/inactive accounts get a dummy bcrypt comparison in `server/src/modules/auth/auth.service.js:8`; JWT verification pins HS256 in `server/src/middleware/auth.js:16`; state-changing requests require an allowed Origin in `server/src/app.js:52`; errors are normalized and production 5xx details hidden in `server/src/middleware/errorHandler.js:6`; request logs carry an ID in `server/src/middleware/requestContext.js:4`.
- **Verification:** Integration tests cover uniform login failure, Origin rejection, cookie session behavior, 400 responses, and two-hop client-IP resolution.

## Review limits

The integration suite verifies the intended proxy path, but cannot prove the live Vercel and Render header chain or restrict direct access to Render. A dependency advisory scan and external penetration test are outside this pass. The report does not claim those checks were performed.
