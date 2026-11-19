# Smart Library Management System

A complete, production-quality **MERN** (MongoDB, Express, React, Node.js) library management application with role-based access for **admins**, **librarians**, and **members**. It covers the full circulation workflow — catalog, members, issuing, returns, reservations, fines, notifications, activity logs, analytics, and CSV reporting — backed by a real REST API and MongoDB. No mock data is used in the UI; every screen talks to the server.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Features](#features)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Seed data & default accounts](#seed-data--default-accounts)
6. [Project structure](#project-structure)
7. [User roles & permissions](#user-roles--permissions)
8. [Testing](#testing)
9. [API documentation](#api-documentation)
10. [Business rules](#business-rules)
11. [Production notes](#production-notes)
12. [Deploying to Render](#deploying-to-render)
13. [Troubleshooting](#troubleshooting)

---

## Tech stack

**Frontend** — React 18, Vite 6, React Router DOM 6, Tailwind CSS 3, Axios, Lucide React, React Toastify, Recharts, date-fns.

**Backend** — Node.js, Express 4, MongoDB + Mongoose 8, JWT, bcryptjs, express-validator, Multer, nodemailer (optional SMTP), Helmet, CORS, express-rate-limit, Morgan, dotenv.

---

## Features

### Authentication & security
- Register / log in / log out with JWT (7-day expiry by default)
- Password hashing with bcryptjs (12 salt rounds)
- Forgot/reset password flow with SHA-256-hashed, 15-minute reset tokens
- Change password and edit profile
- Role-based route guards on both client and server
- Protected REST endpoints, mass-assignment prevention (explicit allow-lists)
- Configurable CORS allow-list, security headers, rate limiting on auth routes
- Centralized error handling with proper HTTP status codes

### Admin & librarian workspace
- Live dashboard: books, copies, members, overdue loans, reservations, fine collection and 12-month trends
- Charts: borrowing trend (area), collection availability (bar), most borrowed books (horizontal bar)
- Book CRUD with cover upload, categories, copies, shelf location, search, filters and sorting
- Member CRUD, profiles, borrowing history and outstanding fines
- Issue books (with borrowing-limit check and atomic copy decrement)
- Return books with automatic overdue-day and fine calculation
- Reservation queue with notifications when a copy becomes available
- Fine creation, payment and waiver
- Activity audit log and six exportable CSV reports

### Member workspace
- Browse, search and filter the catalog; view book detail and availability
- Reserve unavailable books and check queue position
- View currently borrowed books, history, due dates and fines
- Manage personal profile and password
- Receive in-app notifications (issue, return, fine, reservation availability)

### UI/UX
- Premium indigo/slate design system with Plus Jakarta Sans typography
- Responsive sidebar, mobile drawer, sticky topbar, notification menu
- Loading, empty and error states, confirmation dialogs, toast feedback
- Cards, data tables, pagination, charts, responsive grid/list catalog views

---

## Quick start

### Prerequisites
- Node.js 18+ (tested on Node 25)
- npm 9+
- MongoDB: local instance or a MongoDB Atlas cluster

### 1. Install dependencies

From the project root:

```bash
npm run install:all
```

This installs the root tooling plus `server/` and `client/` dependencies.

### 2. Configure environment

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Edit `server/.env` at minimum:

```env
MONGO_URI=mongodb://127.0.0.1:27017/smart_library
JWT_SECRET=a-long-random-secret-string
```

If the client uses the default `VITE_API_URL=http://localhost:5000`, Vite proxies `/api` and `/uploads` to the backend.

### 3. Seed the database (creates default accounts and sample data)

```bash
npm run seed
```

### 4. Start both apps

```bash
npm run dev
```

- Client: <http://localhost:5173>
- Server: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

Run them separately if you prefer:

```bash
npm run dev:server
npm run dev:client
```

### Production-style local build

```bash
npm run build
cd server
set NODE_ENV=production
npm start
```

The Express server serves `client/dist` when `NODE_ENV=production`.

---

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | Express port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/smart_library` | MongoDB connection string |
| `JWT_SECRET` | dev-only fallback | **Set this in production** |
| `JWT_EXPIRE` | `7d` | Access token lifetime |
| `JWT_RESET_EXPIRE` | `15m` | Password reset token metadata |
| `CLIENT_URL` | `http://localhost:5173` | Comma-separated CORS allow-list |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | empty | Optional SMTP for reset emails. If unset, the reset token is returned in the API response in development only. |
| `BORROW_LIMIT` | `5` | Max simultaneously issued books per member |
| `LOAN_PERIOD_DAYS` | `14` | Default loan period |
| `FINE_PER_DAY` | `5` | Fine charged per overdue day |
| `MAX_RESERVATIONS` | `3` | Max active reservations per member |
| `VITE_API_URL` (client) | `http://localhost:5000` | Backend origin for API and uploaded images |

---

## Seed data & default accounts

`npm run seed` creates 6 categories, 16 books, 1 admin, 1 librarian, 8 members, sample loans (including overdue ones), fines, reservations, notifications and activity logs.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@library.com` | `Admin@12345` |
| Librarian | `librarian@library.com` | `Librarian@123` |
| Member | `liam.carter@student.edu` | `Member@123` |

The seed script skips when users already exist. To reset:

```bash
npm run seed -- --force
```

> Change these passwords immediately outside a local demo environment.

---

## Project structure

```
library-management-system/
├── package.json                 # Root scripts (dev, build, seed, test)
├── README.md
├── server/
│   ├── config/                  # env + MongoDB connection
│   ├── controllers/             # Route business logic
│   ├── middleware/              # auth, validation, upload, errors
│   ├── models/                  # User, Book, Category, Borrow, Reservation,
│   │                            # Fine, Notification, ActivityLog
│   ├── routes/                  # REST route definitions
│   ├── services/                # notification, activity, mail helpers
│   ├── utils/                   # errors, pagination, dates, CSV
│   ├── validators/              # express-validator chains
│   ├── seed/seed.js             # Sample data + default admin
│   ├── tests/                   # In-memory integration + seed checks
│   ├── uploads/                 # Multer destination (gitignored)
│   ├── server.js
│   └── .env.example
└── client/
    ├── src/
    │   ├── assets/
    │   ├── components/          # Layout, guards, tables, charts, cards
    │   ├── context/             # AuthContext
    │   ├── hooks/               # useFetch, useDebounce
    │   ├── pages/               # Auth, dashboard, books, members,
    │   │                        # circulation, reservations, fines, reports…
    │   ├── services/api.js      # Axios instance + token interceptor
    │   ├── utils/               # Formatters, status tones
    │   ├── App.jsx              # Routes
    │   └── main.jsx
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```

---

## User roles & permissions

| Area | Admin | Librarian | Member |
| --- | :---: | :---: | :---: |
| Dashboard & analytics | ✓ | ✓ | — |
| Books / categories (write) | ✓ | ✓ | — |
| Members (create/edit/delete) | ✓ | ✓ | — |
| Issue / return books | ✓ | ✓ | — |
| Reservations (manage queue) | ✓ | ✓ | Own only |
| Fines (create/pay/waive) | ✓ / ✓ / ✓ | ✓ / ✓ / — | View own |
| Reports & export CSV | ✓ | ✓ | — |
| Activity log | ✓ | ✓ | — |
| Profile & notifications | ✓ | ✓ | ✓ |

---

## Testing

Integration tests spin up a temporary MongoDB using `mongodb-memory-server` — no local database required.

```bash
npm test
```

Or individually:

```bash
npm --prefix server run test:integration   # 31 API assertions
npm --prefix server run test:seed          # verifies seed counts
npm --prefix client run build              # production build check
```

The API smoke test covers auth, RBAC, category/book CRUD, search/filter, issuing, returns, fines, payments, reservations, dashboard, reports, CSV export, notifications and activity logs.

---

## API documentation

See **[server/API.md](server/API.md)** for every endpoint, request body, query parameter and role requirement.

All responses use the envelope:

```json
{ "success": true, "message": "…", "data": {}, "meta": {} }
```

Errors:

```json
{ "success": false, "message": "…", "errors": [{ "field": "email", "message": "…" }] }
```

Send authenticated requests with `Authorization: Bearer <token>`.

---

## Business rules

- A member can borrow up to `BORROW_LIMIT` (default 5) books at once.
- Only books with `availableCopies > 0` can be issued; the decrement is atomic.
- Default due date is `LOAN_PERIOD_DAYS` (14) days from issue; staff may override it.
- Returning a book late creates an overdue fine of `daysLate × FINE_PER_DAY`.
- Members can reserve only unavailable books and may have up to `MAX_RESERVATIONS` active reservations.
- On return, the first pending reservation is notified and has 48 hours to be fulfilled.
- Deleting a book with active loans is blocked; deleting a member with active loans or unpaid fines is blocked.

---

## Production notes

1. Set strong `JWT_SECRET`, environment-specific `MONGO_URI`, and a strict `CLIENT_URL` allow-list.
2. Use HTTPS and configure secure cookies/proxy headers if deploying behind a load balancer.
3. Configure SMTP so password-reset links are emailed; without SMTP the token is only returned in development.
4. Serve uploads through a CDN or object storage in a multi-instance deployment (local `server/uploads` is instance-local).
5. Replace seeded credentials and disable public registration if only staff should create accounts.
6. Add a MongoDB replica set if you want to wrap multi-document operations in transactions. Current operations use atomic updates and explicit safeguards without requiring a replica set.

---

## Deploying to Render

The project is configured for a **single Render Web Service** that serves both the REST API and the built React client. This is the recommended setup: no CORS origin to keep in sync, no build-time API URL to manage, and `/api/health` works immediately.

### What was added for Render

- **`render.yaml`** — Blueprint defining the Web Service, build/start commands and health check.
- **Root `start` script** (`npm --prefix server start`) — the command Render runs.
- **`engines.node >= 20`** — pins a supported Node runtime.
- Express serves `client/dist` when `NODE_ENV=production` and returns JSON 404s for unknown `/api` routes instead of the SPA shell.
- CORS falls back to Render's `RENDER_EXTERNAL_URL`, so same-origin writes work without manual configuration.

### Prerequisites

1. Push this project to GitHub/GitLab. The Blueprint deploys the `main` branch (change `branch` in `render.yaml` if yours differs).
2. Create a MongoDB Atlas cluster (Render has no managed MongoDB).
   - Create a database user with read/write access.
   - Under **Network Access**, allow `0.0.0.0/0` (Render free instances do not have static outbound IPs).
   - Copy the SRV connection string, e.g. `mongodb+srv://user:password@cluster.mongodb.net/smart_library?retryWrites=true&w=majority`.
3. Generate a strong JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

### Deploy with the Blueprint (recommended)

1. Render Dashboard → **New +** → **Blueprint** → connect your repository.
2. Render reads `render.yaml` and prompts for the secret values:
   - `MONGO_URI` — your Atlas connection string.
   - `JWT_SECRET` — the random secret from above.
   - `CLIENT_URL` — your service URL, e.g. `https://smart-library.onrender.com`. This can also be filled in after the first deploy.
3. Click **Apply**. Render installs root/server/client dependencies, builds the client and starts the API.
4. When the service shows **Live**, open its URL — the React app should load.
5. Visit `<your-url>/api/health`; expect `{"success":true,"status":"ok",…}`.

### Deploy manually (without the Blueprint)

Create a **Web Service** with these exact settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `npm ci --omit=dev && npm --prefix server ci --omit=dev && npm --prefix client ci && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Plan | Free, or Starter if you need always-on |
| Root directory | `.` |

Then add the environment variables from the next table.

### Environment variables on Render

| Key | Value | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | **Required** — Express only serves `client/dist` in production mode. |
| `MONGO_URI` | Atlas SRV string | Secret. Include the database name and URL-encode special characters in the password. |
| `JWT_SECRET` | long random string | Secret. Keep it stable across redeploys or all sessions are invalidated. |
| `CLIENT_URL` | `https://<app>.onrender.com` | Comma-separated CORS allow-list. Leave blank on a single service — Render's `RENDER_EXTERNAL_URL` is used automatically. Set it for custom domains or split deployments. |
| `PORT` | *do not set* | Render injects it; the server already reads `process.env.PORT`. |
| `RENDER_EXTERNAL_URL` | *set by Render* | Automatic CORS fallback when `CLIENT_URL` is blank. Do not override. |
| `VITE_API_URL` | *do not set* | Must stay unset for the single-service setup so the client calls `/api` on its own origin. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | optional | Enables emailed password resets. Without them a reset token is only returned in development. |
| `BORROW_LIMIT`, `LOAN_PERIOD_DAYS`, `FINE_PER_DAY`, `MAX_RESERVATIONS` | optional | Override business rules. |

### First-run data

The Atlas database starts empty. After the first successful deploy, seed it **once**:

- **Option A — Render Shell:** service → **Shell** → `npm run seed`.
- **Option B — your machine:** point local `server/.env` at the same Atlas `MONGO_URI`, then run `npm run seed` from the project root.

Expected output includes `Seed completed successfully.` and counts `{ users: 10, books: 16, categories: 6, borrows: 10, reservations: 3, fines: 3 }`.

Then sign in with the accounts in [Seed data & default accounts](#seed-data--default-accounts) and **change those passwords immediately**.

### Deployment checklist

- [ ] `/api/health` returns `success: true`.
- [ ] The app loads and redirects to `/login`.
- [ ] Admin login works and the dashboard charts render.
- [ ] Books and members pages load data from MongoDB.
- [ ] Issuing a book decrements its available copies.
- [ ] Uploading a book cover saves and displays the image.
- [ ] Render logs show no errors.

### Optional: two-service setup (Static Site + API)

If you prefer separate services:

1. **Web Service (API):** same build command as above, start `npm start`, set `CLIENT_URL=https://<frontend>.onrender.com`.
2. **Static Site (client):**
   - Build command: `npm --prefix client ci && npm --prefix client run build`
   - Publish directory: `client/dist`
   - Environment: `VITE_API_URL=https://<api>.onrender.com`
   - `VITE_API_URL` is baked into the bundle at **build** time — set it before building, and rebuild after changing it.
3. CORS requires `CLIENT_URL` to match the Static Site origin exactly (scheme, host, port).

### Render-specific caveats

- **Uploads are ephemeral.** `server/uploads` is instance-local storage. Files survive normal traffic but disappear on redeploy, restart or when a free instance spins down; the MongoDB `coverImage` paths then point at missing files. For persistent uploads, swap the storage engine in `server/middleware/upload.js` for object storage (S3/Cloudinary) and re-upload or re-seed covers after a redeploy.
- **Free-plan cold starts.** The first request after inactivity can take ~30–60 seconds. Use a paid plan or an uptime monitor if that matters.
- **No `.env` files are uploaded.** All configuration must be set as Render environment variables; `server/.env` and `client/.env` are gitignored.
- **Lock files are committed.** `package-lock.json` exists in the root, `server/` and `client/`, which `npm ci` requires.
- **HTTPS/proxy is handled by Render.** `app.set('trust proxy', 1)` is already enabled so rate limiting sees real client IPs.
- **Custom domains:** add the domain to `CLIENT_URL`, then configure DNS in Render.

### Render troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails with an `npm ci` lock mismatch | Run `npm install` locally in the root, `server/` and `client/`, then commit all three `package-lock.json` files. |
| Blank page or 404 when refreshing a route | Confirm `NODE_ENV=production` and start command `npm start`; Express must serve `client/dist`. |
| API unreachable from the browser | Check `MONGO_URI`, the Atlas IP allowlist, and the database user's permissions. |
| CORS error in the console | Leave `CLIENT_URL` blank to use `RENDER_EXTERNAL_URL`, or set it to the exact frontend origin including `https://`. |
| Everyone is logged out after a redeploy | `JWT_SECRET` changed between deploys; keep the same value. |
| Cover images break after a restart | Expected on the free plan — see the ephemeral uploads caveat above. |

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Cannot connect to the server` | Ensure `npm run dev:server` is running and `VITE_API_URL` matches the backend origin. |
| Mongo connection timeout | Verify `MONGO_URI`; Atlas requires network access and correct credentials. |
| Login returns 401 | Confirm the seeded account emails/passwords and that `JWT_SECRET` is consistent across restarts. |
| CORS error | Add the exact frontend origin (including protocol and port) to `CLIENT_URL`. |
| Cover images do not show | Confirm `/uploads` proxy in `vite.config.js` and that the file exists in `server/uploads`. |
| Seed says database already has users | Use `npm run seed -- --force` to reset sample data. |
