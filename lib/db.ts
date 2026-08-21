import postgres from "postgres";

/**
 * Lazy Postgres connection shared across the app.
 *
 * The client is created the first time it's actually needed (inside a request),
 * NOT at import time — so `next build` and any code path that doesn't touch the
 * database still works even when DATABASE_URL isn't set (e.g. during CI/build).
 *
 * In dev, the client is cached on globalThis so Next.js's hot-reload doesn't
 * open a brand-new pool on every file change.
 *
 * Works with any Postgres provider that gives you a connection string:
 * Neon, Supabase, Vercel Postgres, Railway, etc. `prepare: false` keeps it
 * compatible with transaction-pooling connection strings (Supabase's pooler,
 * Neon's pooled endpoint), which is what you want on serverless like Vercel.
 */

type Sql = ReturnType<typeof postgres>;

const globalForSql = globalThis as unknown as { _sql?: Sql };

let sqlClient: Sql | undefined = globalForSql._sql;

export function getSql(): Sql {
  if (!sqlClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Add it to .env.local for local dev, and to " +
          "your hosting provider's environment variables (e.g. Vercel → Project " +
          "Settings → Environment Variables) for production."
      );
    }
    sqlClient = postgres(connectionString, { prepare: false });
    if (process.env.NODE_ENV !== "production") {
      globalForSql._sql = sqlClient;
    }
  }
  return sqlClient;
}
