"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { TEACHERS } from "@/lib/data/teachers";
import type { Teacher } from "@/lib/data/teachers";
import { SectionHead } from "@/components/sections/SectionHead";
import { Reveal } from "@/components/sections/Reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Teachers — three-card grid. Hover (or tap, on touch) reveals the
 * teacher's "why I teach" quote, typed out character-by-character at
 * ~28ms/char with natural pauses on spaces, commas, and em-dashes.
 *
 * The typewriter is gated by `prefers-reduced-motion` — when reduced,
 * the full quote is shown immediately on hover/tap with no animation.
 */
export function Teachers() {
  return (
    <section
      id="teachers"
      className="relative bg-linen-200 px-8 py-40 max-[960px]:px-6 max-[960px]:py-24"
    >
      <SectionHead
        label="03 · Teachers"
        title={
          <>
            The people
            <br />
            <em className="font-light italic text-sage-deep">
              who hold the room.
            </em>
          </>
        }
        lead="Three teachers, forty-one years of practice between them. Hover over any card to read why they still teach."
      />

      <div className="mx-auto mt-24 grid max-w-[1280px] grid-cols-3 gap-12 max-[960px]:mt-16 max-[960px]:grid-cols-1 max-[960px]:gap-8">
        {TEACHERS.map((teacher, i) => (
          <Reveal key={teacher.id} delay={(i + 1) as 1 | 2 | 3}>
            <TeacherCard teacher={teacher} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const reduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iRef = useRef(0);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    iRef.current = 0;
    setTyped("");
    setTyping(false);
  };

  const type = () => {
    if (typing) return;
    setTyping(true);
    iRef.current = 0;
    setTyped("");

    if (reduced) {
      setTyped(teacher.quote);
      return;
    }

    const step = () => {
      const i = iRef.current;
      if (i >= teacher.quote.length) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        return;
      }
      setTyped(teacher.quote.slice(0, i + 1));
      iRef.current = i + 1;

      const lastChar = teacher.quote[i] ?? " ";
      const delay =
        lastChar === " "
          ? 18
          : lastChar === ","
            ? 60
            : lastChar === "." || lastChar === "—"
              ? 140
              : 28;
      timerRef.current = setTimeout(step, delay);
    };
    step();
  };

  useEffect(() => () => clear(), []);

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-[4px] bg-linen-50 transition-transform duration-800 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(44,38,32,0.18)]"
      onMouseEnter={type}
      onMouseLeave={clear}
      onClick={() => (typing ? clear() : type())}
      aria-label={`${teacher.name}, ${teacher.role}. Tap to ${typing ? "hide" : "reveal"} their teaching quote.`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Image
          src={teacher.photo.src}
          alt={teacher.photo.alt}
          fill
          sizes="(max-width: 960px) 100vw, 33vw"
          className="object-cover transition-transform duration-1400 group-hover:scale-[1.06]"
          style={{ filter: "saturate(0.85) contrast(0.95)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 50%, rgba(60,50,40,0.18) 100%)",
          }}
        />
      </div>

      <div className="px-7 pb-10 pt-8">
        <h3
          className="font-serif text-[1.6rem] font-normal leading-[1.1] text-ink"
          style={{ fontVariationSettings: '"opsz" 60' }}
        >
          {teacher.name}
        </h3>
        <div className="mb-6 mt-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-sage-deep">
          {teacher.role}
        </div>

        <div className="relative min-h-[90px] border-t border-ink-line-soft pt-5">
          {!typing && (
            <p className="font-serif text-[0.92rem] italic text-ink-mute transition-opacity duration-500">
              <span className="not-italic text-terracotta">↳ </span>
              {typed ? "tap to hide" : "hover to read my why"}
            </p>
          )}
          {typing && (
            <blockquote className="absolute left-0 right-0 top-5 font-serif text-[0.95rem] font-light italic leading-[1.65] text-ink">
              <span className="not-italic text-terracotta">“</span>
              {typed}
              {!reduced && typed.length < teacher.quote.length && (
                <span
                  className="ml-px inline-block h-[1em] w-[2px] translate-y-[0.15em] bg-terracotta align-text-bottom"
                  style={{ animation: "var(--animate-cursor-blink)" }}
                  aria-hidden="true"
                />
              )}
            </blockquote>
          )}
        </div>
      </div>
    </article>
  );
}
