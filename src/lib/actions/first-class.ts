"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { PREFERRED_DAYS } from "@/lib/data/schedule";

/**
 * First-Class-Free form schema.
 * The honeypot field `company` must be empty — bots fill every input.
 */
const firstClassSchema = z.object({
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

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
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

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

async function getClientIp(): Promise<string> {
  // Best-effort; the gateway adds X-Forwarded-For. Fail-open if missing.
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "unknown";
}

export async function claimFirstClassAction(
  _prev: FirstClassResult | null,
  formData: FormData,
): Promise<FirstClassResult> {
  // 1. Honeypot — silently reject bots. Never tell them why.
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return {
      success: false,
      code: "BOT",
      message: "Submission rejected.",
    };
  }

  // 2. Rate limit per IP (fail-open — never block a real user because
  //    our in-memory state got into a weird place).
  let rateLimitOk = true;
  try {
    const ip = await getClientIp();
    rateLimitOk = checkRateLimit(ip).allowed;
  } catch {
    rateLimitOk = true;
  }
  if (!rateLimitOk) {
    return {
      success: false,
      code: "RATE_LIMIT",
      message:
        "You've sent a few requests already — please try again in an hour, or call us at 718 · 555 · 0142.",
    };
  }

  // 3. Validate
  const parsed = firstClassSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    preferredDay: formData.get("preferredDay"),
    notes: formData.get("notes"),
    company: formData.get("company"),
  });

  if (!parsed.success) {
    const errors: FirstClassFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "name" ||
        key === "email" ||
        key === "preferredDay" ||
        key === "notes"
      ) {
        (errors[key] ??= []).push(issue.message);
      }
    }
    return {
      success: false,
      code: "VALIDATION",
      message: "Please correct the highlighted fields.",
      errors,
    };
  }

  // 4. Persist — fail-open on duplicate email (the user already applied;
  //    just acknowledge them warmly).
  try {
    const ipHash = await (async () => {
      try {
        return hashIp(await getClientIp());
      } catch {
        return null;
      }
    })();

    await db.lead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        preferredDay: parsed.data.preferredDay,
        notes: parsed.data.notes || null,
        ipHash,
        status: "pending",
      },
    });
  } catch (err: unknown) {
    // SQLite unique constraint violation code = 2067
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        code: "DUPLICATE",
        message:
          "We already have a request from this email — Iris will write you back within a day. If you don't hear from us, check your spam folder.",
      };
    }
    // Don't leak internal errors to the client.
    return {
      success: false,
      code: "INTERNAL",
      message:
        "Something went wrong on our end. Please try again, or call us at 718 · 555 · 0142.",
    };
  }

  return {
    success: true,
    message:
      "Thank you — Iris will write you back within a day, by hand. We'll confirm your mat by email.",
  };
}
