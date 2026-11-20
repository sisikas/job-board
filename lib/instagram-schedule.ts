import { randomUUID } from "crypto";
import { getSql } from "@/lib/db";

/**
 * Admin Instagram schedule. The table is created on first use, same as the
 * account tables. Images stay in Postgres and are only served to a logged-in
 * admin. `npm run db:setup` creates the table too.
 */

export type InstaStatus = "pending" | "uploaded";

export type InstaPost = {
  id: string;
  postDate: string;
  caption: string;
  status: InstaStatus;
  hasImage: boolean;
  createdAt: string;
  updatedAt: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CAPTION_MAX = 10000;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type InstaRow = {
  id: string;
  post_date: string;
  caption: string;
  status: string;
  has_image: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

let tableReady: Promise<void> | undefined;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    const sql = getSql();
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS instagram_posts (
          id text PRIMARY KEY,
          post_date text NOT NULL,
          caption text NOT NULL DEFAULT '',
          status text NOT NULL DEFAULT 'pending',
          image_bytes bytea,
          image_type text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS sort_order integer`;
      await sql`
        WITH ranked AS (
          SELECT id, (row_number() OVER (ORDER BY post_date DESC, created_at DESC))::int - 1 AS n
          FROM instagram_posts
          WHERE sort_order IS NULL
        )
        UPDATE instagram_posts AS posts
        SET sort_order = ranked.n
        FROM ranked
        WHERE posts.id = ranked.id
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS instagram_posts_order_idx
        ON instagram_posts (sort_order, created_at)
      `;
    })().catch((err) => {
      tableReady = undefined;
      throw err;
    });
  }
  return tableReady;
}

function stamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function asStatus(value: string): InstaStatus {
  return value === "uploaded" ? "uploaded" : "pending";
}

function rowToPost(row: InstaRow): InstaPost {
  return {
    id: row.id,
    postDate: row.post_date,
    caption: row.caption ?? "",
    status: asStatus(row.status),
    hasImage: Boolean(row.has_image),
    createdAt: stamp(row.created_at),
    updatedAt: stamp(row.updated_at),
  };
}

export function parseInstaDate(value: unknown): string | null {
  if (typeof value !== "string" || !DATE_RE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

export function parseInstaStatus(value: unknown): InstaStatus | null {
  if (value === "pending" || value === "uploaded") return value;
  return null;
}

export function parseCaption(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length > CAPTION_MAX) return null;
  return value;
}

export function allowedImageType(value: string): boolean {
  return IMAGE_TYPES.has(value);
}

export async function listInstaPosts(): Promise<InstaPost[]> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<InstaRow[]>`
    SELECT id, post_date, caption, status,
           (image_bytes IS NOT NULL) AS has_image,
           created_at, updated_at
    FROM instagram_posts
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map(rowToPost);
}

async function readPost(id: string): Promise<InstaPost | null> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<InstaRow[]>`
    SELECT id, post_date, caption, status,
           (image_bytes IS NOT NULL) AS has_image,
           created_at, updated_at
    FROM instagram_posts
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToPost(rows[0]) : null;
}

export async function createInstaPost(input: { caption: string }): Promise<InstaPost> {
  await ensureTable();
  const sql = getSql();
  const id = randomUUID();
  const postDate = new Date().toISOString().slice(0, 10);
  const next = await sql<{ n: number }[]>`
    SELECT COALESCE(MIN(sort_order) - 1, 0)::int AS n FROM instagram_posts
  `;
  const sortOrder = Number(next[0]?.n ?? 0);
  const rows = await sql<InstaRow[]>`
    INSERT INTO instagram_posts (id, post_date, caption, status, sort_order)
    VALUES (${id}, ${postDate}, ${input.caption}, 'pending', ${sortOrder})
    RETURNING id, post_date, caption, status,
              (image_bytes IS NOT NULL) AS has_image,
              created_at, updated_at
  `;
  return rowToPost(rows[0]);
}

export async function updateInstaPost(
  id: string,
  patch: { postDate?: string; caption?: string; status?: InstaStatus }
): Promise<InstaPost | null> {
  await ensureTable();
  const existing = await readPost(id);
  if (!existing) return null;
  const postDate = patch.postDate ?? existing.postDate;
  const caption = patch.caption ?? existing.caption;
  const status = patch.status ?? existing.status;
  const sql = getSql();
  const rows = await sql<InstaRow[]>`
    UPDATE instagram_posts
    SET post_date = ${postDate},
        caption = ${caption},
        status = ${status},
        updated_at = now()
    WHERE id = ${id}
    RETURNING id, post_date, caption, status,
              (image_bytes IS NOT NULL) AS has_image,
              created_at, updated_at
  `;
  return rows[0] ? rowToPost(rows[0]) : null;
}

export async function setInstaImage(
  id: string,
  bytes: Buffer,
  type: string
): Promise<InstaPost | null> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<InstaRow[]>`
    UPDATE instagram_posts
    SET image_bytes = ${bytes},
        image_type = ${type},
        updated_at = now()
    WHERE id = ${id}
    RETURNING id, post_date, caption, status,
              (image_bytes IS NOT NULL) AS has_image,
              created_at, updated_at
  `;
  return rows[0] ? rowToPost(rows[0]) : null;
}

export async function getInstaImage(
  id: string
): Promise<{ bytes: Buffer; type: string } | null> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<{ image_bytes: Buffer | null; image_type: string | null }[]>`
    SELECT image_bytes, image_type
    FROM instagram_posts
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row?.image_bytes || !row.image_type || !allowedImageType(row.image_type)) return null;
  const bytes = Buffer.isBuffer(row.image_bytes) ? row.image_bytes : Buffer.from(row.image_bytes);
  if (bytes.length === 0) return null;
  return { bytes, type: row.image_type };
}

const POST_ID = /^[0-9a-f-]{36}$/i;

/** Saves the grid order. The first id is the top-left photo. */
export async function reorderInstaPosts(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.filter((id) => POST_ID.test(id)))];
  if (unique.length === 0) return;
  await ensureTable();
  await getSql().begin(async (tx) => {
    for (let index = 0; index < unique.length; index++) {
      await tx`
        UPDATE instagram_posts
        SET sort_order = ${index}, updated_at = now()
        WHERE id = ${unique[index]}
      `;
    }
  });
}

export async function deleteInstaPost(id: string): Promise<boolean> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<{ id: string }[]>`
    DELETE FROM instagram_posts WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}
