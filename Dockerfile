# syntax=docker.io/docker/dockerfile:1.7-labs
# =============================================================================
# Stillwater · Yoga Studio — Production Dockerfile
# =============================================================================
#
# Multi-stage build using Bun as both package manager and runtime.
#   Stage 1 (deps):    Install all dependencies (including dev) for building
#   Stage 2 (builder): Run `bun run build` to produce the .next/standalone output
#   Stage 3 (runtime): Copy build output + prod deps only, run the standalone server
#
# Security:
#   - Non-root user (stillwater, uid 1001)
#   - No dev dependencies in the runtime image
#   - No source code in the runtime image (standalone output is self-contained)
#   - Healthcheck hits /api/health (DB connectivity check)
#
# Build context is kept small by .dockerignore (node_modules, .next, .git,
# docs, audit folders all excluded).
#
# Usage:
#   docker build -t stillwater-web:prod .
#   docker run -p 3000:3000 --env-file .env stillwater-web:prod
# =============================================================================

# ── Stage 1: deps ────────────────────────────────────────────────────────────
# Install all dependencies (including dev) — the builder stage needs them.
FROM oven/bun:1-alpine AS deps

# curl is needed for the healthcheck in later stages; bash for the build script.
RUN apk add --no-cache curl

WORKDIR /app

# Copy package manifests + lockfile first for layer caching.
COPY package.json bun.lock ./

# Install ALL dependencies (including dev) via Bun.
RUN bun install --frozen-lockfile

# ── Stage 2: builder ─────────────────────────────────────────────────────────
# Run `bun run build` to produce the production .next/standalone output.
FROM deps AS builder

WORKDIR /app

# Copy the rest of the source (respecting .dockerignore).
COPY . .

# Set build-time env vars. Next.js reads NEXT_PHASE to know it's a production
# build. No real secrets are needed — DATABASE_URL points at a placeholder
# SQLite path; Prisma generates the client but doesn't connect at build time.
ENV NEXT_PHASE=phase-production-build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder DATABASE_URL — Prisma generate needs a value, but doesn't connect.
ENV DATABASE_URL="file:./db/stillwater.db"

# Generate Prisma Client (needed for the build's type resolution).
RUN bunx prisma generate

# Build the production bundle. `bun run build` runs:
#   next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
RUN bun run build

# ── Stage 3: runtime ─────────────────────────────────────────────────────────
# Minimal runtime image: only the standalone build output + production deps.
FROM oven/bun:1-alpine AS runtime

# curl for the healthcheck.
RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy the standalone build output. The standalone output at
# .next/standalone/ is self-contained: it includes server.js, the minimal
# node_modules needed to run, and the .next/static assets we copied in
# the build script.
COPY --from=builder --chown=stillwater:stillwater /app/.next/standalone ./
COPY --from=builder --chown=stillwater:stillwater /app/.next/static ./.next/static
COPY --from=builder --chown=stillwater:stillwater /app/public ./public

# Copy the Prisma schema + migrations so the runtime can run `prisma migrate deploy`
# or `prisma db push` if needed. The Prisma Client is already in node_modules
# from the standalone build, but the schema is needed for migrations.
COPY --from=builder --chown=stillwater:stillwater /app/prisma ./prisma

# Create a non-root user (security best practice — avoids running as root).
# Create the db directory with correct ownership for the SQLite file.
RUN addgroup -g 1001 -S stillwater && \
    adduser -S stillwater -G stillwater -u 1001 && \
    mkdir -p /app/db && \
    chown -R stillwater:stillwater /app

USER stillwater

# Expose Next.js default port.
EXPOSE 3000

# Healthcheck — hits /api/health which checks DB connectivity.
# A 200 response means the app is healthy and ready to serve traffic.
# A 503 means the database is unreachable (SQLite file missing or locked).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Run the production server. `bun run start` executes:
#   NODE_ENV=production bun .next/standalone/server.js
# The standalone server.js is Next.js's minimal production runner — no
# development server, no HMR, no source maps.
CMD ["bun", ".next/standalone/server.js"]
