import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * SSR-safe mobile breakpoint hook.
 *
 * Uses `useSyncExternalStore` — the React 18+ idiom for subscribing to
 * external state — to avoid the `react-hooks/set-state-in-effect` lint
 * error that the prior `useEffect` + `setState` implementation triggered.
 * Mirrors the pattern in `use-reduced-motion.ts` (ADR-007).
 *
 * Defaults to `false` on the server and during the first client paint,
 * then resolves to the real media-query value after mount. This avoids
 * both hydration mismatches and a flash of the wrong layout.
 */
function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia(MOBILE_QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
