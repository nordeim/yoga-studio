---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs
framework_version: "16.1"
last_updated: 2026-07-04
---

# Stillwater · Yoga Studio

## Core Identity & Purpose

Boutique yoga studio marketing & booking site for a fictional Cobble Hill, Brooklyn studio. Single homepage (`/`) composed of six editorial sections (Hero, Practices, Teachers, Schedule, First-Class-Free, Footer) plus a persistent client-side chrome (Topbar, BreathGuide, SoundToast). The aesthetic is the antidote to high-intensity gym culture: calm, intentional, grounded.

Maintained as a production-grade reference build — a single-route Next.js 16 App Router application that demonstrates Server Components by default, 5 client-component leaves for interactivity, Prisma + SQLite for lead capture, Zod 4 for validation, Radix UI primitives for the accordion, and Web Audio API for the opt-in chime. The original `nordeim/yoga-studio` repo (cloned at `./yoga-studio/` for skill reference) had Auth.js, Stripe, Inngest, and Replicate — this build deliberately omits them for a calm marketing site.

**Tech Stack**: Next.js 16.1.3 (App Router, Turbopack), React 19, TypeScript 5 (strict), Tailwind CSS v4, Prisma 6.19 + SQLite, Zod 4, shadcn/ui (New York) + Radix UI primitives, `next/font` (Fraunces + Inter), Web Audio API.

---

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

Follow this six-phase workflow for all implementation tasks:

1. **ANALYZE** — Never make surface-level assumptions. Identify explicit requirements, implicit needs, and ambiguities. Read the relevant `src/components/sections/*` and `src/lib/data/*` files before touching anything.
2. **PLAN** — Create a detailed plan with sequential phases. Present for explicit user confirmation. Never proceed without validation.
3. **VALIDATE** — Get explicit user approval before coding. Address concerns.
4. **IMPLEMENT** — Implement in logical, testable components. Test each before integration.
5. **VERIFY** — Run `bun run lint && bun run typecheck && bun run test` before delivery. Consider edge cases, accessibility, performance.
6. **DELIVER** — Complete handoff with documentation. Suggest next steps.

### Project-Specific Principles

- **Calm over loud.** Restraint is the brand. One accent colour (terracotta `#b16a48`), used in exactly four places: section labels, hover underlines, sound toggle when active, and form submit hover. Do not introduce more.
- **Server-first.** Only 5 leaves are client components: `Hero`, `Teachers`, `Schedule`, `FirstClassFree`, `HomeChrome`. Everything else renders on the server. Push `'use client'` to the leaves, never to the section shell.
- **Accessibility is non-negotiable.** WCAG AAA target. Every interactive element needs a 2px terracotta `:focus-visible` ring with 2px offset. `prefers-reduced-motion` DISABLES animations (not slows them) per WCAG 2.3.3.
- **Library discipline.** Use shadcn/ui + Radix primitives when they exist. The Schedule accordion MUST use `@radix-ui/react-accordion` directly — do not build a custom accordion.
- **Anti-generic.** No purple gradients, no bento card grids, no "Inter alone" — Fraunces (humanist serif) paired with Inter (UI sans) is required. No `rounded-2xl` everywhere — minimal radii (`rounded-sm` or sharp) for editorial feel.

---

## Implementation Standards

### Next.js 16 Specific

- **App Router** — `src/app/` directory. The ONLY user-visible route is `/` (per `fullstack-dev` skill constraint). Do NOT add other routes without explicit user request.
- **Server Components by default.** Mark `'use client'` only when a component needs `useState`/`useEffect`/`useRef`, browser APIs (`window`, `matchMedia`, `AudioContext`), or `usePathname`/`useRouter`/`useSearchParams`.
- **Async APIs in Next.js 16.** `headers()`, `cookies()`, `params`, `searchParams` are `Promise<T>` — always `await` them. Synchronous access → runtime 500. See `src/lib/actions/first-class.ts:73` for the `await headers()` pattern.
- **`next/image`** for hero + teacher portraits. Hero gets `priority`; everything else lazy-loads. `remotePatterns` in `next.config.ts` whitelists `picsum.photos` + `fastly.picsum.photos`.
- **Metadata API** in `src/app/layout.tsx` — `title.template`, `openGraph`, `twitter`, `robots`. JSON-LD would go in a `<script type="application/ld+json">` in the body, NOT in `metadata.other`.
- **Server Actions** for form submissions (`'use server'` first line). Bind via `<form action={claimFirstClassAction}>`, NOT `onClick`.
- **`output: "standalone"`** in `next.config.ts` for Docker deployment.
- **`allowedDevOrigins`** includes `*.space-z.ai` for the sandbox preview.

### TypeScript Strict Mode

- `strict: true` in `tsconfig.json`. `noImplicitAny: false` (scaffold default — do NOT change without explicit request).
- **Never use `any`** — use `unknown` + type guards. The scaffold's ESLint disables `@typescript-eslint/no-explicit-any`, but the project rule is stricter: prefer real type safety.
- Prefer `interface` for object shapes; `type` for unions/intersections.
- Let TypeScript infer return types on non-public-API functions. Explicit return types only on exported server-action signatures (for `FirstClassResult` discriminated unions).
- `import type { Foo }` for type-only imports (verbatimModuleSyntax not enforced, but preferred).
- Path alias: `@/*` → `./src/*`.

### Tailwind CSS v4 (CSS-first config)

- **NO `tailwind.config.js` for app tokens.** All design tokens live in `src/app/globals.css` inside the `@theme inline {}` block. The root-level `tailwind.config.ts` is the scaffold default and is intentionally empty of app tokens.
- **PostCSS**: `postcss.config.mjs` has only `@tailwindcss/postcss`. Do NOT add `autoprefixer` or `postcss-import` — they break v4.
- **Custom tokens** — `--color-linen-*`, `--color-sand`, `--color-sage-*`, `--color-terracotta*`, `--color-dusk-pink`, `--color-ink*`. Use them as `bg-linen-100`, `text-ink-soft`, `border-ink-line`, etc. **NEVER raw hex in components** (`bg-[#b16a48]` is forbidden).
- **Custom utilities** via `@utility name { ... }` — see `fade-up`, `fade-up-in`, `delay-1..4`, `linen-grain`.
- **Custom animations** via `--animate-*` theme keys referencing `@keyframes` — see `hero-breath` (8s), `brand-breath`, `breath-orb`, `scrollline`, `cursor-blink`, `sound-wave`.
- **v3 → v4 cheatsheet** if editing scaffold code: `bg-opacity-50` → `bg-color/50`; `shadow-sm` → `shadow-xs`; `bg-gradient-to-r` → `bg-linear-to-r`; `outline-none` → `outline-hidden`; `ring` → `ring-3`.

### React 19 Specific

- **`useSyncExternalStore`** for external-state subscriptions (see `src/hooks/use-reduced-motion.ts`). Avoids the React 19 `set-state-in-effect` lint error.
- **`useActionState`** for form state (see `src/components/sections/FirstClassFree.tsx`). Signature: `useActionState(serverAction, initialState)`.
- **No `forwardRef` needed** on new components — React 19 passes `ref` as a regular prop.
- **React Compiler** handles memoization — do not wrap everything in `useMemo`/`useCallback`.

### Prisma + SQLite

- Schema at `prisma/schema.prisma`. Single model: `Lead` (first-class-free submissions).
- `src/lib/db.ts` exports a global singleton `db` — import as `import { db } from "@/lib/db"`.
- **Migration workflow**: `bun run db:push` (dev only — SQLite). For Postgres prod, change `provider` to `"postgresql"` and use `bun run db:migrate` (which runs `prisma migrate dev`).
- **Never `prisma db push` in production** — always `prisma migrate deploy`.

### Zod 4 (validation)

- API change from Zod 3: `z.enum(values, { errorMap: ... })` is GONE. Use `z.enum(values, { message: "..." })` instead. See `src/lib/actions/first-class.ts:24`.
- `z.infer<typeof schema>` for the input type.

### Web Audio API (chime)

- `AudioContext` is instantiated ONLY on explicit user gesture (browser autoplay policy). See `src/components/layout/SoundToast.tsx:88` — the `playChime` function creates a fresh context each call.
- Two stacked triangle waves at A4 (440 Hz) + E5 (659.25 Hz) + sub-octave A3 (220 Hz) — a perfect fifth, the most consonant interval.
- 2.8s exponential decay. Silent-fail in `try/catch` — audio is optional.

---

## Development Workflow

### Environment Setup

```bash
bun install                 # or: pnpm install / npm install
cp .env.example .env        # creates .env with DATABASE_URL
bunx prisma db push         # creates ./db/stillwater.db
bun run dev                 # http://localhost:3000
```

### Build Commands

| Command             | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `bun run dev`       | Dev server with Turbopack on port 3000 (logs to `dev.log`)    |
| `bun run build`     | Production build (standalone output, copies static + public)  |
| `bun run start`     | Start production server from `.next/standalone/server.js`     |
| `bun run lint`      | ESLint (`eslint .`) — must be 0 errors before commit          |
| `bun run typecheck` | TypeScript typecheck (`tsc --noEmit`) — must be 0 errors      |
| `bun run test`      | Vitest unit tests (run once, CI-friendly)                     |
| `bun run test:watch`| Vitest in watch mode (local dev)                              |
| `bun run db:push`   | Push Prisma schema → SQLite (dev only)                        |
| `bun run db:generate` | Regenerate Prisma Client after schema changes               |
| `bun run db:migrate` | Create + apply a migration (Postgres prod)                   |
| `bun run db:reset`  | Reset database (destroys data)                                |

**Quality gate before every commit:**
```bash
bun run lint && bun run typecheck && bun run test
```

**Full pre-ship gate (also run by CI on push/PR):**
```bash
bun run lint && bun run typecheck && bun run test && bun run build
```

---

## Testing Strategy

### Current state

**Vitest** is installed and wired up. The priority test surface is the First-Class-Free validation logic (PAD §8.2), which lives in `src/lib/first-class-validation.ts` (extracted from the server action so it can be unit-tested in isolation — see "Error Handling & Debugging" below for the `'use server'` gotcha that forced this extraction).

**22 unit tests** across 3 files in `src/tests/unit/`:

| File | Tests | Coverage |
| ---- | ----- | -------- |
| `first-class.schema.test.ts` | 12 | Zod schema: happy path, name/email/notes/preferredDay validation, honeypot field |
| `first-class.rate-limit.test.ts` | 5 | Per-IP sliding window: 3/hour limit, 4th blocked, per-IP isolation |
| `first-class.honeypot.test.ts` | 5 | Bot detection: empty passes, non-empty rejected, whitespace rejected |

**Config**: `vitest.config.ts` at project root. **Setup**: `src/tests/setup.ts` (stubs `window.matchMedia` for jsdom). **Alias**: `@` → `./src` (matches `tsconfig.json`).

```bash
bun run test          # run once (CI)
bun run test:watch    # watch mode (local dev)
```

Manual verification via `agent-browser` is still used for visual/e2e checks (Playwright not yet installed):

```bash
agent-browser open http://localhost:3000/
agent-browser wait --load networkidle
agent-browser errors                          # must be empty
agent-browser console                         # must be empty
agent-browser snapshot -i                     # verify all 6 sections + form fields
```

### Planned

- **`@testing-library/react` + `@testing-library/jest-dom`** for component tests on `FirstClassFree.tsx`, `Schedule.tsx`, `Hero.tsx`. Add to `src/tests/setup.ts` when introduced.
- **Playwright + @axe-core/playwright** for e2e + accessibility scans. A fresh `playwright.config.ts` should be written when Playwright is actually installed (the previous orphan config from another project was deleted).
- Co-locate component tests as `*.test.tsx` next to the source.

---

## Code Quality Standards

### Linting & Formatting

```bash
bun run lint
```

ESLint config (`eslint.config.mjs`) extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. The scaffold disables many strict rules (e.g., `no-explicit-any: off`); the project convention is to follow the **stricter** rule even when ESLint permits the looser one.

**Ignores**: `node_modules`, `.next`, `yoga-studio` (cloned reference), `skills`, `examples`, `upload`, `tool-results`.

### Pre-commit Checklist

- [ ] `bun run lint` — 0 errors
- [ ] `bun run typecheck` — 0 errors
- [ ] `bun run test` — all tests pass
- [ ] `bun run build` — succeeds (run before PR, not every commit)
- [ ] No `console.log` left in committed code (dev log only)
- [ ] No raw hex colours in components — use design tokens
- [ ] No `'use client'` on components that don't need it
- [ ] Every interactive element has a `:focus-visible` ring
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No orphan config files at project root (see §Error Handling & Debugging)

---

## Git & Version Control

### Branching

- `main` — production-ready
- `feat/<short-description>` — feature branches
- `fix/<short-description>` — bug fixes
- Short-lived branches (merge within 1–3 days)

### Commit Standards

- Follow **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, `style:`, `perf:`
- Atomic commits (one logical change per commit)
- Body explains WHY, not WHAT

### .gitignore Notes

The `.gitignore` excludes: `node_modules`, `.next/`, `.env*`, `*.log`, `dev.log`, `server.log`, `*.tsbuildinfo`, `next-env.d.ts`, `/skills/` (bundled catalog, audit-only). The `db/` folder is NOT ignored — the SQLite file ships with the repo for dev convenience, but should be cleared before production deploy.

---

## Error Handling & Debugging

### Server Action error envelope

`src/lib/actions/first-class.ts` exports a discriminated union `FirstClassResult`:

```typescript
type FirstClassResult =
  | { success: true; message: string }
  | { success: false; code: "VALIDATION" | "RATE_LIMIT" | "BOT" | "DUPLICATE" | "INTERNAL"; message: string; errors?: FirstClassFieldErrors }
```

- **VALIDATION** — Zod schema failure. Inline field errors via `errors` map.
- **RATE_LIMIT** — >3 submissions/hour per IP. Sliding-window in-memory map.
- **BOT** — honeypot field `company` was filled. Silent reject.
- **DUPLICATE** — Prisma unique constraint (`P2002`) on `email`. Warm acknowledgement.
- **INTERNAL** — anything else. Generic message, never leak internals.

### Fail-open pattern

Rate limiter fails OPEN on Redis/memory outage — never block a real user because the limiter state got weird. See `src/lib/actions/first-class.ts:100-106`.

### Debugging

- **Dev server log**: `tail -f dev.log` (dev server output is teed here by `next dev -p 3000 2>&1 | tee dev.log`).
- **Prisma query log**: `src/lib/db.ts` has `log: ['query']` in dev — every SQL query is logged.
- **Browser errors**: `agent-browser errors` + `agent-browser console`.
- **Hydration mismatch**: check for `typeof window === 'undefined'` guards in client components, or use `useSyncExternalStore` for external state.
- **`Cannot find module 'X'` during `bun run build`**: almost always an **orphan config file** at project root referencing an uninstalled dependency. `next build` runs `tsc` over ALL `.ts`/`.tsx` files in the project (per `tsconfig.json` `include: ["**/*.ts", "**/*.tsx"]`), including config files. If a config file imports a dep that isn't in `package.json`, the build fails. **Fix**: delete the orphan config file, or add the dep, or exclude the file in `tsconfig.json`. Past victims: `drizzle.config.ts`, `playwright.config.ts`, `playwright-live.config.ts`, `vitest.config.ts` (all were orphans from a previous project and were deleted).
- **`Server Actions must be async functions` build error**: a `'use server'` module cannot export synchronous functions — Next.js requires every export to be an async Server Action. **Fix**: move pure sync logic (Zod schemas, rate limiters, hash functions) to a separate non-`'use server'` module and import it. See `src/lib/first-class-validation.ts` for the canonical pattern.
- **`react-hooks/set-state-in-effect` lint error**: do NOT silence it in `eslint.config.mjs`. Use `useSyncExternalStore` for external state (media queries, localStorage, IntersectionObserver). See `src/hooks/use-reduced-motion.ts` and `src/hooks/use-mobile.ts` for the canonical pattern. Note: the severity of this rule depends on the `eslint-plugin-react-hooks` version — `bun.lock` may pin a less strict version than `pnpm-lock.yaml`, so the error may appear/disappear depending on which lockfile is used. The fix is the same regardless.
- **Prisma `P2002` on form submit**: Unique constraint on `email`. The server action handles this and returns a warm `DUPLICATE` message — not a bug.
- **Prisma migration drift (`prisma migrate dev` fails with "Drift detected")**: run `bun run db:reset` (drops + recreates the DB from migrations), then `bun run db:migrate`. This is safe in dev (SQLite). Never run `db:reset` in production.

---

## Communication & Documentation

### Documentation Standards

- Explain "why", not just "what".
- Document assumptions and constraints.
- Code comments are for non-obvious logic — the breath-cycle math, the chime frequencies, the rate-limit window.
- Section-level docstrings on every exported component.

### Companion docs

- **`README.md`** — project overview, quick start, tech stack, architecture, design system. For humans landing on the repo.
- **`AGENTS.md`** — compact, high-signal agent instructions. For AI coding agents.
- **`CLAUDE.md`** (this file) — comprehensive project conventions. For Claude Code sessions.

---

## Project-Specific Standards

### Architecture

```
src/
├── app/                         # App Router
│   ├── layout.tsx               # Fonts, skip link, metadata
│   ├── page.tsx                 # Composes all 6 sections + chrome (SERVER component)
│   ├── globals.css              # @theme tokens, keyframes, reduced-motion guard
│   └── api/route.ts             # Health check endpoint
├── components/
│   ├── layout/                  # Topbar, Footer, BreathGuide, SoundToast,
│   │                            # LinenGrain, HomeChrome (client orchestrator)
│   ├── sections/                # Hero, Practices, Teachers, Schedule,
│   │                            # FirstClassFree, SectionHead, Reveal
│   └── ui/                      # shadcn/ui primitives (39 components — unused
│                                # scaffold files were removed; see §Anti-Patterns)
├── hooks/                       # use-reduced-motion, use-reveal, use-breath-cycle,
│                                # use-mobile (all useSyncExternalStore)
├── lib/
│   ├── actions/first-class.ts   # Server Action: honeypot + rate limit + persist
│   ├── first-class-validation.ts # Pure logic: Zod schema, rate limiter, hashIp
│   │                            # (extracted for unit testing — see §Error Handling)
│   ├── data/                    # Static content (practices, teachers, schedule)
│   ├── db.ts                    # Prisma client (global singleton)
│   └── utils.ts                 # cn() helper
├── tests/
│   ├── setup.ts                 # Vitest global setup (matchMedia stub for jsdom)
│   └── unit/                    # Unit tests (first-class.schema, rate-limit, honeypot)
```

**Layering rule**: `app/` → `components/` → `hooks/` + `lib/`. Lower layers may never import from higher layers.

### Static content boundary

Teachers, practices, and the weekly schedule live in `src/lib/data/*.ts` as `readonly` arrays. They are NOT in the database because they change ~annually and never participate in transactions. Only the `Lead` model (form submissions) is in the DB.

### Form handling

The "First Class Free" form (`src/components/sections/FirstClassFree.tsx`) uses `useActionState` bound to `claimFirstClassAction`. The server action (`src/lib/actions/first-class.ts`) delegates validation to pure functions in `src/lib/first-class-validation.ts` (this extraction was forced by the `'use server'` sync-export gotcha — see §Error Handling & Debugging). The flow:

1. **Honeypot check** — `company` field must be empty.
2. **Rate limit** — 3 submissions/hour per IP, fail-open. Logic in `first-class-validation.ts:checkRateLimit()`.
3. **Zod validation** — name (2–80 chars), email, preferredDay (enum), notes (optional, ≤500 chars). Schema in `first-class-validation.ts:firstClassSchema`.
4. **Persist** — `db.lead.create()` with `ipHash` (SHA-256, never raw IP). `hashIp()` lives in `first-class-validation.ts`.
5. **Return** — discriminated union; client renders success state or inline errors.

**Why the split**: `'use server'` modules forbid exporting synchronous functions — Next.js requires every export to be an async Server Action. The Zod schema and rate limiter are pure sync functions, so they cannot live in `first-class.ts`. They live in `first-class-validation.ts` (a regular module) and are imported by the server action. This also makes them unit-testable.

### Environment Variables

| Variable       | Purpose                          | Example                       |
| -------------- | -------------------------------- | ----------------------------- |
| `DATABASE_URL` | SQLite connection string         | `file:./db/stillwater.db`     |

That's the only env var. No `AUTH_SECRET`, no `NEXTAUTH_URL` — there is no auth. If you add auth later, add `AUTH_SECRET` (32+ chars, Zod-validated to reject known-weak values).

### Design system tokens

Defined in `src/app/globals.css` under `@theme inline {}`. The key ones:

| Token                  | Hex / Value                                  | Usage                                   |
| ---------------------- | -------------------------------------------- | --------------------------------------- |
| `--color-linen-50`     | `#faf5ec`                                    | Page background (brightest cream)       |
| `--color-linen-100`    | `#f4ede0`                                    | Default cream background                |
| `--color-linen-200`    | `#efe6d4`                                    | Card hover background                   |
| `--color-sand`         | `#e3d5c1`                                    | First-Class-Free section background     |
| `--color-sage`         | `#8a9a87`                                    | Available seat dots                     |
| `--color-sage-deep`    | `#5d6e5a`                                    | Italic emphasis in titles               |
| `--color-terracotta`   | `#b16a48`                                    | PRIMARY accent — labels, hover, focus   |
| `--color-terracotta-deep` | `#8e4f33`                                 | Hover state for terracotta              |
| `--color-dusk-pink`    | `#d4a5a0`                                    | Soft secondary accent                   |
| `--color-ink`          | `#2c2620`                                    | Headlines (15.8:1 on linen-50)          |
| `--color-ink-soft`     | `#4a4036`                                    | Body text (9.5:1)                       |
| `--color-ink-mute`     | `#7a6e60`                                    | Metadata (decorative only)              |
| `--color-ink-line`     | `rgba(44,38,32,0.14)`                        | Borders                                 |
| `--font-serif`         | `Fraunces, Georgia, serif`                   | All headings, teacher quotes            |
| `--font-sans`          | `Inter, system-ui, sans-serif`               | UI body, labels, metadata               |
| `--ease-quiet`         | `cubic-bezier(0.22, 1, 0.36, 1)`             | Default easing                          |
| `--animate-hero-breath`| `hero-breath 8s ease-in-out infinite alternate` | Hero Ken Burns + breath cycle        |

### Motion standards

| Type       | Duration | Easing                              | Use case                            |
| ---------- | -------- | ----------------------------------- | ----------------------------------- |
| Micro      | 150ms    | `(0.4, 0, 0.2, 1)`                  | Hover states, toggle icons          |
| Standard   | 300ms    | `(0.4, 0, 0.2, 1)`                  | Schedule row expand                 |
| Dramatic   | 500ms+   | `(0.25, 1, 0.36, 1)`                | Hero entry                          |
| Reveal     | 1000ms   | `(0.22, 1, 0.36, 1)`                | Scroll-triggered fade-up            |
| Ken Burns  | 8s       | `ease-in-out infinite alternate`    | Hero photo scale/translate          |
| Breath     | 8s       | `ease-in-out infinite`              | BreathGuide orb, brand mark dot     |

**Guardrails**: animate `transform` + `opacity` only (never `width`/`height`/`top`/`margin`). No `transition: all`. `will-change: transform` sparingly. IntersectionObserver gates all scroll animations + pauses hero breath when off-screen.

---

## Anti-Patterns to Avoid

- **Over-engineering** — don't add Auth.js v5, Stripe, Inngest, or Replicate unless the user explicitly asks. The original `yoga-studio` repo had them; this build deliberately omits them for a marketing site. (Note: `next-auth` was previously listed as an unused dependency in the PAD — it has now been **removed** from `package.json` entirely. Do not re-add it without explicit request.)
- **Premature optimization** — measure before optimizing. The current LCP is the hero image; everything else is below the fold.
- **Raw hex in components** — `bg-[#b16a48]` is forbidden. Use `bg-terracotta`.
- **`'use client'` on shells** — section shells (`<Practices>`, `<Schedule>` parent) should be server components. Only the interactive leaf (`<ScheduleRow>` trigger) is a client component.
- **Custom accordion** — use `@radix-ui/react-accordion` primitives directly. The shadcn `Accordion` wrapper injects a default chevron that doesn't match the design; we use Radix primitives with our own `+` icon that rotates 45° into an `×`.
- **`@fontsource/*`** — use `next/font/google` for Fraunces + Inter. Never `@font-face` in CSS.
- **`drizzle-kit push` in production** — not applicable here (we use Prisma), but the principle holds: never push schema directly to prod. Always migrate.
- **`as any` casts** — use wrapper functions or `unknown` + type guards.
- **Adding more routes** — the `fullstack-dev` skill constraint says only `/` is user-visible. If a new route is needed, ask first.
- **Slowing animations for reduced-motion** — DISABLE them entirely. Slowed animations can trigger vestibular disorders.
- **Orphan config files at project root** — `next build` type-checks ALL `.ts`/`.tsx` files via `tsconfig.json`. A config file that imports an uninstalled dependency (e.g. `drizzle-kit`, `@playwright/test`, `vitest` before it was installed) will break the build with `Cannot find module`. If you add a config file, ensure its dependencies are in `package.json`. The project previously had 4 orphan configs (`drizzle.config.ts`, `playwright.config.ts`, `playwright-live.config.ts`, and a stale `vitest.config.ts` from another project) — all deleted.
- **Exporting sync functions from `'use server'` modules** — Next.js requires all exports from a `'use server'` file to be async Server Actions. A Zod schema, rate limiter, or hash function is sync and cannot live there. **Fix**: extract pure logic to a sibling non-`'use server'` module (see `src/lib/first-class-validation.ts`). This also makes the logic unit-testable.
- **Silencing `react-hooks/set-state-in-effect`** — do NOT add `"react-hooks/set-state-in-effect": "off"` to `eslint.config.mjs`. Use `useSyncExternalStore` instead. The rule exists to prevent cascading renders.
- **Re-adding removed scaffold dependencies** — 26 unused dependencies were removed from `package.json` (including `next-auth`, `recharts`, `framer-motion`, `@dnd-kit/*`, `@tanstack/*`, `zustand`, etc.). Do NOT re-add them via `bun add` without confirming they're actually used. The removed shadcn ui components (`chart`, `sonner`, `carousel`, `calendar`, `form`, `resizable`, `input-otp`, `command`, `drawer`) were also deleted — if you need one, re-add it via `bunx shadcn@latest add <component>` (which will also re-add its dependencies).
- **Unjustified major version bumps** — `recharts` was bumped from `^2.15.4` to `^3.9.1` without justification, causing a build-breaking type error in `chart.tsx` (recharts 3.x changed the `payload` prop type). It was reverted. Never bump a major version without reading the changelog and verifying the consuming code still compiles.

---

## Success Metrics

You are successful when:

- `bun run lint`, `bun run typecheck`, and `bun run test` are all clean.
- `bun run build` succeeds (4 routes: `/`, `/_not-found`, `/api`, `/api/health`).
- The homepage renders at http://localhost:3000 with no console errors.
- All 6 sections are present in the accessibility tree with meaningful labels.
- The form submits, persists a `Lead` row, and shows the "Thank you." state.
- The schedule accordion expands/collapses with keyboard (Tab + Enter/Space).
- Lighthouse Performance ≥ 85, Accessibility = 100.
- CI passes on push and PR (`.github/workflows/ci.yml` runs lint + typecheck + test + build).
