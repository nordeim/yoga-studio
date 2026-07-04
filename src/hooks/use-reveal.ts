"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface UseRevealOptions {
  /** IntersectionObserver threshold — fraction of element visible. */
  threshold?: number;
  /** rootMargin, default pushes the trigger 8% above the viewport bottom. */
  rootMargin?: string;
  /** When false, the element can re-hide after leaving viewport. */
  once?: boolean;
}

/**
 * Fade-up reveal driven by IntersectionObserver. Pair with the `fade-up`
 * utility class — when `revealed` is true, add `fade-up-in` to toggle
 * the transition.
 *
 * Under `prefers-reduced-motion`, the element is revealed immediately
 * on mount (no transition). The reveal state is computed in the effect
 * via the observer's initial callback rather than an early setState,
 * avoiding cascading renders.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
): { ref: React.RefObject<T | null>; revealed: boolean } {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -8% 0px",
    once = true,
  } = options;
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      reduced ||
      typeof IntersectionObserver === "undefined"
    ) {
      // Reduced-motion: reveal immediately, no observer.
      // Defer to next microtask so it doesn't collide with mount.
      const raf = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, reduced]);

  return { ref, revealed };
}
