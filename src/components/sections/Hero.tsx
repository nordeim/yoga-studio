"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Hero — full-viewport Ken Burns photo on an 8-second breath cycle
 * (alternate scale/translate), with a radial veil and diagonal sunbeam
 * overlay. The headline fades up on mount; the scroll cue pulses.
 *
 * The hero image pauses its animation when scrolled off-screen to
 * keep the rAF budget honest.
 */
export function Hero() {
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        const [e] = entries;
        if (e) setInView(e.isIntersecting);
      },
      { threshold: 0 },
    );
    const el = document.getElementById("top");
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="top"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-8 pb-24 pt-32 text-center text-linen-50"
    >
      {/* Photo + breath cycle */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-[-3%]"
          style={{
            animation: reduced
              ? undefined
              : "var(--animate-hero-breath)",
            animationPlayState: inView ? "running" : "paused",
          }}
        >
          <Image
            src="https://picsum.photos/seed/yoga-morning-light-studio-window/2400/1600"
            alt="Soft morning light through tall windows onto a wooden studio floor"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{
              filter: "brightness(0.78) saturate(0.85) contrast(0.95)",
            }}
          />
        </div>
      </div>

      {/* Radial veil + bottom gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, transparent 0%, rgba(40,32,24,0.35) 70%, rgba(30,22,16,0.7) 100%), linear-gradient(180deg, rgba(40,32,24,0.45) 0%, transparent 35%, transparent 65%, rgba(30,22,16,0.55) 100%)",
        }}
      />

      {/* Diagonal sunbeam */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-screen"
        style={{
          background:
            "linear-gradient(115deg, transparent 22%, rgba(255,232,200,0.16) 28%, transparent 35%, transparent 52%, rgba(255,232,200,0.10) 60%, transparent 67%)",
        }}
      />

      {/* Content */}
      <div className="relative z-[3] max-w-[920px]">
        <HeroLabel />
        <h1
          className="font-serif font-light leading-[0.95] tracking-[-0.025em] text-linen-50"
          style={{
            fontVariationSettings: '"opsz" 144',
            fontSize: "clamp(4rem, 14vw, 11rem)",
          }}
        >
          Stillwater
        </h1>
        <p
          className="mx-auto mb-14 max-w-[480px] font-serif text-[clamp(1.05rem,1.6vw,1.3rem)] font-light italic leading-[1.65] text-linen-50/85"
          style={{ fontVariationSettings: '"opsz" 24' }}
        >
          Slow practice for fast lives. Eight mats to a room, one breath at a
          time, taught by people who have done this for twenty years.
        </p>
        <Link
          href="#signup"
          className="inline-flex items-center gap-4 rounded-full border border-linen-50/45 bg-linen-50/5 px-10 py-4.5 font-sans text-[12px] font-medium uppercase tracking-[0.22em] text-linen-50 transition-all duration-600 hover:border-linen-50 hover:bg-linen-50 hover:text-ink"
          style={{ paddingBlock: "1.15rem", paddingInline: "2.4rem" }}
        >
          <span>Reserve a mat</span>
          <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">
            →
          </span>
        </Link>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-10 left-1/2 z-[3] flex -translate-x-1/2 flex-col items-center gap-4 text-linen-50/70">
        <span className="text-[10px] font-medium uppercase tracking-[0.32em]">
          scroll
        </span>
        <span
          className="relative block h-[50px] w-px overflow-hidden bg-linen-50/25"
          aria-hidden="true"
        >
          <span
            className="absolute left-0 top-[-50%] block h-1/2 w-full bg-linen-50/80"
            style={{ animation: "var(--animate-scrollline)" }}
          />
        </span>
      </div>
    </section>
  );
}

function HeroLabel() {
  return (
    <div className="mb-14 font-sans text-[11px] font-medium uppercase tracking-[0.36em] text-linen-50/78">
      <span>A Yoga Studio</span>
      <span className="mx-4 inline-block h-px w-7 align-middle bg-linen-50/50" />
      <span>Cobble Hill, Brooklyn</span>
      <span className="mx-4 inline-block h-px w-7 align-middle bg-linen-50/50" />
      <span>Est. 2014</span>
    </div>
  );
}
