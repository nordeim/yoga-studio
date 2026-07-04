# Stillwater · Yoga Studio — Quick Start Guide

> **Audience:** Developers and operators who want to get Stillwater running from a fresh clone to a deployed server in the fewest possible steps.
>
> **Scope:** Step-by-step commands from `git clone` through database initialization to a running server. Covers local development, local production, and Docker production. For advanced Docker/TLS/Postgres scenarios, see [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start: Local Development (5 minutes)](#2-quick-start-local-development-5-minutes)
3. [Production Deployment: Local (non-Docker)](#3-production-deployment-local-non-docker)
4. [Production Deployment: Docker (Quick)](#4-production-deployment-docker-quick)
5. [Database Details](#5-database-details)
6. [Verification & Smoke Tests](#6-verification--smoke-tests)
7. [Troubleshooting](#7-troubleshooting)
8. [What's Next](#8-whats-next)

---

## 1. Prerequisites

### 1.1 Required software

| Tool | Version | Check command | Install |
| --- | --- | --- | --- |
| **Bun** | ≥ 1.3 | `bun --version` | `curl -fsSL https://bun.sh/install \| bash` |
| **Node.js** | ≥ 20 (optional, for tooling) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **git** | ≥ 2.40 | `git --version` | [git-scm.com](https://git-scm.com/) |
| **Docker** | ≥ 24.0 (only for Docker deploy) | `docker --version` | [docs.docker.com](https://docs.docker.com/get-docker/) |

### 1.2 System requirements

| Resource | Minimum | Recommended |
| --- | --- | --- |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 512 MB | 1 GB |
| Disk | 500 MB | 2 GB |
| OS | Linux, macOS, or WSL2 (Windows) | Ubuntu 22.04+ LTS |

### 1.3 Get the code

```bash
git clone https://github.com/nordeim/yoga-studio.git stillwater
cd stillwater
```

> **Note:** Replace the URL with your fork's URL if you've forked the repo.

---

## 2. Quick Start: Local Development (5 minutes)

This is the fastest path to a running dev server with hot reload. Uses SQLite (file-based, no server process).

### Step 1: Install dependencies

```bash
bun install
```

**Expected output:** `538 packages installed` (or similar). This takes ~5–15 seconds with Bun.

### Step 2: Configure environment

```bash
cp .env.example .env
```

The defaults are correct for local dev — `DATABASE_URL="file:./db/stillwater.db"`. No edits needed.

> ⚠️ **Gotcha — parent `.env` shadowing:** If a parent directory has an `.env` file with `DATABASE_URL` set, Prisma may load it instead of the project's `.env` (dotenv searches up the tree). Check with:
> ```bash
> bunx prisma migrate status
> ```
> If the output shows a different database path than `file:./db/stillwater.db`, your parent `.env` is shadowing. Fix: ensure the project's `.env` is the only `.env` in the path, or set `DATABASE_URL` explicitly in your shell before running Prisma commands:
> ```bash
> export DATABASE_URL="file:./db/stillwater.db"
> ```

### Step 3: Initialize the database

```bash
bun run db:push
```

**What this does:**
- Creates the SQLite file at `./db/stillwater.db`
- Creates the `Lead` table (the only database model)
- Creates 3 indexes: `Lead_email_key` (unique), `Lead_status_idx`, `Lead_createdAt_idx`
- Regenerates the Prisma Client

**Expected output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "stillwater.db" at "file:./db/stillwater.db"

The database is now in sync with your Prisma schema.

Running generate...
✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client
```

> 📋 **No seed data needed:** Stillwater has no database seed script. Static content (teachers, practices, weekly schedule) lives in `src/lib/data/*.ts` as `readonly` arrays — not in the database. The only database table is `Lead`, which is populated by form submissions. See [§5.2](#52-why-theres-no-seed-data) for details.

### Step 4: Start the dev server

```bash
bun run dev
```

**Expected output:**
```
▲ Next.js 16.1.3 (Turbopack)
- Local: http://localhost:3000
✓ Ready in <1s
```

The dev server runs on `http://localhost:3000` with hot reload via Turbopack. Output is also teed to `dev.log`.

### Step 5: Verify the setup

Open `http://localhost:3000` in your browser. You should see the Stillwater homepage with all 6 sections: Hero, Practices, Teachers, Schedule, First-Class-Free, Footer.

**Run the quality gate to confirm everything is healthy:**

```bash
bun run lint           # 0 errors
bun run typecheck      # 0 errors
bun run test           # 22 tests pass
```

**Expected test output:**
```
 ✓ src/tests/unit/first-class.schema.test.ts (12 tests)
 ✓ src/tests/unit/first-class.rate-limit.test.ts (5 tests)
 ✓ src/tests/unit/first-class.honeypot.test.ts (5 tests)

 Test Files  3 passed (3)
      Tests  22 passed (22)
```

---

## 3. Production Deployment: Local (non-Docker)

Use this path when you want to run the production build directly with Bun (no Docker).

### Step 1: Build the production server

```bash
bun run build
```

**What this does:**
- Runs `next build` (Turbopack) to create an optimized production build
- Copies `.next/static/` into `.next/standalone/.next/`
- Copies `public/` into `.next/standalone/`
- Produces a self-contained server at `.next/standalone/server.js`

**Expected output:**
```
✓ Compiled successfully in ~11s
✓ Generating static pages using 1 worker (4/4)

Route (app)
┌ ○ /              (Static)
├ ○ /_not-found    (Static)
├ ƒ /api           (Dynamic)
└ ƒ /api/health    (Dynamic)
```

### Step 2: Initialize the database (if not already done)

If you haven't initialized the database yet (e.g., deploying to a fresh server):

```bash
# For SQLite (default):
bun run db:push

# For PostgreSQL (production):
# 1. Change `provider` to "postgresql" in prisma/schema.prisma
# 2. Set DATABASE_URL to your Postgres connection string in .env
# 3. Run migrations (NOT db:push):
bun run db:migrate
```

> ⚠️ **Never run `db:push` in production with Postgres.** Always use `prisma migrate deploy` (which applies existing migration files without prompting). The `db:migrate` script runs `prisma migrate dev`, which is for development — it can prompt interactively and create new migrations.

### Step 3: Start the production server

```bash
bun run start
```

**What this does:**
- Sets `NODE_ENV=production`
- Runs `bun .next/standalone/server.js`
- Tees output to `server.log`
- Listens on `0.0.0.0:3000`

**Expected output:**
```
▲ Next.js 16.1.3
- Local: http://localhost:3000
✓ Ready in <1s
```

### Step 4: Verify the production server

```bash
# Homepage returns 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
# Expected: 200

# Health check endpoint returns 200
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok"} or similar

# Server-rendered content is present
curl -s http://localhost:3000/ | grep -oE "(Stillwater|Practices|Teachers|Schedule|Vinyasa|Yin)" | sort -u
# Expected: Stillwater, Practices, Teachers, Schedule, Vinyasa, Yin
```

---

## 4. Production Deployment: Docker (Quick)

Use this path when you want to run Stillwater in a Docker container. For advanced Docker scenarios (TLS, Postgres, reverse proxy), see [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

### Step 1: Configure environment

```bash
cp .env.example .env.local
```

For Docker production, use `.env.local` (mounted by `docker-compose.prod.yml`). The default `DATABASE_URL="file:./db/stillwater.db"` is fine for a single-container SQLite deployment.

### Step 2: Build and start the container

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**What this does:**
- Builds the production Docker image using `Dockerfile` (multi-stage: deps → builder → runtime)
- Creates a non-root user (`stillwater`, uid 1001) for security
- Starts the container on `127.0.0.1:3000` (loopback only — put a reverse proxy in front for TLS)
- Creates a `db_data` named volume for the SQLite database (persists across container restarts)
- Sets up a healthcheck hitting `/api/health` every 30s

**Expected output:**
```
✔ Container stillwater-web  Started
```

### Step 3: Initialize the database (first run only)

```bash
docker compose -f docker-compose.prod.yml exec web bunx prisma db push
```

This creates the `Lead` table inside the container's SQLite file (persisted via the `db_data` volume).

### Step 4: Verify the container is healthy

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps
# Expected: stillwater-web  Up (healthy)

# Check health endpoint
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Check homepage
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
# Expected: 200
```

### Step 5: View logs (if needed)

```bash
docker compose -f docker-compose.prod.yml logs -f web
```

---

## 5. Database Details

### 5.1 Schema

Stillwater uses a **single Prisma model**: `Lead` (first-class-free form submissions). The schema lives at `prisma/schema.prisma`:

```prisma
model Lead {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique
  preferredDay    String
  notes           String?
  status          String   @default("pending")  // pending | replied | booked | archived
  ipHash          String?  // SHA-256 of IP, truncated to 16 chars
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

**That's the entire database.** One table, three indexes, one unique constraint.

### 5.2 Why there's no seed data

Stillwater deliberately has **no seed script** and **no seed data**. Here's why:

| Content type | Where it lives | Why not the database? |
| --- | --- | --- |
| Teachers (3 items) | `src/lib/data/teachers.ts` | Changes ~annually. Version-controlled in code. No admin UI needed. |
| Practices (4 items) | `src/lib/data/practices.ts` | Same — reference data, not user-generated. |
| Schedule (10 classes) | `src/lib/data/schedule.ts` | Same — weekly schedule, updated via code. |
| Preferred days (6 options) | `src/lib/data/schedule.ts` | Enum for the form's select field. |
| **Lead submissions** | **`Lead` table (SQLite)** | **User-generated — this IS in the database.** |

**The database is for mutable state (form submissions), not reference data.** Static content renders faster from code (no DB round-trip), is easier to version-control (diffs are readable), and doesn't require migrations.

### 5.3 Migration vs `db push`

Stillwater supports two database initialization approaches:

| Approach | Command | When to use | Migration history? |
| --- | --- | --- | --- |
| **`db push`** | `bun run db:push` | Dev only (SQLite). Pushes schema directly. | No |
| **`migrate deploy`** | `bunx prisma migrate deploy` | Production (SQLite or Postgres). Applies migration files. | Yes |
| **`migrate dev`** | `bun run db:migrate` | Dev only. Creates + applies new migrations. | Yes |

The project includes one migration: `prisma/migrations/20260704060757_init/` (creates the `Lead` table + indexes).

**For local dev:** `bun run db:push` is the fastest path (no migration files needed).

**For production:** Always use `bunx prisma migrate deploy` — it applies existing migrations without prompting, and is safe for Postgres.

### 5.4 Resetting the database

If you need to start fresh (drops all data and recreates the schema):

```bash
# Dev (SQLite) — destroys all data:
bun run db:reset

# Then re-initialize:
bun run db:push
```

> ⚠️ **Never run `db:reset` in production.** It destroys all lead submissions. To reset a production Postgres database, take a backup first, then drop and recreate the schema manually.

### 5.5 Inspecting the database

```bash
# View all leads (dev only — no admin UI exists)
bunx prisma studio
# Opens a web UI at http://localhost:5555

# Or query directly via the Prisma Client:
bun -e "import {db} from './src/lib/db'; db.lead.findMany().then(console.log)"
```

---

## 6. Verification & Smoke Tests

### 6.1 Quality gate (run before every commit)

```bash
bun run lint           # ESLint — 0 errors
bun run typecheck      # tsc --noEmit — 0 errors
bun run test           # Vitest — 22 tests pass
bun run build          # Next.js build — succeeds (4 routes)
```

### 6.2 Form submission smoke test

```bash
# Submit a test lead via curl (server must be running)
curl -s -X POST http://localhost:3000/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Smoke+Test&email=smoke@example.com&preferredDay=Weekday+morning&company="

# Verify the lead was persisted
bun -e "import {db} from './src/lib/db'; db.lead.findFirst({where:{email:'smoke@example.com'}}).then(l => console.log(l ? '✅ Lead found' : '❌ Lead not found'))"
```

### 6.3 Browser verification (manual)

Open `http://localhost:3000` and verify:

- [ ] Hero section renders with 8-second breath animation
- [ ] Practices section shows 4 cards (Vinyasa, Yin, Restorative, Breathwork)
- [ ] Teachers section shows 3 teachers with hover typewriter quotes
- [ ] Schedule section shows 10 classes in expandable accordion rows
- [ ] First-Class-Free form accepts a submission and shows "Thank you" state
- [ ] Footer shows 4 columns of editorial content
- [ ] No console errors (open browser DevTools)
- [ ] No network errors (check Network tab)

### 6.4 Docker health check

```bash
# Container is healthy
docker compose -f docker-compose.prod.yml ps
# Status column should show "Up (healthy)"

# Health endpoint
curl -s http://localhost:3000/api/health | head -1
# Expected: 200 OK or {"status":"ok"}
```

---

## 7. Troubleshooting

### 7.1 `bun install` fails

| Symptom | Cause | Fix |
| --- | --- | --- |
| `error: unresolved dependencies` | Lockfile out of sync | Delete `bun.lock` and re-run `bun install` |
| `EACCES: permission denied` | Node modules owned by root | `sudo chown -R $USER:$USER node_modules` |
| `certificate verification failed` | Corporate proxy / self-signed cert | `export NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only) |

### 7.2 `prisma db push` fails

| Symptom | Cause | Fix |
| --- | --- | --- |
| `P1003: Database does not exist` | The `db/` directory doesn't exist | `mkdir -p db && bun run db:push` |
| Wrong database path shown | Parent `.env` shadowing | See [§2 Step 2 gotcha](#step-2-configure-environment) |
| `Environment variables loaded from .env` but wrong DB | dotenv loaded a parent `.env` | `export DATABASE_URL="file:./db/stillwater.db"` then retry |

### 7.3 `bun run dev` fails

| Symptom | Cause | Fix |
| --- | --- | --- |
| `EADDRINUSE: address already in use 0.0.0.0:3000` | Another process on port 3000 | `lsof -i :3000` then kill the process, or change port in `package.json` |
| `Cannot find module '@prisma/client'` | Prisma Client not generated | `bun run db:generate` |
| Hydration mismatch in console | `useSyncExternalStore` SSR mismatch | Check `getServerSnapshot` returns the default value — see `src/hooks/use-reduced-motion.ts` |

### 7.4 `bun run build` fails

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Cannot find module 'X'` at a config file | Orphan config file imports uninstalled dep | Delete the config file or install the dep. See CLAUDE.md "Orphan config files" anti-pattern. |
| `Server Actions must be async functions` | `'use server'` module exported a sync function | Move pure sync logic to a non-`'use server'` module. See `src/lib/first-class-validation.ts`. |
| `Property 'payload' does not exist` after version bump | Unjustified major version bump | Revert the version bump in `package.json`. See Bug #10 in `stillwater_SKILL.md`. |

### 7.5 Form submission fails

| Symptom | Cause | Fix |
| --- | --- | --- |
| `P2002` unique constraint on `email` | Email already submitted | This is expected behavior — the server action returns a warm `DUPLICATE` message. Not a bug. |
| `RATE_LIMIT` response | >3 submissions/hour from same IP | Wait 1 hour, or the rate limiter is fail-open (check `src/lib/first-class-validation.ts`). |
| `INTERNAL` response | Prisma error (not P2002) | Check `dev.log` or `server.log` for the full error. The server action hides internal errors from the client. |

### 7.6 Docker-specific issues

| Symptom | Cause | Fix |
| --- | --- | --- |
| Container exits immediately | `db:push` not run (no DB file) | `docker compose -f docker-compose.prod.yml exec web bunx prisma db push` |
| `permission denied` on `db/` volume | Volume owned by root | `docker compose down -v` then `up -d --build` (recreates the volume) |
| Healthcheck fails | `/api/health` can't reach the DB | Check `DATABASE_URL` inside the container: `docker compose exec web printenv DATABASE_URL` |

---

## 8. What's Next

### 8.1 After local dev is running

- Read [`CLAUDE.md`](./CLAUDE.md) for comprehensive project conventions
- Read [`AGENTS.md`](./AGENTS.md) for compact agent instructions
- Read [`stillwater_SKILL.md`](./stillwater_SKILL.md) for the deepest-layer skill document (bugs, lessons, ADRs)
- Read [`Project_Architecture_Document.md`](./Project_Architecture_Document.md) for the full architecture reference

### 8.2 Before deploying to production

- Replace `picsum.photos` placeholder images with real photography (update `next.config.ts` `remotePatterns`)
- Set up a reverse proxy with TLS (Caddy, Nginx, or Traefik) — see [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) §6
- Consider migrating from SQLite to PostgreSQL if you expect concurrent writers — see [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) §5
- Set up CI/CD (the workflow at `.github/workflows/ci.yml` runs lint + typecheck + test + build on every push/PR)
- Set up database backups (schedule a periodic `docker cp` of the SQLite file, or use managed Postgres backups)

### 8.3 Adding features

- **Adding a teacher/practice/class**: Edit the `readonly` array in `src/lib/data/*.ts` — no database migration needed.
- **Adding a new form field**: Update the Zod schema in `src/lib/first-class-validation.ts`, the Prisma schema in `prisma/schema.prisma`, run `bun run db:push` (dev) or create a migration (prod), and update the form component in `src/components/sections/FirstClassFree.tsx`.
- **Adding a new route**: The project is single-route (`/` only) by design. Adding routes requires explicit user request — see ADR-010 in `stillwater_SKILL.md`.

---

## Quick Reference: Command Summary

```bash
# ── Setup (first time) ──────────────────────────────────────
git clone https://github.com/nordeim/yoga-studio.git stillwater
cd stillwater
bun install
cp .env.example .env
bun run db:push

# ── Development ─────────────────────────────────────────────
bun run dev              # http://localhost:3000 (hot reload)

# ── Quality gate (before every commit) ──────────────────────
bun run lint             # ESLint
bun run typecheck        # tsc --noEmit
bun run test             # Vitest (22 tests)

# ── Production (local, non-Docker) ──────────────────────────
bun run build            # creates .next/standalone/server.js
bun run start            # starts production server on :3000

# ── Production (Docker) ─────────────────────────────────────
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec web bunx prisma db push
docker compose -f docker-compose.prod.yml logs -f web

# ── Database ────────────────────────────────────────────────
bun run db:push          # dev: push schema to SQLite
bun run db:generate      # regenerate Prisma Client
bun run db:migrate       # dev: create + apply migration
bun run db:reset         # dev: destroy + recreate (⚠️ loses data)
bunx prisma studio       # open DB browser at localhost:5555

# ── Inspect ─────────────────────────────────────────────────
bunx prisma migrate status   # check migration state
tail -f dev.log              # live dev server logs
grep "POST /" dev.log        # form submissions
```

---

*Stillwater · Yoga Studio — Quick Start Guide. For questions, refer to the companion docs: `README.md`, `CLAUDE.md`, `AGENTS.md`, `stillwater_SKILL.md`, `Project_Architecture_Document.md`, `DEPLOYMENT_GUIDE.md`.*
