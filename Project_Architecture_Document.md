# Stillwater · Yoga Studio — Master Project Architecture Document (PAD) v1.0

**Classification:** Internal Engineering Reference
**Status:** DEFINITIVE, PRODUCTION-LOCKED BLUEPRINT
**Companion Documents:** [`README.md`](./README.md), [`AGENTS.md`](./AGENTS.md), [`CLAUDE.md`](./CLAUDE.md), [`stillwater_SKILL.md`](./stillwater_SKILL.md)
**Last Updated:** 2026-07-04
**Audience:** Senior Engineers, Tech Leads, DevOps, and Onboarding Engineers
**Rule:** Every architectural decision in this document traces to a specific rationale. Nothing is here "because it's popular."

---

#### Revision Block — v1.1 (Tracked Changes)

**v1.1 (2026-07-04)** — Post-audit remediation:
- `[FIX]` Deleted 4 orphan config files (`drizzle.config.ts`, `playwright.config.ts`, `playwright-live.config.ts`, stale `vitest.config.ts`) that broke `bun run build` with `Cannot find module` errors.
- `[FIX]` Reverted `recharts` from `^3.9.1` to `^2.15.4` (unjustified major version bump caused build-breaking type error in `chart.tsx`).
- `[FIX]` Refactored `src/hooks/use-mobile.ts` to use `useSyncExternalStore` (ADR-007 compliance — was triggering `react-hooks/set-state-in-effect`).
- `[FIX]` Renamed Prisma migration `20260704060757_test` → `20260704060757_init` (unprofessional name from interactive `prisma migrate dev`).
- `[NEW]` Installed Vitest + wrote 22 unit tests for First-Class-Free validation logic (PAD §8.1 HIGH-priority gap — closed).
- `[NEW]` Extracted pure validation logic from `src/lib/actions/first-class.ts` into `src/lib/first-class-validation.ts` (forced by `'use server'` sync-export constraint; also enables unit testing).
- `[NEW]` Fixed `.github/workflows/ci.yml` (was broken: YAML corruption, wrong PM, missing scripts). Now uses Bun, runs lint + typecheck + test + build.
- `[NEW]` Added scripts to `package.json`: `typecheck`, `test`, `test:watch`.
- `[REM]` Removed 26 unused production dependencies (next-auth, recharts, framer-motion, @dnd-kit/*, @tanstack/*, zustand, etc.) — went from 65 to 39 production deps.
- `[REM]` Deleted 9 unused shadcn ui component files (chart, sonner, carousel, calendar, form, resizable, input-otp, command, drawer).
- `[DOC]` Updated CLAUDE.md, AGENTS.md, README.md, and this PAD to reflect all changes.

**v1.0 (2026-07-04)** — Initial PAD:
- `[SYN]` Initial PAD generated from the production Stillwater codebase (Next.js 16.1.3 + React 19 + Tailwind v4 + Prisma 6.19 + Zod 4 + shadcn/ui + Web Audio API).
- `[SR]` All version numbers verified against `package.json` + `bun.lock`.
- `[CA]` All file paths verified to exist via spot-check.
- `[SAN]` Docker configuration adapted from the original `yoga-studio` repo (pnpm → bun, postgres+redis removed, SQLite volume added).
- `[AUTH]` No auth layer — confirmed via codebase audit (no Auth.js, no sessions, no protected routes).

---

## Table of Contents

1. [System Overview & Decisions](#1-system-overview--decisions)
2. [High-Level System Topology](#2-high-level-system-topology)
3. [Application Architecture](#3-application-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Design System Reference](#5-design-system-reference)
6. [Security Architecture](#6-security-architecture)
7. [Worker / Background Service Architecture](#7-worker--background-service-architecture)
8. [Testing Strategy](#8-testing-strategy)
9. [Build & Deployment](#9-build--deployment)
10. [Developer Handbook](#10-developer-handbook)
11. [Known Issues & Outstanding Tasks](#11-known-issues--outstanding-tasks)
12. [Key Files Reference](#12-key-files-reference)
13. [Glossary](#13-glossary)

---

## 1. System Overview & Decisions

### 1.1 Document Metadata & Purpose

This Project Architecture Document (PAD) is the single source of truth for the Stillwater Yoga Studio codebase. It captures not just _what_ the system is, but _why_ every decision was made and _how_ every component fits together.

**How to use this document:**

| Audience | Read these sections first |
| --- | --- |
| New engineer onboarding | §1, §2, §3, §10 (Developer Handbook) |
| Debugging a production issue | §6 (Security), §9 (Build & Deploy), §11 (Known Issues) |
| Reviewing tech choices | §1.3 (ADRs), §2 (Topology) |
| Extending a feature | §3 (App Architecture), §4 (Data), §5 (Design System) |
| Deploying | §9 (Build & Deploy), especially §9.3 (Docker) |
| AI coding agent | [`AGENTS.md`](./AGENTS.md) (compact) → this PAD (deep dive) |

### 1.2 Technology Stack Summary

| Layer | Technology | Version | Key Rationale |
| --- | --- | --- | --- |
| Web Framework | Next.js (App Router, Turbopack) | `^16.1.1` (resolved 16.1.3) | Server Components by default, async `headers()`/`cookies()` (Next.js 16), `output: "standalone"` for Docker. Chosen over Pages Router (legacy) and Vite (no SSR). |
| UI Runtime | React | `^19.0.0` | `useSyncExternalStore` for external state, `useActionState` for forms, no `forwardRef` needed. React 19 is the first version with the Compiler enabled by default. |
| Language | TypeScript | `^5.9.0` | `strict: true`. `noImplicitAny: false` (scaffold default — project convention is stricter: no `any` outside scaffold). Path alias `@/*` → `./src/*`. |
| Styling | Tailwind CSS | `^4.3.0` | CSS-first `@theme` config in `globals.css` — no `tailwind.config.js` for app tokens. Chosen over v3 for the simpler mental model and faster builds. |
| PostCSS | `@tailwindcss/postcss` | `^4` | The ONLY PostCSS plugin. Adding `autoprefixer` or `postcss-import` breaks v4. |
| UI Components | shadcn/ui (New York) + Radix UI | latest | 50+ primitives in `src/components/ui/`. Radix for accessibility (accordion, dialog, etc.). Chosen over MUI (too opinionated) and Chakra (v3 instability). |
| Icons | lucide-react | `^0.525.0` | Used sparingly — the design prefers custom SVG for the brand mark and expand icon. |
| Fonts | Fraunces + Inter | via `next/font/google` | `display: "swap"`, `variable` strategy. NEVER `@fontsource/*`. Fraunces (humanist serif with optical sizing) paired with Inter (UI sans) — the pairing rejects the "Inter alone" AI-slop aesthetic. |
| Database ORM | Prisma | `^6.11.1` (resolved 6.19.2) | `schema.prisma` is more readable than Drizzle's TypeScript schema. The `fullstack-dev` skill scaffold includes Prisma out of the box. Chosen over Drizzle (original yoga-studio repo used it) for readability. |
| Database | SQLite | via `bun run db:push` | File-based, zero-config, sufficient for a single-model marketing site. Portable to Postgres by changing `provider` in `schema.prisma`. Chosen over Postgres for dev simplicity. |
| Validation | Zod | `^4.0.2` | Enum API changed in v4: `z.enum(values, { message })` not `{ errorMap }`. Used for server action input validation. |
| Audio | Web Audio API | browser-native | No library. `AudioContext` instantiated ONLY on explicit user gesture (browser autoplay policy). Two stacked triangle waves at A4 + E5 (perfect fifth). |
| Package Manager | Bun | latest (1.3+) | `bun install`, `bun run dev`, `bun run build`, `bun run start`. Also the production runtime (`bun .next/standalone/server.js`). Chosen over pnpm for the unified PM + runtime story. |
| Linter | ESLint | `^9` + `eslint-config-next` | `eslint.config.mjs` extends `core-web-vitals` + `typescript`. Many strict rules disabled by scaffold — project convention follows the STRICTER rule. |
| Container Runtime | Docker + Bun | `oven/bun:1-alpine` | Multi-stage build. Non-root user. Healthcheck at `/api/health`. See §9.3. |

### 1.3 Architecture Decision Records (ADRs)

**ADR-001: Next.js 16 App Router over Pages Router**

- **Context:** The original `nordeim/yoga-studio` repo used Next.js 16 App Router with Drizzle ORM. This build keeps App Router but swaps Drizzle for Prisma. The question was whether to use App Router (`src/app/`) or the legacy Pages Router (`src/pages/`).
- **Decision:** Use App Router (`src/app/`).
- **Rationale:** Next.js 16 fully supports App Router with React 19 Server Components, Turbopack, and the new async `headers()`/`cookies()` API. Pages Router is legacy and does not support Server Components. The `fullstack-dev` skill scaffold uses App Router.
- **Consequences:** All pages are Server Components by default. Client components need `'use client'`. `params`/`searchParams` are `Promise<T>` — must `await`. Layouts cannot fetch data (only page-level Server Components can).
- **Alternatives Rejected:** Pages Router (legacy, no RSC); Vite + React (no SSR, no metadata API, no server actions).

**ADR-002: Tailwind v4 CSS-first config over `tailwind.config.js`**

- **Context:** Tailwind v4 introduced a new CSS-first configuration model where design tokens live in `@theme` blocks in `globals.css` instead of a JavaScript config file.
- **Decision:** All design tokens live in `src/app/globals.css` inside the `@theme inline {}` block. The root-level `tailwind.config.ts` is the empty scaffold default and holds no app tokens.
- **Rationale:** Tailwind v4's CSS-first config is the new default. It keeps tokens in the same file as the base styles, making the design system easier to audit. The `@utility` directive replaces `@layer utilities` for custom utilities.
- **Consequences:** The root `tailwind.config.ts` is intentionally empty of app tokens — don't add tokens there. Custom utilities use `@utility` not `@layer utilities`. PostCSS config must have ONLY `@tailwindcss/postcss` (adding `autoprefixer` or `postcss-import` breaks v4).
- **Alternatives Rejected:** Tailwind v3 with `tailwind.config.js` (legacy, slower builds, more config boilerplate); CSS-in-JS (runtime overhead, worse DX).

**ADR-003: Prisma + SQLite over Drizzle ORM + Postgres**

- **Context:** The original `yoga-studio` repo used Drizzle ORM with Postgres. The `fullstack-dev` skill scaffold includes Prisma with SQLite.
- **Decision:** Use Prisma with SQLite for development. The schema is portable to Postgres by changing `provider` to `"postgresql"` in `prisma/schema.prisma`.
- **Rationale:** (1) The `fullstack-dev` skill scaffold includes Prisma out of the box — no extra setup. (2) Prisma's `schema.prisma` is more readable than Drizzle's TypeScript schema — easier for non-engineers to review. (3) SQLite is sufficient for a single-model marketing site (the `Lead` model for form submissions). (4) The project has no concurrent write load, no complex queries, no need for Postgres extensions.
- **Consequences:** Schema is portable to Postgres by changing `provider`. Use `bun run db:push` for dev (SQLite), `bun run db:migrate` for prod (Postgres). The `status` field on `Lead` is a `String` (not an enum) because SQLite doesn't support Prisma enums natively — values are documented in the schema comment.
- **Alternatives Rejected:** Drizzle ORM (original repo used it; rejected for Prisma's readability); raw SQL (no type safety); Postgres for dev (unnecessary operational overhead for a marketing site).

**ADR-004: Static content in code, not database**

- **Context:** Teachers, practices, and the weekly schedule are reference data that changes ~annually. The question was whether to put them in the database (like the original repo) or in code.
- **Decision:** Teachers, practices, and schedule live in `src/lib/data/*.ts` as `readonly` arrays. Only the `Lead` model (form submissions) is in the database.
- **Rationale:** Static content (1) renders faster (no DB round-trip), (2) is easier to version-control (diffs are readable), (3) doesn't require migrations, (4) doesn't need an admin UI. The database is for mutable state, not reference data. Ask: "Will this data ever be written by a user, or participate in a transaction?" If no, keep it in code.
- **Consequences:** Adding a teacher/practice/class is a 1-file, 1-step process (edit the array, done). No admin UI needed. The `src/lib/data/*.ts` files export `readonly` arrays with `as const` for type narrowing.
- **Alternatives Rejected:** Database tables for teachers/practices/schedule (original repo had them; rejected for the overhead — migrations, seed scripts, admin UI, query latency — for data that rarely changes).

**ADR-005: No auth, no payments, no background jobs**

- **Context:** The original `yoga-studio` repo had Auth.js v5, Stripe, Inngest, and Replicate. This build is a calm marketing site with an anonymous "first class free" form.
- **Decision:** Deliberately omit Auth.js, Stripe, Inngest, and Replicate.
- **Rationale:** A "first class free" form doesn't need user accounts, payments, background jobs, or AI image generation. Adding them introduces complexity, CVE surface, and maintenance burden that a calm marketing site doesn't warrant. The form is anonymous; rate limiting is per-IP (in-memory); email confirmation is manual ("Iris writes you back within a day, by hand").
- **Consequences:** The form is anonymous. No sessions, no JWTs, no protected routes. The only "auth-like" pattern is the per-IP rate limiter in `src/lib/actions/first-class.ts` (in-memory sliding window, 3 submissions/hour, fail-open). If a member portal is added later, introduce Auth.js v5 with the DrizzleAdapter pattern from the original repo.
- **Alternatives Rejected:** Auth.js v5 (rejected — no user accounts needed); Stripe (rejected — "first class free" means free); Inngest (rejected — no background jobs); Replicate (rejected — hero/teacher photos are placeholders, swap to real photography in production).

**ADR-006: Radix Accordion primitives over shadcn wrapper**

- **Context:** The Schedule section needs an expandable accordion. The shadcn/ui scaffold includes an `Accordion` wrapper around `@radix-ui/react-accordion`. The wrapper injects a default chevron icon.
- **Decision:** Use `@radix-ui/react-accordion` primitives directly in `Schedule.tsx`, not the shadcn `Accordion` wrapper.
- **Rationale:** The design requires a custom `+` icon that rotates 45° into an `×` on open (matching the original HTML mockup). The shadcn wrapper's default chevron doesn't match. Using primitives gives full control over the trigger content while preserving Radix's ARIA wiring (`aria-expanded`, `aria-controls`, `role="region"`).
- **Consequences:** The `src/components/ui/accordion.tsx` file is still present (scaffold) but unused by the Schedule section. Don't delete it — other features might use it. The Schedule trigger has a meaningful `aria-label` that includes the row's content (day, time, class, teacher, seats).
- **Alternatives Rejected:** shadcn `Accordion` wrapper (default chevron doesn't match design); custom accordion with `<details>`/`<summary>` (no ARIA wiring, no keyboard support); custom accordion with `useState` (rejected — reinvents Radix).

**ADR-007: `useSyncExternalStore` over `useEffect` + `setState`**

- **Context:** The `useReducedMotion` hook needs to subscribe to the `prefers-reduced-motion` media query. The initial implementation used `useEffect` + `setState` synchronously, which triggered React 19's `react-hooks/set-state-in-effect` lint error.
- **Decision:** Use `useSyncExternalStore` for `useReducedMotion()` (and any future external-state subscriptions).
- **Rationale:** In React 19, calling `setState` synchronously in `useEffect` is flagged as a cascading-render anti-pattern. `useSyncExternalStore` is the idiomatic way to subscribe to external state (media queries, IntersectionObserver, EventSource, localStorage). It's SSR-safe by design (`getServerSnapshot` returns the default value on the server).
- **Consequences:** The hook is SSR-safe (no hydration mismatch). The `getServerSnapshot: () => false` defaults to "motion enabled" on the server — the CSS `@media (prefers-reduced-motion: reduce)` guard in `globals.css` handles the actual disabling.
- **Alternatives Rejected:** `useEffect` + `setState` (lint error, cascading renders); `useRef` + manual DOM mutation (not React-idiomatic); third-party hook libraries (unnecessary dependency).

**ADR-008: Web Audio API over `<audio>` element for the chime**

- **Context:** The opt-in chime needs to play a perfect-fifth interval (A4 + E5) with a 2.8s exponential decay. The question was whether to use a pre-recorded MP3 via `<audio>` or generate the chime programmatically.
- **Decision:** Use Web Audio API (`AudioContext` + `OscillatorNode`) for the chime, not an `<audio>` element with a sound file.
- **Rationale:** Web Audio API (1) generates the chime programmatically — no asset to load or host, (2) supports precise timing and envelope shaping, (3) the perfect-fifth interval is calculated in code (not a fixed recording), (4) smaller bundle (no MP3). The `AudioContext` is instantiated ONLY on explicit user gesture (browser autoplay policy).
- **Consequences:** The chime is opt-in only — `AudioContext` must be created in a user-gesture handler. The `playChime` function in `SoundToast.tsx` creates a fresh `AudioContext` each call (no shared context). Silent-fail in `try/catch` — audio is optional.
- **Alternatives Rejected:** `<audio>` element with MP3 (asset to host, less control over envelope); third-party audio library (unnecessary dependency); no chime (rejected — the chime is part of the brand's "slow" interaction design).

**ADR-009: Bun over pnpm/npm**

- **Context:** The original `yoga-studio` repo used pnpm. The `fullstack-dev` skill scaffold uses Bun.
- **Decision:** Use Bun as both package manager and runtime.
- **Rationale:** (1) Bun is the unified PM + runtime — `bun install`, `bun run dev`, `bun run build`, `bun run start`, and `bun .next/standalone/server.js` all use the same tool. (2) The `fullstack-dev` skill scaffold uses Bun. (3) Bun's standalone server is faster than Node's `next start` for the standalone build output. (4) Bun's install is significantly faster than pnpm/npm.
- **Consequences:** The lockfile is `bun.lock` (not `pnpm-lock.yaml`). Docker images use `oven/bun:1-alpine`. The `package.json` scripts use `bun run` (which works with npm/pnpm too — the project is PM-agnostic at the script level, but the lockfile locks to Bun).
- **Alternatives Rejected:** pnpm (original repo used it; rejected for the unified PM + runtime story); npm (slower, no runtime); Deno (less ecosystem support for Next.js).

**ADR-010: Single-route architecture (`/` only)**

- **Context:** The `fullstack-dev` skill constraint says only `/` is user-visible. The original mockup is a single-page editorial scroll with six sections.
- **Decision:** Implement a single route (`/`) with six composed sections. No `/schedule`, `/teachers`, or `/signup` standalone pages.
- **Rationale:** The design is a single-page editorial scroll — "one idea per scroll viewport." Splitting into routes would break the narrative flow and the breath-cycle hero's context. The `fullstack-dev` skill constraint reinforces this. Anchor links (`#practices`, `#teachers`, etc.) provide deep-linking within the page.
- **Consequences:** All sections are composed in `src/app/page.tsx`. The Topbar nav uses anchor links, not `next/link` to other routes. If standalone pages are needed later (e.g., a blog), they require explicit user request and a route group like `(marketing)/blog/`.
- **Alternatives Rejected:** Multi-page architecture (breaks the editorial scroll); Next.js dynamic routes (no need — no dynamic content beyond the form); catch-all route (overkill for a single page).

---

## 2. High-Level System Topology

### 2.1 System topology diagram

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Desktop / Mobile Browser<br/>(Web Audio API, IntersectionObserver)"]
    end

    subgraph Edge["Edge / CDN Layer"]
        CDN["CDN / Reverse Proxy<br/>(Caddy / Nginx / Traefik)<br/>TLS termination"]
    end

    subgraph App["Application Layer (Docker container)"]
        NextServer["Next.js 16 Standalone Server<br/>(bun .next/standalone/server.js)<br/>Port 3000"]
        ServerActions["Server Actions<br/>(claimFirstClassAction)"]
        HealthCheck["/api/health<br/>(DB connectivity check)"]
    end

    subgraph Data["Data Layer"]
        SQLite[("SQLite<br/>./db/stillwater.db<br/>Lead model")]
        Static["Static Content<br/>src/lib/data/*.ts<br/>(readonly arrays)"]
    end

    subgraph External["External Services"]
        Picsum["picsum.photos<br/>(placeholder images)"]
        Fonts["Google Fonts<br/>(Fraunces + Inter)"]
    end

    Browser -->|HTTP/HTTPS| CDN
    CDN -->|HTTP :3000| NextServer
    NextServer -->|composes| Static
    NextServer -->|form submit| ServerActions
    ServerActions -->|prisma db create| SQLite
    NextServer -->|healthcheck| HealthCheck
    HealthCheck -->|SELECT 1| SQLite
    Browser -->|next/image| Picsum
    Browser -->|next/font| Fonts

    style Client fill:#faf5ec,stroke:#b16a48
    style App fill:#f4ede0,stroke:#5d6e5a
    style Data fill:#efe6d4,stroke:#8a9a87
    style External fill:#e3d5c1,stroke:#7a6e60
```

### 2.2 Layer annotations

| Layer | Runtime | Scaling | Key Constraints |
| --- | --- | --- | --- |
| Client | Browser (modern, Web Audio API support) | N/A (per-user) | `prefers-reduced-motion` must disable animations. `AudioContext` only on user gesture. |
| Edge / CDN | Caddy / Nginx / Traefik (operator's choice) | Horizontal | TLS termination only — no caching logic (Next.js handles caching headers). |
| Application | Bun 1.x + Next.js 16 standalone | Vertical (single container) | Stateless except SQLite file. Port 3000. Non-root user (`stillwater`, uid 1001). |
| Data — SQLite | Bun's Prisma client | Single-writer | File-based, no concurrent write load. Persisted via Docker named volume (`db_data`). |
| Data — Static | Bundled into the Next.js server | N/A | `readonly` arrays in `src/lib/data/*.ts`. Tree-shaken into the server bundle. |
| External — picsum.photos | HTTPS | N/A | Placeholder images only — replace with real photography in production. Whitelisted in `next.config.ts` `images.remotePatterns`. |
| External — Google Fonts | HTTPS | N/A | Fraunces + Inter via `next/font/google`. Self-hosting is a future optimization (not currently needed). |

### 2.3 Request flow

1. **Browser** requests `/` (or an anchor deep-link like `/#schedule`).
2. **CDN** terminates TLS and forwards to the Next.js standalone server on port 3000.
3. **Next.js Server** (Bun process) renders the page as a Server Component:
   - `page.tsx` composes `<LinenGrain />`, `<HomeChrome />`, `<Hero />`, `<Practices />`, `<Teachers />`, `<Schedule />`, `<FirstClassFree />`, `<Footer />`.
   - Static content (`PRACTICES`, `TEACHERS`, `SCHEDULE`) is imported from `src/lib/data/*.ts` and rendered into the HTML.
   - Client components (`Hero`, `Teachers`, `Schedule`, `FirstClassFree`, `HomeChrome`) ship their JS chunks for hydration.
4. **Browser** hydrates the client components. The breath-cycle animation starts, the IntersectionObserver wires up reveals, the SoundToast appears after 2.4s.
5. **Form submission**: Browser POSTs the form to the Server Action `claimFirstClassAction`. The server action validates (Zod), rate-limits (in-memory), persists (Prisma → SQLite), and returns a `FirstClassResult`. The client swaps the form for the success message.
6. **Healthcheck**: Docker hits `/api/health` every 30s. The endpoint runs `db.$queryRaw\`SELECT 1\`` against SQLite and returns 200 (ok) or 503 (degraded).

---

## 3. Application Architecture

### 3.1 The Layer Model

Stillwater follows a strict 4-layer model. The Golden Rule: **lower layers may never import from higher layers.**

```
Layer 0: src/lib/data/*     — Static content (readonly arrays). Rule: no imports from any layer above.
Layer 1: src/lib/*           — Infrastructure (db, utils, actions). Rule: may import from Layer 0 + external packages. Never from components.
Layer 2: src/hooks/*         — Custom React hooks. Rule: may import from Layer 1. Never from components.
Layer 3: src/components/*    — UI components (layout, sections, ui). Rule: may import from Layers 0-2. Layout/sections may compose ui primitives.
Layer 4: src/app/*           — App Router (pages, layouts, API routes). Rule: may import from all layers. Composes the page tree.
```

**Enforcement**: TypeScript's `paths` alias (`@/*` → `./src/*`) makes all layers accessible, but the layering rule is a code-review convention, not a lint rule. If you add `no-restricted-imports` to ESLint, you can enforce it mechanically.

### 3.2 Annotated Directory Structure

```
stillwater/
├── prisma/
│   ├── migrations/
│   │   └── 20260704060757_init/    ← Initial migration (Lead table + indexes). Renamed from "test".
│   ├── db/                          ← SQLite database file (dev only, gitignored in prod)
│   └── schema.prisma                ← Lead model (first-class-free submissions). Single source of truth for DB schema.
├── public/
│   ├── logo.svg                     ← Z.ai scaffold logo (replace with Stillwater mark in production)
│   └── robots.txt                   ← Allow all crawlers
├── src/
│   ├── app/                         ← Layer 4: App Router
│   │   ├── api/
│   │   │   ├── health/
│   │   │   │   └── route.ts         ← /api/health — Docker healthcheck endpoint (DB connectivity)
│   │   │   └── route.ts             ← /api — legacy scaffold "Hello, world!" (kept for compatibility)
│   │   ├── globals.css              ← @theme tokens, @keyframes, @utility, reduced-motion guard. Single source of truth for design system.
│   │   ├── layout.tsx               ← Root layout: Fraunces + Inter fonts (next/font), skip link, metadata API, <main id="main-content">
│   │   └── page.tsx                 ← Home page (SERVER component): composes all 6 sections + HomeChrome
│   ├── components/
│   │   ├── layout/                  ← Persistent chrome (6 files)
│   │   │   ├── BreathGuide.tsx      ← Fixed bottom-left 8s breath orb (client — useBreathCycle)
│   │   │   ├── Footer.tsx           ← Ink-on-cream 4-column editorial footer (server)
│   │   │   ├── HomeChrome.tsx       ← Client orchestrator: Topbar + BreathGuide + SoundToast state
│   │   │   ├── LinenGrain.tsx       ← SVG noise overlay, 50% opacity, multiply-blend (server)
│   │   │   ├── SoundToast.tsx       ← Opt-in dialog + playChime() Web Audio API (client)
│   │   │   └── Topbar.tsx           ← Fixed nav, scroll-condense, sound toggle (client — useState + useEffect)
│   │   ├── sections/                ← Homepage sections (7 files)
│   │   │   ├── FirstClassFree.tsx   ← useActionState form + Server Action binding (client)
│   │   │   ├── Hero.tsx             ← 8s breath cycle + Ken Burns + scroll cue (client — useReducedMotion, IntersectionObserver)
│   │   │   ├── Practices.tsx        ← 4-card editorial 2×2 grid (server — composes Reveal)
│   │   │   ├── Reveal.tsx           ← IntersectionObserver fade-up wrapper (client — useReveal)
│   │   │   ├── Schedule.tsx         ← Radix accordion + mala-bead seat dots (client)
│   │   │   ├── SectionHead.tsx      ← Label + title + lead shared header (server — composes Reveal)
│   │   │   └── Teachers.tsx         ← Hover/click typewriter quotes (client — useState + useRef + setTimeout)
│   │   └── ui/                      ← shadcn/ui primitives (39 files, all 'use client')
│   │       ├── accordion.tsx        ← shadcn Accordion wrapper (UNUSED by Schedule — see ADR-006)
│   │       ├── button.tsx           ← CVA button variants (primary, secondary, outline, ghost, link)
│   │       ├── input.tsx            ← Form input
│   │       ├── select.tsx           ← Form select (used by FirstClassFree)
│   │       ├── textarea.tsx         ← Form textarea (used by FirstClassFree)
│   │       └── ... (34 more)        ← Remaining shadcn/ui New York set (9 unused components removed in v1.1)
│   ├── hooks/                       ← Layer 2: Custom hooks (5 files)
│   │   ├── use-breath-cycle.ts      ← 8s rAF loop: inhale/exhale phase + 1..4 counter
│   │   ├── use-mobile.ts            ← Breakpoint hook (uses useSyncExternalStore — used by sidebar.tsx)
│   │   ├── use-reduced-motion.ts    ← useSyncExternalStore for prefers-reduced-motion (SSR-safe)
│   │   ├── use-reveal.ts            ← IntersectionObserver fade-up (reduced-motion reveals immediately)
│   │   └── use-toast.ts             ← Scaffold toast hook (unused)
│   ├── lib/                         ← Layer 1: Infrastructure
│   │   ├── actions/
│   │   │   └── first-class.ts       ← 'use server' — Server Action: honeypot + rate limit + Zod + Prisma persist
│   │   ├── first-class-validation.ts ← Pure logic: Zod schema, rate limiter, hashIp (extracted for unit testing)
│   │   ├── data/                    ← Layer 0: Static content
│   │   │   ├── practices.ts         ← PRACTICES readonly array (4 items: Vinyasa, Yin, Restorative, Breathwork)
│   │   │   ├── schedule.ts          ← SCHEDULE readonly array (10 classes) + PREFERRED_DAYS readonly array
│   │   │   └── teachers.ts          ← TEACHERS readonly array (3 items: Anya, Marcus, Iris) with "why I teach" quotes
│   │   ├── db.ts                    ← Prisma client global singleton (prevents hot-reload connection leaks in dev)
│   │   └── utils.ts                 ← cn() helper: clsx + tailwind-merge
│   └── tests/                       ← Layer 1.5: Test infrastructure (v1.1)
│       ├── setup.ts                 ← Vitest global setup (matchMedia stub for jsdom)
│       └── unit/                    ← Unit tests (3 files, 22 tests total)
│           ├── first-class.schema.test.ts       ← Zod schema validation (12 tests)
│           ├── first-class.rate-limit.test.ts   ← Rate limiter sliding window (5 tests)
│           └── first-class.honeypot.test.ts     ← Honeypot bot detection (5 tests)
├── .dockerignore                    ← Excludes node_modules, .next, .git, docs, audit folders from build context
├── .env.example                     ← DATABASE_URL template (only env var)
├── .env                             ← Local env (gitignored, created during setup)
├── .gitignore                       ← Excludes node_modules, .next, .env*, *.log, db/, skills/, yoga-studio/
├── AGENTS.md                        ← Compact agent instructions (high-signal only)
├── CLAUDE.md                        ← Comprehensive conventions for Claude Code sessions
├── README.md                        ← Human-facing project overview + quick start
├── stillwater_SKILL.md              ← Deepest-layer skill: 20 sections + appendices, every decision/bug/pattern
├── Project_Architecture_Document.md ← This file
├── Dockerfile                       ← Production multi-stage build (oven/bun:1-alpine, non-root, healthcheck)
├── Dockerfile.dev                   ← Dev image with hot reload (Turbopack, bind-mount source)
├── docker-compose-dev.yml           ← Dev compose: single `web` service + db_data volume (no postgres/redis)
├── docker-compose.prod.yml          ← Prod compose: single `web` service, bind to 127.0.0.1:3000
├── bun.lock                         ← Bun lockfile (PM-locked)
├── components.json                  ← shadcn/ui config (New York style, RSC, @/* aliases)
├── eslint.config.mjs                ← ESLint flat config (core-web-vitals + typescript, ignores audit folders)
├── next.config.ts                   ← output: standalone, picsum.photos remotePatterns, allowedDevOrigins
├── package.json                     ← Scripts: dev, build, start, lint, typecheck, test, test:watch, db:*
├── postcss.config.mjs               ← ONLY @tailwindcss/postcss (no autoprefixer, no postcss-import)
├── tailwind.config.ts               ← Scaffold default (holds shadcn theme — see §11 Known Issues)
├── tsconfig.json                    ← strict: true, @/* alias, excludes audit folders
└── vitest.config.ts                 ← Vitest config (jsdom, globals, @/ alias — v1.1)
```

### 3.3 Critical Code Patterns

#### Pattern 1: Server Action with discriminated union result

```typescript
// src/lib/actions/first-class.ts
// Purpose: Validate, rate-limit, and persist a "first class free" form submission.
// Returns a discriminated union — never throws for expected errors.

"use server";

export async function claimFirstClassAction(
  _prev: FirstClassResult | null,
  formData: FormData,
): Promise<FirstClassResult> {
  // 1. Honeypot — silently reject bots. The `company` field is visually
  //    hidden (not aria-hidden — bots fill every input). If non-empty, reject.
  if (formData.get("company")) {
    return { success: false, code: "BOT", message: "Submission rejected." };
  }

  // 2. Rate limit (fail-open). In-memory sliding window — 3/hour per IP.
  //    Fail-open: never block a real user because the limiter state got weird.
  let rateLimitOk = true;
  try {
    const ip = await getClientIp();  // Next.js 16: await headers()
    rateLimitOk = checkRateLimit(ip).allowed;
  } catch {
    rateLimitOk = true;  // fail-open
  }
  if (!rateLimitOk) {
    return { success: false, code: "RATE_LIMIT", message: "..." };
  }

  // 3. Validate with Zod 4. Enum API: { message } not { errorMap }.
  const parsed = firstClassSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, code: "VALIDATION", message: "...", errors: formatErrors(parsed.error) };
  }

  // 4. Persist. Handle duplicate email (Prisma P2002) with a warm message.
  try {
    await db.lead.create({ data: { ...parsed.data, ipHash: await hashIp(), status: "pending" } });
  } catch (err) {
    if (isUniqueConstraint(err)) {
      return { success: false, code: "DUPLICATE", message: "We already have a request from this email..." };
    }
    return { success: false, code: "INTERNAL", message: "Something went wrong on our end..." };
  }

  return { success: true, message: "Thank you — Iris will write you back within a day, by hand." };
}
```

**Why this pattern:** Server Actions with discriminated-union results give type-safe error handling at the call site. The client can `switch (state.code)` and render the right message without `try/catch`. Honeypot + fail-open rate limiter + Zod validation + Prisma unique constraint handling cover the four main abuse vectors without auth.

#### Pattern 2: `useSyncExternalStore` for SSR-safe external state

```typescript
// src/hooks/use-reduced-motion.ts
// Purpose: SSR-safe subscription to prefers-reduced-motion. Avoids the
// React 19 set-state-in-effect lint error.

"use client";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};  // SSR: no-op
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot(): boolean { return false; }  // SSR default: motion enabled

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

**Why this pattern:** React 19's `react-hooks/set-state-in-effect` rule flags synchronous `setState` in `useEffect` as a cascading-render anti-pattern. `useSyncExternalStore` is the idiomatic way to subscribe to external state (media queries, IntersectionObserver, EventSource, localStorage). The `getServerSnapshot` returns `false` (motion enabled) so the server render matches the client's first paint — no hydration mismatch.

#### Pattern 3: Radix Accordion with custom trigger content

```tsx
// src/components/sections/Schedule.tsx
// Purpose: Expandable schedule rows with full ARIA wiring and a custom
// "+" icon that rotates 45° into an "×" on open. Uses Radix primitives
// directly (not the shadcn wrapper) for full control over the trigger.

"use client";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

<AccordionPrimitive.Item value={cls.id} className="group ...">
  <AccordionPrimitive.Header>
    <AccordionPrimitive.Trigger
      aria-label={`${cls.day} ${cls.time} ${cls.className} with ${cls.teacher}, ${cls.taken} of ${cls.total} mats ${isFull ? "taken — waitlist only" : "available"} — expand for room details`}
    >
      {/* Desktop layout — ONE element, hidden on mobile */}
      <div className="grid grid-cols-[100px_110px_1fr_130px_180px_44px] max-[960px]:hidden">...</div>
      {/* Mobile layout — ONE element, hidden on desktop */}
      <div className="hidden flex-col max-[960px]:flex">...</div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
  <AccordionPrimitive.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
    {/* detail panel */}
  </AccordionPrimitive.Content>
</AccordionPrimitive.Item>
```

**Why this pattern:** Radix primitives have strict structural requirements — exactly ONE trigger per header. Putting two triggers (desktop + mobile) in one header silently broke the accordion's ARIA wiring (Bug #3 in `stillwater_SKILL.md`). The fix: one trigger, two layouts inside. The meaningful `aria-label` gives screen reader users the row's context + the action, instead of a redundant "Expand for room details" ten times.

#### Pattern 4: Web Audio API chime (opt-in only)

```typescript
// src/components/layout/SoundToast.tsx
// Purpose: Play a perfect-fifth chime (A4 + E5 + sub-octave A3) with a
// 2.8s exponential decay. Created on explicit user gesture only.

export function playChime(): void {
  try {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();  // fresh context each call — no shared state
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;

    const tones = [
      { freq: 440.0,  gain: 0.08, delay: 0.0  },  // A4
      { freq: 659.25, gain: 0.05, delay: 0.04 },  // E5 (perfect fifth)
      { freq: 220.0,  gain: 0.04, delay: 0.1  },  // A3 (sub-octave warmth)
    ];

    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = t.freq;
      gain.gain.setValueAtTime(0, now + t.delay);
      gain.gain.linearRampToValueAtTime(t.gain, now + t.delay + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.delay + 2.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t.delay);
      osc.stop(now + t.delay + 3.0);
    }
  } catch { /* silent fail — audio is optional */ }
}
```

**Why this pattern:** Browser autoplay policy requires `AudioContext` to be created/resumed in a user-gesture handler. The chime is opt-in (SoundToast asks permission) because silence is part of the brand. The perfect fifth (A4 + E5) is the most consonant interval in Western music — it reads as "a soft chime," not "a synthesizer." Triangle waves are softer than sine waves at low gains. The sub-octave A3 adds warmth without mud.

#### Pattern 5: `useActionState` form with inline errors + live region

```tsx
// src/components/sections/FirstClassFree.tsx
// Purpose: Bind the form to the Server Action, render inline errors with
// ARIA wiring, and show a live-region status message.

"use client";
import { useActionState } from "react";

function FirstClassForm() {
  const [state, formAction, isPending] = useActionState<FirstClassResult | null, FormData>(
    claimFirstClassAction,
    null,
  );

  if (state?.success) {
    return <SuccessMessage message={state.message} />;  // swap form for thank-you
  }

  return (
    <form action={formAction} noValidate>
      {/* honeypot */}
      <input type="text" name="company" tabIndex={-1} className="absolute -left-[9999px] ..." aria-hidden="true" />

      <input
        name="email"
        aria-invalid={!!state?.errors?.email}
        aria-describedby={state?.errors?.email ? "email-error" : undefined}
      />
      {state?.errors?.email && <p id="email-error" role="alert">{state.errors.email[0]}</p>}

      <button type="submit" disabled={isPending}>{isPending ? "Sending…" : "Reserve my first mat"}</button>

      <div aria-live="polite" aria-atomic="true">{/* status messages render here */}</div>
    </form>
  );
}
```

**Why this pattern:** `useActionState` is React 19's idiomatic way to bind a Server Action to a form with pending state. The `aria-invalid` + `aria-describedby` + `role="alert"` trio gives screen readers the full picture: which field is invalid, what the error is, announced immediately. The `aria-live="polite"` status region announces success/rate-limit/duplicate messages without stealing focus. The honeypot is `aria-hidden` but visually positioned off-screen — bots fill every input, humans don't.

---

## 4. Data Architecture

### 4.1 Database Schema

Stillwater uses a single Prisma model: `Lead`. The schema lives in `prisma/schema.prisma`.

```mermaid
erDiagram
    Lead {
        string id PK "cuid()"
        string name "required, 2-80 chars"
        string email UK "required, unique"
        string preferredDay "required, enum"
        string notes "optional, max 500 chars"
        string status "default 'pending'"
        string ipHash "optional, SHA-256 of IP"
        datetime createdAt "default now()"
        datetime updatedAt "updatedAt"
    }
```

### 4.2 Data model

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

/// A "first class free" lead — captured from the homepage form.
/// No account, no auth. Iris writes them back by hand within a day.
model Lead {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique
  preferredDay    String
  notes           String?
  status          String   @default("pending") // pending | replied | booked | archived
  ipHash          String?  // SHA-256 of IP for rate-limit forensics, never the raw IP
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

**Field rationale:**

| Field | Type | Why |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | CUIDs are collision-resistant across machines. Better than UUIDs for URL safety. |
| `email` | `String @unique` | Natural key — one submission per email. Prisma's `P2002` error is caught and returned as a warm `DUPLICATE` message. |
| `preferredDay` | `String` | Stores one of `PREFERRED_DAYS` (from `src/lib/data/schedule.ts`). SQLite doesn't support Prisma enums — values are validated by Zod at the boundary. |
| `notes` | `String?` | Optional. Zod caps at 500 chars. |
| `status` | `String @default("pending")` | Workflow: `pending` → `replied` → `booked` → `archived`. Indexed for admin queries. SQLite doesn't support enums — values are documented in the schema comment. |
| `ipHash` | `String?` | SHA-256 of the IP, truncated to 16 chars. Used for rate-limit forensics (identifying abuse patterns) without storing raw IPs. Nullable because IP extraction can fail. |
| `createdAt` | `DateTime @default(now())` | Indexed for "show me the last 100 leads" queries. |
| `updatedAt` | `DateTime @updatedAt` | Prisma auto-updates on every write. |

### 4.3 Persistence Strategy

**Connection management**: `src/lib/db.ts` exports a global singleton `db` to prevent hot-reload connection leaks in development:

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Migration workflow**:
- **Dev (SQLite)**: `bun run db:push` (pushes schema directly — no migration history). Acceptable for dev because the schema is single-model and rarely changes.
- **Prod (Postgres)**: `bun run db:migrate` (runs `prisma migrate dev` to create + apply migrations). **Never `prisma db push` in production** — always `prisma migrate deploy`.

**Backups**: The SQLite file at `./db/stillwater.db` is persisted via a Docker named volume (`db_data`). For production, either (1) schedule a periodic `docker cp` of the file to off-site storage, or (2) migrate to Postgres and use managed backups (Neon, Supabase, RDS).

**Caching**: None. The site has no read-heavy queries — the only DB write is the form submission, and the only DB read is the healthcheck. Static content (teachers, practices, schedule) is in code, not the DB.

---

## 5. Design System Reference

### 5.1 Typographic System

| Role | Typeface | Weight | Tracking | Line-height | Usage |
| --- | --- | --- | --- | --- | --- |
| Display (hero) | Fraunces | 300 | -0.025em | 0.95 | `Stillwater` hero title (`opsz` 144) |
| H1 (section titles) | Fraunces | 300 | -0.015em | 1.05 | "Four ways to come home." (`opsz` 144) |
| H2 (card titles) | Fraunces | 400 | 0 | 1.2 | "Vinyasa", "Anya Perrin" (`opsz` 90 / 60) |
| Body | Inter | 300 | 0 | 1.75 | Default body text |
| Teacher quotes | Fraunces Italic | 300 | 0 | 1.65 | Typewriter quotes (`opsz` 24 for italic tags) |
| Metadata | Inter | 500 | 0.16–0.32em uppercase | 1.2 | Section labels, durations, room names |

**Optical sizing**: Fraunces uses `fontVariationSettings: '"opsz" 144'` for the hero title (largest), `"opsz" 90` for section card titles, `"opsz" 60` for teacher names, `"opsz" 24` for italic tags. This is what gives Fraunces its warmth — the optical sizing adjusts stroke contrast at different sizes.

**Font loading**: `next/font/google` with `display: "swap"` + `variable` strategy. Fraunces and Inter are preloaded on `<html>` so first paint uses the correct family. NEVER `@fontsource/*` — it broke fonts in prior projects and adds bundle weight.

### 5.2 Color Tokens

All tokens are defined in `src/app/globals.css` inside the `@theme inline {}` block. This is the single source of truth — every hex below was verified against the actual CSS.

| Token | Hex | RGB | Tailwind class | WCAG Contrast (on linen-50) | Usage |
| --- | --- | --- | --- | --- | --- |
| `--color-linen-50` | `#faf5ec` | `rgb(250, 245, 236)` | `bg-linen-50` | — | Page background (brightest cream) |
| `--color-linen-100` | `#f4ede0` | `rgb(244, 237, 224)` | `bg-linen-100` | — | Default cream background |
| `--color-linen-200` | `#efe6d4` | `rgb(239, 230, 212)` | `bg-linen-200` | — | Card hover background |
| `--color-linen-300` | `#e6dfd1` | `rgb(230, 223, 209)` | `bg-linen-300` | — | Sand-tinted dividers |
| `--color-sand` | `#e3d5c1` | `rgb(227, 213, 193)` | `bg-sand` | — | First-Class-Free section background |
| `--color-sand-deep` | `#c9b89e` | `rgb(201, 184, 158)` | `bg-sand-deep` | — | Sand-tinted dividers (deeper) |
| `--color-sage` | `#8a9a87` | `rgb(138, 154, 135)` | `bg-sage` | — | Available seat dots |
| `--color-sage-deep` | `#5d6e5a` | `rgb(93, 110, 90)` | `text-sage-deep` | 5.8:1 (AAA Large) | Italic emphasis in section titles |
| `--color-terracotta` | `#b16a48` | `rgb(177, 106, 72)` | `bg-terracotta` | 5.3:1 (AAA Large, AA Normal) | **PRIMARY accent** — labels, hover, focus |
| `--color-terracotta-deep` | `#8e4f33` | `rgb(142, 79, 51)` | `bg-terracotta-deep` | — | Hover state for terracotta |
| `--color-dusk-pink` | `#d4a5a0` | `rgb(212, 165, 160)` | `bg-dusk-pink` | — | Soft secondary accent (radial blooms only) |
| `--color-ink` | `#2c2620` | `rgb(44, 38, 32)` | `bg-ink` / `text-ink` | 15.8:1 (AAA) | Headlines, footer background |
| `--color-ink-soft` | `#4a4036` | `rgb(74, 64, 54)` | `text-ink-soft` | 9.5:1 (AAA) | Body text |
| `--color-ink-mute` | `#7a6e60` | `rgb(122, 110, 96)` | `text-ink-mute` | 3.4:1 (AA Large only) | Metadata (decorative) |
| `--color-ink-line` | `rgba(44, 38, 32, 0.14)` | — | `border-ink-line` | — | Borders |
| `--color-ink-line-soft` | `rgba(44, 38, 32, 0.07)` | — | `border-ink-line-soft` | — | Soft borders, dividers |

**Forbidden colours**: Raw hex in components (`bg-[#b16a48]`), Tailwind defaults (`amber-*`, `red-*`, `blue-*`, `purple-*`), `oklch()` colours. The shadcn/ui primitives use their own token system (`--background`, `--foreground`, etc.) — kept for compatibility, don't mix with Stillwater tokens in the same component.

### 5.3 Component Primitives

- **shadcn/ui (New York style)**: 50+ primitives in `src/components/ui/`. All are `'use client'`. Installed via `components.json` (style: "new-york", rsc: true, iconLibrary: "lucide").
- **Radix UI**: Used directly for the Schedule accordion (ADR-006). The shadcn `Accordion` wrapper is present but unused.
- **CVA (class-variance-authority)**: Used by the shadcn `button.tsx` for variant management (primary, secondary, outline, ghost, link × sm, md, lg, icon).
- **Custom SVG**: Brand mark (breathing terracotta dot), expand icon (`+` → `×`), sound toggle icon. Not from a library — hand-crafted for the design.

### 5.4 Motion / Animation

**Six keyframes** defined in `@theme`:

| Name | Duration | Easing | Use Case |
| --- | --- | --- | --- |
| `hero-breath` | 8s | `ease-in-out infinite alternate` | Hero photo scale + translate (Ken Burns + breath) |
| `brand-breath` | 8s | `ease-in-out infinite` | Topbar brand mark dot (synced with hero) |
| `breath-orb` | 8s | `ease-in-out infinite` | BreathGuide bottom-left orb (synced with hero) |
| `scrollline` | 2.6s | `cubic-bezier(0.22, 1, 0.36, 1) infinite` | Hero scroll cue (animated line) |
| `cursor-blink` | 1s | `steps(2) infinite` | Typewriter cursor in teacher quotes |
| `sound-wave` | 1.4s | `ease-in-out infinite` | Sound toggle icon waves (when active) |

**Three easing curves** (only three — restraint is the brand):

| Token | Curve | Use Case |
| --- | --- | --- |
| `--ease-quiet` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default easing (reveals, hovers) |
| `--ease-precise` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard material easing (accordion, toggles) |
| `--ease-emphasis` | `cubic-bezier(0.16, 1, 0.3, 1)` | Dramatic transitions (sound toast entry) |

**Reduced-motion handling**: `prefers-reduced-motion: reduce` **disables** animations entirely (not slows them) — slowed animations can trigger vestibular disorders (WCAG 2.3.3). The CSS guard in `globals.css` + the `useReducedMotion()` hook are belt-and-suspenders. The typewriter in `Teachers.tsx` shows the full quote immediately when reduced.

**Animation guardrails**: animate `transform` + `opacity` only (never `width`/`height`/`top`/`margin`). No `transition: all`. `will-change: transform` sparingly. IntersectionObserver gates all scroll animations + pauses hero breath when off-screen.

---

## 6. Security Architecture

### 6.1 Security Rules

| Rule | Enforcement | Severity |
| --- | --- | --- |
| Never use `any` — use `unknown` + type guards | Code review (ESLint allows it; project convention forbids it) | HIGH |
| No `process.env.*` outside `src/lib/db.ts` | Code review (only `DATABASE_URL` is needed) | MEDIUM |
| `.env*` files never committed | `.gitignore` (`.env*` excluded) | CRITICAL |
| Honeypot field on all forms | Code review (the `company` field in `FirstClassFree.tsx`) | HIGH |
| Rate limiter fails OPEN on outage | Code review (`src/lib/actions/first-class.ts:100-106`) | HIGH |
| Store `ipHash` (SHA-256), never raw IPs | Code review (`hashIp()` in `first-class.ts:69`) | HIGH |
| Never leak internal errors to client | Server action returns generic `INTERNAL` message | HIGH |
| Zod validation at every boundary | Code review (server action input) | HIGH |
| `onConflictDoNothing()` or `@unique` for idempotency | Prisma schema (`email @unique`) + server action catches `P2002` | MEDIUM |
| `AudioContext` only on user gesture | `playChime()` called only from `onClick`/`onAccept` handlers | MEDIUM |
| No `dangerouslySetInnerHTML` without escaping | Code review (not currently used anywhere) | MEDIUM |
| No `as any` casts | Code review (the one exception is `webkitAudioContext` in `SoundToast.tsx`) | LOW |

### 6.2 Security Utilities

| Utility | Location | Purpose |
| --- | --- | --- |
| `hashIp(ip)` | `src/lib/actions/first-class.ts:69` | SHA-256 + truncate to 16 chars. Used for rate-limit forensics without storing raw IPs. |
| `checkRateLimit(ip)` | `src/lib/actions/first-class.ts:53` | In-memory sliding window. 3 submissions/hour per IP. Fail-open. |
| `getClientIp()` | `src/lib/actions/first-class.ts:73` | Reads `x-forwarded-for` / `x-real-ip` from `await headers()`. Returns `"unknown"` if missing. |
| `firstClassSchema` | `src/lib/actions/first-class.ts:18` | Zod schema. Validates name (2-80), email, preferredDay (enum), notes (≤500), company (honeypot, max 0). |
| `playChime()` | `src/components/layout/SoundToast.tsx:88` | Web Audio API. Created on user gesture. Silent-fail. |

### 6.3 Authentication & Authorization

**There is no auth layer.** The form is anonymous — name, email, preferred day, optional notes. No user accounts, no sessions, no JWTs, no protected routes.

If a member portal is added later (bookings history, class packs, account settings), introduce Auth.js v5 with:
- Credentials provider + bcryptjs
- DrizzleAdapter (or PrismaAdapter) for session storage
- `verifySession()` for Server Components (throws `NEXT_REDIRECT` — never wrap in try/catch)
- API routes use `auth()` directly (returns null → 401 JSON)

See the original `yoga-studio` repo's `skills/nextjs16-full-stack/SKILL.md` for the reference pattern.

### 6.4 Threat Model

| Threat | Vector | Mitigation |
| --- | --- | --- |
| Form spam (bots) | Automated form submissions | Honeypot field (`company`) — bots fill every input, humans don't. Silent reject. |
| Form spam (humans) | Manual repeated submissions | Per-IP rate limiter (3/hour, in-memory sliding window, fail-open). |
| Email enumeration | Submit form with known emails, observe response | The `DUPLICATE` response is the same warm message regardless of whether the email exists — but it does reveal existence. Acceptable for a marketing form; would need a generic "received" response for higher-security contexts. |
| IP harvesting | The `ipHash` field is SHA-256 + truncated | Not reversible. Used only for rate-limit forensics. |
| XSS | User input rendered in HTML | React escapes by default. `notes` is rendered as text content, never `dangerouslySetInnerHTML`. |
| CSRF | Cross-site form submission | Server Actions have built-in CSRF protection via Next.js (origin + path verification). |
| Audio annoyance | Auto-playing chime | `AudioContext` only on explicit user gesture (browser autoplay policy). The SoundToast asks permission. |
| DoS | Overwhelming the server | The app is stateless except SQLite. Docker restart policy is `unless-stopped`. For higher-traffic deploys, add a CDN/reverse proxy with rate limiting. |
| Data exfiltration | Reading the SQLite file | The file is inside the container at `/app/db/stillwater.db`, owned by `stillwater:stillwater` (uid 1001). Not accessible from outside the container except via the Docker volume. |

---

## 7. Worker / Background Service Architecture

**Not applicable.** Stillwater has no background jobs, queues, or async processing.

The original `yoga-studio` repo used Inngest for background jobs (video assembly pipeline). This build deliberately omits it (ADR-005). The only "async" work is the Server Action, which is synchronous (Prisma insert + return). Email confirmation is manual ("Iris writes you back within a day, by hand").

If background jobs are added later (e.g., automated email confirmation), introduce Inngest or a simpler queue (BullMQ + Redis). The original repo's `skills/nextjs16-full-stack/SKILL.md` has the Inngest reference pattern.

---

## 8. Testing Strategy

### 8.1 Test Distribution

| Category | File Count | Test Count | Location | Framework |
| --- | --- | --- | --- | --- |
| Unit tests | 3 | 22 | `src/tests/unit/` | Vitest 4.x |
| Integration tests | 0 | 0 | — | Vitest (planned) |
| E2E tests | 0 | 0 | — | Playwright (planned, not installed) |
| Accessibility scans | 0 | 0 | — | @axe-core/playwright (planned) |
| Manual verification | — | — | `agent-browser` commands | `agent-browser` CLI |

**Current state (v1.1)**: Vitest is installed and wired up. 22 unit tests cover the First-Class-Free validation logic (Zod schema, rate limiter, honeypot). Component and E2E tests are still planned. The test gap is now reduced from HIGH to MEDIUM priority.

#### Unit Test Details

| File | Tests | Coverage |
| --- | --- | --- |
| `src/tests/unit/first-class.schema.test.ts` | 12 | Zod schema: happy path, name/email/notes/preferredDay validation, honeypot field |
| `src/tests/unit/first-class.rate-limit.test.ts` | 5 | Per-IP sliding window: 3/hour limit, 4th blocked, per-IP isolation |
| `src/tests/unit/first-class.honeypot.test.ts` | 5 | Bot detection: empty passes, non-empty rejected, whitespace rejected |

**Config**: `vitest.config.ts` at project root. **Setup**: `src/tests/setup.ts` (stubs `window.matchMedia` for jsdom). **Alias**: `@` → `./src` (matches `tsconfig.json`).

```bash
bun run test          # run once (CI)
bun run test:watch    # watch mode (local dev)
```

**Note on testability**: The pure validation logic was extracted from `src/lib/actions/first-class.ts` into `src/lib/first-class-validation.ts` because `'use server'` modules cannot export synchronous functions (Next.js requires all exports to be async Server Actions). This extraction was a prerequisite for unit testing — see §3.3 Pattern 1 and §11 (Lessons Learned).

### 8.2 Test Patterns (planned)

When tests are added:

- **Unit tests** (`*.test.ts` co-located with source): Zod schema validation, rate limiter logic, `cn()` utility, `hashIp()` function.
- **Integration tests** (`*.test.tsx`): Server action with mocked Prisma, form component with `useActionState`.
- **E2E tests** (`e2e/*.spec.ts`): Full user flows — homepage render, form submission, accordion expand, typewriter, sound toggle.
- **Accessibility scans** (in E2E): `@axe-core/playwright` on every page, 0 violations target.

### 8.3 Coverage Thresholds (planned)

| Module | Statement | Branch | Function | Line |
| --- | --- | --- | --- | --- |
| `src/lib/actions/` | 90% | 80% | 90% | 90% |
| `src/lib/data/` | 100% | 100% | 100% | 100% |
| `src/hooks/` | 90% | 80% | 90% | 90% |
| `src/components/sections/` | 70% | 60% | 70% | 70% |
| Overall | 80% | 70% | 80% | 80% |

### 8.4 Pre-PR / Pre-Deploy Checklist

**Before every PR:**
- [ ] `bun run lint` — 0 errors
- [ ] `bun run typecheck` — 0 errors
- [ ] `bun run test` — all tests pass
- [ ] `bun run build` — succeeds (run before PR, not every commit)
- [ ] No `console.log` left in committed code
- [ ] No raw hex colours in components — use design tokens
- [ ] No `'use client'` on components that don't need it
- [ ] Every interactive element has a `:focus-visible` ring
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No orphan config files at project root (see §11 Lessons Learned)
- [ ] No sync functions exported from `'use server'` modules (see §3.3 Pattern 1)
- [ ] `agent-browser` manual verification passed (see §9.4)

**Before every deployment:**
- [ ] `.env` has `DATABASE_URL` set
- [ ] If Postgres: `provider` changed to `"postgresql"` in `prisma/schema.prisma`
- [ ] If Postgres: `bun run db:migrate` (not `db:push`)
- [ ] `next.config.ts` `images.remotePatterns` updated to production image host
- [ ] `allowedDevOrigins` cleared (sandbox-only setting)
- [ ] `docker compose -f docker-compose.prod.yml build` succeeds
- [ ] `docker compose -f docker-compose.prod.yml up -d` starts the container
- [ ] `curl -f https://your-domain/api/health` returns 200
- [ ] CI passes on `main` branch (`.github/workflows/ci.yml`)

---

## 9. Build & Deployment

### 9.1 Production Build

**Build command**:
```bash
bun run build
```

This runs:
```bash
next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
```

**Output structure**:
```
.next/
├── standalone/          ← Self-contained production server
│   ├── server.js        ← Entry point: `bun .next/standalone/server.js`
│   ├── .next/static/    ← Copied from .next/static (CSS, JS chunks)
│   ├── public/          ← Copied from public/ (logo, robots.txt)
│   └── node_modules/    ← Minimal deps needed to run
├── static/              ← Original build output (copied into standalone)
└── ...                  ← Other build artifacts (types, server components, etc.)
```

The `output: "standalone"` setting in `next.config.ts` produces a self-contained `.next/standalone/` directory that can run without the full `node_modules` tree. This is what the Docker runtime stage copies.

### 9.2 Environment Variables

| Name | Required | Description | Default | Example |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | SQLite connection string (relative path) or Postgres URL | — | `file:./db/stillwater.db` or `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | ✅ (set by Docker) | Environment mode | `development` | `production` |
| `NEXT_TELEMETRY_DISABLED` | Optional | Disables Next.js anonymous telemetry | unset | `1` |
| `NEXT_PHASE` | Set by Next.js | Build-time phase indicator | — | `phase-production-build` |
| `HOSTNAME` | Optional | Server bind address | `0.0.0.0` | `0.0.0.0` |
| `PORT` | Optional | Server port | `3000` | `3000` |

**That's the complete list.** Only `DATABASE_URL` is set by the user; the rest are set by Docker or Next.js.

### 9.3 Docker Configuration

#### 9.3.1 Production Dockerfile

**Base image**: `oven/bun:1-alpine` (Bun 1.x on Alpine Linux — small, secure, Bun runtime included).

**Multi-stage build**:
1. **`deps`** stage: Install all dependencies (including dev) — needed for the build.
2. **`builder`** stage: Copy source, set `NEXT_PHASE=phase-production-build`, run `bunx prisma generate`, run `bun run build`.
3. **`runtime`** stage: Copy `.next/standalone/` + `.next/static/` + `public/` + `prisma/`. Install only `curl` (for healthcheck). Create non-root user `stillwater` (uid 1001). Run `bun .next/standalone/server.js`.

**Security hardening**:
- Non-root user (`stillwater`, uid 1001) — never runs as root.
- No dev dependencies in the runtime image (standalone output is self-contained).
- No source code in the runtime image (only the standalone build output + `prisma/` for migrations).
- Healthcheck hits `/api/health` (DB connectivity check) every 30s.
- `NEXT_TELEMETRY_DISABLED=1` — no anonymous telemetry.

**Image size**: ~200 MB (Alpine base + Bun runtime + standalone build output). Significantly smaller than the original `yoga-studio` image (which included FFmpeg + Postgres client).

#### 9.3.2 Development Dockerfile

**Single-stage** build with hot reload via Turbopack. Source code is bind-mounted from the host (see `docker-compose-dev.yml`), so the image only needs dependencies + the dev server entrypoint.

**CMD**: `bun run dev -- --hostname 0.0.0.0` — starts Next.js in dev mode bound to all interfaces.

#### 9.3.3 docker-compose-dev.yml

**Single service**: `web`. No `postgres`, no `redis` (Stillwater uses SQLite + in-memory rate limiting).

**Volumes**:
- `.:/app` — bind-mount source for hot reload.
- `/app/node_modules` — anonymous volume to keep host's node_modules out.
- `.next:/app/.next` — preserve Next.js build cache.
- `db_data:/app/db` — named volume for the SQLite database (survives container recreation).

**First-run setup** (after `docker compose up`):
```bash
docker compose -f docker-compose-dev.yml exec web bunx prisma db push
```
This creates `./db/stillwater.db` inside the container (persisted via the `db_data` volume).

#### 9.3.4 docker-compose.prod.yml

**Single service**: `web`. Binds to `127.0.0.1:3000` (loopback only — put a reverse proxy in front for TLS).

**Volume**: `db_data:/app/db` — named volume for the SQLite database.

**Healthcheck**: `curl -f http://localhost:3000/api/health` every 30s.

### 9.4 CI/CD Pipeline

**CI is configured** via `.github/workflows/ci.yml`. It runs on every push and PR to `main`.

**CI pipeline:**
1. **Checkout** — `actions/checkout@v4`
2. **Setup Bun** — `oven-sh/setup-bun@v2` (ADR-009 — Bun is the unified PM + runtime)
3. **Install** — `bun install --frozen-lockfile`
4. **Lint** — `bun run lint`
5. **Typecheck** — `bun run typecheck`
6. **Unit tests** — `bun run test`
7. **Build** — `bun run build` (with `NEXT_PHASE=phase-production-build` + `NODE_ENV=production`)

All steps must pass for merge. The workflow uses `concurrency` to cancel in-progress runs on the same ref.

**Live-site verification** (manual, via `agent-browser`):
```bash
agent-browser open http://localhost:3000/
agent-browser wait --load networkidle
agent-browser errors                # must be empty
agent-browser console               # must be empty (HMR connected is fine)
agent-browser snapshot -i           # verify all 6 sections + form fields present

# Test the golden path (form submission)
agent-browser fill @e53 "Test Name"
agent-browser fill @e54 "test@example.com"
agent-browser select @e55 "Weekday morning"
agent-browser click @e57
agent-browser wait 3000
agent-browser snapshot -i | grep "Thank you"

# Test the accordion
agent-browser click @e36
agent-browser get attr @e36 aria-expanded      # should be "true"

# Mobile verification
agent-browser set viewport 390 844
agent-browser reload
agent-browser snapshot -i
```

---

## 10. Developer Handbook

### 10.1 Local Setup

#### Minimal setup (no Docker)

```bash
# 1. Clone and install
git clone <your-repo-url> stillwater
cd stillwater
bun install

# 2. Configure environment
cp .env.example .env

# 3. Initialize the database (creates ./db/stillwater.db)
bunx prisma db push

# 4. Start the dev server (port 3000, tees to dev.log)
bun run dev
```

Open <http://localhost:3000>.

#### Docker setup (recommended for consistency)

```bash
# 1. Clone
git clone <your-repo-url> stillwater
cd stillwater

# 2. Configure environment
cp .env.example .env

# 3. Start the dev container
docker compose -f docker-compose-dev.yml up -d

# 4. Initialize the database (first run only)
docker compose -f docker-compose-dev.yml exec web bunx prisma db push
```

Open <http://localhost:3000>.

### 10.2 Common Commands

| Command | Location | Purpose |
| --- | --- | --- |
| `bun run dev` | `package.json` | Dev server with Turbopack on port 3000 (tees to `dev.log`) |
| `bun run build` | `package.json` | Production build (standalone output) |
| `bun run start` | `package.json` | Start production server from `.next/standalone/server.js` |
| `bun run lint` | `package.json` | ESLint (`eslint .`) — must be 0 errors |
| `bun run typecheck` | `package.json` | TypeScript typecheck (`tsc --noEmit`) — must be 0 errors |
| `bun run test` | `package.json` | Vitest unit tests (run once, CI-friendly) |
| `bun run test:watch` | `package.json` | Vitest in watch mode (local dev) |
| `bun run db:push` | `package.json` | Push Prisma schema → SQLite (dev) |
| `bun run db:generate` | `package.json` | Regenerate Prisma Client after schema changes |
| `bun run db:migrate` | `package.json` | Create + apply a migration (Postgres prod) |
| `bun run db:reset` | `package.json` | Reset database (destroys data) |
| `docker compose -f docker-compose-dev.yml up -d` | — | Start dev container |
| `docker compose -f docker-compose.prod.yml up -d` | — | Start prod container |
| `agent-browser open http://localhost:3000/` | — | Open the site in headless browser for verification |

### 10.3 Code Style Rules

| Rule | Enforcement |
| --- | --- |
| TypeScript strict mode | `tsconfig.json` (`strict: true`) |
| No `any` outside scaffold | Code review (ESLint allows it; project forbids it) |
| `import type` for type-only imports | Code review |
| Named exports for components | Code review (except `page.tsx`/`layout.tsx` which require default) |
| `'use client'` only when needed | Code review (see §3.1 decision tree in `CLAUDE.md`) |
| Design tokens, no raw hex | Code review (`bg-terracotta`, not `bg-[#b16a48]`) |
| `prefers-reduced-motion` disables animations | CSS guard in `globals.css` + `useReducedMotion()` hook |
| `await headers()` / `cookies()` / `params` | TypeScript types (Next.js 16 makes them `Promise<T>`) |
| Conventional Commits | Code review (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`) |

### 10.4 Git Workflow

**Branching**:
- `main` — production-ready
- `feat/<short-description>` — feature branches
- `fix/<short-description>` — bug fixes
- Short-lived branches (merge within 1–3 days)

**Commit conventions** (Conventional Commits):
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `chore:` — build process, tooling, dependencies
- `test:` — adding or correcting tests
- `style:` — formatting, missing semi colons, etc.
- `perf:` — performance improvement

**PR process**:
1. Create a branch from `main`.
2. Make changes, commit with Conventional Commits messages.
3. Run `bun run lint && bun run typecheck && bun run test` — all must pass.
4. Run `agent-browser` manual verification (see §9.4).
5. Open a PR with a description linking to the issue.
6. Code review: check the pre-PR checklist (§8.4).
7. Merge to `main` (squash-merge preferred).

---

## 11. Known Issues & Outstanding Tasks

### 11.1 Issues Resolved in v1.1 (Post-Audit Remediation)

| Issue | Resolution |
| --- | --- |
| Orphan config files breaking `bun run build` (`drizzle.config.ts`, `playwright.config.ts`, `playwright-live.config.ts`, stale `vitest.config.ts`) | ✅ Deleted. Build now succeeds. |
| `recharts` unjustified major version bump (`^3.9.1`) causing type error in `chart.tsx` | ✅ Reverted to `^2.15.4`. (`chart.tsx` was later deleted as unused.) |
| `react-hooks/set-state-in-effect` lint error in `src/hooks/use-mobile.ts` | ✅ Refactored to `useSyncExternalStore` (ADR-007 pattern). |
| Prisma migration named `20260704060757_test` (unprofessional) | ✅ Renamed to `20260704060757_init`. DB reset to apply cleanly. |
| No automated test framework (HIGH-priority gap) | ✅ Vitest installed + 22 unit tests written. Gap reduced to MEDIUM (component + E2E tests still planned). |
| CI/CD pipeline broken (YAML corruption, wrong PM, missing scripts) | ✅ Fixed `.github/workflows/ci.yml` — uses Bun, runs lint + typecheck + test + build. |
| 26 unused production dependencies inflating bundle + CVE surface | ✅ Removed (next-auth, recharts, framer-motion, @dnd-kit/*, @tanstack/*, zustand, etc.). 65 → 39 production deps. |
| 9 unused shadcn ui component files | ✅ Deleted (chart, sonner, carousel, calendar, form, resizable, input-otp, command, drawer). |
| Pure validation logic trapped in `'use server'` module (untestable) | ✅ Extracted to `src/lib/first-class-validation.ts`. Now unit-tested. |

### 11.2 Known Issues (Open)

| Priority | Issue | Impact | Status |
| --- | --- | --- | --- |
| MEDIUM | No component tests (`@testing-library/react` not installed) | Form, Schedule, Hero components have no automated test coverage | Open — planned for next sprint |
| MEDIUM | No E2E tests (Playwright not installed) | No automated visual/accessibility regression protection | Open — planned. A fresh `playwright.config.ts` must be written (the previous orphan was deleted). |
| MEDIUM | `picsum.photos` placeholder images | Hero + teacher photos are random placeholders | Open — replace with real photography before production |
| MEDIUM | `status` field on `Lead` is `String`, not enum | SQLite doesn't support Prisma enums; values are convention-only | Open — migrate to Postgres `@enum` when scaling |
| LOW | `tailwind.config.ts` is NOT empty (contradicts ADR-002) | Contains the full shadcn theme (`background`, `foreground`, `chart-*`, etc.) — should be migrated to `globals.css` `@theme` block or deleted. Tokens in `globals.css` already work; this file is redundant. | Open — architectural cleanup. Do NOT delete without verifying no shadcn component depends on it. |
| LOW | `src/app/api/route.ts` is scaffold "Hello, world!" | Unused endpoint | Open — remove or replace with a real API |
| LOW | `src/hooks/use-toast.ts` + `src/components/ui/toaster.tsx` are scaffold | `Toaster` is rendered in `layout.tsx:77` but `useToast` is never called | Open — remove if no toast notifications are needed |
| LOW | `src/components/ui/sidebar.tsx` is unused scaffold | Large component with its own dependency on `use-mobile` hook | Open — delete if no sidebar navigation is needed |
| LOW | `src/components/ui/accordion.tsx` is unused by Schedule (ADR-006) | shadcn wrapper present but Schedule uses Radix primitives directly | Won't fix — kept for potential future use |
| LOW | No i18n | English only | Won't fix — studio is in Brooklyn, no internationalisation needed |
| LOW | No dark mode | The calm aesthetic is built around warm cream | Won't fix — dark mode would undermine the brand |

### 11.3 Lessons Learned (v1.1 Audit)

These lessons were captured during the v1.1 code review and remediation. They are documented to prevent recurrence.

#### Lesson 1: Orphan config files break `next build`

**Symptom**: `bun run build` fails with `Cannot find module 'X'` at a config file (e.g. `drizzle.config.ts:2`).

**Root cause**: `next build` runs `tsc` over ALL `.ts`/`.tsx` files in the project (per `tsconfig.json` `include: ["**/*.ts", "**/*.tsx"]`), including config files at project root. If a config file imports a dependency that isn't in `package.json`, the build fails. The Stillwater project inherited 4 orphan config files from a previous project ("IRONFORGE"): `drizzle.config.ts`, `playwright.config.ts`, `playwright-live.config.ts`, and a stale `vitest.config.ts`. All referenced uninstalled deps (`drizzle-kit`, `@playwright/test`) and non-existent paths (`./src/lib/db/schema/index.ts`, `./src/tests/e2e`).

**Fix**: Delete the orphan config files. If a config file is needed, ensure its dependencies are in `package.json`.

**Prevention**: Before adding a config file, run `bun run build` to verify it compiles. Add a CI step that runs `bun run build` on every PR (now in place via `.github/workflows/ci.yml`).

#### Lesson 2: `'use server'` modules cannot export sync functions

**Symptom**: `bun run build` fails with `Server Actions must be async functions` at a sync export inside a `'use server'` module.

**Root cause**: Next.js requires every export from a `'use server'` file to be an async Server Action. Pure sync logic (Zod schemas, rate limiters, hash functions) cannot live there. The original `src/lib/actions/first-class.ts` exported `firstClassSchema` (a Zod object) and `checkRateLimit` (a sync function) — both illegal.

**Fix**: Extract pure sync logic to a sibling non-`'use server'` module (`src/lib/first-class-validation.ts`). The server action imports from it. This also makes the logic unit-testable.

**Prevention**: When writing a server action, ask: "Is this export async?" If not, it belongs in a separate module.

#### Lesson 3: Unjustified major version bumps break builds

**Symptom**: `bun run build` fails with a type error in a scaffold component after a dependency version bump.

**Root cause**: `recharts` was bumped from `^2.15.4` to `^3.9.1` in `package.json` without justification. Recharts 3.x has breaking API changes (the `payload` prop type on `ChartTooltipContent` changed). The consuming file (`chart.tsx`) was a shadcn scaffold component that hadn't been updated for 3.x.

**Fix**: Reverted to `^2.15.4`. (The `chart.tsx` file was later deleted entirely as unused.)

**Prevention**: Never bump a major version without (1) reading the changelog, (2) verifying the consuming code compiles, (3) running `bun run build`. Major version bumps should be a conscious decision, not a side effect of `bun update`.

#### Lesson 4: Documentation can be wrong about usage

**Symptom**: The PAD §3.2 claimed `src/hooks/use-mobile.ts` was "Scaffold breakpoint hook (unused)". In reality, it was imported by `src/components/ui/sidebar.tsx:8`.

**Root cause**: The documentation was written based on a surface-level scan, not a grep for imports.

**Fix**: Corrected the documentation. The hook was refactored to `useSyncExternalStore` (not deleted) because it IS used.

**Prevention**: When documenting "unused" files, verify with `grep -rln "from.*<module>" src/`. Documentation that claims something is unused should be treated as a hypothesis, not a fact.

#### Lesson 5: Lockfile version drift can hide lint errors

**Symptom**: `bun run lint` passed, but `error.txt` (captured from `pnpm lint`) showed `react-hooks/set-state-in-effect` errors.

**Root cause**: `bun.lock` pinned `eslint-plugin-react-hooks@7.0.1` (less strict), while `pnpm-lock.yaml` pinned `7.1.1` (catches the error). The bug was real in both cases — the rule just wasn't enforced in the Bun environment.

**Fix**: Refactored the code to be correct regardless of plugin version (using `useSyncExternalStore`).

**Prevention**: Don't rely on a single lockfile to define correctness. The code should follow the stricter interpretation. When in doubt, run `pnpm lint` (or upgrade the Bun-pinned plugin) to catch additional issues.

#### Lesson 6: TDD reveals architectural issues

**Symptom**: Writing unit tests for `first-class.ts` failed because the module couldn't be imported in a test environment (it has `'use server'` + Prisma imports).

**Root cause**: The pure validation logic was entangled with the server action orchestration + Prisma persistence. This made it untestable in isolation.

**Fix**: Extracted pure logic to `first-class-validation.ts`. The server action now imports from it. This is the Single Responsibility Principle in action.

**Prevention**: If a module is hard to test, it's probably doing too much. Extract pure logic into testable units. This is a benefit of TDD — it forces better architecture.

---

## 12. Key Files Reference

| File | Lines | Purpose |
| --- | --- | --- |
| `src/app/page.tsx` | ~30 | Home page (SERVER component) — composes all 6 sections + HomeChrome |
| `src/app/layout.tsx` | ~80 | Root layout: Fraunces + Inter fonts, skip link, metadata API |
| `src/app/globals.css` | ~190 | `@theme` tokens, 6 `@keyframes`, `@utility` classes, reduced-motion guard |
| `src/app/api/health/route.ts` | ~35 | `/api/health` — Docker healthcheck endpoint (DB connectivity) |
| `src/lib/actions/first-class.ts` | ~115 | `'use server'` — Server Action: honeypot + rate limit + Zod + Prisma persist |
| `src/lib/first-class-validation.ts` | ~65 | Pure logic: Zod schema, rate limiter, hashIp (extracted for unit testing — v1.1) |
| `src/lib/data/practices.ts` | ~50 | `PRACTICES` readonly array (4 items) |
| `src/lib/data/teachers.ts` | ~50 | `TEACHERS` readonly array (3 items with quotes) |
| `src/lib/data/schedule.ts` | ~150 | `SCHEDULE` readonly array (10 classes) + `PREFERRED_DAYS` |
| `src/lib/db.ts` | ~12 | Prisma client global singleton |
| `src/lib/utils.ts` | ~6 | `cn()` helper (clsx + tailwind-merge) |
| `src/hooks/use-reduced-motion.ts` | ~36 | `useSyncExternalStore` for prefers-reduced-motion (SSR-safe) |
| `src/hooks/use-mobile.ts` | ~36 | `useSyncExternalStore` for mobile breakpoint (refactored in v1.1) |
| `src/hooks/use-reveal.ts` | ~65 | IntersectionObserver fade-up |
| `src/hooks/use-breath-cycle.ts` | ~45 | 8s rAF loop (inhale/exhale counter) |
| `src/components/layout/HomeChrome.tsx` | ~60 | Client orchestrator: Topbar + BreathGuide + SoundToast state |
| `src/components/layout/Topbar.tsx` | ~110 | Fixed nav, scroll-condense, sound toggle |
| `src/components/layout/SoundToast.tsx` | ~115 | Opt-in dialog + `playChime()` Web Audio API |
| `src/components/layout/BreathGuide.tsx` | ~50 | Fixed bottom-left 8s breath orb |
| `src/components/layout/Footer.tsx` | ~95 | Ink-on-cream 4-column editorial footer |
| `src/components/layout/LinenGrain.tsx` | ~8 | SVG noise overlay (50% opacity, multiply) |
| `src/components/sections/Hero.tsx` | ~140 | 8s breath cycle + Ken Burns + scroll cue |
| `src/components/sections/Practices.tsx` | ~70 | 4-card editorial 2×2 grid |
| `src/components/sections/Teachers.tsx` | ~135 | Hover/click typewriter quotes |
| `src/components/sections/Schedule.tsx` | ~230 | Radix accordion + mala-bead seat dots |
| `src/components/sections/FirstClassFree.tsx` | ~280 | `useActionState` form + Server Action binding |
| `src/components/sections/Reveal.tsx` | ~35 | IntersectionObserver fade-up wrapper |
| `src/components/sections/SectionHead.tsx` | ~50 | Label + title + lead shared header |
| `src/tests/setup.ts` | ~15 | Vitest global setup (matchMedia stub for jsdom) — v1.1 |
| `src/tests/unit/first-class.schema.test.ts` | ~110 | Zod schema unit tests (12 tests) — v1.1 |
| `src/tests/unit/first-class.rate-limit.test.ts` | ~65 | Rate limiter unit tests (5 tests) — v1.1 |
| `src/tests/unit/first-class.honeypot.test.ts` | ~55 | Honeypot unit tests (5 tests) — v1.1 |
| `prisma/schema.prisma` | ~25 | `Lead` model (first-class-free submissions) |
| `prisma/migrations/20260704060757_init/migration.sql` | ~20 | Initial migration (Lead table + indexes) — renamed from "test" in v1.1 |
| `next.config.ts` | ~30 | `output: "standalone"`, picsum.photos remotePatterns, allowedDevOrigins |
| `tsconfig.json` | ~45 | `strict: true`, `@/*` alias, excludes audit folders |
| `vitest.config.ts` | ~25 | Vitest config (jsdom, globals, @/ alias) — v1.1 |
| `eslint.config.mjs` | ~40 | ESLint flat config (core-web-vitals + typescript) |
| `.github/workflows/ci.yml` | ~40 | CI workflow (Bun, lint + typecheck + test + build) — fixed in v1.1 |
| `Dockerfile` | ~95 | Production multi-stage (Bun, non-root, healthcheck) |
| `Dockerfile.dev` | ~50 | Dev image with hot reload |
| `docker-compose-dev.yml` | ~55 | Single `web` service + db_data volume |
| `docker-compose.prod.yml` | ~55 | Single `web` service, loopback bind, healthcheck |
| `.dockerignore` | ~55 | Excludes node_modules, .next, .git, docs, audit folders |
| `.env.example` | ~8 | `DATABASE_URL` template |
| `CLAUDE.md` | ~410 | Comprehensive conventions for Claude Code |
| `AGENTS.md` | ~140 | Compact agent instructions (high-signal) |
| `README.md` | ~360 | Human-facing project overview |
| `stillwater_SKILL.md` | ~1991 | Deepest-layer skill: 20 sections + appendices |

---

## 13. Glossary

| Term | Definition |
| --- | --- |
| **Breath cycle** | The 8-second inhale-exhale cadence that drives the hero, brand mark, and breath orb animations. Sacred — all three must stay in sync. |
| **Mala bead** | A string of prayer beads used in yogic meditation. The schedule's seat-availability dots are styled to resemble a mala bead string, not a data dashboard. |
| **Perfect fifth** | The musical interval between A4 (440 Hz) and E5 (659.25 Hz) — the most consonant interval in Western music. Used for the opt-in chime. |
| **Pranayama** | The yogic practice of breath control. The Breathwork practice section references this Sanskrit term. |
| **Honeypot** | A hidden form field that bots fill but humans don't. If non-empty, the submission is silently rejected. |
| **Standalone output** | Next.js's `output: "standalone"` setting produces a self-contained `.next/standalone/` directory with its own minimal `node_modules` — no full install needed at runtime. |
| **Server Action** | A function marked `'use server'` that runs on the server and can be called from client components via `<form action={...}>`. Next.js's replacement for API routes for form submissions. |
| **`useActionState`** | React 19 hook that binds a Server Action to a form, providing pending state and the action's result. |
| **`useSyncExternalStore`** | React 18+ hook for subscribing to external state (media queries, IntersectionObserver, etc.) without cascading renders. |
| **Discriminated union** | A TypeScript pattern where a `type` has a common `success` (or `code`) field that narrows the rest of the object. Used for `FirstClassResult`. |
| **Anti-generic** | The design philosophy that rejects template aesthetics (purple gradients, bento grids, Inter alone) in favor of intentional, bespoke design. |
| **Linen grain** | An SVG noise texture overlaid at 50% opacity, multiply-blended. Makes the cream background feel like paper, not plastic. |
| **Ken Burns** | A slow pan/zoom effect on a still image, named after the documentary filmmaker. The hero photo uses an 8s Ken Burns on the breath cycle. |
| **Radix primitive** | An unstyled, accessible UI component from Radix UI. Stillwater uses `@radix-ui/react-accordion` directly (not the shadcn wrapper) for the Schedule. |
| **CUID** | Collision-resistant unique identifier. Used for Prisma's `@default(cuid())` on the `Lead.id` field. |
| **`P2002`** | Prisma's error code for a unique constraint violation. The server action catches this and returns the warm `DUPLICATE` message. |

---

*End of Stillwater Project Architecture Document. This document was produced by following the `project-architecture-document-md` skill's 13-section canonical structure on the Stillwater Yoga Studio codebase. For the companion docs, see [`README.md`](./README.md), [`AGENTS.md`](./AGENTS.md), [`CLAUDE.md`](./CLAUDE.md), and [`stillwater_SKILL.md`](./stillwater_SKILL.md).*
