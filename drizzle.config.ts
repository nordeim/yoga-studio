import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration — used for `drizzle-kit generate` (create migrations)
 * and `drizzle-kit migrate` (apply migrations).
 *
 * Uses DATABASE_URL_UNPOOLED (the direct Neon connection) because DDL operations
 * are unreliable over the pooled PgBouncer connection.
 *
 * Commands:
 *   pnpm drizzle-kit generate   # Create a migration from schema changes
 *   pnpm drizzle-kit migrate    # Apply migrations to the database
 *   pnpm drizzle-kit studio     # Open the schema browser
 *
 * NEVER use `drizzle-kit push` in production — always generate + review + migrate.
 */
export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
  verbose: true,
  strict: true,
});
