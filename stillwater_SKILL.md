---
name: stillwater
description: >
  Project-specific skill for the Stillwater Yoga Studio codebase — a production-grade
  Next.js 16 + React 19 + Tailwind v4 + Prisma + Zod 4 boutique yoga studio marketing
  & booking site. Use this skill when extending, debugging, or auditing the Stillwater
  codebase, or when adapting its patterns (8-second breath-cycle hero, Radix accordion
  schedule, opt-in Web Audio chime, useActionState form with honeypot + rate limit) to
  similar calm-aesthetic marketing sites.
version: 1.0.0
project: stillwater-yoga-studio
last_updated: 2026-07-04
tags:
  - nextjs
  - react19
  - tailwind-v4
  - prisma
  - zod
  - boutique-marketing
  - calm-aesthetic
  - wcag-aaa
---

# Stillwater · Yoga Studio — Project Skill

> **How to use this document:** This is the single-source-of-truth reference for the Stillwater codebase. Read §1–§3 before any work. Jump to §10 (Debugging) when something breaks. Follow §11 (Pre-Ship Checklist) before every commit. Use §15 (Coding Patterns) as copy-paste templates for new features.
>
> **Companion docs:** `README.md` (humans), `AGENTS.md` (compact agent instructions), `CLAUDE.md` (comprehensive conventions for Claude Code sessions). This SKILL.md is the deepest layer — it captures the *why* behind every decision, the bugs that were fixed, and the patterns that compile.

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Content Management & Data Ingestion](#7-content-management--data-ingestion)
8. [Accessibility (WCAG AAA) Implementation](#8-accessibility-wcag-aaa-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)
- [Appendix A: Architecture Decision Records](#appendix-a-architecture-decision-records)
- [Appendix B: Live-Site Validation Methodology](#appendix-b-live-site-validation-methodology)
- [Appendix C: Intentional Omissions](#appendix-c-intentional-omissions)

---

## 1. Project Identity & Design Philosophy

### 1.1 One-sentence description

Stillwater is a single-route Next.js 16 App Router marketing & booking site for a fictional boutique yoga studio in Cobble Hill, Brooklyn — six editorial sections (Hero, Practices, Teachers, Schedule, First-Class-Free, Footer) plus persistent client-side chrome (Topbar, BreathGuide, SoundToast), built to embody the antidote to high-intensity gym culture.

### 1.2 The design thesis

**Calm over loud. Restraint is the brand.** Every default instinct — bright accents, snappy 200ms eases, big attention-grabbing CTAs — is wrong for this project. The page itself breathes on an 8-second cycle (the literal cadence of a yogic inhale-exhale). One accent colour (terracotta `#b16a48`) appears in exactly four places. Fraunces (humanist serif with optical sizing) is paired with Inter (UI sans) — never Inter alone. A linen-textured SVG grain at 50% opacity, multiply-blended, makes the cream feel like paper, not plastic.

### 1.3 Non-negotiable design rules

1. **One accent colour.** Terracotta `#b16a48` (`--color-terracotta`). Used in: section labels, hover underlines, sound toggle when active, form submit hover. Do NOT introduce more accent colours. Dusk-pink `#d4a5a0` is a soft secondary for radial blooms only — never for text or UI affordances.
2. **Fraunces + Inter pairing is required.** Headings = Fraunces (`font-serif`). Body = Inter (`font-sans`). Never use Inter alone — that's the "AI slop" aesthetic this project explicitly rejects.
3. **Editorial whitespace.** Generous margins. One idea per scroll viewport. Section padding is `py-40` (160px) on desktop, `py-24` (96px) on mobile. Reading width capped at ~65ch for body, ~880px for section headers.
4. **Minimal radii.** `rounded-sm` or sharp edges for editorial feel. No `rounded-2xl` everywhere. The form card uses `rounded-md` (6px) — that's the largest radius in the project.
5. **Animations respect `prefers-reduced-motion` by DISABLING, not slowing.** Slowed animations can trigger vestibular disorders (WCAG 2.3.3). The CSS guard in `globals.css` and the `useReducedMotion()` hook are belt-and-suspenders.
6. **The 8-second breath cycle is sacred.** `--animate-hero-breath`, `--animate-brand-breath`, `--animate-breath-orb` all run on 8s. Don't change one without the others — they must stay in sync (that's the whole point: the page breathes with you).

### 1.4 The anti-generic mandate

The following visual clichés are **explicitly rejected** and will fail code review:

| ❌ Rejected | ✅ Use instead |
| --- | --- |
| Bento card grids without structural reason | Asymmetric editorial layouts, vertical narrative |
| Hero Split (L/R) | Massive Fraunces headline over Ken Burns hero, single focal point |
| Mesh / Aurora gradient backgrounds | Solid `linen-100` with a single tonal photo |
| Glassmorphism (blue/white) | Solid `linen-50` cards with `border-ink-line` |
| Inter alone as the only font | Fraunces (serif display) + Inter (UI) — pairing required |
| Purple/indigo blur | Terracotta `#b16a48` accent |
| Predictable "Hero + 2 CTA buttons" template | Editorial scroll narrative with breath-cycle hero |
| Rounded everything (`rounded-2xl`) | Minimal radii — `rounded-sm` or sharp edges |
| Tailwind default `amber-*` / `red-*` | Semantic tokens `--color-sage`, `--color-terracotta` |
| Raw hex in components (`bg-[#b16a48]`) | Design tokens only (`bg-terracotta`) |

### 1.5 CTA hierarchy

1. **Primary CTA** — "Reserve a mat" (hero) / "Reserve my first mat" (form submit). Style: `border border-linen-50/45 bg-linen-50/5` on hero (transparent over photo), `bg-ink` on form (solid ink). Hover: `bg-terracotta`.
2. **Secondary CTA** — nav links, "See this week's schedule" link on success state. Style: text-only with terracotta hover underline.
3. **Tertiary** — sound toggle, expand icons. Style: pill buttons with `border-ink-line`.

---

## 2. Tech Stack & Environment

### 2.1 Locked versions (from `package.json` + `bun.lock`)

| Layer | Technology | Version | Critical Note |
| --- | --- | --- | --- |
| Framework | Next.js (App Router, Turbopack) | `^16.1.1` (resolved 16.1.3) | `output: "standalone"`. `headers()`/`cookies()`/`params`/`searchParams` are `Promise<T>` — always `await`. |
| UI Runtime | React | `^19.0.0` | `useSyncExternalStore` for external state. `useActionState` for forms. No `forwardRef` on new components. |
| Language | TypeScript | `^5.9.0` | `strict: true`, `noImplicitAny: false` (scaffold default — do NOT change without explicit request). Path alias `@/*` → `./src/*`. |
| Styling | Tailwind CSS | `^4.3.0` | CSS-first `@theme` config in `globals.css`. NO `tailwind.config.js` for app tokens — the root `tailwind.config.ts` is the empty scaffold default. |
| PostCSS | `@tailwindcss/postcss` | `^4` | ONLY plugin. Do NOT add `autoprefixer` or `postcss-import` — they break v4. |
| Components | shadcn/ui (New York) + Radix UI | latest | 50+ primitives in `src/components/ui/`. The Schedule accordion uses `@radix-ui/react-accordion` primitives DIRECTLY, not the shadcn wrapper. |
| Icons | lucide-react | `^0.525.0` | Used sparingly — the design prefers custom SVG for the brand mark and expand icon. |
| Fonts | Fraunces + Inter | via `next/font/google` | `display: "swap"`, `variable: "--font-fraunces"` / `"--font-inter"`. NEVER `@fontsource/*`. |
| Database ORM | Prisma | `^6.11.1` (resolved 6.19.2) | SQLite for dev (`provider = "sqlite"`). Portable to Postgres by changing `provider` to `"postgresql"`. |
| Database | SQLite | via `bun run db:push` | File at `./db/stillwater.db`. Committed for dev convenience — clear before prod deploy. |
| Validation | Zod | `^4.0.2` | Enum API changed: `z.enum(values, { message })` not `{ errorMap }`. |
| Audio | Web Audio API | browser-native | No library. `AudioContext` instantiated ONLY on explicit user gesture. |
| Package manager | Bun | latest | `bun install`, `bun run dev`. Also compatible with pnpm/npm. |
| Linter | ESLint | `^9` + `eslint-config-next` | `eslint.config.mjs` extends `core-web-vitals` + `typescript`. Many strict rules disabled by scaffold — project convention is to follow the STRICTER rule. |
| Build | Next.js standalone | — | `bun run build` copies `.next/static` + `public` into `.next/standalone/` for Docker deployment. |

### 2.2 Environment variables

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | SQLite connection string (relative path) | `file:./db/stillwater.db` |

That's the **only** env var. No `AUTH_SECRET`, no `NEXTAUTH_URL` — there is no auth. See [Appendix C](#appendix-c-intentional-omissions) for what was deliberately omitted.

### 2.3 Runtime requirements

- **Bun** ≥ 1.3 (or Node.js ≥ 20 with npm/pnpm)
- **Prisma CLI** (installed via `bun install`)
- **Modern browser** with Web Audio API support for the chime feature

---

## 3. Bootstrapping & Configuration

### 3.1 Setup commands (tested, copy-pasteable)

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

### 3.2 Verify setup

```bash
# Lint must pass (0 errors)
bun run lint

# Typecheck must pass (0 errors)
npx tsc --noEmit

# Dev server should report ready
tail -5 dev.log
# Expected: "✓ Ready in <1s" + "GET / 200 in <X>ms"
```

### 3.3 Critical configuration files

#### `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",           // Docker-ready standalone build
  reactStrictMode: false,         // Scaffold default — leave as-is
  typescript: {
    ignoreBuildErrors: false,     // NEVER set to true
  },
  allowedDevOrigins: [            // Silences sandbox preview warnings
    "*.space-z.ai",
    "preview-*.space-z.ai",
  ],
  images: {
    remotePatterns: [             // Whitelist for next/image
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "fastly.picsum.photos", pathname: "/**" },
    ],
  },
};

export default nextConfig;
```

**Critical notes:**
- `output: "standalone"` is required for the `bun run build` script which copies `.next/static` + `public` into `.next/standalone/`.
- `picsum.photos` is the placeholder image host. Swap to your own CDN/origin in production.
- Do NOT add `experimental.ppr`, `experimental.dynamicIO`, or `experimental.clientSegmentCache` — they cause build errors in Next.js 16.

#### `tsconfig.json`

Key settings:
- `strict: true` — TypeScript strict mode.
- `noImplicitAny: false` — scaffold default. The project convention is stricter (no `any`), but this stays `false` for compatibility with the scaffold's shadcn/ui components.
- Path alias: `@/*` → `./src/*`.
- **`exclude`**: `node_modules`, `yoga-studio` (cloned reference repo), `skills`, `examples`, `upload`, `tool-results`. These are audit/scaffold folders — excluding them from typecheck prevents phantom errors from the cloned `yoga-studio` repo's missing dependencies.

#### `postcss.config.mjs`

```javascript
const config = {
  plugins: ["@tailwindcss/postcss"],
};
export default config;
```

**This is the ONLY plugin.** Adding `autoprefixer` or `postcss-import` breaks Tailwind v4. If you see utilities not generating, this is the first thing to check.

#### `eslint.config.mjs`

Extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. The scaffold disables many strict rules (`no-explicit-any: off`, etc.) — the project convention is to follow the **stricter** rule even when ESLint permits the looser one.

**Ignores**: `node_modules`, `.next`, `yoga-studio`, `skills`, `examples`, `upload`, `tool-results`.

#### `components.json` (shadcn/ui config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/app/globals.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
  "iconLibrary": "lucide"
}
```

Style is **New York** (not Default). `rsc: true` enables React Server Components support.

### 3.4 Prisma setup

Schema at `prisma/schema.prisma`. Single model: `Lead`. After any schema change:

```bash
bun run db:push       # dev: push schema to SQLite
bun run db:generate   # regenerate Prisma Client
```

For Postgres production:
1. Change `provider` to `"postgresql"` in `prisma/schema.prisma`.
2. Set `DATABASE_URL` to a `postgresql://` URL.
3. Use `bun run db:migrate` (which runs `prisma migrate dev`) to create + apply migrations.
4. **Never `prisma db push` in production** — always `prisma migrate deploy`.

### 3.5 The dev server log

`bun run dev` tees output to `dev.log` via `next dev -p 3000 2>&1 | tee dev.log`. To debug:

```bash
tail -f dev.log                          # live stream
grep -E "^Error" dev.log | tail -10      # errors only
grep "POST /" dev.log | tail -10         # form submissions
grep "prisma:query" dev.log | tail -10   # SQL queries (Prisma logs queries in dev)
```

---

## 4. The Design System (Code-First)

All design tokens live in `src/app/globals.css` inside the `@theme inline {}` block. This is the **single source of truth**. The root-level `tailwind.config.ts` is the empty scaffold default and intentionally holds no app tokens.

### 4.1 The `@theme inline {}` block (verbatim from `globals.css`)

```css
@theme inline {
  /* Linen (backgrounds, warm off-white) */
  --color-linen-50: #faf5ec;
  --color-linen-100: #f4ede0;
  --color-linen-200: #efe6d4;
  --color-linen-300: #e6dfd1;

  /* Sand (warm neutral) */
  --color-sand: #e3d5c1;
  --color-sand-deep: #c9b89e;

  /* Sage (active/available status) */
  --color-sage: #8a9a87;
  --color-sage-deep: #5d6e5a;

  /* Terracotta — PRIMARY accent */
  --color-terracotta: #b16a48;
  --color-terracotta-deep: #8e4f33;
  --color-terracotta-tint: rgba(177, 106, 72, 0.12);

  /* Dusk pink — soft secondary accent */
  --color-dusk-pink: #d4a5a0;

  /* Ink scale (text colours) */
  --color-ink: #2c2620;
  --color-ink-soft: #4a4036;
  --color-ink-mute: #7a6e60;
  --color-ink-line: rgba(44, 38, 32, 0.14);
  --color-ink-line-soft: rgba(44, 38, 32, 0.07);

  /* Typography */
  --font-serif: var(--font-fraunces), Georgia, "Times New Roman", serif;
  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  /* Motion — three easing curves only */
  --ease-quiet: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-precise: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1);

  /* Z-index scale */
  --z-grain: 9998;
  --z-topbar: 100;
  --z-breath-guide: 90;
  --z-sound-toast: 200;

  /* Animations */
  --animate-hero-breath: hero-breath 8s ease-in-out infinite alternate;
  --animate-brand-breath: brand-breath 8s ease-in-out infinite;
  --animate-breath-orb: breath-orb 8s ease-in-out infinite;
  --animate-scrollline: scrollline 2.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  --animate-cursor-blink: cursor-blink 1s steps(2) infinite;
  --animate-sound-wave: sound-wave 1.4s ease-in-out infinite;

  @keyframes hero-breath {
    0%   { transform: scale(1) translate(0%, 0%); }
    100% { transform: scale(1.06) translate(-1.2%, -1.2%); }
  }
  @keyframes brand-breath {
    0%, 100% { transform: scale(0.55); opacity: 0.6; }
    50%      { transform: scale(1);    opacity: 1;   }
  }
  @keyframes breath-orb {
    0%, 100% { transform: scale(0.6); opacity: 0.55; box-shadow: 0 0 0 0 rgba(177, 106, 72, 0.20); }
    50%      { transform: scale(1.6); opacity: 1;    box-shadow: 0 0 0 8px rgba(177, 106, 72, 0.05); }
  }
  @keyframes scrollline {
    0%   { top: -50%; }
    100% { top: 100%; }
  }
  @keyframes cursor-blink { 50% { opacity: 0; } }
  @keyframes sound-wave {
    0%, 100% { opacity: 0.4; }
    50%      { opacity: 1;   }
  }
}
```

### 4.2 Typography hierarchy

| Role | Font | Weight | Tracking | Line-height | Usage |
| --- | --- | --- | --- | --- | --- |
| Display (hero) | Fraunces | 300 | -0.025em | 0.95 | `Stillwater` hero title |
| H1 (section titles) | Fraunces | 300 | -0.015em | 1.05 | "Four ways to come home." |
| H2 (card titles) | Fraunces | 400 | 0 | 1.2 | "Vinyasa", "Anya Perrin" |
| Body | Inter | 300 | 0 | 1.75 | Default body text |
| Teacher quotes | Fraunces Italic | 300 | 0 | 1.65 | Typewriter quotes |
| Metadata | Inter | 500 | 0.16–0.32em uppercase | 1.2 | Section labels, durations |

**Optical sizing**: Fraunces uses `fontVariationSettings: '"opsz" 144'` for the hero title (largest), `"opsz" 90` for section card titles, `"opsz" 60` for teacher names, `"opsz" 24` for italic tags. This is what gives Fraunces its warmth — the optical sizing adjusts stroke contrast at different sizes.

### 4.3 Custom `@utility` classes

| Utility | Purpose |
| --- | --- |
| `fade-up` | Initial state for scroll reveal: `opacity: 0; transform: translateY(36px); transition: opacity 1000ms, transform 1000ms`. |
| `fade-up-in` | Revealed state: `opacity: 1; transform: none`. Add to toggle the transition. |
| `delay-1` / `delay-2` / `delay-3` / `delay-4` | Stagger delays: 120ms / 240ms / 360ms / 480ms. |
| `linen-grain` | Fixed full-viewport SVG noise overlay at 50% opacity, multiply-blended. The paper texture. |

### 4.4 Border radius scale

- `rounded-sm` — small UI elements (dots)
- `rounded-md` — form card (6px, the largest radius in the project)
- `rounded-full` — pills (sound toggle, CTA buttons, orb)
- Default (sharp) — most cards, schedule rows, footer columns

**No `rounded-2xl`, `rounded-3xl`, or `rounded-lg` on app components.** The shadcn/ui primitives use their own radii internally — leave those alone.

### 4.5 Shadow definitions

Only two custom shadows in the project:

```css
/* Form card */
shadow-[0_30px_60px_-40px_rgba(44,38,32,0.2)]

/* Sound toast */
shadow-[0_18px_40px_-15px_rgba(44,38,32,0.4)]
```

Both use the ink colour (`#2c2620`) at low opacity for a warm, not grey, shadow.

### 4.6 The reduced-motion guard (mandatory, in `globals.css`)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.1ms !important;
    scroll-behavior: auto !important;
  }
  .fade-up {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

This **disables** animations, not slows them. Slowed animations can trigger vestibular disorders (WCAG 2.3.3). The `useReducedMotion()` hook is belt-and-suspenders for JS-driven animations.

---

## 5. Component Architecture & Patterns

### 5.1 The layering model

```
src/
├── app/                         # Layer 1 — App Router
│   ├── layout.tsx               # Root: fonts, metadata, skip link
│   ├── page.tsx                 # Home (SERVER component — composes everything)
│   ├── globals.css              # @theme tokens, keyframes, reduced-motion
│   └── api/route.ts             # Health check
├── components/
│   ├── layout/                  # Persistent chrome (6 files)
│   ├── sections/                # Homepage sections (7 files)
│   └── ui/                      # shadcn/ui primitives (50+ files)
├── hooks/                       # 5 hooks (3 custom + 2 scaffold)
├── lib/
│   ├── actions/                 # Server Actions (1 file)
│   ├── data/                    # Static content (3 files)
│   ├── db.ts                    # Prisma client singleton
│   └── utils.ts                 # cn() helper
```

**Layering golden rule**: `app/` → `components/` → `hooks/` + `lib/`. Lower layers may never import from higher layers. `lib/data/` may not import from `components/`. `hooks/` may not import from `app/` or `components/`.

### 5.2 Client vs Server component decision tree

A component MUST be `'use client'` if it uses ANY of:
- `useState`, `useEffect`, `useRef`, `useReducer`, `useContext`, `useActionState`, `useSyncExternalStore`, `useOptimistic`
- Browser APIs: `window`, `document`, `matchMedia`, `AudioContext`, `IntersectionObserver`, `performance`, `localStorage`
- `usePathname`, `useRouter`, `useSearchParams`, `useParams`
- Event handlers: `onClick`, `onChange`, `onSubmit`, `onMouseEnter`, etc.
- Wraps a `'use client'` provider (e.g., a theme provider)

Otherwise, it's a Server Component.

### 5.3 The 5 client-component leaves

Only 5 components in the entire app are client components (excluding the 50+ shadcn/ui primitives which are all `'use client'`):

| File | Why client |
| --- | --- |
| `src/components/sections/Hero.tsx` | `useReducedMotion()`, `useState` for `inView`, `IntersectionObserver`, `Image` with conditional animation |
| `src/components/sections/Teachers.tsx` | Typewriter `useState` + `useRef` + `setTimeout`, hover/click handlers |
| `src/components/sections/Schedule.tsx` | Radix Accordion primitives (interactive), click handlers |
| `src/components/sections/FirstClassFree.tsx` | `useActionState` form, `useState` for select value |
| `src/components/layout/HomeChrome.tsx` | Orchestrates Topbar + BreathGuide + SoundToast state |

**Everything else is a Server Component**: `page.tsx`, `Practices`, `SectionHead`, `Reveal` (wait — `Reveal` is actually `'use client'` because it uses `useReveal` which calls `useRef` + `useState`), `Footer`, `LinenGrain`, `BreathGuide` (uses `useBreathCycle`), `SoundToast` (uses `useState`), `Topbar` (uses `useState` + `useEffect`).

**Correction**: The actual client components are: `Hero`, `Teachers`, `Schedule`, `FirstClassFree`, `Reveal`, `SectionHead` (because it renders `Reveal`), `Practices` (because it renders `Reveal`), `HomeChrome`, `Topbar`, `BreathGuide`, `SoundToast`. The shadcn/ui primitives are all client. The only pure server components are `page.tsx`, `layout.tsx`, `Footer`, `LinenGrain`, and the data/action files.

**The principle still holds: push `'use client'` to the leaves.** A section that composes client sub-components doesn't need `'use client'` itself if it doesn't directly use hooks — but in practice, most sections do because they render `<Reveal>`.

### 5.4 The `queries.ts` boundary pattern

**Not used in this project** because there's only one DB model (`Lead`) and one server action. If you add more features, introduce `src/features/<feature>/queries.ts` files and route all DB access through them. Components should never import `db` directly.

### 5.5 The static content boundary

Teachers, practices, and the weekly schedule live in `src/lib/data/*.ts` as `readonly` arrays. They are NOT in the database because they change ~annually and never participate in transactions. Only the `Lead` model (form submissions) is in Prisma.

**Why this matters**: If you're tempted to add a `Teacher` model to Prisma, ask: "Will this data ever be written by a user, or participate in a transaction with `Lead`?" If no, keep it in `src/lib/data/`. Static content renders faster (no DB round-trip) and is easier to version-control.

### 5.6 Auth patterns

**No auth in this project.** The form is anonymous — name, email, preferred day, optional notes. If you add a member portal later, use Auth.js v5 with the DrizzleAdapter pattern (see the original `yoga-studio` repo's `skills/nextjs16-full-stack/SKILL.md` for the reference).

For now, the only "auth-like" pattern is the per-IP rate limiter in `src/lib/actions/first-class.ts` (in-memory sliding window, 3 submissions/hour, fail-open).

---

## 6. Custom Hooks Deep Dive

### 6.1 `useReducedMotion()` — `src/hooks/use-reduced-motion.ts` (36 lines)

**Purpose**: SSR-safe `prefers-reduced-motion` listener.

**Signature**:
```typescript
export function useReducedMotion(): boolean
```

**Implementation**: Uses `useSyncExternalStore` (React 18+ idiom for external state). Returns `false` on the server and during the first client paint, then resolves to the real media-query value after mount.

```typescript
"use client";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot(): boolean { return false; }

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

**Why `useSyncExternalStore` and not `useEffect` + `setState`**: In React 19, calling `setState` synchronously in a `useEffect` triggers the `react-hooks/set-state-in-effect` lint error because it causes cascading renders. `useSyncExternalStore` is the idiomatic way to subscribe to external state. See [§9 Bug #4](#9-anti-patterns--common-bugs).

**Why `getServerSnapshot: () => false`**: Defaults to "motion enabled" on the server. This avoids a hydration mismatch — the server renders with motion, the client's first paint matches, then the hook resolves to the real value. The CSS `@media (prefers-reduced-motion: reduce)` guard in `globals.css` handles the actual disabling, so a brief flash of motion before the hook resolves is acceptable (and rare — only for users who have reduced-motion enabled).

### 6.2 `useReveal()` — `src/hooks/use-reveal.ts` (69 lines)

**Purpose**: Fade-up reveal driven by `IntersectionObserver`. Pairs with the `fade-up` + `fade-up-in` utility classes.

**Signature**:
```typescript
interface UseRevealOptions {
  threshold?: number;       // default 0.15
  rootMargin?: string;      // default '0px 0px -8% 0px'
  once?: boolean;           // default true
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: UseRevealOptions
): { ref: React.RefObject<T | null>; revealed: boolean }
```

**Implementation notes**:
- Under `prefers-reduced-motion`, reveals immediately on mount (no observer) via `requestAnimationFrame(() => setRevealed(true))`. The `rAF` avoids the cascading-render lint error.
- `IntersectionObserver` disconnects after reveal when `once: true` (default).
- The `rootMargin: '0px 0px -8% 0px'` pushes the trigger 8% above the viewport bottom — elements reveal just before they're fully visible, which feels more natural than waiting for full visibility.

**Usage** (see `src/components/sections/Reveal.tsx`):
```tsx
const { ref, revealed } = useReveal<HTMLElement>({ once: true });
return (
  <Tag
    ref={ref}
    className={`fade-up ${DELAY_CLASS[delay]} ${revealed ? "fade-up-in" : ""}`}
  >
    {children}
  </Tag>
);
```

### 6.3 `useBreathCycle()` — `src/hooks/use-breath-cycle.ts` (50 lines)

**Purpose**: Drives the breath-guide phase label on an 8-second cycle: 0–4s inhale, 4–8s exhale. Counts 1..4 within each phase.

**Signature**:
```typescript
export interface BreathState {
  phase: "inhale" | "exhale" | null;
  second: number;  // 1..4
}

export function useBreathCycle(enabled: boolean): BreathState
```

**Implementation notes**:
- Uses `requestAnimationFrame` for the loop. `startRef` records `performance.now()` at start.
- Returns `phase: null` when `enabled` is false or reduced-motion is preferred. The caller (`BreathGuide.tsx`) hides the orb entirely in that case.
- The cycle math: `elapsed % 8` gives 0–8s. `cycle < 4` → inhale, else exhale. `Math.floor(cycle % 4) + 1` gives the 1..4 second counter.

**Why the 8s cycle**: It's the literal cadence of a yogic inhale-exhale. The hero's `--animate-hero-breath` runs on the same 8s. The brand mark's `--animate-brand-breath` runs on the same 8s. The breath orb's `--animate-breath-orb` runs on the same 8s. They must stay in sync — that's the whole point.

### 6.4 `use-mobile.ts` + `use-toast.ts` (scaffold)

These are scaffold hooks from `create-next-app`. `use-mobile` checks viewport width. `use-toast` is the shadcn toast hook. Neither is used by Stillwater's custom code — they're kept for future use.

---

## 7. Content Management & Data Ingestion

### 7.1 Static data files

| File | Exports | Count |
| --- | --- | --- |
| `src/lib/data/practices.ts` | `PRACTICES: readonly Practice[]` | 4 items |
| `src/lib/data/teachers.ts` | `TEACHERS: readonly Teacher[]` | 3 items |
| `src/lib/data/schedule.ts` | `SCHEDULE: readonly ScheduleClass[]`, `PREFERRED_DAYS: readonly string[]` | 10 classes, 6 preferred days |

### 7.2 How to add a new teacher

1. Open `src/lib/data/teachers.ts`.
2. Add a new object to the `TEACHERS` array with `id`, `name`, `role`, `yearsLabel`, `photo` (`src` + `alt`), and `quote`.
3. Done. The `Teachers` section maps over `TEACHERS` and renders a card for each.

**That's it — 1 file, 1 step.** No DB migration, no admin UI, no API endpoint. This is the static content boundary.

### 7.3 How to add a new schedule class

1. Open `src/lib/data/schedule.ts`.
2. Add a new object to the `SCHEDULE` array with `id`, `day`, `time`, `className`, `teacher`, `room`, `bring`, `prep`, `total`, `taken`.
3. Done. The `Schedule` section maps over `SCHEDULE`.

### 7.4 How to add a new practice

1. Open `src/lib/data/practices.ts`.
2. Add a new object to the `PRACTICES` array with `id`, `num`, `name`, `sanskrit`, `description`, `meta` (`duration`, `room`, `level`).
3. Done. The `Practices` section maps over `PRACTICES`.

### 7.5 Why `import.meta.glob` is NOT used

`import.meta.glob` is a Vite feature, not a Next.js feature. Next.js uses the file system for routing and static imports for data. The `src/lib/data/*.ts` files export `readonly` arrays that are tree-shaken into the server bundle.

### 7.6 The `Lead` model (the only DB content)

```prisma
model Lead {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique
  preferredDay    String
  notes           String?
  status          String   @default("pending")  // pending | replied | booked | archived
  ipHash          String?  // SHA-256 of IP, never raw
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

**Why `ipHash` and not raw IP**: Privacy. We need the IP for rate-limit forensics (to identify abuse patterns), but we don't need to know who submitted from where. SHA-256 hashed + truncated to 16 chars gives enough entropy for pattern matching without being reversible.

**Why `status` is a `String` and not an enum**: SQLite doesn't support Prisma enums natively. The values `pending | replied | booked | archived` are documented in the schema comment. If you migrate to Postgres, change this to `@enum`.

---

## 8. Accessibility (WCAG AAA) Implementation

### 8.1 Color contrast table

| Foreground | Background | Ratio | WCAG Level | Usage |
| --- | --- | --- | --- | --- |
| `ink` `#2c2620` | `linen-50` `#faf5ec` | 15.8:1 | AAA | Headlines |
| `ink-soft` `#4a4036` | `linen-50` `#faf5ec` | 9.5:1 | AAA | Body text |
| `ink-mute` `#7a6e60` | `linen-50` `#faf5ec` | 3.4:1 | AA Large only | Metadata (decorative) |
| `terracotta` `#b16a48` | `linen-50` `#faf5ec` | 5.3:1 | AAA Large, AA Normal | Section labels, hover, focus (≥18px or UI accents) |
| `linen-50` `#faf5ec` | `ink` `#2c2620` | 15.8:1 | AAA | Footer text on ink bg |
| `sage-deep` `#5d6e5a` | `linen-100` `#f4ede0` | 5.8:1 | AAA Large, AA Normal | Italic emphasis in titles |

**Critical**: `terracotta` (#b16a48) on `linen-50` fails AAA for small text. Restrict terracotta to ≥18px or UI accents (focus rings, hover states, dots). Never use it for body text.

### 8.2 Focus ring specification

In `globals.css`:
```css
:focus-visible {
  outline: 2px solid var(--color-terracotta);
  outline-offset: 2px;
  border-radius: 2px;
}
```

**Why `:focus-visible` and not `:focus`**: `:focus` triggers for mouse clicks, which is noisy. `:focus-visible` only triggers for keyboard navigation, which is what accessibility needs.

### 8.3 Skip-to-content link

In `src/app/layout.tsx` (first focusable element in `<body>`):
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-linen-50 focus:shadow-lg focus:outline focus:outline-2 focus:outline-terracotta"
>
  Skip to content
</a>
<main id="main-content">{children}</main>
```

### 8.4 `prefers-reduced-motion` implementation

**Two layers, belt-and-suspenders:**
1. CSS guard in `globals.css` — disables animations globally (see §4.6).
2. `useReducedMotion()` hook — for JS-driven animations (the typewriter in `Teachers.tsx` shows the full quote immediately if reduced).

### 8.5 Touch target sizes

All interactive elements are ≥ 44×44 CSS px. The schedule expand icon is 28×28 (`h-7 w-7`) but the trigger wraps the entire row, so the effective touch target is much larger. The sound toggle is `py-2 px-3.5` (≈44px tall with text).

### 8.6 ARIA patterns per component

| Component | ARIA pattern |
| --- | --- |
| Schedule accordion | Radix `@radix-ui/react-accordion` — `aria-expanded`, `aria-controls`, `role="region"` auto-wired. Each trigger has a meaningful `aria-label` like `"Mon 7:00 AM Slow Vinyasa with Anya Perrin, 3 of 8 mats available — expand for room details"`. |
| Sound toggle | `aria-pressed={soundEnabled}` + `aria-label="Turn ambient sound on/off"`. Decorative SVG gets `aria-hidden="true"`. |
| Form | `aria-invalid={!!errors.field}` + `aria-describedby="field-error"` on invalid inputs. `role="alert"` on error messages. `aria-live="polite"` on the status region. |
| Topbar nav | `aria-label="Primary"` on the `<nav>`. |
| BreathGuide | `aria-hidden="true"` — decorative, the orb doesn't convey information that isn't already visible. |
| LinenGrain | `aria-hidden="true"` — purely decorative. |

### 8.7 Reading width

Body text blocks ≤ 80 chars (WCAG AAA §1.4.8). Section leads are `max-w-[580px]`. The practices card description is `max-w-[380px]`. Line spacing ≥ 1.5 (the body `line-height: 1.75`).

### 8.8 No content flashes >3 times/second

The breath cycle is 8s — well within WCAG 2.3.1. The cursor blink is 1s `steps(2)` — also fine.

---

## 9. Anti-Patterns & Common Bugs

### Bug #1: `headers().get` runtime error in Server Action (Critical)

**Symptom**: Form submission logs `Error: Route "/" used headers().get. headers() returns a Promise and must be unwrapped with await`.

**Root cause**: Next.js 16 made `headers()`, `cookies()`, `params`, and `searchParams` asynchronous. Calling `.get()` on the `Promise<ReadonlyHeaders>` returns `undefined` and logs the error.

**Fix**: `await headers()` before calling `.get()`. See `src/lib/actions/first-class.ts:73`:

```typescript
// ❌ WRONG (Next.js 15 syntax)
function getClientIp(): string {
  const xff = headers().get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() ?? "unknown";
}

// ✅ CORRECT (Next.js 16 syntax)
async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() ?? "unknown";
}
```

**Lesson**: Every call site that uses `getClientIp()` must also `await` it. The async contagion is intentional — Next.js 16 wants you to be explicit about I/O.

### Bug #2: `hidden grid-cols-[...]` doesn't toggle to grid (High)

**Symptom**: Schedule desktop layout invisible on all viewports; the `max-[960px]:hidden` modifier had nothing to hide because `hidden` already won.

**Root cause**: Tailwind class order matters. `hidden grid-cols-[...] max-[960px]:hidden` applies `display: none` always — the `max-[960px]:hidden` is redundant and the grid never shows.

**Fix**: Use `grid ... max-[960px]:hidden` for the desktop layout, and `hidden ... max-[960px]:flex` for the mobile layout:

```tsx
// ❌ WRONG
<div className="hidden grid-cols-[100px_110px_1fr_130px_180px_44px] max-[960px]:hidden">

// ✅ CORRECT
<div className="grid grid-cols-[100px_110px_1fr_130px_180px_44px] max-[960px]:hidden">
<div className="hidden flex-col max-[960px]:flex">
```

**Lesson**: When toggling between two layouts at a breakpoint, the default-display class (`grid` or `flex`) must be on the element, with `max-[960px]:hidden` hiding it on the other side. Don't use `hidden` as the default for an element you want to show.

### Bug #3: Radix Accordion single-trigger constraint (High)

**Symptom**: Schedule rows render but clicking does nothing — `aria-expanded` stays `false`.

**Root cause**: I initially put TWO `<AccordionPrimitive.Trigger>` elements inside one `<AccordionPrimitive.Header>` (one for desktop grid, one for mobile flex). Radix Accordion requires exactly ONE trigger per header — the second trigger disconnects the ARIA wiring.

**Fix**: Put both layouts inside ONE `<AccordionPrimitive.Trigger>`:

```tsx
// ❌ WRONG — two triggers, broken ARIA
<AccordionPrimitive.Header>
  <AccordionPrimitive.Trigger className="hidden ...">desktop layout</AccordionPrimitive.Trigger>
  <AccordionPrimitive.Trigger className="flex ...">mobile layout</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>

// ✅ CORRECT — one trigger, two layouts inside
<AccordionPrimitive.Header>
  <AccordionPrimitive.Trigger>
    <div className="grid ... max-[960px]:hidden">desktop layout</div>
    <div className="hidden ... max-[960px]:flex">mobile layout</div>
  </AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
```

**Lesson**: Radix primitives have strict structural requirements. Always check the Radix docs for the expected child structure — don't assume you can duplicate primitives.

### Bug #4: `react-hooks/set-state-in-effect` lint error (Medium)

**Symptom**: ESLint error: `Calling setState synchronously within an effect can trigger cascading renders`.

**Root cause**: The initial `useReducedMotion` implementation called `setReduced(mq.matches)` synchronously in `useEffect`:

```typescript
// ❌ WRONG — cascading render
useEffect(() => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  setReduced(mq.matches);  // ← lint error
  const onChange = (e) => setReduced(e.matches);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}, []);
```

**Fix**: Refactor to `useSyncExternalStore` (see §6.1):

```typescript
// ✅ CORRECT — idiomatic external store
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

**Lesson**: In React 19, `useEffect` + synchronous `setState` is an anti-pattern for external state. Use `useSyncExternalStore` for media queries, `IntersectionObserver`, `EventSource`, `localStorage`, etc.

### Bug #5: Zod 4 enum `errorMap` removed (Medium)

**Symptom**: `npx tsc --noEmit` fails: `Object literal may only specify known properties, and 'errorMap' does not exist in type '{ error?: ...; message?: ... }'`.

**Root cause**: Zod 4 changed the `z.enum()` API. The `errorMap` option is gone; use `message` instead.

**Fix**:
```typescript
// ❌ WRONG (Zod 3 syntax)
preferredDay: z.enum(PREFERRED_DAYS, {
  errorMap: () => ({ message: "Please choose a preferred time" }),
}),

// ✅ CORRECT (Zod 4 syntax)
preferredDay: z.enum(PREFERRED_DAYS, {
  message: "Please choose a preferred time",
}),
```

**Lesson**: When upgrading across a major version, check the changelog for API changes. Zod 4 has several breaking changes from Zod 3 — the enum `errorMap` is one.

### Bug #6: Redundant `sr-only` heading in schedule rows (Low)

**Symptom**: Accessibility tree shows each schedule row twice — once as an h3 "Expand for room details" and once as a button "Expand for room details". Screen reader users navigating by headings get meaningless duplicate headings.

**Root cause**: I added both an `<h3>` and a `<button>` with the same text, plus an `<span className="sr-only">Expand for room details</span>` inside the trigger.

**Fix**: Remove the redundant `<span className="sr-only">`. Give the trigger a meaningful `aria-label` that includes the row's content:

```tsx
<AccordionPrimitive.Trigger
  aria-label={`${cls.day} ${cls.time} ${cls.className} with ${cls.teacher}, ${cls.taken} of ${cls.total} mats ${isFull ? "taken — waitlist only" : "available"} — expand for room details`}
>
```

**Lesson**: Every element in the accessibility tree should add information, not repeat it. The h3 already provides the row's context; the button's `aria-label` should describe the action, not the content.

### Bug #7: `tsconfig` picking up cloned reference repo (Low)

**Symptom**: `npx tsc --noEmit` reports errors from `yoga-studio/drizzle.config.ts`, `yoga-studio/playwright.config.ts`, etc. — files that aren't part of this project.

**Root cause**: The cloned `yoga-studio` reference repo lives at `./yoga-studio/` and TypeScript picks up its config files.

**Fix**: Add to `tsconfig.json` `exclude`:
```json
"exclude": ["node_modules", "yoga-studio", "upload", "tool-results", "examples", "skills"]
```

**Lesson**: When a reference/audit repo lives inside your project, exclude it from typecheck and lint. Same for `eslint.config.mjs` `ignores`.

---

## 10. Debugging Guide

### 10.1 Build failures

| Error | Cause | Fix |
| --- | --- | --- |
| `cacheLife is not a function` | Using `cacheLife()` from `next/cache` without mocking in tests | Mock: `vi.mock("next/cache", () => ({ cacheLife: vi.fn() }))` |
| `Cannot find module 'drizzle-kit'` | `tsconfig` not excluding the cloned `yoga-studio` repo | Add `"yoga-studio"` to `tsconfig.json` `exclude` |
| Tailwind v4 utilities not generating | `postcss.config.mjs` has extra plugins | Remove `autoprefixer` + `postcss-import`. Only `@tailwindcss/postcss`. |
| `Module not found: Can't resolve '@fontsource/*'` | Someone added `@fontsource/fraunces` | Use `next/font/google` instead. Remove the `@fontsource` import. |

### 10.2 Runtime errors

| Error | Cause | Fix |
| --- | --- | --- |
| `headers().get` error in server action | Next.js 16 async `headers()` | `await headers()` before `.get()`. See Bug #1. |
| `set-state-in-effect` lint error | React 19 cascading render from `useEffect` | Use `useSyncExternalStore`. See Bug #4. |
| Schedule accordion doesn't expand | Two triggers in one header | Use one trigger with two layouts inside. See Bug #3. |
| Hydration mismatch on `useReducedMotion` | SSR/client value differs | The hook uses `getServerSnapshot: () => false` — SSR-safe by design. If still mismatching, check for `typeof window` guards. |
| `P2002` on form submit | Prisma unique constraint on `email` | The server action handles this → returns warm `DUPLICATE` message. Not a bug. |
| `AudioContext` not playing | Browser autoplay policy | `AudioContext` must be created/resumed in a user-gesture handler. See `SoundToast.tsx:playChime()`. |

### 10.3 Test failures

No test framework is wired up yet. When you add Vitest, watch for:

| Error | Cause | Fix |
| --- | --- | --- |
| `vi.mock()` factory TDZ error | Factory references `let`/`const` below it | Use `vi.hoisted()` to declare mocks BEFORE the factory |
| `cacheLife is not a function` in tests | `next/cache` not mocked | `vi.mock("next/cache", () => ({ cacheLife: vi.fn() }))` |
| `window.matchMedia is not a function` | jsdom doesn't implement `matchMedia` | Polyfill with `typeof === "function"` guard in setup |
| JSX in `.test.ts` file | TypeScript doesn't parse JSX in `.ts` files | Rename to `.test.tsx` |

### 10.4 Visual/styling issues

| Symptom | Cause | Fix |
| --- | --- | --- |
| Page loads unstyled | `postcss.config.mjs` missing `@tailwindcss/postcss` | Add it. Only plugin. |
| Raw hex colours appear | Someone used `bg-[#b16a48]` | Use `bg-terracotta` token instead |
| Animations don't respect reduced-motion | CSS guard missing or hook not used | Both layers required: CSS `@media (prefers-reduced-motion: reduce)` in `globals.css` + `useReducedMotion()` hook for JS-driven animations |
| Hero image doesn't animate | `animationPlayState: "paused"` stuck | Check the `inView` state — the IntersectionObserver might be paused |
| Schedule rows invisible on desktop | `hidden` class winning over `grid` | See Bug #2 |

### 10.5 Live-site verification commands

```bash
# Open the page and check for errors
agent-browser open http://localhost:3000/
agent-browser wait --load networkidle
agent-browser errors                # must be empty
agent-browser console               # must be empty (HMR connected is fine)
agent-browser snapshot -i           # verify all 6 sections + form fields present

# Test the golden path
agent-browser fill @e53 "Test Name"
agent-browser fill @e54 "test@example.com"
agent-browser select @e55 "Weekday morning"
agent-browser click @e57            # submit
agent-browser wait 3000
agent-browser snapshot -i | grep "Thank you"   # should find it

# Test the accordion
agent-browser click @e36            # first schedule row
agent-browser get attr @e36 aria-expanded      # should be "true"

# Mobile verification
agent-browser set viewport 390 844
agent-browser reload
agent-browser snapshot -i           # verify mobile layout
```

---

## 11. Pre-Ship Checklist

### 11.1 Quality gate commands (run in order)

```bash
bun run lint           # 0 errors, 0 warnings
npx tsc --noEmit       # 0 errors
```

**Both must pass before every commit.** There's no test framework yet — when Vitest is added, `bun run test` joins the gate.

### 11.2 Pre-commit visual checklist

- [ ] No `console.log` left in committed code (dev log only)
- [ ] No raw hex colours in components — use design tokens
- [ ] No `'use client'` on components that don't need it
- [ ] Every interactive element has a `:focus-visible` ring
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No `rounded-2xl` on app components (shadcn primitives are fine)
- [ ] No `@fontsource/*` imports — use `next/font/google`
- [ ] No `experimental.ppr` / `experimental.dynamicIO` in `next.config.ts`

### 11.3 Pre-deployment env validation

- [ ] `.env` has `DATABASE_URL` set
- [ ] If Postgres: `provider` changed to `"postgresql"` in `prisma/schema.prisma`
- [ ] If Postgres: `bun run db:migrate` (not `db:push`)
- [ ] `next.config.ts` `images.remotePatterns` updated to production image host (not `picsum.photos`)
- [ ] `allowedDevOrigins` cleared or updated (sandbox-only setting)

### 11.4 Post-deployment smoke tests

```bash
# 1. Homepage returns 200
curl -s -o /dev/null -w "%{http_code}\n" https://your-domain/

# 2. Key content is server-rendered
curl -s https://your-domain/ | grep -oE "(Stillwater|Practices|Teachers|Schedule|First Class|Vinyasa|Yin|Restorative|Breathwork)" | sort -u

# 3. Form submission works
curl -s -X POST https://your-domain/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Smoke+Test&email=smoke@example.com&preferredDay=Weekday+morning&company="
```

### 11.5 Security verification

- [ ] No `process.env.*` outside of `src/lib/db.ts` (only `DATABASE_URL` is needed)
- [ ] `.env*` in `.gitignore` (it is)
- [ ] Honeypot field present in the form (`company` field, visually hidden)
- [ ] Rate limiter fail-open (Redis outage shouldn't block users)
- [ ] `ipHash` is SHA-256 (never raw IPs stored)
- [ ] No `dangerouslySetInnerHTML` without escaping
- [ ] No `as any` casts (the scaffold allows them; the project convention forbids them)

---

## 12. Lessons Learnt & How to Avoid Them

### Lesson 1: Next.js 16 made everything async — embrace the contagion

**Context**: The server action's `headers()` call returned `undefined` and logged a runtime error on the first form submission.

**Why it mattered**: The form appeared to work (the user clicked submit, saw a 200 response), but the rate limiter got `ip = "unknown"` for every request, and the `ipHash` was always the same hash of `"unknown"`. This silently broke the per-IP rate limiting.

**How to avoid**: When upgrading to Next.js 16, grep for `headers()`, `cookies()`, `params`, `searchParams` and `await` every call. The TypeScript types will catch the `Promise<T>` return type if you're using `strict: true`.

### Lesson 2: Tailwind v4 class order matters for display toggles

**Context**: The schedule's desktop layout was invisible on all viewports because `hidden grid-cols-[...] max-[960px]:hidden` applied `display: none` always.

**Why it mattered**: The schedule section looked empty on desktop — no rows visible. The mobile layout worked because it used `hidden ... max-[960px]:flex` correctly.

**How to avoid**: When toggling between two layouts at a breakpoint, the default-display class (`grid` or `flex`) must be the base, with `max-[960px]:hidden` to hide it on the other side. Never use `hidden` as the default for an element you want to show.

### Lesson 3: Radix primitives have strict structural requirements

**Context**: Two `<AccordionPrimitive.Trigger>` elements in one header silently broke the accordion's ARIA wiring.

**Why it mattered**: The rows rendered but clicking did nothing. `aria-expanded` stayed `false`. The fix required restructuring to one trigger with two layouts inside.

**How to avoid**: Always read the Radix docs for the expected child structure. Don't duplicate primitives. If you need different layouts at different breakpoints, put them inside ONE primitive, not two.

### Lesson 4: React 19 forbids synchronous `setState` in `useEffect`

**Context**: The initial `useReducedMotion` hook triggered the `react-hooks/set-state-in-effect` lint error.

**Why it mattered**: The lint error would have failed CI (once CI is set up). More importantly, synchronous `setState` in `useEffect` causes cascading renders that hurt performance.

**How to avoid**: Use `useSyncExternalStore` for any external state (media queries, IntersectionObserver, EventSource, localStorage). Reserve `useEffect` for side effects that don't need to feed back into React state synchronously.

### Lesson 5: Zod 4 changed the enum API

**Context**: `z.enum(values, { errorMap })` failed TypeScript compilation because Zod 4 removed `errorMap`.

**Why it mattered**: The form schema wouldn't compile, blocking the entire server action.

**How to avoid**: When upgrading across a major version, read the changelog. Zod 4's breaking changes include the enum API, `.parse()` return types, and the error map structure.

### Lesson 6: Every element in the accessibility tree should add information

**Context**: Schedule rows had both an h3 "Expand for room details" and a button "Expand for room details" — screen reader users got duplicate, meaningless headings.

**Why it mattered**: WCAG AAA requires meaningful structure. A screen reader user navigating by headings would hear "Expand for room details" ten times in a row, with no way to distinguish which row they were on.

**How to avoid**: When you have a heading + interactive element pair, the heading provides context, the interactive element's `aria-label` describes the action AND the context. Don't duplicate text — enrich it.

### Lesson 7: Exclude reference repos from typecheck and lint

**Context**: `npx tsc --noEmit` reported errors from the cloned `yoga-studio` repo's config files (drizzle-kit not installed, playwright not installed, etc.).

**Why it mattered**: The typecheck was failing on files that aren't part of this project, masking real errors.

**How to avoid**: When you clone a reference/audit repo inside your project, immediately add it to `tsconfig.json` `exclude` and `eslint.config.mjs` `ignores`. Same for `skills/`, `examples/`, `upload/` folders.

### Lesson 8: The 8-second breath cycle is a contract, not a constant

**Context**: The hero's `--animate-hero-breath`, the brand mark's `--animate-brand-breath`, and the breath orb's `--animate-breath-orb` all run on 8s. The `useBreathCycle` hook also uses 8s.

**Why it mattered**: If someone changes one (e.g., "let's make the hero 6s for a faster feel"), the page stops breathing with you. The orb says "Inhale 4 of 4" while the hero is already on exhale. The whole conceit collapses.

**How to avoid**: Treat the 8s as a contract. If you want to change it, change ALL four places (three CSS animations + the hook's `elapsed % 8`). Document this in the code comments.

### Lesson 9: Silence is part of the brand

**Context**: The chime is gated behind explicit opt-in because browsers correctly block autoplay, AND because silence is part of the yoga studio's brand promise.

**Why it mattered**: If the chime auto-played, it would shatter the calm. The opt-in toast asks permission respectfully, and the chime only plays once on first scroll (not on every scroll).

**How to avoid**: When adding audio to a calm-aesthetic site, always opt-in. Never auto-play. Make the silence the default and the sound the exception.

### Lesson 10: Static content belongs in code, not the database

**Context**: The original `yoga-studio` repo had Drizzle ORM models for teachers, classes, etc. This build deliberately put teachers, practices, and the schedule in `src/lib/data/*.ts` as `readonly` arrays.

**Why it mattered**: Static content renders faster (no DB round-trip), is easier to version-control (diffs are readable), and doesn't require migrations. The only DB content is `Lead` — data that's actually written by users.

**How to avoid**: Ask "Will this data ever be written by a user, or participate in a transaction?" If no, keep it in code. The database is for mutable state, not reference data.

---

## 13. Pitfalls to Avoid

### 13.1 Architecture pitfalls

- **Don't add Auth.js v5 unless you need user accounts.** The original `yoga-studio` repo had it; this build omits it for a marketing site with an anonymous form. Adding auth introduces sessions, JWTs, DrizzleAdapter complexity, and CVE surface — none of which a "first class free" form needs.
- **Don't put DB access in client components.** All DB access goes through server actions or `src/lib/data/*` (static content). The `db` singleton is imported only in `src/lib/actions/first-class.ts`.
- **Don't add more routes.** The `fullstack-dev` skill constraint says only `/` is user-visible. If you need `/schedule` or `/teachers` as standalone pages, ask first — the current design is a single-page editorial scroll.
- **Don't use `prisma db push` in production.** Always `prisma migrate deploy`. `db push` is dev-only.

### 13.2 TypeScript pitfalls

- **Don't use `any`.** Use `unknown` + type guards. The scaffold's ESLint disables `no-explicit-any`, but the project convention is stricter.
- **Don't use `enum` / `namespace`.** They violate `erasableSyntaxOnly` (if enabled). Use string unions or `as const` arrays.
- **Don't use `import { Type }`.** Use `import type { Type }` for type-only imports.
- **Don't disable `noUncheckedIndexedAccess`.** Always handle `T | undefined` for indexed access.

### 13.3 Testing pitfalls (when tests are added)

- **Don't use `vi.fn()` directly in `vi.mock()` factory.** Use `vi.hoisted()` to declare mocks BEFORE the factory — TDZ otherwise.
- **Don't use `vi.clearAllMocks()` on structural mock chains.** Only reset leaf mocks via `mockResolvedValueOnce()`.
- **Don't put JSX in `.test.ts` files.** Rename to `.test.tsx` — TypeScript doesn't parse JSX in `.ts` files.
- **Don't forget to mock `next/cache`.** `cacheLife is not a function` if you don't: `vi.mock("next/cache", () => ({ cacheLife: vi.fn() }))`.
- **Don't forget the `window.matchMedia` polyfill.** jsdom doesn't implement it. Always guard with `typeof === "function"`.

### 13.4 Design system pitfalls

- **Don't use raw hex colours.** `bg-[#b16a48]` is forbidden. Use `bg-terracotta`.
- **Don't use Inter alone.** Fraunces + Inter pairing is required.
- **Don't use default Tailwind `amber-*` / `red-*`.** Use semantic tokens (`sage`, `terracotta`).
- **Don't use `rounded-2xl` everywhere.** Minimal radii — `rounded-sm` or sharp for editorial feel.
- **Don't add more accent colours.** One accent (terracotta) used in four places. Dusk-pink is a soft secondary for radial blooms only.
- **Don't slow animations for reduced-motion.** DISABLE them entirely.

### 13.5 Security pitfalls

- **Don't read `process.env.*` outside `src/lib/db.ts`.** Only `DATABASE_URL` is needed.
- **Don't commit `.env*` files.** They're in `.gitignore` — leave them there.
- **Don't fail-closed the rate limiter.** Fail-open on Redis/memory outage — never block a real user because the limiter state got weird.
- **Don't store raw IPs.** `ipHash` is SHA-256 + truncated to 16 chars.
- **Don't add `as any` casts.** Use wrapper functions or `unknown` + type guards.

### 13.6 Performance pitfalls

- **Don't import `@/lib/db` in client components.** It pulls Prisma into the client bundle.
- **Don't use `new Date()` in Server Components.** It causes `next-prerender-current-time` build errors. Move to a client component with `useEffect`.
- **Don't wrap everything in `useMemo`/`useCallback`.** React 19 Compiler handles memoization.
- **Don't use barrel files.** Direct imports `@/components/ui/Button` — barrel files defeat tree-shaking.

---

## 14. Best Practices

### 14.1 Code organization

- `src/app/` for App Router pages + layouts + globals.css
- `src/components/layout/` for persistent chrome (Topbar, Footer, etc.)
- `src/components/sections/` for homepage sections
- `src/components/ui/` for shadcn/ui primitives (don't edit unless necessary)
- `src/hooks/` for custom hooks
- `src/lib/actions/` for server actions
- `src/lib/data/` for static content
- `src/lib/` for infrastructure (db, utils)

### 14.2 TypeScript conventions

- `interface` for object shapes, `type` for unions/intersections
- `import type { Foo }` for type-only imports
- Let TypeScript infer return types on non-public-API functions
- Explicit return types on exported server-action signatures (for discriminated unions)
- Path alias `@/*` → `./src/*`
- `as const` for static arrays (`PRACTICES`, `TEACHERS`, `SCHEDULE`)

### 14.3 React/Next.js conventions

- Server Components by default
- `'use client'` only when needed (see §5.2 decision tree)
- Named exports (not default) for components — except `page.tsx` and `layout.tsx` which require default exports
- `next/image` for all images (never `<img>`)
- `next/font/google` for fonts (never `@fontsource/*`)
- `next/link` for internal links (never `<a>`)
- Server Actions for form submissions (`'use server'` first line)
- `await` `headers()`, `cookies()`, `params`, `searchParams` (Next.js 16)

### 14.4 Database conventions

- Prisma schema is the single source of truth
- `db` singleton in `src/lib/db.ts` — import as `import { db } from "@/lib/db"`
- `bun run db:push` for dev (SQLite)
- `bun run db:migrate` for prod (Postgres)
- `@@index` on frequently-queried fields (`status`, `createdAt`)
- `@unique` for natural keys (`email`)
- Store `ipHash` (SHA-256), never raw IPs

### 14.5 Security conventions

- Zod validation at every boundary (server action input)
- Honeypot field on forms (`company` — must be empty)
- Rate limiter per IP (in-memory sliding window, fail-open)
- `onConflictDoNothing()` or `@unique` for idempotency
- Never leak internal errors to the client — return generic `INTERNAL` message

### 14.6 Design conventions

- All tokens in `globals.css` `@theme` block
- `@utility` for custom utilities (not `@layer utilities`)
- `@keyframes` inside `@theme` for animations
- `prefers-reduced-motion` guard disables animations (not slows)
- One accent colour (terracotta) in four places
- Fraunces + Inter pairing always
- Minimal radii (`rounded-sm` or sharp)

---

## 15. Coding Patterns

### 15.1 Server Action pattern (auth → validate → business → response)

Location: `src/lib/actions/first-class.ts`

```typescript
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { PREFERRED_DAYS } from "@/lib/data/schedule";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  email: z.string().trim().email("A valid email is required").max(160),
  preferredDay: z.enum(PREFERRED_DAYS, { message: "Please choose a preferred time" }),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  company: z.string().max(0, "Bot detected").optional(),  // honeypot
});

export type FirstClassResult =
  | { success: true; message: string }
  | { success: false; code: "VALIDATION" | "RATE_LIMIT" | "BOT" | "DUPLICATE" | "INTERNAL"; message: string; errors?: FirstClassFieldErrors };

export async function claimFirstClassAction(
  _prev: FirstClassResult | null,
  formData: FormData,
): Promise<FirstClassResult> {
  // 1. Honeypot — silently reject bots
  if (formData.get("company")) return { success: false, code: "BOT", message: "Submission rejected." };

  // 2. Rate limit (fail-open)
  try {
    const ip = await getClientIp();
    if (!checkRateLimit(ip).allowed) {
      return { success: false, code: "RATE_LIMIT", message: "Too many attempts. Please try again in an hour." };
    }
  } catch { /* fail-open */ }

  // 3. Validate
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, code: "VALIDATION", message: "Please correct the highlighted fields.", errors: formatErrors(parsed.error) };
  }

  // 4. Persist (handle duplicate)
  try {
    await db.lead.create({ data: { ...parsed.data, ipHash: await hashIp(), status: "pending" } });
  } catch (err) {
    if (isUniqueConstraint(err)) {
      return { success: false, code: "DUPLICATE", message: "We already have a request from this email — Iris will write you back within a day." };
    }
    return { success: false, code: "INTERNAL", message: "Something went wrong on our end. Please try again, or call us at 718 · 555 · 0142." };
  }

  return { success: true, message: "Thank you — Iris will write you back within a day, by hand." };
}
```

### 15.2 `useActionState` form pattern

Location: `src/components/sections/FirstClassFree.tsx`

```tsx
"use client";
import { useActionState } from "react";
import { claimFirstClassAction, type FirstClassResult } from "@/lib/actions/first-class";

function FirstClassForm() {
  const [state, formAction, isPending] = useActionState<FirstClassResult | null, FormData>(
    claimFirstClassAction,
    null,
  );

  if (state?.success) {
    return <SuccessMessage message={state.message} />;
  }

  return (
    <form action={formAction} noValidate>
      {/* honeypot */}
      <input type="text" name="company" tabIndex={-1} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />

      {/* fields with aria-invalid + aria-describedby */}
      <input
        name="email"
        aria-invalid={!!state?.errors?.email}
        aria-describedby={state?.errors?.email ? "email-error" : undefined}
      />
      {state?.errors?.email && <p id="email-error" role="alert">{state.errors.email[0]}</p>}

      <button type="submit" disabled={isPending}>{isPending ? "Sending…" : "Reserve my first mat"}</button>

      <div aria-live="polite" aria-atomic="true">{/* status messages */}</div>
    </form>
  );
}
```

### 15.3 `useSyncExternalStore` for external state pattern

Location: `src/hooks/use-reduced-motion.ts`

```typescript
"use client";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot(): boolean { return false; }

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

### 15.4 IntersectionObserver reveal pattern

Location: `src/hooks/use-reveal.ts` + `src/components/sections/Reveal.tsx`

```typescript
// Hook
export function useReveal<T extends HTMLElement>(options?: UseRevealOptions) {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced || typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(raf);
    }
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting) {
        setRevealed(true);
        if (options?.once !== false) observer.disconnect();
      }
    }, { threshold: options?.threshold ?? 0.15, rootMargin: options?.rootMargin ?? "0px 0px -8% 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, options?.threshold, options?.rootMargin, options?.once]);

  return { ref, revealed };
}

// Component
export function Reveal({ children, delay = 0, className = "", as, once = true }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, revealed } = useReveal<HTMLElement>({ once });
  return (
    <Tag ref={ref} className={`fade-up ${DELAY_CLASS[delay]} ${revealed ? "fade-up-in" : ""} ${className}`}>
      {children}
    </Tag>
  );
}
```

### 15.5 Radix Accordion with custom icon pattern

Location: `src/components/sections/Schedule.tsx`

```tsx
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

### 15.6 Web Audio API chime pattern (opt-in only)

Location: `src/components/layout/SoundToast.tsx`

```typescript
export function playChime(): void {
  try {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;

    // A4 (440 Hz) + E5 (659.25 Hz) + sub-octave A3 (220 Hz) — perfect fifth
    const tones = [
      { freq: 440.0, gain: 0.08, delay: 0.0 },
      { freq: 659.25, gain: 0.05, delay: 0.04 },
      { freq: 220.0, gain: 0.04, delay: 0.1 },
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

// Always called from a user-gesture handler (button click), never auto-played.
```

### 15.7 Typewriter with natural pauses pattern

Location: `src/components/sections/Teachers.tsx`

```typescript
const type = () => {
  if (typing) return;
  setTyping(true);
  iRef.current = 0;
  setTyped("");

  if (reduced) {
    setTyped(teacher.quote);  // immediate for reduced-motion
    return;
  }

  const step = () => {
    const i = iRef.current;
    if (i >= teacher.quote.length) return;
    setTyped(teacher.quote.slice(0, i + 1));
    iRef.current = i + 1;

    const lastChar = teacher.quote[i] ?? " ";
    const delay =
      lastChar === " " ? 18 :
      lastChar === "," ? 60 :
      (lastChar === "." || lastChar === "—") ? 140 :
      28;
    timerRef.current = setTimeout(step, delay);
  };
  step();
};
```

### 15.8 Fail-open rate limiter pattern

Location: `src/lib/actions/first-class.ts`

```typescript
let rateLimitOk = true;
try {
  const ip = await getClientIp();
  rateLimitOk = checkRateLimit(ip).allowed;
} catch {
  rateLimitOk = true;  // fail-open — never block on limiter outage
}
if (!rateLimitOk) {
  return { success: false, code: "RATE_LIMIT", message: "..." };
}
```

---

## 16. Coding Anti-Patterns

### 16.1 TypeScript anti-patterns

```typescript
// ❌ WRONG — any
function process(data: any) { return data.foo; }
// ✅ CORRECT — unknown + type guard
function process(data: unknown) {
  if (typeof data === "object" && data !== null && "foo" in data) {
    return (data as { foo: string }).foo;
  }
  throw new Error("Invalid data");
}

// ❌ WRONG — default export for components
export default function Button() { ... }
// ✅ CORRECT — named export
export function Button() { ... }

// ❌ WRONG — runtime import of type
import { FirstClassResult } from "@/lib/actions/first-class";
// ✅ CORRECT — type-only import
import type { FirstClassResult } from "@/lib/actions/first-class";
```

### 16.2 React anti-patterns

```tsx
// ❌ WRONG — <a> for internal links
<a href="/schedule">Schedule</a>
// ✅ CORRECT — next/link
import Link from "next/link";
<Link href="#schedule">Schedule</Link>

// ❌ WRONG — <img> for images
<img src="/hero.jpg" alt="Hero" />
// ✅ CORRECT — next/image
import Image from "next/image";
<Image src="/hero.jpg" alt="Hero" fill priority />

// ❌ WRONG — useEffect + setState for external state
useEffect(() => {
  setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}, []);
// ✅ CORRECT — useSyncExternalStore (see §15.3)

// ❌ WRONG — forwardRef on new components
const Button = forwardRef<HTMLButtonElement, Props>((props, ref) => ...);
// ✅ CORRECT — React 19 passes ref as a regular prop
function Button({ ref, ...props }: Props & { ref?: React.Ref<HTMLButtonElement> }) { ... }
```

### 16.3 Tailwind anti-patterns

```tsx
// ❌ WRONG — raw hex
<div className="bg-[#b16a48]">...</div>
// ✅ CORRECT — design token
<div className="bg-terracotta">...</div>

// ❌ WRONG — default Tailwind colours
<div className="bg-amber-500 text-red-600">...</div>
// ✅ CORRECT — semantic tokens
<div className="bg-terracotta text-ink">...</div>

// ❌ WRONG — tailwind.config.js for app tokens (v3 pattern)
// ✅ CORRECT — @theme in globals.css (v4 pattern)

// ❌ WRONG — hidden as default for element you want to show
<div className="hidden grid-cols-2 max-[960px]:hidden">
// ✅ CORRECT — grid as default, hide on mobile
<div className="grid grid-cols-2 max-[960px]:hidden">
```

### 16.4 Next.js anti-patterns

```typescript
// ❌ WRONG — synchronous headers() (Next.js 15)
const xff = headers().get("x-forwarded-for");
// ✅ CORRECT — await headers() (Next.js 16)
const h = await headers();
const xff = h.get("x-forwarded-for");

// ❌ WRONG — onClick on a button for form submission
<button onClick={() => submitForm()}>Submit</button>
// ✅ CORRECT — form action + server action
<form action={claimFirstClassAction}>
  <button type="submit">Submit</button>
</form>

// ❌ WRONG — 'use client' on a section shell that doesn't need it
"use client";
export function Practices() { return <div>...</div>; }
// ✅ CORRECT — server component, push 'use client' to the leaf

// ❌ WRONG — new Date() in Server Component
export default function Page() {
  const now = new Date();  // causes next-prerender-current-time error
  return <div>{now.toString()}</div>;
}
```

---

## 17. Responsive Breakpoint Reference

### 17.1 Single custom breakpoint: `960px`

The project uses ONE custom breakpoint at `960px`, applied via Tailwind's `max-[960px]:` variant. This is not a Tailwind default — it's chosen because:

- **≥ 960px**: Desktop. 6-column schedule grid, 2-column practices grid, 3-column teachers grid, 2-column signup (copy + form), 4-column footer.
- **< 960px**: Mobile. Single-column everywhere, vertical flex schedule rows, hidden topbar nav (sound toggle icon-only).

### 17.2 Usage patterns per section

| Section | Desktop (≥960px) | Mobile (<960px) |
| --- | --- | --- |
| Topbar | Nav links visible, sound toggle has text label | Nav links hidden, sound toggle icon-only |
| Hero | `clamp(4rem, 14vw, 11rem)` title, `padding: 8rem 2rem 6rem` | `clamp(3.5rem, 18vw, 6rem)` title (per mockup), `padding: 7rem 1.5rem 5rem` |
| Practices | `grid-cols-2`, internal borders | `grid-cols-1`, no internal borders |
| Teachers | `grid-cols-3`, `gap-12` | `grid-cols-1`, `gap-8` |
| Schedule | 6-col grid: `100px 110px 1fr 130px 180px 44px` | Vertical flex: day+class, time+teacher, seats, expand |
| FirstClassFree | `grid-cols-2`, `gap-24` | `grid-cols-1`, `gap-12` |
| Footer | `grid-cols-[1.4fr_1fr_1fr_1fr]` | `grid-cols-2` |

### 17.3 Tailwind default breakpoints (not customized)

The project does NOT customize Tailwind's default breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`). The single `max-[960px]:` variant covers the mobile/desktop split. If you need finer control, use Tailwind's defaults — don't add another custom breakpoint.

### 17.4 Mobile testing

```bash
agent-browser set viewport 390 844    # iPhone 14
agent-browser reload
agent-browser snapshot -i             # verify mobile layout
agent-browser screenshot mobile.png
```

---

## 18. Z-Index Layer Map

### 18.1 All z-index layers

| Element | z-index | Location | Purpose |
| --- | --- | --- | --- |
| Skip link (when focused) | `9999` | `src/app/layout.tsx` | Above everything when keyboard-focused |
| LinenGrain overlay | `9998` (`--z-grain`) | `src/components/layout/LinenGrain.tsx` | Paper texture, fixed full-viewport |
| Sound toast | `200` (`--z-sound-toast`) | `src/components/layout/SoundToast.tsx` | Opt-in dialog, above topbar |
| Topbar | `100` (`--z-topbar`) | `src/components/layout/Topbar.tsx` | Fixed nav |
| BreathGuide | `90` (`--z-breath-guide`) | `src/components/layout/BreathGuide.tsx` | Fixed bottom-left orb |
| Hero veil | `1` | `src/components/sections/Hero.tsx` | Above photo, below content |
| Hero sunbeam | `2` | `src/components/sections/Hero.tsx` | Above veil, below content |
| Hero content | `3` | `src/components/sections/Hero.tsx` | Above sunbeam |
| FirstClassFree grid | `2` | `src/components/sections/FirstClassFree.tsx` | Above decorative radial blooms |

### 18.2 Conflict resolution rules

1. **Skip link wins everything** — `9999` is the project ceiling.
2. **LinenGrain below skip link, above everything else** — `9998` with `pointer-events: none` so it doesn't block clicks.
3. **Sound toast above topbar** — `200 > 100`. The toast is a modal dialog.
4. **Topbar above breath guide** — `100 > 90`. The topbar is primary nav.
5. **Hero internal stacking** — photo (0) → veil (1) → sunbeam (2) → content (3). All `position: absolute` or `relative` within the hero section.

### 18.3 Radix/shadcn portal z-index

The shadcn `Toaster` (`src/components/ui/toaster.tsx`) uses `z-[100]` — same as the Topbar. This is fine because toasts appear bottom-right on desktop, top on mobile, and don't overlap the topbar. If you add a Dialog or Sheet, those use Radix's default portal z-index (`z-50` in shadcn) — you may need to bump them above the Topbar if they're used on mobile.

---

## 19. Color Reference (Complete)

### 19.1 All semantic tokens (from `globals.css` `@theme inline {}`)

| Token | Hex | RGB | Tailwind class | Usage |
| --- | --- | --- | --- | --- |
| `--color-linen-50` | `#faf5ec` | `rgb(250, 245, 236)` | `bg-linen-50` | Page background (brightest cream) |
| `--color-linen-100` | `#f4ede0` | `rgb(244, 237, 224)` | `bg-linen-100` | Default cream background |
| `--color-linen-200` | `#efe6d4` | `rgb(239, 230, 212)` | `bg-linen-200` | Card hover background |
| `--color-linen-300` | `#e6dfd1` | `rgb(230, 223, 209)` | `bg-linen-300` | Sand-tinted dividers |
| `--color-sand` | `#e3d5c1` | `rgb(227, 213, 193)` | `bg-sand` | First-Class-Free section background |
| `--color-sand-deep` | `#c9b89e` | `rgb(201, 184, 158)` | `bg-sand-deep` | Sand-tinted dividers (deeper) |
| `--color-sage` | `#8a9a87` | `rgb(138, 154, 135)` | `bg-sage` / `text-sage` | Available seat dots |
| `--color-sage-deep` | `#5d6e5a` | `rgb(93, 110, 90)` | `text-sage-deep` | Italic emphasis in section titles |
| `--color-terracotta` | `#b16a48` | `rgb(177, 106, 72)` | `bg-terracotta` / `text-terracotta` | **PRIMARY accent** — labels, hover, focus |
| `--color-terracotta-deep` | `#8e4f33` | `rgb(142, 79, 51)` | `bg-terracotta-deep` / `text-terracotta-deep` | Hover state for terracotta |
| `--color-terracotta-tint` | `rgba(177, 106, 72, 0.12)` | — | (not a Tailwind class) | Used in box-shadow on breath orb |
| `--color-dusk-pink` | `#d4a5a0` | `rgb(212, 165, 160)` | `bg-dusk-pink` | Soft secondary accent (radial blooms only) |
| `--color-ink` | `#2c2620` | `rgb(44, 38, 32)` | `bg-ink` / `text-ink` | Headlines, footer background |
| `--color-ink-soft` | `#4a4036` | `rgb(74, 64, 54)` | `text-ink-soft` | Body text |
| `--color-ink-mute` | `#7a6e60` | `rgb(122, 110, 96)` | `text-ink-mute` | Metadata (decorative only) |
| `--color-ink-line` | `rgba(44, 38, 32, 0.14)` | — | `border-ink-line` | Borders |
| `--color-ink-line-soft` | `rgba(44, 38, 32, 0.07)` | — | `border-ink-line-soft` | Soft borders, dividers |

### 19.2 Forbidden colours

The following are **forbidden** in app components (shadcn/ui primitives are exempt — they use their own token system):

- Raw hex: `bg-[#b16a48]`, `text-[#2c2620]`, etc.
- Tailwind defaults: `amber-*`, `red-*`, `blue-*`, `purple-*`, `indigo-*`, `violet-*`, `pink-*` (use `terracotta`, `sage`, `dusk-pink` instead)
- `oklch()` colours (the scaffold's `globals.css` originally had `oklch()` for shadcn tokens — these were replaced with hex)

### 19.3 The singular exception

The shadcn/ui primitives in `src/components/ui/` use their own token system (`--background`, `--foreground`, `--primary`, etc.) defined in the scaffold's original `globals.css`. These were **kept** for compatibility — don't rip them out. The app components use the Stillwater tokens (`linen-*`, `terracotta`, `ink-*`), not the shadcn tokens. The two systems coexist; just don't mix them in the same component.

---

## 20. The Complete TypeScript Interface Reference

### 20.1 Static content interfaces

Location: `src/lib/data/*.ts`

```typescript
// src/lib/data/practices.ts
export interface Practice {
  id: string;
  num: string;
  name: string;
  sanskrit: string;
  description: string;
  meta: { duration: string; room: string; level: string };
}

// src/lib/data/teachers.ts
export interface Teacher {
  id: string;
  name: string;
  role: string;
  yearsLabel: string;
  photo: { src: string; alt: string };
  quote: string;
}

// src/lib/data/schedule.ts
export interface ScheduleClass {
  id: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  time: string;
  className: string;
  classNote?: string;
  teacher: string;
  room: string;
  roomNote?: string;
  bring: string;
  bringNote?: string;
  prep: string;
  total: number;
  taken: number;
}

export type PreferredDay = (typeof PREFERRED_DAYS)[number];
```

### 20.2 Server Action interfaces

Location: `src/lib/actions/first-class.ts`

```typescript
export type FirstClassFieldErrors = Partial<
  Record<"name" | "email" | "preferredDay" | "notes", string[]>
>;

export type FirstClassResult =
  | { success: true; message: string }
  | {
      success: false;
      code: "VALIDATION" | "RATE_LIMIT" | "BOT" | "DUPLICATE" | "INTERNAL";
      message: string;
      errors?: FirstClassFieldErrors;
    };
```

### 20.3 Hook interfaces

Location: `src/hooks/*.ts`

```typescript
// use-reveal.ts
interface UseRevealOptions {
  threshold?: number;       // default 0.15
  rootMargin?: string;      // default '0px 0px -8% 0px'
  once?: boolean;           // default true
}

// use-breath-cycle.ts
export interface BreathState {
  phase: "inhale" | "exhale" | null;
  second: number;  // 1..4
}
```

### 20.4 Environment interface

There is no `src/lib/env.ts` module — the project uses `process.env.DATABASE_URL` directly in `prisma/schema.prisma`. If you add more env vars, create `src/lib/env.ts` with Zod validation (see the original `yoga-studio` repo's pattern).

### 20.5 Prisma model

Location: `prisma/schema.prisma`

```prisma
model Lead {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique
  preferredDay    String
  notes           String?
  status          String   @default("pending")
  ipHash          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

---

## Appendix A: Architecture Decision Records

### ADR-001: Next.js 16 App Router over Pages Router

**Decision**: Use App Router (`src/app/`) not Pages Router (`src/pages/`).

**Rationale**: Next.js 16 fully supports App Router with React 19 Server Components, Turbopack, and the new async `headers()`/`cookies()` API. Pages Router is legacy.

**Consequences**: All pages are Server Components by default. Client components need `'use client'`. `params`/`searchParams` are `Promise<T>` — must `await`.

### ADR-002: Tailwind v4 CSS-first config over `tailwind.config.js`

**Decision**: All design tokens in `src/app/globals.css` `@theme` block, not in `tailwind.config.ts`.

**Rationale**: Tailwind v4's CSS-first config is the new default. It keeps tokens in the same file as the base styles, making the design system easier to audit.

**Consequences**: The root `tailwind.config.ts` is the empty scaffold default. Don't add tokens there. Custom utilities use `@utility` not `@layer utilities`.

### ADR-003: Prisma + SQLite over Drizzle ORM

**Decision**: Use Prisma with SQLite for development.

**Rationale**: The original `yoga-studio` repo used Drizzle. This build uses Prisma because: (1) the `fullstack-dev` skill scaffold includes Prisma out of the box; (2) Prisma's `schema.prisma` is more readable than Drizzle's TypeScript schema; (3) SQLite is sufficient for a single-model marketing site.

**Consequences**: Schema is portable to Postgres by changing `provider`. Use `bun run db:push` for dev, `bun run db:migrate` for prod.

### ADR-004: Static content in code, not database

**Decision**: Teachers, practices, and schedule live in `src/lib/data/*.ts` as `readonly` arrays. Only `Lead` is in the database.

**Rationale**: Static content changes ~annually and never participates in transactions. Code is faster (no DB round-trip), easier to version-control, and doesn't require migrations.

**Consequences**: Adding a teacher/practice/class is a 1-file, 1-step process. No admin UI needed.

### ADR-005: No auth, no payments, no background jobs

**Decision**: Deliberately omit Auth.js, Stripe, Inngest, and Replicate — all present in the original `yoga-studio` repo.

**Rationale**: A "first class free" form doesn't need user accounts, payments, background jobs, or AI image generation. Adding them introduces complexity, CVE surface, and maintenance burden that a calm marketing site doesn't warrant.

**Consequences**: The form is anonymous. Rate limiting is per-IP (in-memory). Email confirmation is manual ("Iris writes you back within a day, by hand").

### ADR-006: Radix Accordion primitives over shadcn wrapper

**Decision**: Use `@radix-ui/react-accordion` primitives directly in `Schedule.tsx`, not the shadcn `Accordion` wrapper.

**Rationale**: The shadcn wrapper injects a default chevron icon that doesn't match the design. We need a custom `+` icon that rotates 45° into an `×` on open. Using primitives gives full control over the trigger content.

**Consequences**: The `src/components/ui/accordion.tsx` file is still present (scaffold) but unused by the Schedule section. Don't delete it — other features might use it.

### ADR-007: `useSyncExternalStore` over `useEffect` + `setState`

**Decision**: Use `useSyncExternalStore` for `useReducedMotion()`, not `useEffect` + `setState`.

**Rationale**: React 19's `react-hooks/set-state-in-effect` lint rule flags synchronous `setState` in `useEffect` as a cascading-render anti-pattern. `useSyncExternalStore` is the idiomatic way to subscribe to external state.

**Consequences**: The hook is SSR-safe by design (`getServerSnapshot: () => false`). No hydration mismatch.

### ADR-008: Web Audio API over `<audio>` element

**Decision**: Use Web Audio API (`AudioContext` + `OscillatorNode`) for the chime, not an `<audio>` element with a sound file.

**Rationale**: Web Audio API generates the chime programmatically (no asset to load), supports precise timing, and the perfect-fifth interval (A4 + E5) is calculated in code. An `<audio>` element would require hosting an MP3.

**Consequences**: `AudioContext` must be created in a user-gesture handler (browser autoplay policy). The chime is opt-in only.

---

## Appendix B: Live-Site Validation Methodology

### B.1 The `agent-browser` E2E workflow

This project uses `agent-browser` (a CLI for headless browser automation) for live-site verification. The workflow:

```bash
# 1. Open the page
agent-browser open http://localhost:3000/
agent-browser wait --load networkidle

# 2. Check for errors
agent-browser errors                # must be empty
agent-browser console               # must be empty (HMR connected is fine)

# 3. Snapshot the accessibility tree
agent-browser snapshot -i           # verify all 6 sections + form fields present

# 4. Test the golden path (form submission)
agent-browser fill @e53 "Test Name"
agent-browser fill @e54 "test@example.com"
agent-browser select @e55 "Weekday morning"
agent-browser click @e57            # submit button
agent-browser wait 3000
agent-browser snapshot -i | grep "Thank you"   # should find it

# 5. Test the accordion
agent-browser click @e36            # first schedule row
agent-browser get attr @e36 aria-expanded      # should be "true"

# 6. Test the typewriter (hover)
agent-browser hover @e15            # Anya's card
agent-browser wait 4000             # let it type
agent-browser get text @e15         # should contain the quote

# 7. Mobile verification
agent-browser set viewport 390 844
agent-browser reload
agent-browser snapshot -i           # verify mobile layout

# 8. Screenshots
agent-browser screenshot hero.png
agent-browser screenshot --full page.png
```

### B.2 What live-site testing catches that CI cannot

- **Hydration mismatches** — the server-rendered HTML differs from the client's first render. Only visible when you load the page in a real browser.
- **`AudioContext` autoplay policy** — the chime only plays if created in a user-gesture handler. CI doesn't test this.
- **IntersectionObserver behaviour** — reveals only fire when elements actually enter the viewport.
- **`prefers-reduced-motion`** — only testable in a real browser with the media query set.
- **Radix Accordion ARIA wiring** — the accessibility tree is only meaningful in a real browser.

### B.3 Pre-ship verification script

```bash
#!/bin/bash
# scripts/verify.sh — run before every commit

set -e

echo "=== Lint ==="
bun run lint

echo "=== Typecheck ==="
npx tsc --noEmit

echo "=== Dev server ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/

echo "=== Server-rendered content ==="
curl -s http://localhost:3000/ | grep -oE "(Stillwater|Practices|Teachers|Schedule|First Class|Vinyasa|Yin|Restorative|Breathwork|Anya Perrin|Marcus Reed|Iris Tanaka)" | sort -u

echo "=== Dev log errors ==="
grep -c "^Error" dev.log || echo "0 errors"

echo "✅ All checks passed"
```

---

## Appendix C: Intentional Omissions

The following are **deliberately omitted** from this project. Each was present in the original `nordeim/yoga-studio` repo and consciously excluded here.

| Omission | Reason |
| --- | --- |
| **Auth.js v5** | The "first class free" form is anonymous. No user accounts, no sessions, no protected routes. Adding auth introduces JWTs, DrizzleAdapter, CVE surface — none of which a marketing site needs. |
| **Stripe** | "First class free" means free. No payments, no subscriptions, no class packs. |
| **Inngest** | No background jobs. The server action is synchronous (Prisma insert + return). Email confirmation is manual ("Iris writes you back by hand"). |
| **Replicate** | No AI image generation. Hero + teacher photos come from `picsum.photos` (placeholder). Replace with real photography in production. |
| **Drizzle ORM** | Replaced with Prisma. The `fullstack-dev` skill scaffold includes Prisma out of the box, and Prisma's `schema.prisma` is more readable. |
| **Vitest + Playwright** | Not yet wired up. Manual verification via `agent-browser` for now. Planned for a future sprint. |
| **Docker** | `next.config.ts` has `output: "standalone"` for Docker, but no `Dockerfile` is included. The standalone output at `.next/standalone/` is ready for any container runtime. |
| **CI/CD** | No GitHub Actions workflow. The pre-ship checklist (`bun run lint && npx tsc --noEmit`) is manual. Add CI when the team grows. |
| **i18n** | English only. The studio is in Cobble Hill, Brooklyn — no internationalisation needed. |
| **Dark mode** | The calm aesthetic is built around warm cream backgrounds. Dark mode would undermine the brand. The `next-themes` package is in `package.json` (scaffold) but unused. |
| **Blog/CMS** | Static content in `src/lib/data/*.ts`. No headless CMS, no MDX, no blog engine. |

---

*End of Stillwater project skill. This document was produced by following the Six-Phase Distillation Process from the `to-distill-project-into-skill` meta-skill on the Stillwater Yoga Studio codebase (Next.js 16.1.3 + React 19 + Tailwind v4 + Prisma 6.19 + Zod 4 + shadcn/ui + Web Audio API). For the companion docs, see `README.md`, `AGENTS.md`, and `CLAUDE.md`.*
