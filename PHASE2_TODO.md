# Self-Registration Feature — Progress Tracker

Context for whoever (or whichever chat) picks this up: CPEC Saint Babeth TSS website.
Admin used to be the ONLY one who could create Teacher/Student accounts. We added
optional self-registration, controlled by an admin toggle, with new accounts starting
as "Pending" until an admin activates them.

If you're pasting this into a new chat because of a daily limit, just say:
"Continue PHASE2_TODO.md for the CPEC Saint Babeth project — do the ⬜ items below."

---

## ✅ PHASE 1 — DONE (frontend only, superseded by Phase 2 below)

Toggle UI, Register tabs on the login popups, and validation — all still in place,
unchanged. See the Phase 2 section for how they're now wired to the real backend.

- `src/types/index.ts` — `StudentAccountStatus` includes `"pending"`, new
  `RegistrationSettings` interface, `SiteContent.registrationSettings`,
  `SettingsSection` includes `"registration"`.
- `src/components/admin/settings/RegistrationPanel.tsx` — Settings > Self-Registration
  panel with the two checkboxes.
- `src/components/admin/views/SettingsView.tsx` — menu entry + panel wired in.
- `src/components/student/StudentAuth.tsx` / `src/components/teacher/TeacherAuth.tsx` —
  Login/Register tabs, Register tab only shown when the matching toggle is on, full
  client-side validation via `src/utils/validation.ts`.
- `src/index.css` — `.reg-toggle-row` styles; reused existing `.ta-tabs`/`.ta-tab`.

---

## ✅ PHASE 2 — DONE (backend)

### 2.1 — Database
- [x] `server/src/schema.sql` — `teacher_accounts.status` and
  `student_accounts.status` ENUMs now include `'pending'`; `site_content` has new
  `allow_student_register` / `allow_teacher_register` `TINYINT(1)` columns
  (default `0`). Brand-new databases via `npm run db:init` get all of this
  automatically.
- [x] `server/src/scripts/migrateRegistration.js` — idempotent migration for
  **existing** databases (widens both status ENUMs, adds the two site_content
  columns only if missing). Run once with:
  ```
  npm run db:migrate-registration
  ```
  (added to `server/package.json` scripts). `db:init`'s `CREATE TABLE IF NOT EXISTS`
  will NOT alter tables that already exist, so this migration script is required
  on any database that was created before this change — same pattern as the
  existing `db:migrate-classes` script.

### 2.2 — Backend routes
- [x] `GET /api/site` (`server/src/routes/siteRoutes.js`) — public, now also returns
  `registrationSettings: { allowStudentRegister, allowTeacherRegister }` as part of
  the existing site-content payload (no new public endpoint needed).
- [x] `PUT /api/site/registration` — admin-only, updates ONLY those two columns
  (same per-section-isolation pattern as `/api/site/contact` etc.).
- [x] `POST /api/auth/teacher/register` (`server/src/routes/authRoutes.js`) —
  public. Re-checks `allow_teacher_register` server-side (403 if off), validates
  all fields, re-checks duplicate email against the real DB, hashes the password,
  inserts with `status = 'pending'`. Does NOT log the new account in.
- [x] `POST /api/auth/student/register` — same, plus validates `schoolClass`
  against `SCHOOL_CLASS_VALUES`.
- [x] Both new routes live under `/api/auth`, so they're automatically covered by
  the existing `authLimiter` (20 requests / 15 min) already mounted on that whole
  router in `server/src/index.js` — no extra rate-limit code needed.
- [x] **Login now blocks `pending` accounts** (previously only `deactivated` was
  blocked — a self-registered "pending" account could log in before an admin
  approved it!). Fixed in all three login routes: `/api/auth/login` (unified),
  `/api/auth/teacher/login`, `/api/auth/student/login`. Returns
  `403 "Your account is pending admin approval. Please check back soon."`

### 2.3 — Frontend wiring
- [x] `src/context/AppContext.tsx` — `teacherSelfRegister` / `studentSelfRegister`
  now call the real `POST /api/auth/*/register` endpoints instead of writing to
  local state. `updateRegistrationSettings` now calls
  `PUT /api/site/registration` (admin auth), with an optimistic local update that
  rolls back if the save fails. The toggle's real value now also loads correctly
  from the existing `GET /api/site` fetch on page load (no more resetting to OFF
  on reload).
- [x] `src/components/admin/settings/RegistrationPanel.tsx` — removed the "Phase 1,
  not saved" warning banner; each checkbox now shows a small Saved/error message
  and disables itself while its own save is in flight.
- [x] `npx tsc -b` passes clean across the whole frontend.
- [x] All touched backend files pass `node --check` (syntax-verified; not run
  against a live database in this sandbox — see "Before you deploy" below).

### 2.4 — Nice-to-haves (optional, not done — pick up anytime)
- [ ] Email notification to admin when a new self-registration comes in.
- [ ] Email confirmation to the student/teacher once an admin activates their account.
- [ ] Simple CAPTCHA or honeypot field on the public register forms — they're
  unauthenticated and only protected by the shared 20-req/15-min `authLimiter`
  right now.
- [ ] Return a more generic message on duplicate email from the public register
  routes (currently confirms "an account with this email already exists", which
  is fine for the admin-only create routes but technically lets someone probe
  which emails are already registered on a public endpoint).

---

## Before you deploy / test this for real
1. **Existing database:** run `npm run db:migrate-registration` once (from `server/`)
   against your real database before using this feature. Skip this only if you're
   initializing a completely fresh database with `npm run db:init`.
2. Restart the Node server after migrating so it picks up the new columns/enum values.
3. In Admin → Settings → Self-Registration, turn on the toggle(s) you want, then
   test end-to-end: register as a student/teacher on the public site → confirm the
   new account shows up as **Pending** in Admin → Student/Teacher Accounts → Activate
   it → confirm login now works (and confirm login is correctly rejected while
   still Pending).
