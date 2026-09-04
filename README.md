# CPEC Saint Babeth Secondary School — Website

A full-stack rebuild of the CPEC Saint Babeth Secondary School website:

- **Frontend** — React + TypeScript + Tailwind CSS (this folder), with a public Resources library
  (Notes / Presentations / Past Papers), a Teacher Portal (register → admin approval → upload resources),
  an Admin panel, and dark mode.
- **Backend** — Express + MySQL (in `server/`), a real REST API + database so every visitor and device sees
  the same shared data (see `server/README.md`).

The frontend is a static site meant for GitHub Pages (or any static host); the backend needs a normal
Node.js + MySQL host (Render, Railway, a VPS, etc. — GitHub Pages can't run it). See
[Deploying to GitHub Pages](#deploying-the-frontend-to-github-pages) and `server/README.md` for both halves.

## Stack

- **Vite** + **React 19** + **TypeScript** + **Tailwind CSS v4** (frontend)
- **Express** + **mysql2** + **JWT** + **bcrypt** (backend API, in `server/`)
- Font Awesome icons (loaded via CDN in `index.html`)
- Google Fonts (Manrope + Inter)

## Getting started (full stack, local development)

The browser never connects directly to MySQL. The data flow is:

```text
Microsoft Edge → Vite/React frontend → Express API → Clever Cloud MySQL
```

**1. Configure and start the backend** in a terminal:

```powershell
cd server
npm install
Copy-Item .env.example .env
# Edit .env and set MYSQL_ADDON_URI from Clever Cloud
npm run db:init
npm run db:seed
npm run dev
```

The API runs at `http://localhost:4000` and loads Clever Cloud credentials from `server/.env`.

**2. Start the frontend** in a second terminal from the project root:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. The frontend requests the Express API, and the API reads the shared data from Clever Cloud MySQL.

For a frontend-only preview, the Vite proxy can target the deployed API through `VITE_API_URL`; for local full-stack development, leave it as `http://localhost:4000`.

To build the frontend for production:

```bash
npm run build
npm run preview
```

## Deploying the frontend to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the frontend and
deploys it automatically every time you push to `main`. The workflow build itself does not connect to the
database; visitors receive data through the deployed Express API.

1. Push this project to the `main` branch of the GitHub repository.
2. In the repo, go to **Settings → Pages** → under "Build and deployment", set **Source** to
   **GitHub Actions**. This step is required once before `actions/configure-pages` can run.
3. In the repo, go to **Settings → Secrets and variables → Actions → Variables** and add a repository
   variable `VITE_API_URL` set to your deployed backend's URL (for the current API:
   `https://saith-babeth-tss.onrender.com`). The workflow passes this through at build time.
4. Check **Settings → Actions → General** and ensure workflows are allowed to run if the Actions page
   shows a disabled-workflow message.
5. Push (or re-push) to `main`. Check the **Actions** tab — once the "Deploy to GitHub Pages" workflow
   finishes, the site is live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```
5. Any future push to `main` re-deploys automatically. You can also trigger it manually from the Actions tab.

No extra configuration is required for the base path — the workflow sets it automatically. If you later
attach a **custom domain** or deploy to a *user/organization* Pages repo (`<username>.github.io`), the app
also works unmodified since it falls back to `base: "/"` in that case.

**Remember:** the backend (`server/`) must be deployed separately somewhere that runs Node.js long-term with
a MySQL database attached — GitHub Pages only hosts the static frontend.

## Project structure

```
src/                            (frontend)
  assets/logo.png               school logo (favicon + navbar/footer/admin sidebar)
  lib/api.ts                    fetch wrapper for the backend API (base URL, auth tokens, error handling)
  types/                        shared TypeScript types (Teacher, Resource, TeacherAccount, SiteContent...)
  context/AppContext.tsx        loads data from the API on mount and exposes it + mutator functions
                                 (addTeacher, addResource, teacherLogin, setSite, ...) to every component
  components/
    layout/                     Navbar (incl. dark mode toggle), Footer, FloatingActions (WhatsApp + FAQ chat)
    sections/                   Hero, About, Academics, Teachers, Resources, Gallery, Apply (5-step wizard), Contact
    admin/                      AdminLogin, AdminShell (sidebar/topbar/mobile tabs)
      views/                    DashboardView, ApplicationsView, TeachersView (Directory / Teacher Accounts /
                                 Resources sub-tabs), SettingsView
      settings/                 One panel per editable section (Security, Home, About, Academics, Gallery,
                                 Contact, FAQ, Data & Storage) + shared FField / ImgTile / SettingsMsg helpers
    teacher/                    TeacherAuth (login/register modal), TeacherShell (dashboard with 3 tabs:
                                 My Resources, Add Resource, Profile)
  utils/format.ts                small helpers (e.g. avatar initials)
public/
  logo.png                      favicon
  images/                       placeholder hero/about/gallery photos — replace with real school photos

server/                         (backend — see server/README.md for full setup)
  src/schema.sql                database tables & relationships
  src/scripts/                  db:init (creates tables) and db:seed (demo data) scripts
  src/routes/                   auth, teachers, teacher-accounts, resources, applications, faqs, site
  src/middleware/auth.js        JWT-based auth (admin / teacher roles)
  src/utils/                    password hashing, base64 file uploads, absolute URL helpers
  uploads/                      resource files, application reports & site images saved to disk here
```

## How data works now (MySQL-backed, shared across everyone)

Unlike a local-only demo, this site's data lives in a real MySQL database behind the API in `server/` —
every visitor and every device sees the same teachers, resources, applications, FAQs and page content:

- `teachers` — shown on the public Teachers section, managed from Admin → Teachers → Directory.
- `teacher_accounts` — teachers register from the public **Teacher Portal** (footer link) and start
  `pending`; an admin activates or deactivates them from Admin → Teachers → Teacher Accounts.
- `resources` — Notes / Presentations / Past Papers uploaded by logged-in teachers from their dashboard,
  filterable by class/type/subject on the public **Resources** section, stored per-uploader in the database.
- `applications` — filled in by the public Apply wizard, listed in Admin → Applications, visible to any
  admin who logs in — no longer tied to the device that submitted them.
- `faqs` — powers the floating chat widget, editable from Admin → Settings → Chat Questions (FAQ).
- `site` (site_content + about_points + programs + gallery_items) — all editable homepage/about/academics/
  gallery/contact text & images, edited from Admin → Settings.
- `theme` (light/dark) — the only thing still kept locally per-browser, since it's a personal display
  preference rather than site content.

Uploaded files (resource PDFs/slides, application reports, site images) are saved to disk on the API server
under `server/uploads/` and served back as normal URLs — not stored as giant blobs in the database.

See Admin → Settings → **Data & Storage** for a live summary of this, and `server/README.md` for schema
details, deployment, and how to reset to demo data.

## Admin access

Open the site, scroll to the footer, and click **"Staff / Admin Login"**.

- Username: `admin`
- Password: `admin123`

(These are the `npm run db:seed` defaults — change them from Admin → Settings → Security once live.)

## Teacher Portal (public site)

Open the site, scroll to the footer, and click **"Teacher Portal"** to register a new teacher account or log
in. New registrations start as `pending` until an admin activates them from Admin → Teachers → Teacher
Accounts. Demo accounts from `npm run db:seed`:

- Email: `mugisha.eric@stbabeth.rw` · Password: `teach123` (active)
- Email: `uwimana.claudine@stbabeth.rw` · Password: `teach123` (active)
- Email: `niyonzima.jean@stbabeth.rw` · Password: `teach123` (pending — needs admin approval first)

## Application wizard (public site)

The Apply section is a 5-step form: Student → Track → School → Parent → **Review**. On the Review step the
applicant sees everything they entered and can go **Back** to correct any step before finally submitting.

## Floating WhatsApp & Chat (FAQ) widget

Two floating buttons sit in the bottom-right corner of every page:

- **WhatsApp** — opens `https://wa.me/<number>` using the phone number set in Admin → Settings → Contact.
- **Chat** — opens a small FAQ panel; clicking a question reveals its answer. The list of questions and
  answers is fully editable from Admin → Settings → Chat Questions (FAQ).

## Images

`public/images/` contains placeholder graphics used as defaults the first time the database is seeded.
Replace them with real photos (same file names) before seeding, or use the image-upload tiles inside
Admin → Settings to swap the hero, about, and gallery photos directly in the browser — those uploads are
saved on the API server and shared with every visitor from then on.
"# CPEC_Saint_Babeth_Secondary_School" 
