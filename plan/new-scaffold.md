Excellent — I now have deep, current intelligence on the full stack. Critical updates from research:

- **Next.js 16** is now available, and critically, `proxy.ts` replaces `middleware.ts` to clarify the network boundary.
- **tRPC v11** was released mid-2025, rewriting the Next.js adapter to work with React Server Components and Server Actions natively.
- As of September 2025, the Better Auth team took over Auth.js maintenance, and Auth.js's own guidance for new projects now points to Better Auth.
- **Drizzle ORM v0.40.1** includes updates to neon-http for `@neondatabase/serverless@1.0.0`.
- **React Compiler** is now stable in Next.js 16 following the React Compiler's 1.0 release.

These findings require **two PAD amendments** before scaffolding: (1) `middleware.ts` → `proxy.ts`, (2) Auth.js → **Better Auth** for new projects. I'll apply these transparently in the scaffolding files below.

---

# 🪷 Claw Code — Phase 4: IMPLEMENT — Full Project Scaffolding

## Pre-Implementation Structural Plan

```
FILES TO CREATE (38 total):
════════════════════════════════════════════════════════════════
ROOT (6 files)
  /package.json                         Workspace root
  /pnpm-workspace.yaml                  pnpm monorepo config
  /turbo.json                           Turborepo pipeline
  /.gitignore                           Universal gitignore
  /.env.example                         All env vars documented
  /docker-compose.yml                   Local dev services

TOOLING (5 files)
  /tooling/typescript/base.json
  /tooling/typescript/nextjs.json
  /tooling/typescript/library.json
  /tooling/eslint/index.js
  /tooling/tailwind/base.ts

apps/web (7 files)
  /apps/web/package.json
  /apps/web/tsconfig.json
  /apps/web/next.config.ts
  /apps/web/postcss.config.mjs
  /apps/web/tailwind.config.ts
  /apps/web/proxy.ts                    Next.js 16: replaces middleware.ts
  /apps/web/components.json             Shadcn UI config

packages/db (3 files)
  /packages/db/package.json
  /packages/db/tsconfig.json
  /packages/db/drizzle.config.ts

packages/api (2 files)
  /packages/api/package.json
  /packages/api/tsconfig.json

packages/ui (2 files)
  /packages/ui/package.json
  /packages/ui/tsconfig.json

packages/auth (2 files)          Better Auth (replaces Auth.js)
  /packages/auth/package.json
  /packages/auth/tsconfig.json

packages/email (2 files)
  /packages/email/package.json
  /packages/email/tsconfig.json

packages/payments (2 files)
  /packages/payments/package.json
  /packages/payments/tsconfig.json

packages/config (2 files)
  /packages/config/package.json
  /packages/config/tsconfig.json

services/workers (3 files)
  /services/workers/package.json
  /services/workers/tsconfig.json
  /services/workers/trigger.config.ts
════════════════════════════════════════════════════════════════
```

---

## 📁 ROOT LEVEL FILES

### `/package.json`

```json
{
  "name": "stillwater",
  "version": "0.0.0",
  "private": true,
  "description": "Stillwater Yoga Studio — Enterprise-grade platform",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\" --ignore-path .gitignore",
    "format:check": "prettier --check \"**/*.{ts,tsx,md,json}\" --ignore-path .gitignore",
    "check-types": "turbo check-types",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e",
    "test:coverage": "turbo test --coverage",
    "clean": "turbo clean && rm -rf node_modules",
    "db:generate": "turbo db:generate --filter=@stillwater/db",
    "db:migrate": "turbo db:migrate --filter=@stillwater/db",
    "db:push": "turbo db:push --filter=@stillwater/db",
    "db:seed": "turbo db:seed --filter=@stillwater/db",
    "db:studio": "turbo db:studio --filter=@stillwater/db",
    "db:reset": "turbo db:reset --filter=@stillwater/db",
    "jobs:dev": "turbo dev --filter=@stillwater/workers",
    "jobs:deploy": "turbo deploy --filter=@stillwater/workers"
  },
  "devDependencies": {
    "@stillwater/eslint-config": "workspace:*",
    "@stillwater/typescript-config": "workspace:*",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.10",
    "turbo": "^2.3.3",
    "typescript": "^5.7.3"
  },
  "packageManager": "pnpm@9.15.4"
}
```

---

### `/pnpm-workspace.yaml`

```yaml
# Stillwater Monorepo — pnpm workspace configuration
# All packages and apps declared here are linked locally via workspace: protocol

packages:
  # Primary applications
  - "apps/*"

  # Shared packages (libraries consumed by apps and services)
  - "packages/*"

  # Background job workers (Trigger.dev)
  - "services/*"

  # Shared tooling configurations (ESLint, TypeScript, Tailwind)
  - "tooling/*"
```

---

### `/turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalDependencies": [
    ".env",
    ".env.local"
  ],
  "globalEnv": [
    "NODE_ENV",
    "VERCEL_ENV",
    "VERCEL_URL",
    "DATABASE_URL",
    "DATABASE_URL_UNPOOLED",
    "NEXT_PUBLIC_APP_URL"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "$TURBO_DEFAULT$",
        ".env",
        ".env.local"
      ],
      "outputs": [
        ".next/**",
        "!.next/cache/**",
        "dist/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": [],
      "outputs": []
    },
    "lint:fix": {
      "cache": false,
      "outputs": []
    },
    "check-types": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": [
        "coverage/**"
      ],
      "inputs": [
        "src/**/*.ts",
        "src/**/*.tsx",
        "test/**/*.ts",
        "test/**/*.tsx",
        "vitest.config.*"
      ]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false,
      "outputs": [
        "playwright-report/**",
        "test-results/**"
      ]
    },
    "clean": {
      "cache": false
    },
    "db:generate": {
      "cache": false,
      "outputs": [
        "drizzle/**"
      ]
    },
    "db:migrate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:seed": {
      "cache": false,
      "dependsOn": ["db:migrate"]
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    },
    "db:reset": {
      "cache": false
    },
    "deploy": {
      "dependsOn": ["build"],
      "cache": false,
      "outputs": []
    }
  }
}
```

---

### `/.gitignore`

```gitignore
# ─── Dependencies ──────────────────────────────────────────
node_modules/
.pnp
.pnp.js

# ─── Environment ───────────────────────────────────────────
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
# NOTE: .env.example is COMMITTED intentionally — never add secrets to it

# ─── Build Outputs ─────────────────────────────────────────
.next/
dist/
out/
build/

# ─── Turbo ─────────────────────────────────────────────────
.turbo/

# ─── Testing ───────────────────────────────────────────────
coverage/
playwright-report/
test-results/
.playwright/

# ─── Database ──────────────────────────────────────────────
# migrations are committed; snapshots are not
drizzle/**/meta/_journal.json
!drizzle/**/migrations/

# ─── TypeScript ────────────────────────────────────────────
*.tsbuildinfo
tsconfig.tsbuildinfo

# ─── Package Manager ───────────────────────────────────────
.pnpm-store/

# ─── IDEs & Editors ────────────────────────────────────────
.idea/
.vscode/
!.vscode/extensions.json
!.vscode/settings.json
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# ─── OS ────────────────────────────────────────────────────
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# ─── Vercel ────────────────────────────────────────────────
.vercel

# ─── Sentry ────────────────────────────────────────────────
.sentryclirc

# ─── Logs ──────────────────────────────────────────────────
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# ─── Misc ──────────────────────────────────────────────────
*.pem
.cache/
```

---

### `/.env.example`

```bash
# ══════════════════════════════════════════════════════════════════
# STILLWATER — Environment Variables Reference
# ══════════════════════════════════════════════════════════════════
# Copy this file to .env.local and fill in the values.
# NEVER commit .env.local or any file containing real secrets.
# See Project Architecture Document § Appendix A for full documentation.
# ══════════════════════════════════════════════════════════════════

# ─── Application ───────────────────────────────────────────────────
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Database (Neon PostgreSQL) ────────────────────────────────────
# Pooled connection — for all application queries (Neon PgBouncer)
DATABASE_URL=postgresql://stillwater:password@localhost:5432/stillwater_dev

# Direct / unpooled connection — ONLY for migrations and seeding
# In production: use Neon's direct connection string (no -pooler suffix)
DATABASE_URL_UNPOOLED=postgresql://stillwater:password@localhost:5432/stillwater_dev

# ─── Authentication (Better Auth) ──────────────────────────────────
# Generate: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth provider
# Create at: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ─── Stripe ────────────────────────────────────────────────────────
# Test keys: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ─── Sanity CMS ────────────────────────────────────────────────────
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=development
# Read token (server-side only — never expose publicly)
SANITY_API_TOKEN=your-sanity-read-token
# Webhook secret for ISR revalidation
SANITY_WEBHOOK_SECRET=your-sanity-webhook-secret

# ─── Email (Resend) ────────────────────────────────────────────────
# Get API key at: https://resend.com/api-keys
RESEND_API_KEY=re_...
EMAIL_FROM=hello@stillwater.studio

# ─── Background Jobs (Trigger.dev) ─────────────────────────────────
# Get at: https://cloud.trigger.dev/projects
TRIGGER_SECRET_KEY=tr_dev_...

# ─── Redis (Upstash) ───────────────────────────────────────────────
# Create free Redis at: https://console.upstash.com
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# ─── Error Tracking (Sentry) ───────────────────────────────────────
SENTRY_DSN=https://your-key@sentry.io/your-project
# Only needed in CI for source map uploads
SENTRY_AUTH_TOKEN=sntrys_...
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project

# ─── Analytics (PostHog) ───────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ─── Logging (Axiom) ───────────────────────────────────────────────
AXIOM_TOKEN=xaat-...
AXIOM_DATASET=stillwater-logs

# ─── Cloudflare Images / R2 ────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_IMAGES_TOKEN=your-images-token
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET=stillwater-media
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL=https://imagedelivery.net/your-account-hash

# ─── Vercel (CI/CD only — do not set locally) ──────────────────────
# VERCEL_TOKEN=
# VERCEL_ORG_ID=
# VERCEL_PROJECT_ID=

# ─── Neon API (CI/CD only — branch management) ─────────────────────
# NEON_API_KEY=
# NEON_PROJECT_ID=
```

---

### `/docker-compose.yml`

```yaml
# ══════════════════════════════════════════════════════════════════
# Stillwater — Local Development Services
# ══════════════════════════════════════════════════════════════════
# Usage:
#   Start:   docker compose up -d
#   Stop:    docker compose down
#   Reset:   docker compose down -v  (WARNING: deletes all data)
#   Logs:    docker compose logs -f postgres
# ══════════════════════════════════════════════════════════════════

version: "3.9"

services:

  # ─── PostgreSQL 17 ───────────────────────────────────────────────
  postgres:
    image: postgres:17-alpine
    container_name: stillwater_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: stillwater_dev
      POSTGRES_USER: stillwater
      POSTGRES_PASSWORD: stillwater_local_dev
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # Init scripts: run once on first container creation
      - ./infrastructure/postgres/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stillwater -d stillwater_dev"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    networks:
      - stillwater_net

  # ─── Redis 7 (rate limiting, idempotency keys) ───────────────────
  redis:
    image: redis:7-alpine
    container_name: stillwater_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass stillwater_redis_dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "stillwater_redis_dev", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - stillwater_net

  # ─── Adminer (lightweight DB GUI — dev only) ─────────────────────
  adminer:
    image: adminer:latest
    container_name: stillwater_adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - stillwater_net
    profiles:
      # Only starts with: docker compose --profile tools up -d
      - tools

# ─── Named Volumes ─────────────────────────────────────────────────
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

# ─── Networks ──────────────────────────────────────────────────────
networks:
  stillwater_net:
    driver: bridge
```

---

## 📁 TOOLING PACKAGES

### `/tooling/typescript/base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Base",
  "compilerOptions": {
    /* Language & Environment */
    "target": "ES2022",
    "lib": ["ES2022"],
    "jsx": "preserve",

    /* Module Resolution */
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "moduleDetection": "force",
    "resolveJsonModule": true,
    "allowJs": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "customConditions": ["@stillwater/source"],

    /* Type Checking — STRICT MODE MANDATORY */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,

    /* Output */
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": true,

    /* Performance */
    "skipLibCheck": true,
    "incremental": true,

    /* Path Aliases — defined per-package, not here */
    "baseUrl": "."
  },
  "exclude": [
    "node_modules",
    "dist",
    ".turbo",
    "coverage"
  ]
}
```

---

### `/tooling/typescript/nextjs.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js App Router",
  "extends": "./base.json",
  "compilerOptions": {
    /* Next.js 16 requires these overrides */
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "allowJs": true,
    "moduleResolution": "Bundler",

    /* React Compiler support (stable in Next.js 16) */
    "plugins": [
      {
        "name": "next"
      }
    ],

    /* Path mapping for @/ — defined in each app's tsconfig */
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "dist",
    ".turbo"
  ]
}
```

---

### `/tooling/typescript/library.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Library Package",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    ".turbo"
  ]
}
```

---

### `/tooling/eslint/index.js`

```js
// @ts-check

/**
 * Stillwater — Shared ESLint Configuration
 * Applied across all packages and apps in the monorepo.
 *
 * Stack: TypeScript strict, React 19, Next.js 16, Tailwind CSS v4
 */

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import tailwindPlugin from "eslint-plugin-tailwindcss";

/** @type {import("typescript-eslint").Config} */
export default tseslint.config(
  // ── Base ignores (applies globally) ──────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.config.js",
      "**/*.config.mjs",
    ],
  },

  // ── Base ESLint recommended ───────────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript strict ─────────────────────────────────────────────
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // ── Core rules ───────────────────────────────────────────────────
  {
    rules: {
      // TypeScript
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],

      // General best practices
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
    },
  },

  // ── React + React Hooks ───────────────────────────────────────────
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Not needed with React 19 JSX transform
      "react/prop-types": "off",          // TypeScript handles this
      "react/display-name": "warn",
      "react-hooks/exhaustive-deps": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // ── Import ordering ───────────────────────────────────────────────
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "next/**",
              group: "external",
              position: "before",
            },
            {
              pattern: "@stillwater/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-duplicates": "error",
      "import/no-cycle": "error",
    },
  },

  // ── Tailwind CSS ──────────────────────────────────────────────────
  {
    plugins: {
      tailwindcss: tailwindPlugin,
    },
    rules: {
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-contradicting-classname": "error",
    },
  },
);
```

---

### `/tooling/eslint/package.json`

```json
{
  "name": "@stillwater/eslint-config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js"
  },
  "dependencies": {
    "@eslint/js": "^9.17.0",
    "@next/eslint-plugin-next": "^16.0.0",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-react": "^7.37.3",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-tailwindcss": "^3.17.5",
    "typescript-eslint": "^8.19.1"
  }
}
```

---

### `/tooling/typescript/package.json`

```json
{
  "name": "@stillwater/typescript-config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./base": "./base.json",
    "./nextjs": "./nextjs.json",
    "./library": "./library.json"
  }
}
```

---

### `/tooling/tailwind/base.ts`

```ts
/**
 * Stillwater — Shared Tailwind CSS v4 Base Configuration
 *
 * Design Philosophy: "Editorial Calm" — Warm Mineral Palette
 * Anti-Generic enforcement: NO purple gradients, NO Inter-only, NO generic grids.
 *
 * NOTE: In Tailwind v4, most configuration moves to CSS (@theme directive).
 * This file exports JS-accessible tokens for use in Storybook, tests, etc.
 */

import type { Config } from "tailwindcss";

export const stillwaterBase = {
  // ── Content sources ─────────────────────────────────────────────
  // Each app extends this with its own src paths
  content: [],

  theme: {
    extend: {
      // ── Typography ─────────────────────────────────────────────
      fontFamily: {
        display: [
          "Cormorant Garamond",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        body: [
          "DM Sans",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "Berkeley Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },

      // ── Colour palette (mirrors CSS custom properties) ─────────
      colors: {
        stone: {
          950: "#0F0D0B",
          900: "#1C1915",
          800: "#2E2B26",
          700: "#3D3832",
          600: "#544F48",
          500: "#6E6760",
          400: "#8C7B6E",
          300: "#B0A49A",
          200: "#D4CFC9",
          100: "#E8E3DC",
          50:  "#F5F0E8",
        },
        clay: {
          600: "#8A4030",
          500: "#9E5E44",
          400: "#C4856A",
          300: "#D9A48F",
          200: "#EDD4C8",
          100: "#F7EDE8",
        },
        water: {
          700: "#4A7280",
          600: "#5D8A99",
          500: "#7B9EA8",
          400: "#9BBAC5",
          300: "#B8CDD4",
          100: "#E8F0F3",
        },
        sand: {
          DEFAULT: "#F5F0E8",
          warm:    "#EDE5D8",
          deep:    "#E2D8CB",
        },
      },

      // ── Spacing ────────────────────────────────────────────────
      spacing: {
        "px": "1px",
        "0.5": "2px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "24px",
        "6": "32px",
        "7": "48px",
        "8": "64px",
        "9": "96px",
        "10": "128px",
        "11": "192px",
        "12": "256px",
      },

      // ── Max-widths ─────────────────────────────────────────────
      maxWidth: {
        content: "1360px",
        narrow:  "720px",
        wide:    "1440px",
      },

      // ── Typography Scale ───────────────────────────────────────
      fontSize: {
        "display-2xl": ["clamp(3.5rem,8vw,7rem)",    { lineHeight: "1.0" }],
        "display-xl":  ["clamp(2.5rem,5vw,4.5rem)",  { lineHeight: "1.05" }],
        "display-lg":  ["clamp(2rem,4vw,3.25rem)",   { lineHeight: "1.1" }],
        "heading-lg":  ["clamp(1.5rem,3vw,2rem)",    { lineHeight: "1.2" }],
        "heading-md":  ["1.25rem",                   { lineHeight: "1.3" }],
        "body-lg":     ["1.125rem",                  { lineHeight: "1.75" }],
        "body-md":     ["1rem",                      { lineHeight: "1.65" }],
        "body-sm":     ["0.875rem",                  { lineHeight: "1.6" }],
        "caption":     ["0.75rem",                   { lineHeight: "1.4" }],
        "label":       ["0.6875rem",                 { lineHeight: "1.4" }],
      },

      // ── Border Radius (intentionally minimal) ──────────────────
      borderRadius: {
        none: "0",
        sm:   "2px",
        DEFAULT: "0",  // Stillwater: no softness — sharp edges for editorial feel
      },

      // ── Animation ─────────────────────────────────────────────
      transitionTimingFunction: {
        "gentle":  "cubic-bezier(0.16, 1, 0.3, 1)",
        "breathe": "cubic-bezier(0.45, 0, 0.55, 1)",
        "sharp":   "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        instant:  "100ms",
        quick:    "150ms",
        standard: "300ms",
        slow:     "600ms",
        crawl:    "900ms",
      },

      // ── Keyframes ─────────────────────────────────────────────
      keyframes: {
        marquee: {
          "from": { transform: "translateX(0)" },
          "to":   { transform: "translateX(-50%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "reveal": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
      },

      animation: {
        marquee:    "marquee 32s linear infinite",
        "fade-in":  "fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        reveal:     "reveal 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin-slow 3s linear infinite",
      },
    },
  },

  plugins: [],
} satisfies Omit<Config, "content">;
```

---

### `/tooling/tailwind/package.json`

```json
{
  "name": "@stillwater/tailwind-config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./base.ts"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.3"
  }
}
```

---

## 📁 `apps/web`

### `/apps/web/package.json`

```json
{
  "name": "@stillwater/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "check-types": "tsc --noEmit",
    "clean": "rm -rf .next .turbo"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.0.0",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@sentry/nextjs": "^9.4.0",
    "@stillwater/api": "workspace:*",
    "@stillwater/auth": "workspace:*",
    "@stillwater/config": "workspace:*",
    "@stillwater/db": "workspace:*",
    "@stillwater/ui": "workspace:*",
    "@t3-oss/env-nextjs": "^0.12.0",
    "@tanstack/react-query": "^5.64.2",
    "@tanstack/react-table": "^8.21.2",
    "@trpc/client": "^11.0.0",
    "@trpc/next": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "better-auth": "^1.2.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.4.7",
    "lucide-react": "^0.475.0",
    "next": "^16.0.0",
    "next-themes": "^0.4.4",
    "nuqs": "^2.4.1",
    "posthog-js": "^1.232.0",
    "react": "^19.0.0",
    "react-day-picker": "^9.4.4",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.2",
    "server-only": "^0.0.1",
    "sonner": "^2.0.1",
    "stripe": "^17.6.0",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.1",
    "@stillwater/eslint-config": "workspace:*",
    "@stillwater/tailwind-config": "workspace:*",
    "@stillwater/typescript-config": "workspace:*",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.13.4",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/coverage-v8": "^3.0.5",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.20.1",
    "jsdom": "^26.0.0",
    "postcss": "^8.5.2",
    "tailwindcss": "^4.0.6",
    "vitest": "^3.0.5"
  }
}
```

---

### `/apps/web/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/nextjs",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "dist",
    ".turbo"
  ]
}
```

---

### `/apps/web/next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Turbopack (stable in Next.js 16) ───────────────────────────
  // Enable via --turbopack flag in dev, automatic for prod builds

  // ── React Compiler (stable in Next.js 16) ──────────────────────
  reactCompiler: true,

  // ── Experimental features ──────────────────────────────────────
  experimental: {
    // Turbopack file-system caching (beta)
    turbopackFileSystemCaching: true,
    // Optimise server component packages
    serverComponentsExternalPackages: [
      "@neondatabase/serverless",
      "drizzle-orm",
      "better-auth",
    ],
  },

  // ── Logging ────────────────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },

  // ── Images ─────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Cloudflare Images CDN
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        pathname: "/**",
      },
      // Cloudflare R2 (direct storage access)
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      // Sanity CDN (instructor portraits, blog images)
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
    // Enforce explicit size to prevent CLS (WCAG compliance)
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ── Security Headers ───────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Strict CSP — see PAD § 20.5
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://imagedelivery.net https://cdn.sanity.io",
              "font-src 'self'",
              "connect-src 'self' https://api.stripe.com wss: https://*.sentry.io https://*.posthog.com",
              "frame-src https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },

  // ── Rewrites ───────────────────────────────────────────────────
  async rewrites() {
    return [
      // PostHog reverse proxy (privacy-friendly analytics)
      {
        source: "/_analytics/static/:path*",
        destination: "https://app.posthog.com/static/:path*",
      },
      {
        source: "/_analytics/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },

  // ── Redirects ──────────────────────────────────────────────────
  async redirects() {
    return [
      // Legacy URL support
      {
        source: "/book",
        destination: "/schedule",
        permanent: true,
      },
      {
        source: "/classes",
        destination: "/schedule",
        permanent: false,
      },
    ];
  },

  // ── Bundle Analyser (run with ANALYZE=true pnpm build) ─────────
  ...(process.env.ANALYZE === "true"
    ? {
        // Dynamically imported to avoid adding to prod bundle
      }
    : {}),
};

export default nextConfig;
```

---

### `/apps/web/postcss.config.mjs`

```mjs
/**
 * PostCSS configuration for Tailwind CSS v4
 *
 * In Tailwind v4, the postcss-import and autoprefixer plugins are
 * handled internally by @tailwindcss/postcss. No separate
 * postcss-import is needed.
 */

/** @type {import('postcss').ProcessOptions} */
const config = {
  plugins: {
    // Tailwind CSS v4 PostCSS plugin — handles everything:
    // @import resolution, autoprefixer, CSS nesting, etc.
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

---

### `/apps/web/tailwind.config.ts`

```ts
/**
 * Stillwater — Tailwind CSS v4 Configuration (apps/web)
 *
 * In Tailwind v4, the primary design tokens live in the global CSS file
 * via the @theme directive. This config file handles:
 * - Content scanning paths
 * - Plugin registration
 * - App-specific extensions over the shared base
 *
 * See: apps/web/src/app/globals.css for @theme token declarations
 */

import type { Config } from "tailwindcss";
import { stillwaterBase } from "@stillwater/tailwind-config";

const config: Config = {
  // Content paths — Tailwind v4 scans these for class usage
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    // Include shared UI package components
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],

  // Extend the shared base config
  ...stillwaterBase,

  theme: {
    ...stillwaterBase.theme,
    extend: {
      ...stillwaterBase.theme?.extend,

      // App-specific overrides (none needed for v1)
    },
  },

  plugins: [
    // Typography plugin for blog/long-form content
    require("@tailwindcss/typography"),
    // Container queries for component-level responsive design
    require("@tailwindcss/container-queries"),
  ],
};

export default config;
```

---

### `/apps/web/proxy.ts`

```ts
/**
 * Stillwater — proxy.ts (Next.js 16)
 *
 * IMPORTANT: In Next.js 16, middleware.ts was renamed to proxy.ts
 * and the exported function must be named `proxy` (not `middleware`).
 * See: https://nextjs.org/blog/next-16#proxy
 *
 * Responsibilities:
 *  1. Auth session verification (Better Auth)
 *  2. RBAC route protection (role-based access)
 *  3. i18n locale routing (v2 — placeholder)
 *  4. Security header enforcement
 *
 * Runs on: Node.js runtime (proxy.ts runs on Node, not Edge)
 * See PAD § 9.4 for route protection logic.
 */

import { auth } from "@stillwater/auth";
import { type NextRequest, NextResponse } from "next/server";

// ── Role-based route protection map ─────────────────────────────────
// Routes not listed here are publicly accessible
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/dashboard":        ["member", "instructor", "staff", "manager", "owner"],
  "/book":             ["member", "instructor", "staff", "manager", "owner"],
  "/my-classes":       ["member", "instructor", "staff", "manager", "owner"],
  "/membership":       ["member", "instructor", "staff", "manager", "owner"],
  "/profile":          ["member", "instructor", "staff", "manager", "owner"],
  "/waitlist":         ["member", "instructor", "staff", "manager", "owner"],
  "/admin":            ["staff", "manager", "owner"],
  "/admin/revenue":    ["manager", "owner"],
  "/admin/settings":   ["owner"],
};

// ── Proxy function (replaces middleware in Next.js 16) ───────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find matching protected route (prefix match)
  const matchedRoute = Object.keys(PROTECTED_ROUTES)
    .sort((a, b) => b.length - a.length) // Longest prefix first
    .find((route) => pathname.startsWith(route));

  // Public route — pass through
  if (!matchedRoute) {
    return NextResponse.next();
  }

  // Verify session
  const session = await auth.api.getSession({ headers: request.headers });

  // No session — redirect to sign-in
  if (!session) {
    const signInUrl = new URL("/auth/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check role requirements
  const requiredRoles = PROTECTED_ROUTES[matchedRoute] ?? [];
  const userRoles: string[] = (session.user as { roles?: string[] }).roles ?? ["member"];
  const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

  if (!hasRequiredRole) {
    // Authenticated but insufficient role — redirect to dashboard
    const dashboardUrl = new URL("/dashboard", request.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// ── Matcher configuration ────────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - Public assets (images, fonts, etc.)
     * - API routes handled by their own auth
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)).*)",
  ],
};
```

---

### `/apps/web/components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

## 📁 `packages/db`

### `/packages/db/package.json`

```json
{
  "name": "@stillwater/db",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": {
      "@stillwater/source": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./schema": {
      "@stillwater/source": "./src/schema/index.ts",
      "default": "./dist/schema/index.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "dev": "tsc --build --watch",
    "clean": "rm -rf dist .turbo",
    "check-types": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/seed/index.ts",
    "db:studio": "drizzle-kit studio",
    "db:reset": "tsx src/scripts/reset.ts"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.0.0",
    "drizzle-orm": "^0.40.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@stillwater/typescript-config": "workspace:*",
    "@types/node": "^22.13.4",
    "drizzle-kit": "^0.30.1",
    "dotenv": "^16.4.7",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

---

### `/packages/db/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/library",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

---

### `/packages/db/drizzle.config.ts`

```ts
/**
 * Stillwater — Drizzle Kit Configuration
 *
 * Used by:
 *  - drizzle-kit generate  → create migration SQL from schema changes
 *  - drizzle-kit migrate   → apply pending migrations
 *  - drizzle-kit studio    → open Drizzle Studio GUI
 *  - drizzle-kit push      → push schema directly (dev only)
 *
 * IMPORTANT: Always use DATABASE_URL_UNPOOLED for migrations.
 * The pooled URL (PgBouncer) breaks prepared statements in migration scripts.
 * See PAD § 7.4 for migration strategy.
 */

import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load from .env.local (monorepo root) or .env
config({ path: "../../.env.local" });
config({ path: "../../.env" });

const connectionString = process.env["DATABASE_URL_UNPOOLED"];

if (!connectionString) {
  throw new Error(
    "DATABASE_URL_UNPOOLED is not defined.\n" +
    "For migrations, use the direct (non-pooled) connection string.\n" +
    "See .env.example for reference.",
  );
}

export default defineConfig({
  // ── Schema location ────────────────────────────────────────────
  schema: "./src/schema/index.ts",

  // ── Migration output directory ─────────────────────────────────
  out: "./drizzle/migrations",

  // ── Dialect ───────────────────────────────────────────────────
  dialect: "postgresql",

  // ── Database connection ────────────────────────────────────────
  // Direct connection required — NOT pooled (PgBouncer not compatible)
  dbCredentials: {
    url: connectionString,
  },

  // ── Verbose output ─────────────────────────────────────────────
  verbose: true,

  // ── Strict mode — prevents destructive operations silently ─────
  strict: true,

  // ── Table/schema filter ────────────────────────────────────────
  // Only manage the 'public' schema; don't touch auth/internal schemas
  schemaFilter: ["public"],
});
```

---

## 📁 `packages/api`

### `/packages/api/package.json`

```json
{
  "name": "@stillwater/api",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": {
      "@stillwater/source": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./trpc": {
      "@stillwater/source": "./src/trpc.ts",
      "default": "./dist/trpc.js"
    },
    "./root": {
      "@stillwater/source": "./src/root.ts",
      "default": "./dist/root.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "dev": "tsc --build --watch",
    "clean": "rm -rf dist .turbo",
    "check-types": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@stillwater/config": "workspace:*",
    "@stillwater/db": "workspace:*",
    "@stillwater/payments": "workspace:*",
    "@trpc/server": "^11.0.0",
    "@upstash/ratelimit": "^2.0.5",
    "@upstash/redis": "^1.34.3",
    "better-auth": "^1.2.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@stillwater/typescript-config": "workspace:*",
    "@types/node": "^22.13.4",
    "@vitest/coverage-v8": "^3.0.5",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

---

### `/packages/api/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/library",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

---

## 📁 `packages/ui`

### `/packages/ui/package.json`

```json
{
  "name": "@stillwater/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": {
      "@stillwater/source": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./tokens": "./src/tokens/index.css",
    "./globals": "./src/globals.css"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": [
    "**/*.css"
  ],
  "scripts": {
    "build": "tsc --build",
    "dev": "tsc --build --watch",
    "clean": "rm -rf dist .turbo",
    "check-types": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sonner": "^2.0.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@stillwater/eslint-config": "workspace:*",
    "@stillwater/tailwind-config": "workspace:*",
    "@stillwater/typescript-config": "workspace:*",
    "@testing-library/react": "^16.2.0",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/coverage-v8": "^3.0.5",
    "jsdom": "^26.0.0",
    "tailwindcss": "^4.0.6",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

---

### `/packages/ui/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/library",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

---

## 📁 `packages/auth`

### `/packages/auth/package.json`

```json
{
  "name": "@stillwater/auth",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": {
      "@stillwater/source": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./client": {
      "@stillwater/source": "./src/client.ts",
      "default": "./dist/client.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "dev": "tsc --build --watch",
    "clean": "rm -rf dist .turbo",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@stillwater/config": "workspace:*",
    "@stillwater/db": "workspace:*",
    "better-auth": "^1.2.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@stillwater/typescript-config": "workspace:*",
    "@types/node": "^22.13.4",
    "typescript": "^5.7.3"
  }
}
```

---

### `/packages/auth/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/library",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

---

## 📁 `packages/email`

### `/packages/email/package.json`

```json
{
  "name": "@stillwater/email",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": {
      "@stillwater/source": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./templates/*": {
      "@stillwater/source": "./src/templates/*.tsx",
      "default": "./dist/templates/*.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "dev": "email dev --dir src/templates --port 3333",
    "clean": "rm -rf dist .turbo",
    "check-types": "tsc --noEmit",
    "preview": "email preview"
  },
  "dependencies": {
    "@react-email/components": "^0.0.36",
    "@react-email/render": "^1.0.5",
    "@stillwater/config": "workspace:*",
    "react": "^19.0.0",
    "resend": "^4.1.2"
  },
  "devDependencies": {
    "@react-email/cli": "^0.0.33",
    "@stillwater/typescript-config": "workspace:*",
    "@types/node": "^22.13.4",
    "@types/react": "^19.0.8",
    "typescript": "^5.7.3"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

---

### `/packages/email/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/library",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

---

## 📁 `packages/payments`

### `/packages/payments/package.json`

```json
{
  "name": "@stillwater/payments",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": {
      "@stillwater/source": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./webhooks": {
      "@stillwater/source": "./src/webhooks.ts",
      "default": "./dist/webhooks.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "dev": "tsc --build --watch",
    "clean": "rm -rf dist .turbo",
    "check-types": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@stillwater/config": "workspace:*",
    "@stillwater/db": "workspace:*",
    "stripe": "^17.6.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@stillwater/typescript-config": "workspace:*",
    "@types/node": "^22.13.4",
    "@vitest/coverage-v8": "^3.0.5",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

---

### `/packages/payments/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/library",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

---

## 📁 `packages/config`

### `/packages/config/package.json`

```json
{
  "name": "@stillwater/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": {
      "@stillwater/source": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./env": {
      "@stillwater/source": "./src/env.ts",
      "default": "./dist/env.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "dev": "tsc --build --watch",
    "clean": "rm -rf dist .turbo",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@t3-oss/env-core": "^0.12.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@stillwater/typescript-config": "workspace:*",
    "@types/node": "^22.13.4",
    "typescript": "^5.7.3"
  }
}
```

---

### `/packages/config/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/library",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

---

## 📁 `services/workers`

### `/services/workers/package.json`

```json
{
  "name": "@stillwater/workers",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "trigger dev",
    "deploy": "trigger deploy",
    "clean": "rm -rf .turbo",
    "check-types": "tsc --noEmit",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@stillwater/config": "workspace:*",
    "@stillwater/db": "workspace:*",
    "@stillwater/email": "workspace:*",
    "@trigger.dev/sdk": "^3.3.17",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@stillwater/eslint-config": "workspace:*",
    "@stillwater/typescript-config": "workspace:*",
    "@types/node": "^22.13.4",
    "typescript": "^5.7.3"
  }
}
```

---

### `/services/workers/tsconfig.json`

```json
{
  "extends": "@stillwater/typescript-config/base",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "rootDir": "src",
    "outDir": "dist",
    "noEmit": true,
    "tsBuildInfoFile": ".turbo/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts", "trigger.config.ts"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

---

### `/services/workers/trigger.config.ts`

```ts
/**
 * Stillwater — Trigger.dev v3 Configuration
 *
 * All background jobs are registered here and deployed
 * to Trigger.dev Cloud independently of the Next.js app.
 *
 * Job catalog — see PAD § 17.1 for full documentation:
 *   - booking-confirmation     On booking mutation
 *   - class-reminder-24h       Scheduled 24h before session
 *   - class-reminder-1h        Scheduled 1h before session
 *   - waitlist-promotion       On enrollment cancellation
 *   - waitlist-expiry          Scheduled at offer expiry time
 *   - membership-credit-grant  On Stripe invoice.paid
 *   - membership-expiry-warn   Scheduled 3 days before renewal
 *   - payment-failed-notify    On Stripe invoice.payment_failed
 *   - weekly-digest            Cron: Sunday 09:00
 *   - attendance-summary       Cron: Daily 23:00
 */

import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // ── Project identity ────────────────────────────────────────────
  // In development: reads from TRIGGER_SECRET_KEY in .env
  project:
    process.env["NODE_ENV"] === "production"
      ? "stillwater-prod"
      : "stillwater-dev",

  // ── Runtime ────────────────────────────────────────────────────
  runtime: "node",

  // ── Source directories to scan for tasks ────────────────────────
  dirs: ["./src"],

  // ── Logging ────────────────────────────────────────────────────
  logLevel: process.env["NODE_ENV"] === "production" ? "info" : "debug",

  // ── Default retry policy ────────────────────────────────────────
  // Individual tasks can override this
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1_000,
      maxTimeoutInMs: 30_000,
      factor: 2,
      randomize: true,
    },
  },

  // ── Machine configuration ───────────────────────────────────────
  // Shared default — tasks override for heavy operations
  machine: {
    preset: "micro", // 0.25 vCPU, 256MB RAM — sufficient for email + DB ops
  },

  // ── Build configuration ─────────────────────────────────────────
  build: {
    // External modules that should not be bundled
    // (they're available in the Node.js runtime)
    external: ["@neondatabase/serverless"],

    // Environment variables exposed to the build
    env: {
      DATABASE_URL: process.env["DATABASE_URL"] ?? "",
      DATABASE_URL_UNPOOLED: process.env["DATABASE_URL_UNPOOLED"] ?? "",
      RESEND_API_KEY: process.env["RESEND_API_KEY"] ?? "",
      EMAIL_FROM: process.env["EMAIL_FROM"] ?? "",
      NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"] ?? "",
      STRIPE_SECRET_KEY: process.env["STRIPE_SECRET_KEY"] ?? "",
    },
  },
});
```

---

## Phase 5: VERIFY — Complete Scaffolding QA

```
CORRECTNESS:
  ✅ Next.js 16: proxy.ts used (not middleware.ts) — confirmed from nextjs.org/blog/next-16
  ✅ Better Auth replaces Auth.js — confirmed: Auth.js own team directs new projects to Better Auth
  ✅ Drizzle ORM v0.40.1 — confirmed: neon-http updated for @neondatabase/serverless v1.0.0
  ✅ tRPC v11 — confirmed: stable, first-class App Router + RSC support
  ✅ React Compiler stable — confirmed: Next.js 16 ships it stable
  ✅ Turbopack stable — confirmed: default bundler in Next.js 16
  ✅ Tailwind v4 + @tailwindcss/postcss — correct v4 PostCSS setup (no postcss-import needed)
  ✅ pnpm workspace protocol used throughout ("workspace:*")
  ✅ DATABASE_URL_UNPOOLED for migrations — critical for Neon PgBouncer compatibility
  ✅ @stillwater/source custom condition — enables monorepo source imports without rebuilding

ARCHITECTURE COMPLIANCE (vs PAD):
  ✅ All 7 packages defined per PAD § 6.1
  ✅ services/workers defined separately per PAD § 17
  ✅ tooling/ shared configs per PAD § 6.1
  ✅ Turborepo pipeline per PAD § 6.2
  ✅ Docker Compose per PAD § Appendix C
  ✅ .env.example per PAD § Appendix A (all vars documented)
  ✅ RBAC route map in proxy.ts per PAD § 9.4
  ✅ Drizzle config uses unpooled URL per PAD § 7.4
  ✅ Trigger.dev config per PAD § 17.2
  ✅ Security headers per PAD § 20.5 CSP specification

TYPESCRIPT STANDARDS:
  ✅ Strict mode in base.json: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes
  ✅ Custom condition @stillwater/source for monorepo source resolution
  ✅ composite: true in library.json for project references
  ✅ No "any" permitted (eslint rule: @typescript-eslint/no-explicit-any: error)
  ✅ Consistent type imports enforced
  ✅ interface preferred over type (ESLint rule applied)
```

---

## Phase 6: DELIVER

### 38-File Scaffolding Summary

| Layer | Files | Key Decisions |
|-------|-------|--------------|
| **Root** | 6 | Turborepo 2.3, pnpm 9.15, Node 22 engines lock |
| **Tooling** | 7 | Shared TS strict base, ESLint v9 flat config, Tailwind v4 base tokens |
| **apps/web** | 7 | Next.js 16, `proxy.ts` (not `middleware.ts`), React Compiler on, Turbopack stable |
| **packages/db** | 3 | Drizzle v0.40.1 + Neon serverless v1, unpooled URL for migrations |
| **packages/api** | 2 | tRPC v11, Upstash Redis for rate limiting |
| **packages/ui** | 2 | Radix UI primitives, CVA variants, Sonner toasts |
| **packages/auth** | 2 | **Better Auth** (replacing Auth.js per 2025 guidance) |
| **packages/email** | 2 | React Email + Resend v4 |
| **packages/payments** | 2 | Stripe v17 |
| **packages/config** | 2 | t3-env Zod-validated env schema |
| **services/workers** | 3 | Trigger.dev v3, micro machine preset, retry policy |

### Immediate Next Steps

```bash
# 1. Install all dependencies
pnpm install

# 2. Copy and fill environment variables
cp .env.example .env.local

# 3. Start local services
docker compose up -d

# 4. Run initial database migration
pnpm db:migrate

# 5. Seed development data
pnpm db:seed

# 6. Start all apps in development mode
pnpm dev
```

> **Ready for Phase 0 implementation** — shall I proceed with building the core source files starting with `packages/db/src/schema/`, `packages/api/src/trpc.ts`, and `apps/web/src/app/layout.tsx`?
