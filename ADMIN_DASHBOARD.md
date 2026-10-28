# Readora admin dashboard

## Run

Use the existing environment setup in README.md and backend/.env. No new dependencies or environment variables are required.

```sh
npm install
npm run dev
```

Open the existing `/login` page. Administrators are redirected to `/admin/dashboard`; readers retain their normal landing page or protected-route return path. The server endpoint is `GET /api/admin/dashboard?months=6` (supported ranges: 3, 6, 12).

## Register through the shared account form

The existing `/register` page has User account and Admin account options. Both use only name, email and password. Selecting Admin account creates an administrator and signs them in immediately at `/admin/dashboard`; selecting User account creates a reader. The shared login also redirects administrators to the dashboard.

Admin registration is open to anyone who can reach the registration endpoint. The account selector is not proof of administrator authorization. This behavior was explicitly requested; it allows public visitors to obtain administrator access when deployed publicly. No setup code or ADMIN_SIGNUP_CODE environment variable is used.

## Alternatively, promote an existing account

1. Register the intended account through the existing registration page and verify its identity through your operational process.
2. On a trusted machine with authorized database access, configure the existing backend environment for the intended database.
3. Run:

```sh
npm run admin:promote -w backend -- owner@example.com --confirm
```

Replace the example with the existing account email. The command only promotes an existing reader; it does not create accounts, change passwords, seed data, or expose a network endpoint. Restrict shell and database access to trusted operators. Log in again through `/login` after promotion. Operators can use this same controlled process for subsequent promotions. No real account was promoted during implementation.

If the host cannot execute tsx, run `npm run build -w backend`, then from the backend directory run `node dist/scripts/promote-admin.js <existing-account-email> --confirm`.

## Validation

```sh
npm run build
npm test -w backend
npm run typecheck -w frontend
npm run typecheck -w backend
```

On Windows, use `npm.cmd` if PowerShell blocks npm.ps1. There are no lint scripts or frontend test scripts configured. Backend tests run against an ephemeral HTTP server with mocked model boundaries, without connecting to or writing to a database. They cover shared reader/admin login, invalid passwords, missing/invalid/expired tokens, server-side role denial, demotion with an existing token, registration role stripping, date-range validation, and empty-dashboard response shape.

For a live smoke test with your own accounts: sign in as a reader and verify `/admin/dashboard` redirects home and `/api/admin/dashboard` returns 403 with that reader's bearer token; sign in as an admin and verify dashboard data. Check widths of 375px and 1440px, keyboard navigation, Escape to dismiss the mobile drawer, sidebar collapse, refresh, range filters, logout, and expired-session return to shared login. Live database and browser checks are not covered by the automated test.

## Metrics and limitations

- Total Books: unavailable because there is no local Book collection. The external catalog is not counted as locally stored books.
- Registered Users: accounts with role `user`.
- Active Readers: unique reader accounts with reading progress updated in the past 30 days.
- Games: stored GameResult records; completed tasks: UserTask records with completed=true.
- Points: sum of positive PointLog awards, excluding deductions.
- User growth: reader registrations by UTC calendar month, including the current partial month.
- Reading activity: count of page_read ledger events by UTC month. These are reward events, not individual pages or reading sessions.
- Popular books: top five books by unique reader–book progress records, across recorded progress.
- Most active readers: reader accounts ranked by books with finishedAt recorded.
- Activity: latest tracked reader registrations and task completions. No publication audit log exists.
- Account status: explicitly not tracked, because the User model has no suspension/verification status field.

Historical percentage comparisons are omitted. Missing collections return empty states; API errors show retry. An unavailable database produces an error, not fabricated zero statistics. Recent users expose only the required name/email/registration fields to authorized admins; responses disable caching. Existing JWT, password reset and session invalidation remain in place. Authorization reads the database role on every request. Add future admin endpoints to the guarded admin router.

## Pending

All sidebar management modules (analytics reports, books, genres, authors, reviews, games, tasks, points, badges, users, reading activity, notifications, support, security settings) are explicitly labeled planned pages. No destructive management actions are implemented, so no destructive confirmation dialog is needed yet. Add confirmations when those mutations are introduced. A local book catalog, account-status tracking, session-level reading history, publication audit history, and historical comparisons require future data/model work.


