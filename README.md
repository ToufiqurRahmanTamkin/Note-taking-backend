# Note Taking Backend

REST API for the Care Guide note-taking platform: JWT authentication,
role-based access control (`user` / `admin`), private notes, a
public/private posts directory, and two MongoDB aggregation-pipeline
reports. Built with Express, TypeScript, and Mongoose.

The matching frontend lives in the sibling [`Note-taking-frontend`](../Note-taking-frontend)
project.

## Features

- **Auth** — register/login with hashed passwords (`bcryptjs`) and JWTs;
  `GET /api/auth/me` resolves the current user from the token.
- **Notes** — private, per-user CRUD notes; admins can list any user's notes.
- **Posts** — shareable notes with a `public`/`private` flag (defaults to
  `public`). A posters directory reports each author's public post count via
  a single `aggregate()` + `$lookup`. Private posts are only ever returned
  to their owner or an admin.
- **Users (admin only)** — full CRUD over user accounts, including role and
  interests.
- **Aggregations**
  - `GET /api/aggregations/users-by-interest` — groups users by shared
    interest in one `aggregate()` call (admin only).
  - `GET /api/aggregations/users/:id/posts` — a user's posts joined via a
    single `$lookup` pipeline, privacy-filtered for the requester.
- **Pagination** — consistent `?page`/`?limit` handling with a shared
  helper, capped at 100 items per page.
- Security middleware: `helmet`, CORS locked to a configured client origin,
  and centralized error handling (duplicate-key / validation errors mapped
  to sane HTTP statuses).

## Tech stack

Node.js · Express · TypeScript · MongoDB + Mongoose · JSON Web Tokens
(`jsonwebtoken`) · `bcryptjs` · `helmet` · `cors`

## Project structure

```
src/
├─ app.ts                Express app: middleware + route mounting
├─ server.ts              Dev entrypoint (listens on PORT)
├─ config/
│  ├─ env.ts              Typed env var loading with dev fallbacks
│  └─ db.ts               Cached MongoDB connection
├─ models/                Mongoose schemas: User, Note, Post
├─ controllers/            Route handlers, grouped by resource
├─ routes/                 Express routers, grouped by resource
├─ middleware/
│  ├─ auth.ts              authenticate (JWT) + authorize (role guard)
│  └─ error.ts              404 + centralized error handler
├─ utils/                  pagination + JWT sign/verify helpers
└─ seed.ts                 Demo data seeding script
api/index.ts                Vercel serverless entrypoint
```

## Prerequisites

- Node.js 18+
- A MongoDB instance (local `mongod`, Docker, or a hosted cluster such as
  MongoDB Atlas)

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables** — copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   | Variable         | Required | Description                                          | Example |
   |------------------|:--------:|--------------------------------------------------------|---------|
   | `PORT`           | no       | Port the API listens on                                | `5000` |
   | `MONGO_URI`      | yes*     | MongoDB connection string                              | `mongodb://127.0.0.1:27017/note_taking_app` |
   | `JWT_SECRET`     | yes*     | Secret used to sign JWTs                               | a long random string |
   | `JWT_EXPIRES_IN` | no       | Token lifetime                                          | `7d` |
   | `CLIENT_ORIGIN`  | no       | Allowed CORS origin (your frontend's URL)               | `http://localhost:5173` |

   \* In development, `MONGO_URI` and `JWT_SECRET` fall back to insecure
   local defaults if unset. In production (`NODE_ENV=production`) both are
   **required** and the server throws on startup if missing.

3. **(Optional) Seed demo data** — creates an admin and two users with
   sample notes and public/private posts:

   ```bash
   npm run seed
   ```

   | Role  | Email               | Password    |
   |-------|---------------------|-------------|
   | Admin | `admin@example.com` | `Admin123!` |
   | User  | `alice@example.com` | `Alice123!` |
   | User  | `bob@example.com`   | `Bob12345!` |

4. **Run the dev server** (auto-restarts on file changes):

   ```bash
   npm run dev
   ```

   The API is now available at `http://localhost:5000/api` (or your
   configured `PORT`). Check it's alive with `GET /api/health`.

### Other scripts

```bash
npm run build   # compile TypeScript to dist/
npm start       # run the compiled server (dist/server.js) — run build first
```

## API reference

All routes are prefixed with `/api`. Routes marked 🔒 require an
`Authorization: Bearer <token>` header; 🔒admin requires the `admin` role.

| Method | Path                                  | Auth     | Description |
|--------|---------------------------------------|----------|--------------|
| GET    | `/health`                             | —        | Liveness probe (no DB dependency) |
| POST   | `/auth/register`                      | —        | Create a `user` account, returns a JWT |
| POST   | `/auth/login`                         | —        | Verify credentials, returns a JWT |
| GET    | `/auth/me`                            | 🔒       | Current user's profile |
| POST   | `/notes`                              | 🔒       | Create a note owned by the caller |
| GET    | `/notes`                              | 🔒       | List notes (own only; admins may pass `?userId=`), paginated |
| GET    | `/notes/:id`                          | 🔒       | Fetch a single note (owner or admin) |
| PUT    | `/notes/:id`                          | 🔒       | Update a note (owner or admin) |
| DELETE | `/notes/:id`                          | 🔒       | Delete a note (owner or admin) |
| POST   | `/posts`                              | 🔒       | Create a post; `privacy` is `"public"` (default) or `"private"` |
| GET    | `/posts/posters`                      | 🔒       | Directory of everyone who has posted, with public post counts |
| GET    | `/users`                              | 🔒admin  | List all users, paginated |
| POST   | `/users`                              | 🔒admin  | Create a user |
| GET    | `/users/:id`                          | 🔒admin  | Fetch a single user |
| PUT    | `/users/:id`                          | 🔒admin  | Update a user |
| DELETE | `/users/:id`                          | 🔒admin  | Delete a user |
| GET    | `/aggregations/users-by-interest`     | 🔒admin  | Users grouped by shared interest |
| GET    | `/aggregations/users/:id/posts`       | 🔒       | A user's posts via `$lookup`; private posts only included for the owner/admin |

## Deployment

`vercel.json` + `api/index.ts` let this API run as a Vercel serverless
function — the Express `app` is exported directly and the MongoDB
connection is established lazily on first request via cached middleware in
`app.ts`. Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` as environment
variables in your Vercel project settings before deploying.
