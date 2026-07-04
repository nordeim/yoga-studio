/**
 * Vitest global setup — runs before every test file.
 *
 * Intentionally minimal. Add `@testing-library/jest-dom` here when
 * component tests are introduced (PAD §8.2, planned).
 */

// jsdom doesn't implement matchMedia — stub it so hooks like
// useReducedMotion and useIsMobile don't throw during tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
