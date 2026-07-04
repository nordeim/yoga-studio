import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from '@/lib/first-class-validation';

/**
 * Unit tests for the per-IP sliding-window rate limiter.
 *
 * Per PAD §6.2, the limiter allows 3 submissions per hour per IP,
 * using an in-memory Map. The server action wraps this in a
 * fail-open try/catch, but the function itself is pure and
 * testable in isolation.
 *
 * NOTE: The rate limiter uses a module-level Map, so state persists
 * across tests in the same file. We use a unique IP per test to
 * avoid cross-test contamination.
 */
describe('checkRateLimit', () => {
  it('allows the first submission from a new IP', () => {
    const result = checkRateLimit('192.168.1.1-test-1');
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it('allows up to 3 submissions per hour from the same IP', () => {
    const ip = '192.168.1.2-test-2';
    expect(checkRateLimit(ip).allowed).toBe(true);
    expect(checkRateLimit(ip).allowed).toBe(true);
    expect(checkRateLimit(ip).allowed).toBe(true);
  });

  it('blocks the 4th submission within the same hour', () => {
    const ip = '192.168.1.3-test-3';
    checkRateLimit(ip);
    checkRateLimit(ip);
    checkRateLimit(ip);
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks different IPs independently', () => {
    const ipA = '10.0.0.1-test-4';
    const ipB = '10.0.0.2-test-4';
    checkRateLimit(ipA);
    checkRateLimit(ipA);
    checkRateLimit(ipA);

    // ipB is a different client — should still be allowed
    expect(checkRateLimit(ipA).allowed).toBe(false);
    expect(checkRateLimit(ipB).allowed).toBe(true);
  });

  it('reports a positive retryAfterMs when blocked', () => {
    const ip = '192.168.1.4-test-5';
    checkRateLimit(ip);
    checkRateLimit(ip);
    checkRateLimit(ip);
    const blocked = checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    // retryAfterMs should be roughly 1 hour (3600000ms), but
    // we only assert it's positive to avoid timing flakiness.
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});
