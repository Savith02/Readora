# Step 3: Administrator Access and Audit Logs

Implemented on `feature/admin-settings-security`, following the committed profile and password/session settings steps. Open `/admin/settings` with an existing administrator account and select **Administrator access** or **Audit logs**. No new dependencies or environment variables are required.

## Administrator access and policy

The directory displays name/initials, email, role, status and registration date. Search by name/email and filter by status; pagination and 10/25/50 page sizes run on the server. It reuses `GET /api/admin/users?role=admin` and the existing role-confirmation dialog. Grant access through the existing User Management link; selecting a reader there uses the same secure workflow.

The backend policy is unchanged: every active administrator has equal authority to grant/revoke administrator privileges after confirming their current password and providing a reason. There is no higher approval role or distinct grant permission. Public registration still creates readers only. The frontend explains this policy; it does not invent a restriction that the server cannot enforce.

Existing transaction/mutation-lock protection prevents self-demotion, last-active-admin demotion and unsafe concurrent changes. Administrator suspension is entirely forbidden; another admin must demote the account first. Suspended users must be reactivated before role changes. Role changes increment the target's session version, so subsequent authenticated requests reject previous tokens and use the current stored role. Data and existing scoring rules are preserved.

## Audit API and storage

- New `GET /api/admin/audit-logs`: `page` (1-100000), `pageSize` (10, 25 or 50), optional `action`, `from` and `to` (ISO dates). Dates include both selected UTC days. Unsupported queries, invalid dates and inverted ranges return 400.
- Existing `GET /api/admin/users/:userId/audit-logs?page=1` retains its response shape and 10-entry page size, using the shared audit query service.
- Existing `PATCH /api/admin/users/:userId/role` and status endpoints remain unchanged.
- Existing password-change and sign-out-all endpoints now insert one audit event in the same transaction as the security update. Failed updates/audit writes roll back; stale concurrent security requests cannot add an extra entry. Existing rate limits/current-password checks remain in force.

All audit reads inherit JWT authentication, live status/session/administrator authorization and `Cache-Control: no-store`. There are no create/edit/delete audit HTTP endpoints. Responses allowlist action metadata and actor/target names and IDs, without emails or credentials. Names are current account names; deleted accounts display an unavailable state. History is newest first with an ID tie-breaker. Pagination/count filters match.

The existing AdminAuditLog schema adds only `password_change` and `sessions_revoked` action values and indexes on `(createdAt, _id)` and `(action, createdAt, _id)`. The existing target-user index remains. No records are migrated/deleted and historical entries remain readable. Existing actions are `suspend`, `reactivate`, `role_change`, `bootstrap_admin`. Password/session events store fixed descriptions, never password values, hashes, JWTs, reset tokens, secrets or session versions. No historical security events are fabricated.

MongoDB transactions require Atlas or a replica set, consistent with existing role/status mutation requirements. Security operations now also require transactions to guarantee that a successful change has an audit record.

## Run and test

From the repository root:

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd test -w backend
npm.cmd test -w frontend
```

The build includes TypeScript checks. No lint script is configured. The optional real-database suite explicitly overrides the database name with a generated `readora_um_test_<random>` name and removes only that database afterward:

```powershell
cd backend
$env:RUN_MONGO_INTEGRATION='1'
node --test dist/tests/adminUsers.mongo.test.js
Remove-Item Env:RUN_MONGO_INTEGRATION
```

Build the backend first. It uses `TEST_MONGO_URI` if supplied or the existing `backend/.env` MongoDB connection. The database credentials need permission to create/drop the generated temporary database; it never uses the application's database name.

Validation executed for this step: workspace production build; backend suite (22 passed, one opt-in integration test skipped by default); frontend suite (10 passed); opt-in MongoDB suite separately passed. Backend coverage includes reader/unauthenticated rejection, validated directory/audit queries, privilege confirmation and validation, self/last-admin protection, suspension/session invalidation, audit rollback and read-only APIs. Real MongoDB coverage includes pagination, populated audit actor/target names, UTC/action filters, unchanged per-user history representation, concurrent demotion safety, and exactly one event per successful concurrent security action. Existing login, password reset, profile and user management tests pass.

For manual checks, use designated test accounts: an active admin, a second active admin and a reader. Open Settings, search/filter/page through administrators, and confirm a role change with the acting admin's password/reason. Verify the target must sign in again, then inspect Audit logs with action/date filters. Attempt own-role change and reader API access; these must be denied. Keep one active admin. Check keyboard tabs/dialog focus and widths 375px, 768px and 1440px. The UI includes responsive cards/table, loading, empty, retry/error and confirmation states, but authenticated desktop/mobile browser interaction has not been verified in this step.

## Files in this step

Created:

- `backend/src/routes/adminAudit.routes.ts`
- `backend/src/services/adminAudit.service.ts`
- `backend/src/validators/adminAudit.validators.ts`
- `frontend/src/api/adminAudit.api.ts`
- `frontend/src/components/admin/AdministratorAccess.tsx`
- `frontend/src/components/admin/AdminAuditLogs.tsx`
- `frontend/tests/adminAccess.test.mjs`
- `ADMIN_ACCESS_AUDIT.md`

Modified:

- `backend/src/models/AdminAuditLog.ts`
- `backend/src/routes/admin.routes.ts`
- `backend/src/routes/adminSecurity.routes.ts`
- `backend/src/routes/adminUsers.routes.ts`
- `backend/tests/adminUsers.test.ts`
- `backend/tests/adminUsers.mongo.test.ts`
- `backend/tests/adminSecurity.test.ts`
- `frontend/src/pages/admin/AdminSettings.tsx`

No Step 4 features, additional roles, separate authentication, individual device/session inventory, unrelated management modules or production fixture records were added. Audit log viewing is read-only; database operators still retain their existing database-level access.
