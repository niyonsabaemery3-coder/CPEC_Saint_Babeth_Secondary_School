# API server (Express + MySQL)

A small REST API backing the CPEC Saint Babeth Secondary School frontend, using **Express** and **mysql2**.
Everything (teachers, teacher accounts, resources, applications, FAQs, editable site content) is stored in
a real MySQL database, shared across every visitor and device — see `src/schema.sql` for the full table
layout and relationships.

## 1. Requirements

- Node.js 18+
- A MySQL or MariaDB server, including a Clever Cloud MySQL add-on
- The API must run on a Node.js host; GitHub Pages only hosts the static frontend

## 2. Setup

```powershell
cd server
npm install
Copy-Item .env.example .env
```

For Clever Cloud, set `MYSQL_ADDON_URI` to the connection URI provided by the MySQL add-on. The API parses
that URI automatically. Hosts that provide separate values can use `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD` and `DB_NAME` instead. Set a long random `JWT_SECRET` in either case.

The backend loads `server/.env` even when started from the repository root. Never commit the real file or
paste the connection URI into frontend code.

If your MySQL user doesn't exist yet, create it first, e.g.:

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

In the project root, copy `.env.example` to `.env` and set:

```
VITE_API_URL=http://localhost:4000
```

The local Vite frontend then calls the local Express API, and the API reads Clever Cloud MySQL. For a
production frontend, set `VITE_API_URL` to the public API URL before building. GitHub Pages also supplies
this value through the `VITE_API_URL` Actions variable.

Run the frontend from a second terminal:

```powershell
cd ..
npm run dev
```

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
static-only, for the frontend). You can run the API on Render, Railway, Fly.io, Clever Cloud, or a VPS and
connect it to the Clever Cloud MySQL add-on. Whichever host you pick:

1. Set all the `.env` variables (`DB_*`, `JWT_SECRET`, `CORS_ORIGIN` = your deployed frontend's URL,
   optionally `PUBLIC_API_URL`).
2. Run `npm run db:init` then `npm run db:seed` once against the production database.
3. Start the server with `npm start`.
4. Point the frontend's `VITE_API_URL` at this API's public URL and rebuild/redeploy the frontend.
