# API server (Express + MySQL)

A small REST API backing the CPEC Saint Babeth Secondary School frontend, using **Express** and **mysql2**.
Everything (teachers, teacher accounts, resources, applications, FAQs, editable site content) is stored in
a real MySQL database, shared across every visitor and device — see `src/schema.sql` for the full table
layout and relationships.

## 1. Requirements

- Node.js 18+
- A MySQL or MariaDB server (local install, Docker, or a managed service like PlanetScale/Railway/RDS)

## 2. Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and fill in your real MySQL credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.) and a long
random `JWT_SECRET`. If your MySQL user doesn't exist yet, create it first, e.g.:

```sql
CREATE USER 'stbabeth'@'%' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON stbabeth_tss.* TO 'stbabeth'@'%';
FLUSH PRIVILEGES;
```

Then create the database + tables, and load the starter/demo data:

```bash
npm run db:init   # creates the database and all tables from schema.sql
npm run db:seed   # inserts demo admin, teachers, resources, FAQs, site content
                   # (safe to re-run — only inserts what's missing)
```

Start the API:

```bash
npm run dev     # auto-restarts on file changes
# or
npm start
```

By default it listens on `http://localhost:4000`. Check it's alive:

```bash
curl http://localhost:4000/api/health
# {"ok":true}
```

## 3. Connect the frontend to it

In the project root (not `server/`), copy `.env.example` to `.env` and set:

```
VITE_API_URL=http://localhost:4000
```

(or your deployed API's URL). Then run the frontend as usual (`npm run dev` / `npm run build`).

## 4. Default demo accounts (from `npm run db:seed`)

- **Admin** — username `admin`, password `admin123` (override with `SEED_ADMIN_USERNAME` /
  `SEED_ADMIN_PASSWORD` in `.env` before seeding).
- **Teacher** (active) — `mugisha.eric@stbabeth.rw` / `teach123`
- **Teacher** (active) — `uwimana.claudine@stbabeth.rw` / `teach123`
- **Teacher** (pending, needs admin approval) — `niyonzima.jean@stbabeth.rw` / `teach123`

Change the admin password from Admin → Settings → Security once you're live.

## 5. Database structure

See `src/schema.sql` for the exact SQL. Summary of tables and how they relate:

- `admins` — site administrators.
- `teacher_accounts` — teacher logins (`pending` / `active` / `deactivated`), created via public
  self-registration and approved by an admin.
- `teachers` — the public "Meet Our Teachers" directory; optionally linked to a `teacher_accounts` row.
- `resources` — Notes/Presentations/Past Papers, each belonging to one `teacher_accounts` uploader
  (`ON DELETE CASCADE`).
- `applications` — submissions from the public Apply wizard.
- `faqs` — the floating chat widget's questions/answers.
- `site_content` — one singleton row (id=1) with all editable homepage/about/contact text & images, plus
  three related child tables (`about_points`, `programs`, `gallery_items`) for the list-shaped sections.

## 6. File uploads

Resource files, application reports, and site images are sent from the frontend as base64, then decoded and
saved to disk under `server/uploads/<category>/` (not stored in the database — only their URL is). They're
served back at `http://<api-host>/uploads/<category>/<file>`. Set `PUBLIC_API_URL` in `.env` if the API sits
behind a reverse proxy/CDN and needs a specific public URL for these links.

## 7. Deploying

This API needs a **persistent Node.js host with a MySQL database** — it cannot run on GitHub Pages (that's
static-only, for the frontend). Reasonable options: Render, Railway, Fly.io, a small VPS, or any host that
runs Node.js long-term, paired with a MySQL instance (many of those hosts offer one, or use PlanetScale/
Aiven/RDS). Whichever you pick:

1. Set all the `.env` variables (`DB_*`, `JWT_SECRET`, `CORS_ORIGIN` = your deployed frontend's URL,
   optionally `PUBLIC_API_URL`).
2. Run `npm run db:init` then `npm run db:seed` once against the production database.
3. Start the server with `npm start`.
4. Point the frontend's `VITE_API_URL` at this API's public URL and rebuild/redeploy the frontend.
