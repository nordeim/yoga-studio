"use client";

import { useEffect, useState } from "react";
import { useBreathCycle } from "@/hooks/use-breath-cycle";

/**
 * Persistent breath guide — a small terracotta orb in the bottom-left
 * corner that pulses on the same 8-second cycle as the hero. The label
 * counts 1..4 inhale, then 1..4 exhale, so the page itself appears to
 * be breathing alongside the visitor.
 *
 * Hidden entirely under reduced-motion.
 */
export function BreathGuide() {
  const [mounted, setMounted] = useState(false);
  const breath = useBreathCycle(mounted);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce) return null;

  return (
    <div
      className={`fixed bottom-7 left-7 z-[90] flex items-center gap-3 transition-all duration-1000 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0"
      } max-[960px]:bottom-5 max-[960px]:left-5`}
      aria-hidden="true"
    >
      <span
        className="block h-[11px] w-[11px] rounded-full bg-terracotta"
        style={{ animation: "var(--animate-breath-orb)" }}
      />
      <div className="flex flex-col leading-tight">
        <span className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
          {breath.phase === "inhale"
            ? "Inhale"
            : breath.phase === "exhale"
              ? "Exhale"
              : "Breath"}
        </span>
        <span className="mt-0.5 font-serif text-[0.78rem] italic text-ink-mute tabular-nums">
          slow · {breath.second} of 4
        </span>
      </div>
    </div>
  );
}
