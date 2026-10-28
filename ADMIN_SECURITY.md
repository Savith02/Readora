# Admin Password & Session Security

Open `/admin/settings` and choose Access & security. Both actions use the existing shared Readora login, JWT, live admin/status checks, password policy, bcrypt utility and sessionVersion. No new environment variables, dependencies, database fields, JWT secrets or token format changes are required.

## Endpoints

All inherit adminRouter authentication, administrator authorization and no-store headers:

- GET /api/admin/security — safe passwordChangedAt metadata only; missing history is null.
- POST /api/admin/security/change-password — currentPassword, newPassword, confirmPassword. Unknown fields are rejected. Policy is shared with registration/reset: at least 8 characters, a letter and a number, at most 72 UTF-8 bytes. Confirmation must match and reuse of the current password is refused.
- POST /api/admin/security/sign-out-all — currentPassword, verified on this exact request, with no separate reusable verification token.

Both sensitive actions share a per-administrator limit of 10 requests per 15 minutes. Incorrect current passwords return 403 without clearing an otherwise valid session. Invalid input returns 400, expired/ended sessions return 401, and rate limits return 429.

Password changes and sign-out use an atomic conditional update matching the active admin, the just-verified password hash and the authenticated sessionVersion. Only one competing request using the old hash/version can succeed. Session increments use $inc rather than read/set. Legacy accounts with a missing version remain compatible with zero-version tokens until invalidation. Name, email, role, account status, points and badges are not changed.

Password changes hash the new password with the existing hashPassword utility, record passwordChangedAt, increment sessionVersion and clear pending reset links in one update. Sign-out increments the version without changing the password. Responses contain a safe confirmation message only. No passwords, hashes, reset tokens, versions, IPs or device details are returned or logged by these endpoints.

Successful requests clear the matching frontend session through the existing logout action and redirect to `/login` with a success notice. A late request does not clear an unrelated replacement frontend session. Password fields remain only in temporary component/request memory, are cleared after success, and are never saved in browser storage or the auth store. Duplicate form submissions are blocked while a request is in progress.

The confirmation dialog for global sign-out requires the current password; Cancel/Escape closes it unless a request is already in progress. Existing PasswordInput controls provide visibility toggles and accessible labels. Layout uses the existing navy/gold cards and responsive controls. No individual-session/device management is claimed because the platform does not track that data.

## Reset compatibility

The existing reset URLs, emailed links, validation and single-use reset-token flow are preserved. Reset completion now also increments sessionVersion in the same update as the password, so even access tokens issued in the same second are invalid. Resetting a suspended account does not change its suspension status or restore access. A password change invalidates previously issued reset links; signing out all sessions does not invalidate legitimate reset links.

## Run and test

```sh
npm run dev
npm run build
npm test -w backend
npm test -w frontend
```

Use npm.cmd on Windows if PowerShell blocks npm.ps1. No lint script is configured. Backend security tests exercise admin-only access, unsafe/weak inputs, confirmation mismatch, reuse, incorrect passwords, hashing, old/new login, old-token rejection, simultaneous stale requests, rate limiting, single-use reset and suspended-account rejection. Existing reader/admin login and User Management tests continue to run. Frontend tests cover successful session clearing, failed-request preservation and replacement-session races.

The opt-in MongoDB integration suite has also been extended to check actual concurrent password updates, legacy missing versions, fresh login after revocation, and password reset/token invalidation against a random temporary database. See USER_MANAGEMENT.md for running that suite with RUN_MONGO_INTEGRATION=1 and optional TEST_MONGO_URI. It never modifies production credentials.

Manual UI validation requires an authenticated admin. Check the Access & security tab on mobile/desktop, password toggles, field validation, canceling global sign-out, success notices on login and relogin. Browser UI automation should not enter or change real authentication credentials.

## Files

Created: backend/src/routes/adminSecurity.routes.ts, backend/src/validators/adminSecurity.validators.ts, backend/tests/adminSecurity.test.ts, frontend/src/api/adminSecurity.api.ts, frontend/src/components/admin/AdminSecurity.tsx, ADMIN_SECURITY.md.

Modified: backend/src/routes/admin.routes.ts, backend/src/middleware/auth.middleware.ts (preserve verified version on req.auth), backend/src/validators/auth.validators.ts (export the existing policy), backend/src/services/passwordReset.service.ts, backend/tests/adminUsers.mongo.test.ts, frontend/src/hooks/useAuth.ts, frontend/src/store/authStore.ts, frontend/src/pages/admin/AdminSettings.tsx, frontend/tests/adminProfile.test.mjs, ADMIN_SETTINGS.md.
