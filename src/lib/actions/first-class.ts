"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  firstClassSchema,
  checkRateLimit,
  hashIp,
  type FirstClassResult,
  type FirstClassFieldErrors,
} from "@/lib/first-class-validation";

// Re-export the types so existing imports from this module still work.
export type { FirstClassResult, FirstClassFieldErrors };

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
