# Platform Settings and final integration

Implemented on `admin-settings-and-security`. Open `/admin/settings` using the existing shared login with an administrator account. The page now has five keyboard-accessible sections: My profile (including account details), Password & security, Administrator access, Audit logs, and Platform settings. Other sections remain usable if the profile request fails. Security forms mount only when selected.

## Supported public settings

| Field | Validation | Actual website behavior |
| --- | --- | --- |
| `displayName` | Trimmed, 2-60 characters | Shared header/footer/admin logos, admin website link, footer copyright and browser title |
| `description` | Trimmed, at most 500 characters | Footer description and browser description metadata |
| `supportEmail` | Empty or valid email, at most 254 characters | Optional public `mailto:` footer link; does not change SMTP or password-reset delivery |
| `logoStyle` | `book` or `app-icon` | Existing Readora book mark or bundled `/icons/icon-192.png` asset |
| `announcementEnabled` | Boolean | Shows/hides a public announcement on reader layouts |
| `announcementText` | Trimmed, at most 500 characters; nonempty when enabled | Plain text announcement beneath reader navigation |

Unsupported control characters are rejected. React escapes all configured text; no HTML rendering or arbitrary image URL/file upload is accepted. All six fields are explicitly public, including saved announcement text while hidden. Do not put confidential information in these fields. Editable settings never contain environment credentials, JWT secrets, SMTP passwords or API keys.

Readora's existing name, book mark, footer description, no support contact and no announcement are the defaults. The frontend uses these defaults immediately and retains defaults/last successful settings if the public API is unavailable. A failed admin load shows retry/error feedback instead of a misleading editable fallback. Settings changes update the local public branding store immediately; other open tabs refresh when they regain focus or reload. Background responses cannot overwrite a later admin publication. Static HTML metadata remains Readora until JavaScript loads; no server-rendered SEO system is introduced.

There is no existing upload/storage service, so this step offers only existing bundled logo assets. There is no platform-wide reading-goal mechanism, so no default-goal setting is exposed. Existing account goals (including the current 20-page registration default), user theme choices and scoring rules are unchanged. The announcement is informational and does not disable logins or reader functionality. No forced platform theme or unrelated maintenance-mode feature is added.

## Persistence, APIs and concurrency

`PlatformSettings` is a fixed MongoDB singleton (`_id: platform`) containing only the allowlisted fields, revision and timestamps. Defaults/types come from the existing shared workspace package. Reads of an unconfigured deployment return defaults and revision zero without inserting a settings record. Startup registers the new model through the existing model registry. No migration, seed, production demonstration records, environment variables or dependencies are required.

- `GET /api/platform-settings`: public read, returns `{ settings }` with exactly the six public fields. Metadata and revision are omitted.
- `GET /api/admin/platform-settings`: existing JWT/live admin authorization required, returns `{ settings, revision }`.
- `PATCH /api/admin/platform-settings`: same authorization; accepts only `{ revision, settings: { ...allSixFields } }`. Rejects arbitrary keys, secrets, roles, status, user-goal settings, missing/invalid values and unsupported assets. Limited to 30 write attempts per 15 minutes per authenticated admin.

All responses use `Cache-Control: no-store`. Public writes are unavailable. Successful changes increment the revision and insert exactly one `platform_settings_update` in the existing AdminAuditLog, in one MongoDB transaction. Saving unchanged values is a no-op with no duplicate event. Stale revisions/competing initial saves return 409 and the UI offers reload/discard rather than overwriting another administrator's changes. Audit failure rolls back the settings change; failed writes do not produce successful-publication feedback. Atlas or a replica set is required for writes, as with existing privileged mutations; unsupported standalone writes return 503 without saving.

The new audit action records fixed reason text plus previous/new public settings. The existing required target-user link points to the acting admin for attribution and compatibility with per-user audit consumers; the global audit UI labels its target as **Platform settings**. Audit entries retain their existing read-only API protection. No password, hash, token, secret or session-version value is logged.

## Security review and preserved behavior

Reviewed live JWT middleware (algorithm, expiry, DB role/status and session-version checks), shared registration/login, administrator middleware, profile field allowlist, password policy/hash/current-password verification, security endpoint rate limits and atomic session invalidation, password-reset compatibility, role/status transactions and last-admin lock, audit reads and write rollback, and the new platform allowlist/serializer/rate limit/error handling. No existing authentication, role or suspension protections were weakened. Platform writes also reread the active admin/session version inside their transaction.

The current policy still gives all active admins equal role-management/public-settings authority. No new permission tiers were introduced. Self-demotion and administrator suspension remain blocked; concurrent role changes retain the existing mutation-lock protection. Public registration always creates a reader, including when clients submit an admin role. Login/logout and existing JWT/environment configuration are unchanged.

The frontend Vite configuration now resolves `@readora/shared` to its workspace TypeScript source because the shared package's CommonJS build is consumed by the backend. This prevents CommonJS/ES-module export failures in frontend production builds without replacing the shared package or adding a client/dependency.

## Run and validate

From the repository root, after the existing environment setup:

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run typecheck -w backend
npm.cmd run typecheck -w frontend
npm.cmd test -w backend
npm.cmd test -w frontend
```

The workspace build compiles shared, backend and frontend. There is no configured lint script. Use the existing `backend/.env` and frontend API/proxy configuration; no additional variables are required.

Real MongoDB integration tests are opt-in and use an explicit generated `readora_um_test_<random>` database name, verified before cleanup. They never use the configured application database name. After compiling the backend:

```powershell
cd backend
$env:RUN_MONGO_INTEGRATION='1'
node --test dist/tests/adminUsers.mongo.test.js
Remove-Item Env:RUN_MONGO_INTEGRATION
```

The suite uses `TEST_MONGO_URI` if provided, otherwise the existing MongoDB URI. Credentials need temporary-database create/drop permission. It removes only that generated database in cleanup.

Automated validation executed:

- Workspace production build and separate frontend/backend TypeScript checks passed. Vite retains its large-chunk advisory.
- Backend suite: 28 passing tests/subtests, one opt-in database test skipped by default. Covers dashboard admin/reader gates, shared registration/login, User Management queries and protection, profile field safety, password policy/change/reset, session invalidation, role/suspension safety, audit rollback and read-only APIs, and strict platform settings validation, authorization, no-op behavior, concurrent revision checks and write rate limiting.
- Frontend suite: 16 passing tests/subtests. Covers auth profile/security synchronization and logout races, existing role API contract, public settings fallback/load/publication races, admin settings API contract, escaped rendered name/description, bundled logo and support-link rendering, exactly five linked tab panels, and existing admin route denial for readers. A pre-existing Vite test websocket-port warning does not fail tests.
- The extended real MongoDB suite passed separately. It verifies actual queries/pagination/profile data, suspension and preserved reading/points data, concurrent admin demotions, password/session events, reset flow, one settings record under competing first saves, audit failure rollback, public serialization and unchanged reader goals/progress/points. Final assertions exercise real reader registration/login after settings publication and denial across admin APIs.
- `git diff --check` was run.

## Limits of regression coverage

This checkout's `/read/:id`, `/games`, `/tasks` and `/leaderboard` routes (and `/search`, book details and profile) currently render existing Coming soon placeholders. Several reading/gamification services are empty files. Their models and stored activity summaries exist and were exercised/preserved in isolated database tests, but there are no complete activity-submission/gameplay/leaderboard browser flows to regression-test here. This step does not implement those unrelated modules or claim those reader flows are working end to end.

After the user signed in, a browser follow-up verified the desktop profile and Platform Settings layout and loaded defaults, the 375px responsive settings navigation/form, arrow/Home/End keyboard navigation, the native publish confirmation, Escape cancellation and discard of an unsaved draft, and mobile drawer opening/scrolling/navigation to User Management with automatic closure. No horizontal overflow was visible in the inspected mobile form and dialog screens. No settings were published and no live profile, role, password or session changes were made. The follow-up also improved the confirmation to show announcement text even when its visibility is hidden and clarified that saved text is public. Frontend build and all 16 frontend tests passed again. Full cross-browser/device coverage, all error states and live privileged writes remain unverified; write behavior is covered by the isolated API/database tests. Use separate designated admin/reader test accounts for further manual testing, not production password/role changes solely for testing.

## Files created

- `packages/shared/src/platformSettings.ts`
- `backend/src/models/PlatformSettings.ts`
- `backend/src/validators/platformSettings.validators.ts`
- `backend/src/services/platformSettings.service.ts`
- `backend/src/routes/platformSettings.routes.ts`
- `backend/tests/platformSettings.test.ts`
- `frontend/src/api/platformSettings.api.ts`
- `frontend/src/store/platformSettingsStore.ts`
- `frontend/src/components/admin/AdminPlatformSettings.tsx`
- `frontend/tests/platformSettings.test.mjs`
- `PLATFORM_SETTINGS.md`

## Files modified

- `packages/shared/src/index.ts`
- `backend/src/models/index.ts`
- `backend/src/models/AdminAuditLog.ts`
- `backend/src/routes/index.ts`
- `backend/src/routes/admin.routes.ts`
- `backend/tests/adminUsers.mongo.test.ts`
- `frontend/vite.config.ts`
- `frontend/src/App.tsx`
- `frontend/src/api/adminAudit.api.ts`
- `frontend/src/components/layout/Logo.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/components/layout/Navbar.tsx`
- `frontend/src/components/layout/AppLayout.tsx`
- `frontend/src/components/admin/AdministratorAccess.tsx`
- `frontend/src/components/admin/AdminAuditLogs.tsx`
- `frontend/src/pages/admin/AdminLayout.tsx`
- `frontend/src/pages/admin/AdminSettings.tsx`
