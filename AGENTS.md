# AGENTS.md

Compact instruction file for AI coding agents working in this repo. Every line answers: "Would an agent likely miss this without help?" If not, it's not here.

## Commands

| Task              | Command                          |
| ----------------- | -------------------------------- |
| Install           | `bun install`                    |
| Dev server        | `bun run dev` (port 3000, tees to `dev.log`) |
| Lint (must pass)  | `bun run lint`                   |
| Typecheck (must pass) | `npx tsc --noEmit`            |
| Production build  | `bun run build`                  |
| Push Prisma schema (dev) | `bun run db:push`         |
| Regenerate Prisma Client | `bun run db:generate`     |

**Quality gate before every commit**: `bun run lint && npx tsc --noEmit`. Both must be 0 errors.

## Architecture facts agents miss

- **Only one route exists: `/`.** The `fullstack-dev` skill constraint forbids adding user-visible routes. Do NOT add `/schedule`, `/teachers`, etc. without explicit user request.
- **Five client-component leaves only**: `Hero`, `Teachers`, `Schedule`, `FirstClassFree`, `HomeChrome`. Everything else is a Server Component. Push `'use client'` to the leaf, never the section shell.
- **Static content lives in `src/lib/data/*.ts`** as `readonly` arrays — teachers, practices, schedule. NOT in the database. Only the `Lead` model (form submissions) is in Prisma.
- **`page.tsx` is a Server Component** that composes all 6 sections + `<HomeChrome />` (the client orchestrator for Topbar + BreathGuide + SoundToast state).
- **The Schedule accordion uses `@radix-ui/react-accordion` primitives directly**, NOT the shadcn `Accordion` wrapper. The shadcn wrapper injects a default chevron that doesn't match the design — we render our own `+` icon that rotates 45° into an `×` on open.

## Framework quirks that will bite you

- **Next.js 16: `headers()` returns a Promise.** Always `await headers()`. Synchronous `.get()` on it → runtime 500. See `src/lib/actions/first-class.ts:73`.
- **Tailwind v4: CSS-first config.** Design tokens live in `src/app/globals.css` under `@theme inline {}`. There is NO `tailwind.config.js` for app tokens — the root `tailwind.config.ts` is the empty scaffold default. Do NOT add tokens there.
- **PostCSS has only `@tailwindcss/postcss`.** Do NOT add `autoprefixer` or `postcss-import` — they break v4.
- **Zod 4 enum API changed.** `z.enum(values, { errorMap: ... })` is GONE. Use `z.enum(values, { message: "..." })`. See `src/lib/actions/first-class.ts:24`.
- **React 19: no `forwardRef` needed** on new components. `ref` is a regular prop.
- **React 19: use `useSyncExternalStore` for external state**, NOT `useEffect` + `setState`. The latter triggers the `react-hooks/set-state-in-effect` lint error. See `src/hooks/use-reduced-motion.ts`.
- **`useActionState`** for form state — signature is `useActionState(serverAction, initialState)`. See `src/components/sections/FirstClassFree.tsx`.
- **`tsconfig.json` excludes `yoga-studio`, `skills`, `examples`, `upload`, `tool-results`** — these are audit/scaffold folders, not part of the app. Don't remove the excludes.

## Design system — non-obvious rules

- **One accent colour: terracotta `#b16a48`** (token: `--color-terracotta`). Used in exactly four places: section labels, hover underlines, sound toggle when active, form submit hover. Do NOT introduce more accent colours.
- **Never raw hex in components.** `bg-[#b16a48]` is forbidden. Use `bg-terracotta`, `text-ink-soft`, `border-ink-line`, etc.
- **Fraunces + Inter pairing is required.** Never use Inter alone — that's the "AI slop" aesthetic this project rejects. Headings = Fraunces (`font-serif`), body = Inter (`font-sans`).
- **`prefers-reduced-motion` DISABLES animations, not slows them.** Slowed animations trigger vestibular disorders. The CSS guard is in `globals.css`; the hook is `useReducedMotion()`.
- **Animation guardrails**: animate `transform` + `opacity` only. Never `width`/`height`/`top`/`margin`. No `transition: all`. List specific properties.
- **Hero breath cycle is 8 seconds** (`--animate-hero-breath`). The BreathGuide orb uses the same 8s cycle. Don't change one without the other — they must stay in sync (that's the whole point: the page breathes with you).
- **The chime is two stacked triangle waves at A4 (440 Hz) + E5 (659.25 Hz) + sub-octave A3.** A perfect fifth — the most consonant interval. `AudioContext` is instantiated ONLY on explicit user gesture (browser autoplay policy). See `src/components/layout/SoundToast.tsx`.

## Database

- **SQLite for dev** (`prisma/schema.prisma` `provider = "sqlite"`). Portable to Postgres by changing `provider` to `"postgresql"` — the schema is portable.
- **`db/` folder is committed** (the SQLite file ships with the repo for dev convenience). Clear it before production deploy.
- **`src/lib/db.ts`** exports a global singleton `db`. Import as `import { db } from "@/lib/db"`.
- **Never `prisma db push` in production** — always `prisma migrate deploy`.

## Server Action conventions

`src/lib/actions/first-class.ts` is the only server action. It returns a discriminated union `FirstClassResult` — never throw for expected errors. The flow:

1. Honeypot check (`company` field must be empty) → silent `BOT` reject.
2. Rate limit (3/hour per IP, in-memory sliding window, **fail-open** on outage).
3. Zod validation → `VALIDATION` with inline field errors.
4. `db.lead.create()` → `DUPLICATE` on Prisma `P2002` (unique email constraint).
5. Success → `{ success: true, message }`.

`ipHash` is SHA-256 of the IP (never store raw IPs). See `src/lib/actions/first-class.ts:69`.

## Things that are NOT in this project (don't add without asking)

- **No auth** (no Auth.js, no NextAuth, no sessions). The form is anonymous.
- **No Stripe, no payments.** "First class free" means free.
- **No Inngest, no background jobs.**
- **No Replicate, no AI image generation.** Hero + teacher photos come from `picsum.photos` (placeholder).
- **No test framework yet.** Vitest + Playwright are planned but not installed. Manual verification via `agent-browser` for now.

The original `yoga-studio` repo (cloned at `./yoga-studio/`) had all of these — this build deliberately omits them for a calm marketing site.

## Investigating before editing

Before touching a section, read:
- `src/app/page.tsx` — to see how sections compose
- `src/components/sections/<Section>.tsx` — the section itself
- `src/lib/data/<thing>.ts` — the static content it renders
- `src/app/globals.css` — the design tokens + keyframes it uses

Before touching the form, read:
- `src/components/sections/FirstClassFree.tsx` — the client component
- `src/lib/actions/first-class.ts` — the server action
- `prisma/schema.prisma` — the `Lead` model

Before touching animations, read:
- `src/hooks/use-reduced-motion.ts` — `useSyncExternalStore` pattern
- `src/hooks/use-reveal.ts` — IntersectionObserver fade-up
- `src/hooks/use-breath-cycle.ts` — 8s rAF loop
- The `@keyframes` block in `src/app/globals.css`

## Verification after changes

```bash
bun run lint && npx tsc --noEmit   # must be 0 errors
bun run dev                         # then verify in browser:
agent-browser open http://localhost:3000/
agent-browser wait --load networkidle
agent-browser errors                # must be empty
agent-browser console               # must be empty (HMR connected is fine)
agent-browser snapshot -i           # verify all 6 sections + form fields present
```
