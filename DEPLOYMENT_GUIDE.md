# Stillwater · Yoga Studio — Container Deployment Guide

> **Audience:** DevOps engineers, solo developers deploying to a VPS, and anyone who needs to run Stillwater in Docker.
>
> **Scope:** Every supported deployment path — from a one-command dev container to a hardened production setup with TLS and Postgres. Pick the section that matches your target environment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start: Development Container](#2-quick-start-development-container)
3. [Production Deployment: Docker Compose](#3-production-deployment-docker-compose)
4. [Production Deployment: Standalone Docker](#4-production-deployment-standalone-docker)
5. [Migrating from SQLite to PostgreSQL](#5-migrating-from-sqlite-to-postgresql)
6. [Reverse Proxy + TLS (Caddy / Nginx / Traefik)](#6-reverse-proxy--tls-caddy--nginx--traefik)
7. [Health Monitoring](#7-health-monitoring)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Image Architecture](#9-image-architecture)
10. [Scaling Considerations](#10-scaling-considerations)
11. [Troubleshooting](#11-troubleshooting)
12. [Rollback Procedure](#12-rollback-procedure)
13. [Deployment Checklist](#13-deployment-checklist)

---

## 1. Prerequisites

### 1.1 Host requirements

| Requirement | Minimum | Recommended |
| --- | --- | --- |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 512 MB | 1 GB |
| Disk | 1 GB | 5 GB (for SQLite volume + image cache) |
| OS | Linux x86_64 (Ubuntu 22.04+, Debian 12+, Alpine) | Ubuntu 24.04 LTS |
| Network | Public IP or domain with DNS A record | Domain + CDN (Cloudflare) in front |

The Stillwater image is ~200 MB (Alpine base + Bun runtime + standalone Next.js build). The SQLite database starts at ~16 KB and grows by ~1 KB per form submission — you won't hit disk limits.

### 1.2 Software requirements

| Tool | Version | Purpose |
| --- | --- | --- |
| Docker Engine | ≥ 24.0 | Container runtime |
| Docker Compose | ≥ 2.20 (v2 plugin, not the old `docker-compose` Python script) | Multi-service orchestration |
| `curl` | any | Healthcheck verification |
| `git` | ≥ 2.40 | Cloning the repo (if building from source) |

**Install Docker** (if not already installed):

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker  # or log out and back in

# Verify
docker --version          # ≥ 24.0
docker compose version    # ≥ 2.20
```

### 1.3 Get the code

```bash
git clone <your-repo-url> stillwater
cd stillwater
```

---

## 2. Quick Start: Development Container

The fastest path to a running dev server with hot reload. Uses `docker-compose-dev.yml` (single `web` service, SQLite volume, no external database).

### 2.1 Configure environment

```bash
cp .env.example .env
```

The defaults are fine for dev — `DATABASE_URL="file:./db/stillwater.db"`.

### 2.2 Start the dev container

```bash
docker compose -f docker-compose-dev.yml up -d
```

This will:
1. Build the `Dockerfile.dev` image (installs Bun dependencies).
2. Start the `stillwater-web-dev` container on port 3000.
3. Bind-mount your source code (`.:/app`) for hot reload via Turbopack.
4. Create the `db_data` named volume for the SQLite file.

### 2.3 Initialize the database (first run only)

```bash
docker compose -f docker-compose-dev.yml exec web bunx prisma db push
```

This creates `./db/stillwater.db` inside the container (persisted via the `db_data` volume). Run this only once — on subsequent restarts, the database persists.

### 2.4 Verify

```bash
# Homepage should return 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
# Expected: 200

# Health endpoint should return ok
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok","database":"connected","timestamp":"..."}

# Container should be healthy
docker compose -f docker-compose-dev.yml ps
# Expected: stillwater-web-dev   ...   Up (healthy)   0.0.0.0:3000->3000/tcp
```

Open <http://localhost:3000> in your browser.

### 2.5 Common dev commands

```bash
# View logs (live)
docker compose -f docker-compose-dev.yml logs -f web

# Restart the container (picks up Dockerfile.dev changes)
docker compose -f docker-compose-dev.yml restart web

# Rebuild the image (after dependency changes in package.json)
docker compose -f docker-compose-dev.yml up -d --build

# Stop
docker compose -f docker-compose-dev.yml down

# Stop + remove volumes (⚠️ destroys the SQLite database)
docker compose -f docker-compose-dev.yml down -v
```

### 2.6 Hot reload notes

- Source changes (`.tsx`, `.ts`, `.css`) hot-reload automatically via Turbopack — no restart needed.
- `package.json` / `bun.lock` changes require a rebuild: `docker compose -f docker-compose-dev.yml up -d --build`.
- `prisma/schema.prisma` changes require `bunx prisma db push` (inside the container) + `bunx prisma generate`.
- The `.next` directory is a named volume — preserved across restarts for faster rebuilds.

---

## 3. Production Deployment: Docker Compose

The recommended production path. Uses `docker-compose.prod.yml` (single `web` service, binds to loopback, healthcheck, SQLite volume).

### 3.1 Configure production environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# .env.local
DATABASE_URL="file:./db/stillwater.db"
NEXT_TELEMETRY_DISABLED=1
```

**For SQLite** (default, low-traffic sites): the above is sufficient. The SQLite file persists in the `db_data` named volume.

**For PostgreSQL** (high-traffic or managed-backup sites): see [§5 Migrating to PostgreSQL](#5-migrating-from-sqlite-to-postgresql) first, then set:

```bash
# .env.local
DATABASE_URL="postgresql://stillwater:STRONG_PASSWORD@postgres:5432/stillwater?schema=public"
NEXT_TELEMETRY_DISABLED=1
```

### 3.2 Build and start the production container

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
1. Build the `Dockerfile` image (multi-stage: deps → builder → runtime).
2. Start the `stillwater-web` container bound to `127.0.0.1:3000` (loopback only — see [§6](#6-reverse-proxy--tls-caddy--nginx--traefik) for putting a reverse proxy in front).
3. Mount `.env.local` as the environment.
4. Create the `db_data` named volume for the SQLite file.

### 3.3 Initialize the database (first run only)

```bash
docker compose -f docker-compose.prod.yml exec web bunx prisma db push
```

**For PostgreSQL**: use `bunx prisma migrate deploy` instead (applies migration SQL files, not schema push):

```bash
docker compose -f docker-compose.prod.yml exec web bunx prisma migrate deploy
```

### 3.4 Verify

```bash
# Container is healthy
docker compose -f docker-compose.prod.yml ps
# Expected: stillwater-web   ...   Up (healthy)   127.0.0.1:3000->3000/tcp

# Health endpoint returns ok
curl -s http://localhost:3000/api/health | jq .
# Expected: { "status": "ok", "database": "connected", "timestamp": "..." }

# Homepage returns 200 and contains key content
curl -s http://localhost:3000/ | grep -oE "(Stillwater|Practices|Teachers|Schedule)" | sort -u
# Expected: Practices, Schedule, Stillwater, Teachers
```

### 3.5 Common prod commands

```bash
# View logs (live)
docker compose -f docker-compose.prod.yml logs -f web

# Restart (zero-downtime if behind a reverse proxy with health checks)
docker compose -f docker-compose.prod.yml restart web

# Rebuild + restart (after pulling new code)
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Stop
docker compose -f docker-compose.prod.yml down

# Stop + remove volumes (⚠️ DESTROYS the SQLite database — back up first!)
docker compose -f docker-compose.prod.yml down -v
```

### 3.6 Backup the SQLite database

The SQLite file lives in the `db_data` named volume. Back it up with:

```bash
# Back up to a tarball
docker run --rm -v stillwater_db_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/stillwater-db-$(date +%Y%m%d).tar.gz -C /data .

# Restore from a tarball
docker run --rm -v stillwater_db_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/stillwater-db-20260101.tar.gz -C /data
```

Schedule this as a cron job on the host:

```bash
# crontab -e
0 3 * * * /usr/local/bin/docker run --rm -v stillwater_db_data:/data -v /backups:/backup alpine tar czf /backup/stillwater-db-$(date +\%Y\%m\%d).tar.gz -C /data .
```

---

## 4. Production Deployment: Standalone Docker

If you prefer plain Docker commands (no compose), or want to integrate Stillwater into an existing compose stack.

### 4.1 Build the image

```bash
docker build -t stillwater-web:prod .
```

The image is ~200 MB. Tag it with the git SHA for traceability:

```bash
GIT_SHA=$(git rev-parse --short HEAD)
docker tag stillwater-web:prod stillwater-web:$GIT_SHA
```

### 4.2 Run the container

```bash
docker run -d \
  --name stillwater-web \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file .env.local \
  -v stillwater_db_data:/app/db \
  stillwater-web:prod
```

**Flags explained:**
- `-d` — detached (background)
- `--name stillwater-web` — friendly name for `docker logs stillwater-web`
- `--restart unless-stopped` — auto-restart on crash, but not on `docker stop`
- `-p 127.0.0.1:3000:3000` — bind to loopback only (reverse proxy in front)
- `--env-file .env.local` — load environment variables
- `-v stillwater_db_data:/app/db` — named volume for SQLite (persists across container recreation)

### 4.3 Initialize the database (first run only)

```bash
docker exec stillwater-web bunx prisma db push
```

### 4.4 Verify

```bash
docker ps --filter name=stillwater-web
# Expected: STATUS column shows "Up (healthy)"

curl -s http://localhost:3000/api/health | jq .
# Expected: { "status": "ok", "database": "connected", ... }
```

### 4.5 Update to a new version

```bash
# Pull new code
git pull

# Rebuild
docker build -t stillwater-web:prod .

# Stop the old container
docker stop stillwater-web && docker rm stillwater-web

# Start the new container (same command as §4.2)
docker run -d --name stillwater-web --restart unless-stopped \
  -p 127.0.0.1:3000:3000 --env-file .env.local \
  -v stillwater_db_data:/app/db stillwater-web:prod
```

The `db_data` volume persists across the recreation — no data loss.

---

## 5. Migrating from SQLite to PostgreSQL

SQLite is sufficient for a marketing site with low form-submission volume. Migrate to Postgres when you need: concurrent writers, managed backups, Postgres extensions, or higher write throughput.

### 5.1 When to migrate

| Signal | Action |
| --- | --- |
| < 100 submissions/day | Stay on SQLite |
| 100–1000 submissions/day | Consider Postgres (mostly for backup convenience) |
| > 1000 submissions/day | Migrate to Postgres |
| Need managed backups | Migrate to Postgres (Neon, Supabase, RDS) |
| Need concurrent writers | Migrate to Postgres (SQLite is single-writer) |

### 5.2 Step-by-step migration

#### Step 1: Add Postgres to docker-compose.prod.yml

Add a `postgres` service to `docker-compose.prod.yml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: stillwater-postgres
    environment:
      POSTGRES_DB: stillwater
      POSTGRES_USER: stillwater
      POSTGRES_PASSWORD: ${DB_PASSWORD:-CHANGE_ME_STRONG_PASSWORD}
      TZ: UTC
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "127.0.0.1:5432:5432"  # loopback only
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stillwater -d stillwater"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped

  web:
    # ... existing web config ...
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  db_data:        # keep for backward compat (or remove if fully migrated)
    driver: local
  postgres_data:
    driver: local
```

#### Step 2: Change the Prisma provider

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  # was "sqlite"
  url      = env("DATABASE_URL")
}
```

Also change the `status` field on `Lead` from `String` to an enum (Postgres supports Prisma enums):

```prisma
enum LeadStatus {
  pending
  replied
  booked
  archived
}

model Lead {
  # ...
  status LeadStatus @default(pending)
  # ...
}
```

#### Step 3: Update .env.local

```bash
# .env.local
DATABASE_URL="postgresql://stillwater:STRONG_PASSWORD@postgres:5432/stillwater?schema=public"
NEXT_TELEMETRY_DISABLED=1
```

#### Step 4: Generate + apply the migration

```bash
# Generate the migration SQL
docker compose -f docker-compose.prod.yml run --rm web bunx prisma migrate dev --name migrate-to-postgres

# Apply it
docker compose -f docker-compose.prod.yml up -d
```

#### Step 5: Migrate existing SQLite data (if you have submissions)

```bash
# Export from SQLite
docker compose -f docker-compose.prod.yml run --rm web \
  bunx prisma db pull --url="file:./db/stillwater.db"

# The data needs to be exported as SQL and re-imported into Postgres.
# For a small Lead table, use this one-liner:
docker compose -f docker-compose.prod.yml exec web sh -c \
  "sqlite3 ./db/stillwater.db '.dump Lead' | sed 's/INSERT INTO/INSERT INTO/' > /tmp/leads.sql"

# Import into Postgres (adjust syntax as needed — SQLite and Postgres
# SQL dialects differ slightly for booleans and dates)
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U stillwater -d stillwater -f /tmp/leads.sql
```

For larger migrations, use a tool like [`pgloader`](https://pgloader.readthedocs.io/) which handles the SQLite → Postgres dialect conversion automatically.

#### Step 6: Remove the SQLite volume (optional, after verifying the migration)

```bash
docker compose -f docker-compose.prod.yml down
docker volume rm stillwater_db_data
docker compose -f docker-compose.prod.yml up -d
```

---

## 6. Reverse Proxy + TLS (Caddy / Nginx / Traefik)

The production container binds to `127.0.0.1:3000` (loopback only). To serve it on the public internet with HTTPS, put a reverse proxy in front. **Caddy is recommended** — it auto-provisions and renews Let's Encrypt certificates.

### 6.1 Caddy (recommended — automatic TLS)

#### Install Caddy

```bash
# Ubuntu / Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

#### Configure Caddy

Create `/etc/caddy/Caddyfile`:

```caddyfile
stillwater.yoga {
    # Proxy to the Stillwater container
    reverse_proxy 127.0.0.1:3000

    # Compression
    encode gzip zstd

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
    }

    # Cache static assets aggressively
    @static {
        path /_next/static/*
        path /public/*
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
}
```

#### Start Caddy

```bash
sudo systemctl reload caddy
```

Caddy will automatically:
1. Provision a Let's Encrypt certificate for `stillwater.yoga`.
2. Redirect HTTP → HTTPS.
3. Renew the certificate before it expires.
4. Proxy requests to `127.0.0.1:3000`.

**Prerequisite**: Point your domain's DNS A record at the server's public IP before starting Caddy, or Let's Encrypt provisioning will fail.

### 6.2 Nginx (manual TLS)

For existing Nginx setups. Install `certbot` for Let's Encrypt certificate management.

```nginx
# /etc/nginx/sites-available/stillwater.yoga
server {
    listen 80;
    server_name stillwater.yoga;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stillwater.yoga;

    ssl_certificate /etc/letsencrypt/live/stillwater.yoga/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stillwater.yoga/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static assets — long cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Everything else — proxy to Stillwater
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/stillwater.yoga /etc/nginx/sites-enabled/
sudo certbot --nginx -d stillwater.yoga
sudo nginx -t && sudo systemctl reload nginx
```

### 6.3 Traefik (Docker-native, automatic TLS)

If you're running Stillwater alongside other Docker services, Traefik is the most Docker-friendly option. Add labels to the `web` service in `docker-compose.prod.yml`:

```yaml
services:
  web:
    # ... existing config ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.stillwater.rule=Host(`stillwater.yoga`)"
      - "traefik.http.routers.stillwater.entrypoints=websecure"
      - "traefik.http.routers.stillwater.tls.certresolver=letsencrypt"
      - "traefik.http.services.stillwater.loadbalancer.server.port=3000"
    networks:
      - traefik_public

networks:
  traefik_public:
    external: true
```

Remove the `ports` mapping (Traefik handles routing). See the [Traefik docs](https://doc.traefik.io/traefik/) for the full Traefik setup.

### 6.4 Verify TLS

```bash
# Grade your TLS configuration (aim for A or A+)
curl -s https://www.ssllabs.com/ssltest/analyze.html?d=stillwater.yoga | grep "Overall Rating"

# Or use the CLI:
npx ssllabs-scan --grade stillwater.yoga
```

---

## 7. Health Monitoring

### 7.1 The `/api/health` endpoint

Stillwater exposes a health check endpoint at `/api/health`. It returns:

- **200** `{"status":"ok","database":"connected","timestamp":"..."}` — healthy
- **503** `{"status":"degraded","database":"disconnected","error":"..."}` — database unreachable

The endpoint runs `db.$queryRaw\`SELECT 1\`` against the database — a trivial query that verifies connectivity without depending on schema state.

### 7.2 Docker healthcheck

Both Dockerfiles configure a healthcheck:

```dockerfile
# Production Dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

Docker marks the container as `healthy` after 3 consecutive successes (start period 15s) and `unhealthy` after 3 consecutive failures.

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' stillwater-web
# Expected: healthy

# Get the last 5 health check results
docker inspect --format='{{range .State.Health.Log}}{{.ExitCode}}: {{.Output}}{{end}}' stillwater-web
```

### 7.3 External monitoring (recommended)

Set up an external uptime monitor that hits your public health endpoint:

```bash
# UptimeRobot / Pingdom / Better Stack — configure a check for:
# URL: https://stillwater.yoga/api/health
# Expected status: 200
# Expected body contains: "ok"
# Check interval: 60s
```

### 7.4 Log aggregation

The Docker container logs to stdout/stderr (standard Next.js + Bun practice). Forward to your log aggregator:

```bash
# View live logs
docker compose -f docker-compose.prod.yml logs -f web

# Forward to a log aggregator (Loki, Datadog, CloudWatch) via Docker's
# logging drivers. Example: json-file with rotation
docker compose -f docker-compose.prod.yml up -d --build \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3
```

For production, configure the logging driver in `docker-compose.prod.yml`:

```yaml
services:
  web:
    # ...
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 8. Environment Variables Reference

The complete list of env vars the codebase reads or that Next.js/Bun/Docker set automatically.

| Variable | Required | Set By | Default | Description |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | User (`.env` / `.env.local`) | — | Prisma connection string. SQLite (`file:./db/stillwater.db`) or Postgres (`postgresql://...`). |
| `NODE_ENV` | ✅ | Docker / Next.js | `development` | Runtime mode. `production` enables Prisma prod singleton + disables dev warnings. |
| `NEXT_TELEMETRY_DISABLED` | Optional | User / Dockerfile | unset | `1` disables Next.js anonymous telemetry. |
| `NEXT_PHASE` | Auto | Next.js | — | `phase-production-build` during `next build`. Don't set manually. |
| `HOSTNAME` | Optional | Dockerfile | `0.0.0.0` | Server bind address. `0.0.0.0` = all interfaces. |
| `PORT` | Optional | Dockerfile | `3000` | Server port. |
| `DB_PASSWORD` | Optional | User (only if using Postgres compose) | — | Postgres password, referenced in the compose's `${DB_PASSWORD:-...}` default. |

**Future vars (when you add auth/payments/email):**

| Variable | Required when | Description |
| --- | --- | --- |
| `AUTH_SECRET` | Adding Auth.js v5 | 32+ char random string. Generate with `openssl rand -base64 32`. |
| `AUTH_URL` | Adding Auth.js v5 | Public URL (`https://stillwater.yoga`). |
| `RESEND_API_KEY` | Adding transactional email | Starts with `re_`. |
| `UPSTASH_REDIS_REST_URL` | Outgrowing in-memory rate limiter | `https://...upstash.io`. |
| `UPSTASH_REDIS_REST_TOKEN` | Outgrowing in-memory rate limiter | Upstash REST token. |

---

## 9. Image Architecture

### 9.1 Multi-stage build overview

The production `Dockerfile` is a 3-stage build:

```
Stage 1: deps     ← oven/bun:1-alpine + bun install (all deps, including dev)
    ↓
Stage 2: builder  ← deps + source + prisma generate + bun run build
    ↓
Stage 3: runtime  ← oven/bun:1-alpine + standalone build output + curl
                    (non-root user, no dev deps, no source code)
```

### 9.2 Why `oven/bun:1-alpine`?

- **Bun is both PM and runtime** — no need for separate Node + pnpm images.
- **Alpine base** is ~5 MB vs ~100 MB for `debian-slim`.
- **Bun's standalone server** (`bun .next/standalone/server.js`) is faster than `next start` for the standalone build output.
- **Final image size**: ~200 MB (Alpine + Bun + standalone Next.js + curl).

### 9.3 Security hardening

| Measure | How |
| --- | --- |
| Non-root user | `stillwater` (uid 1001) — never runs as root. |
| No dev dependencies in runtime | Standalone output is self-contained; runtime stage doesn't run `bun install`. |
| No source code in runtime | Only `.next/standalone/`, `.next/static/`, `public/`, `prisma/` are copied. |
| Minimal runtime packages | Only `curl` (for healthcheck). No `ffmpeg`, no `git`, no build tools. |
| `.dockerignore` | Excludes `node_modules`, `.next`, `.git`, `.env*`, `db/`, docs, audit folders from the build context. |
| Telemetry disabled | `NEXT_TELEMETRY_DISABLED=1` in the Dockerfile. |

### 9.4 Build context size

With the `.dockerignore` in place, the build context sent to the Docker daemon is ~5 MB (just `src/`, `prisma/`, `public/`, config files, docs). Without `.dockerignore`, it would include `node_modules` (~500 MB) and `.next` (~200 MB) — dramatically slowing the build.

---

## 10. Scaling Considerations

### 10.1 Vertical scaling (single container)

The simplest scaling path. Increase the container's resource limits:

```yaml
# docker-compose.prod.yml
services:
  web:
    # ...
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 256M
```

Bun's standalone server handles ~1000 concurrent requests on a 1 vCPU / 512 MB container. For a marketing site, this is more than enough.

### 10.2 Horizontal scaling (multiple containers)

For higher availability or traffic, run multiple containers behind a load balancer. **Requires migrating to PostgreSQL first** — SQLite doesn't support multiple writers.

```yaml
# docker-compose.prod.yml (scaled)
services:
  web:
    # ...
    deploy:
      replicas: 3
    # Remove the fixed container_name — compose will generate unique names
    # container_name: stillwater-web  ← remove this
```

Or with `docker run`:

```bash
docker run -d --name stillwater-web-1 ... stillwater-web:prod
docker run -d --name stillwater-web-2 ... stillwater-web:prod
docker run -d --name stillwater-web-3 ... stillwater-web:prod
```

Put a load balancer (HAProxy, Nginx, Traefik, or your cloud provider's LB) in front of the containers. Configure the LB's health check to hit `/api/health`.

### 10.3 CDN (for static assets)

Next.js static assets (`/_next/static/*`) are immutable and cacheable forever. Put a CDN (Cloudflare, CloudFront, Fastly) in front:

- **Origin**: your reverse proxy (Caddy/Nginx) on the server.
- **Cache behavior**: cache `/_next/static/*` for 1 year, cache `/` for 60s (or whatever your content freshness tolerance is).
- **TLS**: CDN terminates TLS, talks to origin over HTTPS (or HTTP if the CDN is in the same VPC).

Cloudflare's free tier is sufficient for a marketing site.

---

## 11. Troubleshooting

### 11.1 Container won't start

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Error: Cannot find module '.next/standalone/server.js'` | Build failed or `.next/standalone/` not copied | Check the build output: `docker compose -f docker-compose.prod.yml logs web`. Rebuild: `docker compose -f docker-compose.prod.yml up -d --build` |
| `Error: Database connection failed` | SQLite file missing or Postgres unreachable | Run `bunx prisma db push` (SQLite) or check Postgres container health (Postgres). |
| `EADDRINUSE: address already in use 0.0.0.0:3000` | Another process is using port 3000 | `lsof -i :3000` to find it, kill it, or change Stillwater's port: `-p 127.0.0.1:3001:3000`. |
| Container exits immediately | Crash on startup | `docker logs stillwater-web` — the stack trace will show the cause. |

### 11.2 Health check failing

```bash
# Check the health check log
docker inspect --format='{{json .State.Health.Log}}' stillwater-web | jq .

# Common causes:
# 1. Database not initialized → docker exec stillwater-web bunx prisma db push
# 2. curl not installed → check the Dockerfile (runtime stage has `apk add curl`)
# 3. App not ready yet → increase start_period in the HEALTHCHECK
```

### 11.3 Form submissions failing

```bash
# Check the app logs for the server action
docker compose -f docker-compose.prod.yml logs web | grep -E "(Error|claimFirstClass)"

# Common causes:
# 1. Rate limit hit (3/hour per IP) → wait an hour or restart the container
#    (the rate limiter is in-memory and resets on restart)
# 2. Duplicate email → the action returns DUPLICATE (expected, not a bug)
# 3. Database write failed → check /api/health and disk space
```

### 11.4 Slow page load

```bash
# Check if the container is resource-constrained
docker stats stillwater-web

# Check network — the hero image comes from picsum.photos
curl -o /dev/null -s -w "%{time_total}\n" https://picsum.photos/seed/yoga-morning-light-studio-window/2400/1600
# If > 2s, swap to local images in public/ and update next.config.ts
```

### 11.5 SQLite database locked

```bash
# SQLite is single-writer. If you see "SQLITE_BUSY", another write is in progress.
# The Prisma client retries automatically, but if it persists:

# 1. Check for long-running transactions
docker exec stillwater-web sh -c "bunx prisma studio"  # inspect the DB

# 2. If the DB is wedged, restart the container (releases the lock)
docker compose -f docker-compose.prod.yml restart web

# 3. For persistent write contention, migrate to Postgres (§5)
```

---

## 12. Rollback Procedure

### 12.1 Rollback to a previous image version

If you tagged images with git SHAs (recommended in §4.1):

```bash
# Find the previous working version
docker images stillwater-web --format "{{.Tag}} {{.CreatedAt}}"

# Stop the current container
docker compose -f docker-compose.prod.yml down

# Update the image tag in docker-compose.prod.yml (or use docker run)
# image: stillwater-web:abc1234  ← previous SHA

# Start with the old image
docker compose -f docker-compose.prod.yml up -d
```

### 12.2 Rollback a database migration (Postgres only)

If a Prisma migration broke something:

```bash
# List migrations
docker compose -f docker-compose.prod.yml exec web bunx prisma migrate status

# Roll back to a specific migration
docker compose -f docker-compose.prod.yml exec web bunx prisma migrate resolve --rolled-back <migration_name>

# Then restore the old code + restart
```

**SQLite doesn't have migrations** (it uses `db push` which is destructive). For SQLite, restore from the daily backup (§3.6).

### 12.3 Rollback the database from backup

```bash
# Stop the container
docker compose -f docker-compose.prod.yml down

# Restore the SQLite volume from a backup tarball
docker run --rm -v stillwater_db_data:/data -v $(pwd):/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/stillwater-db-20260101.tar.gz -C /data"

# Restart with the old image
docker compose -f docker-compose.prod.yml up -d
```

---

## 13. Deployment Checklist

Run through this checklist before every production deployment.

### 13.1 Pre-deploy

- [ ] Code is merged to `main` and passes CI (`bun run lint && npx tsc --noEmit`)
- [ ] `.env.local` has the correct `DATABASE_URL` for the target environment
- [ ] If Postgres: `prisma/schema.prisma` `provider` is `"postgresql"`
- [ ] If Postgres: migrations are committed and tested locally
- [ ] `next.config.ts` `images.remotePatterns` points to production image host (not `picsum.photos`)
- [ ] `allowedDevOrigins` is cleared or updated (sandbox-only setting)
- [ ] DNS A record points to the server's public IP
- [ ] Reverse proxy (Caddy/Nginx) is configured for the production domain
- [ ] TLS certificate is valid (or will auto-provision via Caddy/certbot)

### 13.2 Deploy

- [ ] `git pull` on the server
- [ ] `docker compose -f docker-compose.prod.yml up -d --build` succeeds
- [ ] `docker compose -f docker-compose.prod.yml ps` shows `Up (healthy)`
- [ ] `curl -s http://localhost:3000/api/health` returns `{"status":"ok",...}`
- [ ] If first deploy: `docker exec stillwater-web bunx prisma db push` (SQLite) or `prisma migrate deploy` (Postgres)

### 13.3 Post-deploy verification

- [ ] `curl -s https://your-domain/` returns 200 and contains "Stillwater"
- [ ] `curl -s https://your-domain/api/health` returns `{"status":"ok",...}`
- [ ] Form submission works (test with a real email)
- [ ] Schedule accordion expands
- [ ] Teacher typewriter types on hover
- [ ] Sound chime plays on opt-in + scroll
- [ ] No errors in `docker compose -f docker-compose.prod.yml logs web`
- [ ] Uptime monitor (UptimeRobot / Pingdom) shows the site as up

### 13.4 Post-deploy monitoring (first 24 hours)

- [ ] Check logs every 2 hours for the first 6 hours
- [ ] Verify the health check stays green
- [ ] Monitor form submission volume (expected: low for a marketing site)
- [ ] If using Postgres: check connection count isn't climbing (leak indicator)
- [ ] After 24 hours: confirm the daily SQLite backup cron ran successfully

---

*End of Stillwater Container Deployment Guide. For the architecture reference, see [`Project_Architecture_Document.md`](./Project_Architecture_Document.md). For daily development, see [`README.md`](./README.md) and [`CLAUDE.md`](./CLAUDE.md).*
