# Open Positions — job board

A small web app for sharing your open job postings as a link. People who DM
you on Instagram asking about a role can be sent to this page, where they can
search by role or filter by location and see the details for each opening.

- `/` — public page: search bar + location filter, job cards that link to
  each posting's own page
- `/jobs/[id]` — a single posting's own page, with its full description, an
  apply button, and a "more roles like this" section underneath. This is the
  link to send someone who's asking about one specific role — copy it
  straight from your browser's address bar, or from the admin table (see
  below).
- `/admin` — password-protected page to add, edit, mark filled, or delete
  postings from a simple table (no coding needed after setup). **This is the
  main way to manage postings — it works live even after you deploy**, because
  postings are stored in a Postgres database (see "Data storage" below).
- `Positions.xlsx` — an *optional* fillable spreadsheet for entering a batch of
  postings at once instead of typing them into `/admin` one by one. Fill it in
  (Excel, Numbers, Google Sheets all work — just export/save as `.xlsx`), then
  load it into the database with two commands (see "Bulk entry via the
  spreadsheet" below).

## Bulk entry via the spreadsheet (optional)

You don't need this for day-to-day use — `/admin` handles adding and editing
postings live. It's just a convenience for entering a big batch at once.

1. Open `Positions.xlsx`. The "Instructions" tab explains each column; the
   "Postings" tab is where you add rows.
2. Delete the italic example row once you've seen the format, and add one
   row per opening. Only Role, Venue and City are required.
3. Set Apply Method to `instagram`, `email`, or `link`, and put the matching
   value in Apply Contact — an `@handle`, an email address, or a URL. This
   is what decides whether a posting's "apply" button opens an Instagram DM
   or an email draft.
4. Leave the ID column blank for new postings. Don't edit the ID on a row
   that already has one — that's what lets the importer update the right
   posting instead of creating a duplicate.
5. To take a posting down, set its Status to `filled` rather than deleting
   the row.
6. Save the file, then run these two commands (the first turns the
   spreadsheet into `data/jobs.json`; the second loads it into the database):

   ```bash
   python3 scripts/import_jobs.py Positions.xlsx
   npm run db:setup
   ```

   `import_jobs.py` needs Python 3 with `openpyxl` (`pip install openpyxl`
   if you don't have it). `npm run db:setup` upserts by ID, so re-running is
   safe — it updates existing postings and adds new ones, and never creates
   duplicates. Note it does **not** delete postings that you removed from the
   spreadsheet; delete those from `/admin` (once you're live, the database is
   the source of truth, not the file).

You can also just send me an updated `Positions.xlsx` and I'll hand back the
updated `data/jobs.json` for you to load.

## Running it locally

You need a Postgres connection string (free — see "Data storage" below), then:

```bash
npm install                       # first time, and after pulling new deps
# create .env.local with DATABASE_URL and ADMIN_PASSWORD (see below)
npm run db:setup                  # first time: creates the table + loads postings
npm run dev
```

Then open http://localhost:3000 for the public page and
http://localhost:3000/admin for the admin table.

**Default admin password:** `changeme` — set your own before sharing this
with anyone (see below).

## Setting the admin password

The admin page is protected by a single password, read from the
`ADMIN_PASSWORD` environment variable.

- **Locally:** create a file named `.env.local` in the project root with
  both your database URL and your admin password (see `.env.local.example`
  for a template):

  ```
  DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
  ADMIN_PASSWORD=your-own-password
  ```

- **On Vercel:** add both `DATABASE_URL` and `ADMIN_PASSWORD` under Project
  Settings → Environment Variables before (or after) deploying, then redeploy.

## Data storage

Job postings live in a **Postgres database** — a single `jobs` table, reached
through `lib/db.ts` and read/written by the functions in `lib/jobs.ts`. Because
it's a real database and not a file on disk, adding, editing, marking filled,
and deleting through `/admin` **persist in production** — including on Vercel,
whose serverless filesystem is read-only. This is what lets you keep using the
admin interface live after deploying.

You need a Postgres connection string. Any provider works; two good free
options:

- **Neon** (https://neon.tech) — sign up, create a project, and copy the
  connection string it shows you (use the **pooled** one if it offers a
  choice). It looks like
  `postgres://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`.
- **Supabase** (https://supabase.com) — create a project, then
  Project Settings → Database → Connection string → **Transaction pooler**.

Put that string in `DATABASE_URL` — in `.env.local` for local dev, and in your
host's environment variables for production. Then run once:

```bash
npm run db:setup
```

That creates the `jobs` table if it doesn't exist and loads any postings from
`data/jobs.json` into it (so your current postings are there from day one).
It's safe to re-run.

If you ever want to swap Postgres for something else, everything the app needs
from storage is the handful of functions exported by `lib/jobs.ts`
(`getAllJobs`, `searchJobs`, `getJob`, `getSimilarJobs`, `getLocations`,
`createJob`, `updateJob`, `deleteJob`) — keep those names and shapes and
nothing in `app/` has to change.

## Deploying to Vercel

1. Create a free Postgres database and copy its connection string (see
   "Data storage" above).
2. Push this project to a GitHub repo.
3. Import the repo in Vercel and deploy — it's a standard Next.js app, no
   special build configuration needed.
4. In the Vercel project settings, add two environment variables:
   `DATABASE_URL` (your connection string) and `ADMIN_PASSWORD` (your admin
   password). Redeploy if you added them after the first deploy.
5. Load your postings into the database once. Either run `npm run db:setup`
   locally with the *production* `DATABASE_URL` set (both Neon and Supabase
   accept connections from anywhere), or add a posting or two straight from
   the live `/admin` page. After that, manage everything from `/admin`.
6. Share the live URL with people who DM you. Send the homepage for a general
   "here's what's open" link, `/?q=barista` / `/?location=Athens` for a
   filtered view, or `/jobs/<id>` for one specific posting — that last one is
   what you'll use most for one-on-one DM replies.

> **Tip — if you use Neon:** Vercel has a built-in Neon integration
> (Project → Storage → Create → Neon) that provisions the database and sets
> `DATABASE_URL` for you automatically. Then you only add `ADMIN_PASSWORD`
> by hand.

## How "apply" works

Each posting has an `applyMethod` (`instagram`, `email`, or `link`) and an
`applyContact` (an `@handle`, an email address, or a URL, matching the
method). `getApplyInfo()` in `lib/jobs.ts` turns that pair into the actual
link shown on the public page:

- `instagram` → the button opens `instagram.com/<handle>`. Accepts a bare
  handle, `@handle`, or a full `instagram.com/...` URL in Apply Contact.
- `email` → the button opens a `mailto:` link.
- `link` → opens the URL as-is. Use this for anything else — a form, a job
  board listing, etc.

Clicking the apply button (`components/ApplyButton.tsx`) doesn't navigate
straight away — it opens a small popup first, showing exactly what will
happen ("To apply, send an email to this address: hiring@example.com" or
"To apply, send a DM to Sunset Rooftop Bar's Instagram account: @handle"),
with the address/handle itself, an "Open in Mail" / "Open Instagram" button
that does the actual mailto:/instagram.com redirect, and a "Copy" button.
This is so people see who/where they're actually contacting before their
mail app or Instagram launches. The wording is pulled straight from that
job's `applyMethod`/`applyContact`/`venue` in the database — no separate
copy to maintain.

If Apply Contact is left blank, no apply button shows on that posting.

## Individual job pages and "more roles like this"

Every posting has its own page at `/jobs/<id>`, built for sharing one role
at a time. It shows the full description, the apply button, and — if there
are other open postings worth surfacing — a "more roles like this" list at
the bottom. `getSimilarJobs()` in `lib/jobs.ts` picks those: other open
postings with the exact same Role first, topped up with postings that share
a City or Country if there aren't enough same-role matches, capped at 3.

A posting marked `filled` still has a working page (so an old link someone
was sent doesn't just break) — it shows a "this position has been filled"
notice instead of an apply button, and still surfaces similar open roles
underneath. A link to an `id` that doesn't exist at all shows a small
branded 404 pointing back to the homepage (`app/jobs/[id]/not-found.tsx`).

To find a specific posting's link: open `/admin` — the `id` field (shown in
the admin table) is the last part of the URL.

## Fonts

The whole site uses Bricolage Grotesque, self-hosted as `.woff2` files under
`public/fonts/` and loaded via `@font-face` in `app/globals.css` (regular,
medium, semibold, and bold weights). It's referenced from `body` in that
same file, so every page picks it up automatically — no per-page changes
needed. To switch fonts later, swap the font files in `public/fonts/`,
update the `@font-face` blocks and the `font-family` on `body` in
`app/globals.css`.

## Customizing job fields

Each job posting has: `role`, `venue`, `city`, `country`, `description`,
`applyMethod`, `applyContact`, `instagramUrl`, `status` (`open` or `filled`),
and `postedAt`. To add a field (e.g. pay range or schedule), update the `Job`
type and the SQL in `lib/jobs.ts`, add the column in `scripts/setup_db.mjs`,
the admin form/table in `app/admin/page.tsx`, the card layout in
`app/page.tsx`, and both spreadsheet scripts in `scripts/`.

## Project structure

```
app/
  page.tsx              public search/browse page
  jobs/[id]/page.tsx      single posting's page + "more roles like this"
  jobs/[id]/not-found.tsx branded 404 for a bad/removed job link
  admin/page.tsx         password-gated admin table (add/edit/delete)
  api/jobs/route.ts       GET (search) / POST (create)
  api/jobs/[id]/route.ts  PUT (update) / DELETE
  api/admin/login/route.ts   sets the admin session cookie
  api/admin/logout/route.ts  clears it
components/
  ApplyButton.tsx   the apply button shown on each job's detail page (the
                    homepage cards link to that page rather than applying
                    directly, so the click target is the whole card)
lib/
  db.ts     lazy Postgres client (reads DATABASE_URL), shared across the app
  jobs.ts   data access layer (SQL against the `jobs` table) + getSimilarJobs
  format.ts date formatting helper shared across pages
  auth.ts   simple password-based admin session check
data/
  jobs.json   seed postings, loaded into the database by `npm run db:setup`
              (starting point only — once live, the database is the source
              of truth)
scripts/
  setup_db.mjs       creates the `jobs` table + loads data/jobs.json (npm run db:setup)
  import_jobs.py     converts Positions.xlsx -> data/jobs.json (optional bulk entry)
  build_template.py  regenerates Positions.xlsx itself (only needed if you
                      want to change its columns/instructions)
Positions.xlsx   the fillable spreadsheet template (optional bulk entry)
```
