# Admin Settings & Profile

Open `/admin/settings` after signing in through the existing `/login` as an administrator. The existing Admin Settings & Security sidebar link and sidebar profile open this page. `/admin/admin-settings-security` redirects to `/admin/settings`.

The responsive settings navigation has Admin profile, Account details and Access & security panels. Arrow keys, Home and End navigate tabs. The page reuses existing navy/gold theme tokens, Card, Button, Input, Avatar and useAuth. It includes loading/retry, field validation, save progress, success and error states. Account metadata comes from the backend; missing creation dates are labeled Not recorded. Email is read-only and no email-change flow is implemented.

## APIs

- `GET /api/admin/profile` retrieves the authenticated administrator's safe public fields, account status and creation date.
- `PATCH /api/admin/profile` accepts only `{ "name": "Display Name" }`, trimmed to 2–50 characters.

Both routes inherit the existing JWT authentication, live account status/session checks, administrator authorization and Cache-Control: no-store middleware. The target ID always comes from req.auth, never client input. The database update matches an active admin and sets name only. Requests containing email, role, status, points, credentials, session version, user ID or any other extra fields are rejected. Profile updates are limited to 30 per 15 minutes per admin. No database schema or environment changes are required.

The existing public-user serializer is reused. Password hashes, reset tokens and session versions are never returned. Name changes do not end existing sessions. The auth store updates the saved name immediately, so sidebar initials/name and existing account components reflect it; a late response cannot restore a signed-out account or overwrite a replacement session. Points and other existing state remain unchanged.

## Run and verify

```sh
npm run dev
npm run build
npm test -w backend
npm test -w frontend
```

Use npm.cmd on Windows if PowerShell blocks npm.ps1. No new dependencies are needed. There is no configured lint script.

Backend profile tests exercise authentication and administrator authorization, safe serialization, trimming, validation, attempts to target another user, and rejection of sensitive fields. The frontend tests use the existing Vite loader and mocked Axios adapter to exercise the real auth-store action, subscription updates, failed saves, logout races and replacement-account races. They do not claim browser rendering coverage.

The existing opt-in isolated MongoDB integration suite also verifies profile reads/updates against real records, preservation of email/role/status/password hash/session version/points, and continued session validity. It runs only with RUN_MONGO_INTEGRATION=1; see USER_MANAGEMENT.md for temporary-database isolation and execution instructions.

Manual checks: as an admin open settings, edit/save your name and verify the sidebar changes; reload to check persistence. Switch all panels with mouse and keyboard. Test widths 375px, 768px and 1440px, including loading/error states and mobile drawer navigation. Reader `/admin/settings` must redirect away; reader profile API calls must return 403. No live account names were changed during automated tests; all database fixtures are isolated test data.

## Files

Created: backend/src/routes/adminProfile.routes.ts, backend/src/validators/adminProfile.validators.ts, backend/tests/adminProfile.test.ts, frontend/src/api/adminProfile.api.ts, frontend/src/pages/admin/AdminSettings.tsx, frontend/tests/adminProfile.test.mjs, ADMIN_SETTINGS.md.

Modified: backend/src/controllers/auth.controller.ts (export existing safe serializer), backend/src/routes/admin.routes.ts (mount profile router), backend/tests/adminUsers.mongo.test.ts (real-database profile assertions), frontend/package.json (frontend test command), frontend/src/hooks/useAuth.ts, frontend/src/store/authStore.ts, frontend/src/routes/AppRoutes.tsx, frontend/src/pages/admin/AdminLayout.tsx.

## Validation recorded for this change

- Workspace production build passed (including frontend and backend TypeScript compilation). Vite retains its large-bundle advisory.
- Backend default suite: 13 passing tests/subtests; the opt-in MongoDB test is skipped by default.
- Frontend auth-state suite: 6 passing tests/subtests.
- The extended real MongoDB suite was separately enabled and passed using a generated temporary database, which was removed. No production account names or other records were changed.
- git diff --check passed. There is no lint script configured.
- Browser capture was available, but Readora was signed out. Desktop/mobile visual interaction checks remain pending an administrator session; automated tests do not assert absence of browser layout overflow.

Password changes and global session revocation are now implemented in the Access & security panel. See ADMIN_SECURITY.md for endpoint contracts, recent-password verification, session-version concurrency checks and reset compatibility. No individual device/session inventory is tracked.
