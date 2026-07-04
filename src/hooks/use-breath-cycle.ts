"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drives the breath-guide phase label on an 8-second cycle:
 * 0–4s inhale, 4–8s exhale. Counts 1..4 within each phase so the
 * pill reads "Inhale · 3 of 4" — same cadence as a yogic breath.
 *
 * Returns `null` for phase when reduced-motion is preferred; the caller
 * should hide the orb entirely in that case.
 */
export interface BreathState {
  phase: "inhale" | "exhale" | null;
  second: number; // 1..4
}

export function useBreathCycle(enabled: boolean): BreathState {
  const [state, setState] = useState<BreathState>({
    phase: null,
    second: 1,
  });
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    startRef.current = performance.now();
    let rafId = 0;

    const tick = () => {
      const start = startRef.current;
      if (start === null) return;
      const elapsed = (performance.now() - start) / 1000;
      const cycle = elapsed % 8; // 0–4 inhale, 4–8 exhale
      const second = Math.floor(cycle % 4) + 1;
      setState({
        phase: cycle < 4 ? "inhale" : "exhale",
        second,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  return state;
}
