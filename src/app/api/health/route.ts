import { NextResponse } from "next/server";

/**
 * Health check endpoint — used by Docker HEALTHCHECK and load balancers.
 *
 * Returns 200 with a JSON body when the app is healthy and ready to serve
 * traffic. Returns 503 when the database is unreachable.
 *
 * Checks:
 *   1. Database connectivity — attempts a trivial Prisma query.
 *
 * Intentionally lightweight — no auth, no rate limit, no logging.
 * Called every 30s by the Docker healthcheck.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Dynamic import so the health check doesn't pull Prisma into the
    // build's static analysis if this route is never hit.
    const { db } = await import("@/lib/db");
    // Trivial query — `$queryRaw` with a constant. On SQLite this is
    // `SELECT 1`. If the DB file is missing or locked, this throws.
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      { status: "degraded", database: "disconnected", error: message },
      { status: 503 },
    );
  }
}
