"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe `prefers-reduced-motion` listener.
 *
 * Uses `useSyncExternalStore` — the React 18+ idiom for subscribing to
 * external state. Defaults to `false` on the server and during the first
 * client paint, then resolves to the real media-query value after mount.
 * This avoids both hydration mismatches and a flash of motion for
 * sensitive users.
 *
 * Per WCAG 2.3.3, when this returns `true` you should DISABLE animations
 * entirely (not slow them) — slowed animations can trigger vestibular
 * discomfort.
 */
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

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
