# Readora User Management

## Run and open

Use the existing backend/.env and start from the repository root:

```sh
npm install
npm run dev
```

Sign in at `/login` using an existing administrator, then open `/admin/users` or select User Management in the sidebar. The old `/admin/user-management` link redirects to the new page. No new application dependencies or production environment variables are required.

MongoDB Atlas or a replica set is required for role/status changes. Read-only listing and profiles work on standalone MongoDB, but access changes return 503 rather than saving without an atomic audit record. Restart the backend after updating the code so the existing collection/index initialization also registers the new models.

## Security and administrator setup

Public registration now always creates role=user, even if a request supplies role=admin or accountType=admin. Existing accounts retain their roles. Both roles continue to use the existing login and JWT system.

If there are no active administrators, register the intended operator as a reader, then use a trusted database operator's terminal:

```sh
npm run admin:promote -w backend -- operator@example.com --confirm
```

The command refuses when an active admin already exists. It uses a transaction and records a bootstrap_admin audit entry; its administratorId and targetUserId both identify the bootstrapped account, with the reason explaining local operator provisioning. If tsx is unavailable, build the backend, enter the backend directory, and run `node dist/scripts/promote-admin.js operator@example.com --confirm`.

Subsequent role changes happen in User Management and require the acting administrator's current password, confirmation, a reason and the expected current role. An admin cannot alter their own role/status. Admin accounts cannot be suspended: another admin must demote them first. Suspended readers must be reactivated before promotion. All role/status writers use a common transaction lock and re-read the acting administrator and admin count inside the transaction, preventing concurrent demotions from removing all active admins. Stale changes return 409.

Suspension blocks login and every route protected by requireAuth. Each status or role change increments a hidden sessionVersion; all earlier tokens remain invalid even after reactivation. Existing tokens without this field remain compatible with unchanged legacy accounts (version zero). Password reset remains available, but does not bypass suspension. Reactivated readers must sign in again. Progress, points, badge awards and task/game records are never modified by access changes.

Audit history is admin-only, has no modification/deletion API, and records only actor/target IDs, action, reason, previous/new values and creation time. Role-confirmation passwords are never logged or saved in audit records. Database operators should restrict direct write/delete access to the audit collection according to their operational policy.

## Endpoints

All endpoints below inherit the existing adminRouter JWT, live database role check and Cache-Control: no-store middleware:

- GET /api/admin/users — paginated allowlisted user summaries. Query: page (1–100000), pageSize (10/25/50), search (name/email, literal substring, max 100 chars), role (user/admin), status (active/suspended), from/to (YYYY-MM-DD, inclusive UTC dates), sort (newest/oldest/name_asc/name_desc). Secondary ID sorting stabilizes equal values. Search does not accept raw Mongo expressions or user regex syntax.
- GET /api/admin/users/stats — reader-only total, active-in-30-days, UTC-month registrations and suspended count.
- GET /api/admin/users/:userId — allowlisted account information and bounded reading/game/task/points/badge summaries.
- PATCH /api/admin/users/:userId/status — status, expectedStatus, reason (5–1000 chars).
- PATCH /api/admin/users/:userId/role — role, expectedRole, reason, acting administrator's password. Only user/admin values accepted.
- GET /api/admin/users/:userId/audit-logs?page=1 — audit history, 10 entries per page.

Mutations have a per-admin limit of 30 requests per 15 minutes. JSON bodies reject unexpected fields. Invalid IDs and query values return 400; missing users 404; missing/invalid/ended sessions 401; unauthorized access 403; stale/unsafe changes 409. Successful mutations return a message; no credential or token fields are returned by admin endpoints.

## Safe schema additions

User: status (default active), suspensionReason, statusChangedAt, hidden sessionVersion (default 0). New role/status/date and name/ID indexes support management queries. Missing legacy status/sessionVersion values are interpreted as active/zero; there is no destructive migration.

AdminAuditLog: immutable audit fields, creation timestamp and target/date index.

AdminMutationLock: one internal version document to serialize role/status transactions. It is not exposed through an API.

Existing reading, games, task, points and badge schemas/scoring rules are unchanged.

## Counting rules and supported data

- All four overview cards count role=user accounts only. Total/new/active counts can include suspended readers; Active Readers means unique readers with ReadingProgress.lastReadAt in the past 30 days, matching the dashboard's existing activity definition. Account status=Active is a separate access condition.
- Registration dates are filtered by inclusive UTC days. The new-users card includes the current partial UTC month.
- Last reading activity is tracked; general last-online/login activity is not and is never fabricated.
- Books started count reader-book progress records; completed books require finishedAt. Profiles show up to six recent books.
- Game statistics count recorded GameResult rows and wins; up to six results show score/maxScore and recorded awards. No untracked session-duration or completion metric is inferred.
- Completed tasks use completed=true. Current progress shows up to ten tracked tasks whose active definition belongs to today's UTC date or the current ISO week. Six recent completions are shown. Missing definitions are labeled unavailable.
- Task rewards and total earned points sum positive ledger entries; current balance is User.totalPoints. No points are awarded by this module.
- Badges reuse User.badges and Badge definitions. There is no separate achievement model. Reader rank compares current points balances among reader accounts; ties share a rank. It is not an invented historical/weekly leaderboard rank.
- The user list is server-paginated. The reading lookup runs after pagination and uses the existing userId/lastReadAt index. Case-insensitive substring search may scan matching account fields; for very large installations an indexed search service is future work.

## Validation

```sh
npm run build
npm test -w backend
npm run typecheck -w frontend
npm run typecheck -w backend
```

Use npm.cmd on Windows if npm.ps1 is blocked. No lint script or frontend test runner is configured.

Default tests use an isolated in-memory model adapter behind an actual HTTP server. They exercise validation, authentication/authorization, reader registration, pagination/search requests, profile field mapping, session invalidation after suspension/reactivation, role password checks, access policy and audit transaction rollback. They do not prove real MongoDB aggregation or concurrent transaction behavior.

The opt-in MongoDB test uses a random database named readora_um_test_<16 hex characters>, explicitly overrides the configured application database, and removes only that temporary database in finally. It creates no production/demo accounts. Use an authorized test cluster that supports transactions. In a terminal in backend:

```powershell
npm.cmd run build
$env:RUN_MONGO_INTEGRATION='1'
# Optional TEST_MONGO_URI overrides backend/.env MONGO_URI for a dedicated test cluster.
node --test dist/tests/adminUsers.mongo.test.js
```

The real-database suite checks actual filters/legacy defaults, multiple pages, aggregation summaries, preserved progress/ledger, audit rollback and simultaneous administrator demotions. A skipped/timed-out/failed integration test is not a passing database check.

Manual UI checks: sign in as admin; search/filter/sort/reset; adjust page size and use previous/next; open a profile; cancel and confirm suspension, reactivation and a role change; review audit history. In a separate reader session verify protected access stops after suspension, old tokens stay invalid after reactivation, and fresh login restores access. Verify reader `/admin/users` redirects away and admin APIs return 403. Check 375px/768px/1440px widths, dropdown actions, keyboard dialogs and the mobile drawer. Authentication, API and data checks are automated as described; visual/device checks require a reachable browser window.

## Files in this change

Created:

- backend/src/models/AdminAuditLog.ts
- backend/src/routes/adminUsers.routes.ts
- backend/src/services/adminUsers.service.ts
- backend/src/validators/adminUsers.validators.ts
- backend/tests/adminUsers.test.ts
- backend/tests/adminUsers.mongo.test.ts
- frontend/src/api/adminUsers.api.ts
- frontend/src/components/admin/UserManagement.tsx
- frontend/src/pages/admin/AdminUsers.tsx
- frontend/src/pages/admin/AdminUserProfile.tsx
- USER_MANAGEMENT.md

Modified:

- backend/package.json — run all backend test files
- backend/scripts/promote-admin.ts — transactional, audited first-admin-only provisioning
- backend/src/controllers/auth.controller.ts — reader-only registration, suspended-login rejection, versioned tokens
- backend/src/middleware/auth.middleware.ts — live status/session checks
- backend/src/models/User.ts — compatible suspension/session fields and indexes
- backend/src/models/index.ts — register audit/lock models
- backend/src/routes/admin.routes.ts — mount guarded user-management routes
- backend/src/utils/jwt.ts — backward-compatible session version
- backend/src/validators/auth.validators.ts — strip public role selection
- backend/tests/admin.test.ts — ensure public requests never create administrators
- frontend/src/api/auth.api.ts — reader-only public registration payload
- frontend/src/pages/auth/Register.tsx — remove public admin registration option
- frontend/src/routes/AppRoutes.tsx — user list/profile and legacy redirect
- frontend/src/pages/admin/AdminLayout.tsx — activate User Management navigation
- frontend/src/pages/admin/AdminDashboard.tsx — activate the existing Manage Users shortcut
- ADMIN_DASHBOARD.md — update admin provisioning/module documentation

## Verification recorded during implementation

- Full workspace production build passed; Vite reports the existing large-chunk advisory.
- Default backend suite: eight passing tests/subtests, no failures; the opt-in MongoDB test is skipped unless explicitly enabled.
- The opt-in real MongoDB integration suite was separately enabled and passed. It verified real aggregate results, filters, legacy defaults, pagination, profile data, unchanged progress/points ledger, session rejection, audit rollback and concurrent admin demotions. Its generated temporary database was removed successfully. The initial restricted-network attempt timed out; the network-enabled run passed.
- Frontend/backend typechecks and git diff --check passed.
- No lint script is configured.
- Browser visual/device interaction checks were blocked because the Chrome window was outside the monitor area available to the UI capture tool. Desktop/mobile styles and semantic controls are implemented, but no claim of completed visual interaction testing is made.
