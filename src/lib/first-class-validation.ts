import { z } from "zod";
import { createHash } from "node:crypto";
import { PREFERRED_DAYS } from "@/lib/data/schedule";

/**
 * Pure validation + rate-limiting logic for the First-Class-Free form.
 *
 * Extracted from `src/lib/actions/first-class.ts` so it can be unit-tested
 * in isolation. The `'use server'` directive on the action file forbids
 * exporting synchronous functions (Next.js requires all exports from a
 * server-action module to be async), so pure logic lives here.
 *
 * Per PAD §6.2: 3 submissions per hour per IP, in-memory sliding window.
 */

/**
 * First-Class-Free form schema.
 * The honeypot field `company` must be empty — bots fill every input.
 */
export const firstClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name")
    .max(80, "That's a bit long — under 80 characters, please"),
  email: z
    .string()
    .trim()
    .email("A valid email is required")
    .max(160, "That email is too long"),
  preferredDay: z.enum(PREFERRED_DAYS, {
    message: "Please choose a preferred time",
  }),
  notes: z
    .string()
    .trim()
    .max(500, "Under 500 characters, please — we read every word")
    .optional()
    .or(z.literal("")),
  company: z.string().max(0, "Bot detected").optional(), // honeypot
});

export type FirstClassFieldErrors = Partial<
  Record<"name" | "email" | "preferredDay" | "notes", string[]>
>;

export type FirstClassResult =
  | { success: true; message: string }
  | {
      success: false;
      code: "VALIDATION" | "RATE_LIMIT" | "BOT" | "DUPLICATE" | "INTERNAL";
      message: string;
      errors?: FirstClassFieldErrors;
    };

/** In-memory sliding-window rate limiter (per IP). */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // 3 submissions per hour per IP
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(ip) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    const oldest = timestamps[0] ?? now;
    return { allowed: false, retryAfterMs: oldest + RATE_LIMIT_WINDOW_MS - now };
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
