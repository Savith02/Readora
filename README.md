# Readora
Readora is a gamified reading platform where book lovers can discover, read, and enjoy books, while earning points, completing challenges, and taking playful breaks that keep them hooked on reading.

## Getting started

### What you need
- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) 20 or newer
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running on this computer (default port 27017).
  No MongoDB installed? With Docker: `docker run -d -p 27017:27017 --name readora-mongo mongo:8`

### Set it up
1. Clone the project and install everything. Run `npm install` in the **repo root** (not inside `frontend` or `backend`):
   ```
   git clone <repo-url>
   cd Readora
   npm install
   ```
2. Create `backend/.env` from the template (on Windows `cmd`: `copy .env.example backend\.env`):
   ```
   cp .env.example backend/.env
   ```
3. Open `backend/.env` and give `JWT_SECRET` a value. It has to be at least 32 characters and should be your own.
   This command prints a good one to paste in:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
   Everything else in the template works as it is for local development.
4. Start the backend and the website together:
   ```
   npm run dev
   ```
5. Open **http://localhost:5173**. The API runs at http://localhost:5000.

### Your account
Accounts are stored in the MongoDB on **your own computer**, and git does not carry them (the same goes for `backend/.env`,
which holds your secrets). Everyone who clones the project starts with an empty database, so open
**http://localhost:5173/register** and create your own account. Nothing is shared between computers.

### Optional
- **Use MongoDB Atlas (hosted) instead of a local MongoDB.** Create a free cluster at mongodb.com/atlas, add a database
  user, allow your IP under **Network Access**, then copy the connection string (Connect, Drivers). Put the database name
  `/readora` before the `?` and paste it as `MONGO_URI` in `backend/.env`. If the password has special characters such as
  `@` or `#`, write them URL-encoded (`@` is `%40`). Everyone who uses the same `MONGO_URI` shares the same accounts and
  data, so send it privately and never commit it.
- Add the default tasks and badges to your database (safe to run more than once):
  `npm run seed -w backend`
- **Forgot password:** with no `SMTP_*` settings, the reset link is printed in the terminal where `npm run dev` is running
  instead of being emailed. To send real emails, fill in the `SMTP_*` lines in `backend/.env` (see `.env.example`) and
  restart `npm run dev`.

## Project layout
- `frontend/`: the website (React, Vite, Tailwind)
- `backend/`: the API (Express, MongoDB with Mongoose)
- `packages/shared/`: types and constants used by both

Useful commands, all from the repo root:

| Command | What it does |
|---|---|
| `npm run dev` | start backend and frontend together |
| `npm run dev -w backend` / `npm run dev -w frontend` | start only one of them |
| `npm run typecheck -w backend` | check the backend's TypeScript |
| `npm run build` | build everything for production |

## Troubleshooting
- **`Invalid environment variables in backend/.env: JWT_SECRET ...`**: `JWT_SECRET` is empty or shorter than 32 characters. See step 3.
- **`Failed to start: connect ECONNREFUSED ... 27017`**: MongoDB is not running. Start the MongoDB service (or your Docker container) and run `npm run dev` again.
- **Atlas: `querySrv ECONNREFUSED`**: some PCs point Node at a DNS server that does not answer. The backend retries with
  public DNS (1.1.1.1 and 8.8.8.8) by itself and prints a warning; if it still fails, check your internet connection.
- **Atlas: `bad auth` or `Authentication failed`**: wrong database user or password in `MONGO_URI`.
- **Atlas: `Server selection timed out`**: your IP is not allowed. Add it under Network Access in Atlas.
- **`Could not listen on port 5000`**: something else is using the port. Close the other copy of the backend. Keep the port at 5000, because
  the website forwards its API calls there.
- **Login or register says "The server is not responding"**: the backend is not running or crashed. Look at the terminal for its error.
- **`npm install` errors or missing packages**: run it in the repo root, not inside a sub-folder.
