"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { claimFirstClassAction } from "@/lib/actions/first-class";
import type { FirstClassResult } from "@/lib/actions/first-class";
import { PREFERRED_DAYS } from "@/lib/data/schedule";
import { SectionHead } from "@/components/sections/SectionHead";
import { Reveal } from "@/components/sections/Reveal";

const FIRST_CLASS_PERKS = [
  "Choose any class, any teacher, any room.",
  "Mat, two blankets, a bolster, and towel — all provided.",
  "We will write you back within a day, by hand.",
  "Parking validated. Bike room in the back.",
];

/**
 * First-Class-Free section — two-column layout. Left column is editorial
 * copy + perks; right column is the capture form. The form posts to a
 * Server Action (zod-validated, honeypot-protected, per-IP rate-limited).
 *
 * On success, the entire form is replaced by a quiet acknowledgement.
 * On validation errors, fields render inline errors with `aria-invalid`
 * + `aria-describedby` per WCAG AAA.
 */
export function FirstClassFree() {
  return (
    <section
      id="signup"
      className="relative overflow-hidden bg-sand px-8 py-40 pb-48 max-[960px]:px-6 max-[960px]:py-24"
    >
      {/* Decorative radial blooms */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[10%] -top-[10%] h-[70%] w-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(212,165,160,0.4) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[10%] -left-[10%] h-[70%] w-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(138,154,135,0.25) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-[2] mx-auto grid max-w-[1180px] grid-cols-2 items-start gap-24 max-[960px]:grid-cols-1 max-[960px]:gap-12">
        {/* Left — copy + perks */}
        <div className="pt-4">
          <SectionHead
            align="left"
            label="05 · First Class Free"
            title={
              <>
                Come sit
                <br />
                <em className="font-light italic text-terracotta-deep">
                  with us.
                </em>
              </>
            }
            lead="Your first class is on us. No card. No commitment. Just a mat by the window, an hour that is yours alone, and tea afterward if you'd like to stay."
          />

          <Reveal delay={3}>
            <ul className="mt-12 border-t border-ink-line pt-8">
              {FIRST_CLASS_PERKS.map((perk) => (
                <li
                  key={perk}
                  className="py-2.5 font-serif text-[1rem] font-light italic leading-[1.5] text-ink-soft"
                >
                  <span
                    aria-hidden="true"
                    className="mr-3 -translate-y-1 inline-block text-[1.4em] not-italic text-terracotta"
                  >
                    ·
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Right — the form */}
        <Reveal delay={2}>
          <FirstClassForm />
        </Reveal>
      </div>
    </section>
  );
}

function FirstClassForm() {
  const [state, formAction, isPending] = useActionState<
    FirstClassResult | null,
    FormData
  >(claimFirstClassAction, null);

  const [preferredDay, setPreferredDay] = useState<string>("");
  const errors = state?.success === false ? state.errors : undefined;
  const isSuccess = state?.success === true;

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md bg-linen-50 p-12 shadow-[0_30px_60px_-40px_rgba(44,38,32,0.2)]"
      >
        <h3
          className="mb-4 font-serif text-[2rem] font-light leading-tight text-ink"
          style={{ fontVariationSettings: '"opsz" 60' }}
        >
          Thank you.
        </h3>
        <p className="font-serif text-[1.05rem] font-light italic leading-[1.65] text-ink-soft">
          {state.message}
        </p>
        <Link
          href="#schedule"
          className="mt-8 inline-flex items-center gap-3 font-sans text-[12px] font-medium uppercase tracking-[0.22em] text-terracotta transition-colors hover:text-terracotta-deep"
        >
          <span>See this week's schedule</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      noValidate
      className="rounded-md bg-linen-50 p-12 shadow-[0_30px_60px_-40px_rgba(44,38,32,0.2)] max-[960px]:p-8"
      aria-describedby="form-status"
    >
      {/* Honeypot — visually hidden, NOT aria-hidden (bots fill it) */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <Field
        id="name"
        label="Your name"
        error={errors?.name?.[0]}
        required
      >
        <input
          type="text"
          id="name"
          name="name"
          required
          autoComplete="name"
          placeholder="First and last"
          aria-invalid={!!errors?.name}
          aria-describedby={errors?.name ? "name-error" : undefined}
          className="w-full border-b border-ink-line bg-transparent py-2.5 font-serif text-[1.1rem] font-light text-ink transition-colors duration-500 placeholder:font-serif placeholder:italic placeholder:text-ink-mute focus:border-terracotta focus:outline-none"
        />
      </Field>

      <Field
        id="email"
        label="Email"
        error={errors?.email?.[0]}
        required
      >
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@home.com"
          aria-invalid={!!errors?.email}
          aria-describedby={errors?.email ? "email-error" : undefined}
          className="w-full border-b border-ink-line bg-transparent py-2.5 font-serif text-[1.1rem] font-light text-ink transition-colors duration-500 placeholder:font-serif placeholder:italic placeholder:text-ink-mute focus:border-terracotta focus:outline-none"
        />
      </Field>

      <Field
        id="preferredDay"
        label="Preferred day"
        error={errors?.preferredDay?.[0]}
        required
      >
        <select
          id="preferredDay"
          name="preferredDay"
          required
          value={preferredDay}
          onChange={(e) => setPreferredDay(e.target.value)}
          aria-invalid={!!errors?.preferredDay}
          aria-describedby={
            errors?.preferredDay ? "preferredDay-error" : undefined
          }
          className={`w-full border-b border-ink-line bg-transparent py-2.5 font-serif text-[1.1rem] font-light transition-colors duration-500 focus:border-terracotta focus:outline-none ${
            preferredDay ? "text-ink" : "text-ink-mute"
          }`}
        >
          <option value="" disabled>
            Choose a time
          </option>
          {PREFERRED_DAYS.map((day) => (
            <option key={day} value={day} className="text-ink">
              {day}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="notes"
        label={
          <>
            Anything we should know?{" "}
            <em className="font-sans text-[11px] font-normal not-italic tracking-normal text-ink-mute">
              (optional)
            </em>
          </>
        }
      >
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Injuries, experience, what you are looking for..."
          className="min-h-[60px] w-full resize-y border-b border-ink-line bg-transparent py-2.5 font-serif text-[0.95rem] font-light leading-[1.6] text-ink transition-colors duration-500 placeholder:font-serif placeholder:italic placeholder:text-ink-mute focus:border-terracotta focus:outline-none"
        />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-ink py-5 font-sans text-[12px] font-medium uppercase tracking-[0.22em] text-linen-50 transition-all duration-600 hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{isPending ? "Sending…" : "Reserve my first mat"}</span>
        {!isPending && <span aria-hidden="true">→</span>}
      </button>

      <p
        id="form-status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-5 text-center font-serif text-[0.85rem] italic leading-[1.5] text-ink-mute"
      >
        {state?.success === false && state.code === "RATE_LIMIT" && (
          <span className="text-terracotta">{state.message}</span>
        )}
        {state?.success === false && state.code === "DUPLICATE" && (
          <span className="text-terracotta">{state.message}</span>
        )}
        {state?.success === false && state.code === "BOT" && (
          <span>{state.message}</span>
        )}
        {state?.success === false && state.code === "VALIDATION" && (
          <span className="text-terracotta">{state.message}</span>
        )}
        {state?.success === false && state.code === "INTERNAL" && (
          <span className="text-terracotta">{state.message}</span>
        )}
        {(!state || state.success === false) &&
          state?.code !== "RATE_LIMIT" &&
          state?.code !== "DUPLICATE" &&
          state?.code !== "BOT" &&
          state?.code !== "VALIDATION" &&
          state?.code !== "INTERNAL" && (
            <>No credit card. No confirmation email until Iris writes you back, by hand.</>
          )}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="mb-2.5 block font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-ink-mute"
      >
        {label}
        {required && (
          <span className="sr-only"> (required)</span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 font-sans text-[12px] italic text-terracotta"
        >
          {error}
        </p>
      )}
    </div>
  );
}
