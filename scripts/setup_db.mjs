/**
 * One-time (and re-runnable) database setup for the job board.
 *
 *   npm run db:setup
 *
 * What it does:
 *  1. Reads DATABASE_URL from your environment or from .env.local / .env.
 *  2. Creates the `jobs` table if it doesn't already exist.
 *  3. Loads every posting from data/jobs.json into the table (upsert by id),
 *     so your existing postings are there the first time you deploy.
 *
 * It's safe to run more than once. Upsert means re-running updates rows that
 * already exist and inserts new ones — it never creates duplicates. It does
 * NOT delete rows that are missing from jobs.json (once you're editing through
 * /admin, the database is the source of truth, not the file).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- tiny .env loader (so this standalone script sees DATABASE_URL like Next does)
function loadEnvFile(file) {
  const full = path.join(projectRoot, file);
  if (!fs.existsSync(full)) return;
  for (const rawLine of fs.readFileSync(full, "utf-8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "\n✖ DATABASE_URL is not set.\n\n" +
      "  Create a free Postgres database (Neon or Supabase), copy its connection\n" +
      "  string, and put it in a file named .env.local in the project root:\n\n" +
      "      DATABASE_URL=postgres://user:password@host/dbname?sslmode=require\n\n" +
      "  Then run `npm run db:setup` again.\n"
  );
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id            text PRIMARY KEY,
      role          text NOT NULL,
      venue         text NOT NULL,
      city          text NOT NULL,
      country       text NOT NULL DEFAULT '',
      description   text NOT NULL DEFAULT '',
      apply_method  text NOT NULL DEFAULT 'instagram',
      apply_contact text NOT NULL DEFAULT '',
      instagram_url text NOT NULL DEFAULT '',
      status        text NOT NULL DEFAULT 'open',
      posted_at     text NOT NULL
    )
  `;
  console.log("✔ Table `jobs` is ready.");

  const dataFile = path.join(projectRoot, "data", "jobs.json");
  if (!fs.existsSync(dataFile)) {
    console.log("• No data/jobs.json found — nothing to import. Table is empty and ready.");
    return;
  }

  let jobs;
  try {
    jobs = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  } catch (err) {
    console.error(`✖ Could not parse data/jobs.json: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(jobs) || jobs.length === 0) {
    console.log("• data/jobs.json has no postings — table left as is.");
    return;
  }

  let imported = 0;
  for (const j of jobs) {
    if (!j || !j.id || !j.role || !j.venue || !j.city) {
      console.warn(`  ⚠ Skipped a posting missing id/role/venue/city: ${JSON.stringify(j?.role ?? j)}`);
      continue;
    }
    await sql`
      INSERT INTO jobs (
        id, role, venue, city, country, description,
        apply_method, apply_contact, instagram_url, status, posted_at
      ) VALUES (
        ${j.id}, ${j.role}, ${j.venue}, ${j.city}, ${j.country ?? ""}, ${j.description ?? ""},
        ${j.applyMethod ?? "instagram"}, ${j.applyContact ?? ""}, ${j.instagramUrl ?? ""},
        ${j.status ?? "open"}, ${j.postedAt ?? new Date().toISOString().slice(0, 10)}
      )
      ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        venue = EXCLUDED.venue,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        description = EXCLUDED.description,
        apply_method = EXCLUDED.apply_method,
        apply_contact = EXCLUDED.apply_contact,
        instagram_url = EXCLUDED.instagram_url,
        status = EXCLUDED.status,
        posted_at = EXCLUDED.posted_at
    `;
    imported += 1;
  }

  console.log(`✔ Imported/updated ${imported} posting(s) from data/jobs.json.`);
}

main()
  .then(() => sql.end())
  .then(() => {
    console.log("\nDone. Your database is ready to use. 🎉");
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n✖ Database setup failed:", err.message);
    await sql.end().catch(() => {});
    process.exit(1);
  });
