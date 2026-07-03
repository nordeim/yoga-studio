# syntax=docker.io/docker/dockerfile:1.7-labs
# =============================================================================
# StoryIntoVideo — Production Dockerfile
# =============================================================================
#
# NF-1 fix: The live site was running the development server in production
# (confirmed by HMR client chunks, dev console messages, unhashed chunk names,
# and `cache-control: no-cache` headers). This production Dockerfile builds the
# app with `next build` and runs it with `next start` (via `pnpm start`).
#
# Multi-stage build:
#   Stage 1 (deps):     Install all dependencies (including dev) for building
#   Stage 2 (builder):  Run `next build` to produce the .next/ output
#   Stage 3 (runtime):  Copy build output + prod deps only, run `next start`
#
# Security:
#   - Non-root user (fitnesstudio, uid 1001)
#   - No dev dependencies in the runtime image
#   - FFmpeg installed for video assembly (Step 6 of the Inngest pipeline)
#   - Healthcheck hits /api/health (DB + FFmpeg + config check)
#
# Pattern source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
# =============================================================================

# ── Stage 1: deps ────────────────────────────────────────────────────────────
# Install all dependencies (including dev) — needed for the build step.
FROM node:24-alpine AS deps

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

# Install ffmpeg (needed at build time for type-checking fluent-ffmpeg) + curl
# for the healthcheck in later stages.
RUN apk add --no-cache ffmpeg curl

WORKDIR /app

# Copy package manifests + lockfile first for layer caching
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (including dev) — the builder stage needs them
RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ─────────────────────────────────────────────────────────
# Run `next build` to produce the production .next/ output.
FROM deps AS builder

WORKDIR /app

# Copy the rest of the source
COPY . .

# Set build-time env vars. The env module's build-context fallback returns
# placeholders when NEXT_PHASE=phase-production-build, so no real secrets
# are needed for the build step.
ENV NEXT_PHASE=phase-production-build
ENV NODE_ENV=production

# Build the production bundle
RUN pnpm build

# ── Stage 3: runtime ─────────────────────────────────────────────────────────
# Minimal runtime image: only production deps + build output + ffmpeg.
FROM node:24-alpine AS runtime

# Enable pnpm (for `pnpm start`)
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

# Install runtime system dependencies:
#   - ffmpeg: video assembly (Inngest Step 6)
#   - curl:   healthcheck
RUN apk add --no-cache ffmpeg curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package manifests + lockfile, then install PRODUCTION deps only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy the build output from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules/.next ./node_modules/.next

# Create a non-root user (security best practice — avoids running as root)
RUN addgroup -g 1001 -S fitnesstudio && \
    adduser -S fitnesstudio -G fitnesstudio -u 1001 && \
    chown -R fitnesstudio:fitnesstudio /app

USER fitnesstudio

# Expose Next.js default port
EXPOSE 3000

# Healthcheck — hits /api/health which checks DB + FFmpeg + env config.
# A 200 response means the app is healthy and ready to serve traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Run the production server via `pnpm start` (which invokes `next start`).
# The production Dockerfile must NEVER run the development server — that was
# the root cause of NF-1 (live site was in dev mode).
CMD ["pnpm", "start"]
