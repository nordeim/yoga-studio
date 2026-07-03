$ grep ^DATABASE .env.local
DATABASE_URL=postgresql://fitnesstudio:fitnesstudio_dev_password@localhost:5432/fitnesstudio_dev
DATABASE_URL_UNPOOLED=postgresql://fitnesstudio:fitnesstudio_dev_password@localhost:5432/fitnesstudio_dev

$ cat docker-compose-dev.yml

# Development environment for StoryIntoVideo

# Services: PostgreSQL 17, Redis 7, Next.js web app

# Usage: docker compose -f docker-compose-dev.yml up -d

# See also: docker-compose-nginx.yml for optional HTTPS proxy.

networks:
fitnesstudio-network:
driver: bridge

services:

# ==========================================================================

# PostgreSQL 17 – Database with required extensions

# ==========================================================================

postgres:
image: postgres:17-alpine
container_name: fitnesstudio-postgres-dev
environment:
POSTGRES_DB: fitnesstudio_dev
POSTGRES_USER: fitnesstudio
POSTGRES_PASSWORD: ${DB_PASSWORD:-fitnesstudio_dev_password}
POSTGRES_HOST_AUTH_METHOD: trust # dev convenience
TZ: UTC
PGDATA: /var/lib/postgresql/data/pgdata
command: >
postgres
-c timezone=UTC
-c log_destination=stderr
-c logging_collector=off
-c log_min_messages=warning
ports: - "127.0.0.1:5432:5432" # bind only to loopback for local tooling
volumes: - postgres_data:/var/lib/postgresql/data - ./scripts/init-extensions.sql:/docker-entrypoint-initdb.d/01-init-extensions.sql:ro
healthcheck:
test: ["CMD-SHELL", "pg_isready -U fitnesstudio -d fitnesstudio_dev"]
interval: 10s
timeout: 5s
retries: 5
start_period: 10s
networks: - fitnesstudio-network
restart: unless-stopped

# ==========================================================================

# Redis 7 – Cache, queues, sessions (noeviction policy per MEP)

# ==========================================================================

redis:
image: redis:7-alpine
container_name: fitnesstudio-redis-dev
command: >
redis-server
--maxmemory 512mb
--maxmemory-policy noeviction
--appendonly yes
--save 60 1000
--loglevel warning
ports: - "127.0.0.1:6379:6379" # bind only to loopback
volumes: - redis_data:/data
healthcheck:
test: ["CMD", "redis-cli", "ping"]
interval: 10s
timeout: 3s
retries: 5
start_period: 5s
networks: - fitnesstudio-network
restart: unless-stopped

# ==========================================================================

# Next.js 16 Web Application (development with hot reload)

# ==========================================================================

web:
build:
context: .
dockerfile: Dockerfile.dev
target: development
container_name: fitnesstudio-web-dev
env_file: - .env.docker
environment:
NODE_ENV: development
DATABASE_URL: postgresql://fitnesstudio:${DB_PASSWORD:-fitnesstudio_dev_password}@postgres:5432/fitnesstudio_dev
REDIS_URL: redis://redis:6379 # Override any vars from .env.docker if needed
ports: - "3000:3000"
volumes: - .:/app - /app/node_modules # anonymous volume to keep host node_modules out - .next:/app/.next # preserve Next.js build cache - pnpm_store:/root/.local/share/pnpm/store
depends_on:
postgres:
condition: service_healthy
redis:
condition: service_healthy
networks: - fitnesstudio-network
restart: unless-stopped # CMD is defined in Dockerfile

# ==========================================================================

# Named Volumes

# ==========================================================================

volumes:
postgres_data:
driver: local
redis_data:
driver: local
pnpm_store:
driver: local

$ docker ps
CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES
c4608eb44f33 postgres:17-alpine "docker-entrypoint.s…" 7 minutes ago Up 7 minutes (healthy) 127.0.0.1:5432->5432/tcp fitnesstudio-postgres-dev
d8e27b716cd5 redis:7-alpine "docker-entrypoint.s…" 7 minutes ago Up 7 minutes (healthy) 127.0.0.1:6379->6379/tcp fitnesstudio-redis-dev
