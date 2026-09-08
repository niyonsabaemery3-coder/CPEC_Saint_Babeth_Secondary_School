# CPEC Saint Babeth TSS — Project Handoff & Testing Guide

**Purpose of this file:** a single, accurate source of truth for anyone (human
or AI) picking up this project. It says exactly what exists, what was added
in the latest update, what is still missing, and — most importantly — gives
copy-pasteable steps to verify every claim below actually works, rather than
trusting the description alone. If you are an AI assistant reading this to
continue work, verify claims via the "How to test" sections before relying
on them.

Last updated: this document reflects the codebase as of the grading-system
update described below. If the code has changed since, re-run the tests in
this file before trusting anything it says.

---

## 1. What this project is

A full-stack school management website for CPEC Saint Babeth TSS (a
technical secondary school in Rwanda):

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4, in the repo
  root (`src/`). Meant to be built and deployed as a static site (GitHub
  Pages via `.github/workflows/`).
- **Backend**: Express 5 + MySQL (via `mysql2`), in `server/`. A REST API
  under `/api/*`, plus it serves the built frontend (`dist/`) as static
  files so one deployment can host both.
- **Database**: MySQL (developed against Clever Cloud MySQL / any standard
  MySQL 8 instance).

### 1.1 — Features that existed before this update (unchanged)

- Public site: About, Academics, Admissions, Teachers, Students, News,
  Events, Gallery, Resources, Contact pages.
- Admin panel: manages all public site content, teacher/student accounts,
  applications (admissions), FAQs, resources, news/events, page banners.
- Teacher portal: teachers log in, upload learning resources for their class.
- Student portal: students log in, download resources, view/download a
  report-card **file** an admin uploaded for them (`student_reports` table —
  this is a raw PDF/image upload, NOT structured marks; see below).
- Auth: unified login endpoint across admin/teacher/student, JWT-based,
  bcrypt password hashing, self-registration toggle with admin approval.
- Security: Helmet, CORS allowlist, two-tier rate limiting (general +
  strict on `/api/auth`), path-traversal-safe file uploads, JWT_SECRET
  required in production (server refuses to start without it).

None of the above was touched or removed by this update.

---

## 2. What was added in this update

Two things: **(A)** a real, structured grading system, and **(B)** an audit
log. Below is exactly what was built, file by file.

### 2.A — Grading system

**Problem it solves:** previously there was no way to record a subject-by-
subject numeric mark for a student, compute an average, or rank students —
"Student Reports" was just a manually-uploaded file per student.

**New database tables** (in `server/src/schema.sql`, and auto-created on
existing databases by `runGradingSystemMigration()` in `server/src/index.js`):

| Table | Columns | Purpose |
|---|---|---|
| `subjects` | id, name, code (unique), max_score (default 100), created_at | Subject catalog |
| `exam_terms` | id, name, school_year, is_current, created_at | Terms/exam sessions; one can be flagged current |
| `class_subjects` | id, school_class, subject_id, teacher_account_id (nullable), created_at | Which subjects a class takes + who teaches each |
| `student_marks` | id, student_id, subject_id, term_id, score, entered_by_teacher_id, created_at, updated_at | One mark per student × subject × term (unique constraint) |

Averages, totals and class rank are **computed on read** (in
`server/src/routes/markRoutes.js`), never stored — so they cannot go stale
relative to the raw marks.

**New files:**
- `server/src/routes/subjectRoutes.js` — subject CRUD + class assignment
- `server/src/routes/termRoutes.js` — exam term CRUD + "set current"
- `server/src/routes/markRoutes.js` — mark entry (roster) + report cards + class report

**New API endpoints** (all under `/api`, all require a Bearer JWT):

```
GET    /api/subjects                                admin, teacher
POST   /api/subjects                                admin        { name, code, maxScore }
PUT    /api/subjects/:id                             admin        { name?, code?, maxScore? }
DELETE /api/subjects/:id                             admin
GET    /api/subjects/class/:schoolClass              admin, teacher
POST   /api/subjects/class/:schoolClass              admin        { subjectId, teacherAccountId? }
DELETE /api/subjects/class/:schoolClass/:subjectId   admin

GET    /api/terms                                    any logged-in role
POST   /api/terms                                    admin        { name, schoolYear }
PATCH  /api/terms/:id/set-current                    admin
DELETE /api/terms/:id                                admin

GET    /api/marks/roster?schoolClass=&subjectId=&termId=   admin, or the teacher assigned to that subject+class
POST   /api/marks/roster                                    admin, same teacher scoping
                { schoolClass, subjectId, termId, entries: [{ studentId, score }] }
                (score: null/"" clears the mark; every row validated before any write)
GET    /api/marks/report/:studentId?termId=                 admin, the student themself, or their class's teacher
GET    /api/marks/class-report?schoolClass=&termId=          admin, or the teacher assigned to that class
```

**Access control specifics (this is the part worth verifying, not just
trusting):**
- A teacher can only read/write `/api/marks/roster` for a
  (schoolClass, subjectId) pair where a `class_subjects` row exists with
  their `teacher_account_id`. Enforced server-side on every call, not just
  hidden in the UI.
- A student calling `GET /api/marks/report/:studentId` gets a 403 if
  `:studentId` is not their own id.
- Score validation: every entry in a `POST /api/marks/roster` body is
  checked against `0 <= score <= subject.max_score` **before** any row is
  written — a single bad row rejects the whole request instead of leaving
  the sheet half-saved.

### 2.B — Audit log

**Problem it solves:** previously nothing recorded who created/changed/
deleted an account, a subject, a term, or a set of marks.

**New table**: `audit_logs` (actor_role, actor_id, actor_name, action,
entity_type, entity_id, details JSON, created_at), auto-created by
`runAuditLogMigration()`.

**New file**: `server/src/utils/audit.js` — exports `logAction(...)`.
Deliberately swallows its own errors (`try/catch`, logs to console only) so
a logging failure can never break the action it's describing.

**New route**: `server/src/routes/auditRoutes.js` —
`GET /api/audit-logs?page=&limit=&entityType=&actorId=&action=` (admin only,
paginated).

**Wired into** (i.e. these actions now write an audit-log row):
subject create/update/delete, class-subject assign/unassign, exam term
create/set-current/delete, mark entry (`POST /api/marks/roster`), and
teacher/student account create/activate/deactivate/delete.

**Not wired into**: site-content edits, resource uploads, applications,
news/events, FAQs, page banners — i.e. everything that existed before this
update still has no audit trail. Only the items listed above do.

### 2.C — Small supporting change

`server/src/middleware/auth.js` gained one new export, `requireAnyAuth` —
a middleware that accepts any logged-in role (admin/teacher/student),
used by `GET /api/terms` and `GET /api/marks/report/:id`.

---

## 3. What was NOT done (be honest about this with whoever asks)

- **No frontend UI for any of this.** Everything in section 2 is backend-
  only. There is no admin screen to manage subjects/terms/assignments, no
  teacher mark-entry grid, no student "My Grades" page. The API is ready to
  be wired into `src/components/` but that work has not started.
- **No automated tests.** Not for this update, and none existed before it
  either — the whole project (frontend and backend) has zero unit or
  integration tests. Section 4 below is a *manual* testing procedure to
  compensate for that; it is not a substitute for real tests.
- **No forgot-password / email-based recovery.** Teachers and students can
  change their own password *while logged in*
  (`PUT /api/auth/teacher/password`, `PUT /api/auth/student/password` —
  these already existed before this update). There is still no way to
  recover a forgotten password without admin help, because there is no
  email/SMTP integration in this project.
- **No CAPTCHA/honeypot** on the public self-registration forms (a known
  gap noted in `PHASE2_TODO.md` before this update; unrelated to grading).
- **Rank/average calculation is O(n) per classmate per report request** —
  `computeStudentReport()` in `markRoutes.js` does one extra query per
  classmate to build the ranking. Fine for typical class sizes (~20–50
  students) but would need optimizing (e.g. a single aggregate SQL query)
  if class sizes grow much larger or the endpoint is called very frequently.
- **This has not been run against a live MySQL database in this session** —
  see section 4.3 for exactly what *was* verified vs what still needs a
  real database to confirm.

---

## 4. How to test this — step by step

Do these in order. Each step says what a correct result looks like, so a
failure is obvious rather than ambiguous.

### 4.1 — Static checks (no database needed)

```bash
cd server
npm install
node --check src/index.js
node --check src/middleware/auth.js
node --check src/utils/audit.js
node --check src/routes/subjectRoutes.js
node --check src/routes/termRoutes.js
node --check src/routes/markRoutes.js
node --check src/routes/auditRoutes.js
```
**Expected:** no output and exit code 0 from each `node --check` — that
just confirms the JavaScript is syntactically valid, nothing more.

### 4.2 — Server boots without crashing (still no real database needed)

```bash
cd server
ALLOW_LOCAL_ORIGINS=true JWT_SECRET=any_long_random_string_here PORT=4123 \
DB_HOST=127.0.0.1 DB_USER=root DB_PASSWORD=x DB_NAME=test \
node src/index.js
```
**Expected output:**
```
✔ API running at http://0.0.0.0:4123
✔ Database target: 127.0.0.1:3306/test
❌ MySQL connection failed:
connect ECONNREFUSED 127.0.0.1:3306
  Run 'npm run db:init' and 'npm run db:seed' to set up the database.
```
The last three lines are *expected* here because there's no real MySQL
running at that address — the point of this test is only that the process
starts, all `require(...)` calls resolve, and it fails **gracefully** (not
a stack-trace crash) when the database is unreachable. Press Ctrl+C to stop
it. **This much was actually run and confirmed working in this session.**

### 4.3 — Full end-to-end test against a real MySQL database

**This part requires a real MySQL/MariaDB server and was NOT run in this
session** (the sandbox this was built in had no working MySQL install
available — the code has been checked for correctness by careful review and
by the checks in 4.1/4.2, not by execution against a live database). Run
this yourself before trusting the grading system in production:

```bash
cd server
cp ../.env.example .env
# edit .env: set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME (or MYSQL_ADDON_URI)
# to a real, empty MySQL database, and set a real JWT_SECRET.
npm run db:init      # creates every table, including the 4 new grading tables + audit_logs
npm run db:seed      # creates a default admin login (see server/src/scripts/seed.js for the credentials it prints)
npm run dev
```

**Verify the new tables exist:**
```sql
SHOW TABLES LIKE 'subjects';
SHOW TABLES LIKE 'exam_terms';
SHOW TABLES LIKE 'class_subjects';
SHOW TABLES LIKE 'student_marks';
SHOW TABLES LIKE 'audit_logs';
```
**Expected:** all five return one row each.

**Log in as admin** (use the username/password `npm run db:seed` printed):
```bash
curl -s -X POST http://localhost:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<admin_username>","password":"<admin_password>"}'
```
**Expected:** `{ "token": "...", "username": "..." }`. Save the token as
`$ADMIN_TOKEN` for the rest of these commands.

**Create a subject:**
```bash
curl -s -X POST http://localhost:4000/api/subjects \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Mathematics","code":"MATH","maxScore":100}'
```
**Expected:** `201` with the created subject, including an `id`. Save it as
`$SUBJECT_ID`.

**Create a term and make it current:**
```bash
curl -s -X POST http://localhost:4000/api/terms \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Term 1","schoolYear":"2025-2026"}'
# note the returned id as $TERM_ID, then:
curl -s -X PATCH http://localhost:4000/api/terms/$TERM_ID/set-current \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
**Expected:** the create returns `201` with `isCurrent: false`; the
set-current call returns `{ "message": "Current term updated." }`.

**Assign the subject to a class:**
```bash
curl -s -X POST http://localhost:4000/api/subjects/class/S1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d "{\"subjectId\": $SUBJECT_ID}"
```
**Expected:** `201 { "message": "Subject assigned to class." }`.

**Create a student in S1** (if you don't already have one — use the
existing `POST /api/student-accounts` admin endpoint), then enter a mark:
```bash
curl -s -X POST http://localhost:4000/api/marks/roster \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d "{\"schoolClass\":\"S1\",\"subjectId\":$SUBJECT_ID,\"termId\":$TERM_ID,\"entries\":[{\"studentId\":$STUDENT_ID,\"score\":85}]}"
```
**Expected:** `{ "message": "Marks saved.", "saved": 1, "cleared": 0 }`.

**Try an invalid score (should be rejected, nothing written):**
```bash
curl -s -X POST http://localhost:4000/api/marks/roster \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d "{\"schoolClass\":\"S1\",\"subjectId\":$SUBJECT_ID,\"termId\":$TERM_ID,\"entries\":[{\"studentId\":$STUDENT_ID,\"score\":150}]}"
```
**Expected:** `400` with an error mentioning the score must be between 0
and 100. Confirm the *previous* mark (85) is still intact via the report
card call below — this proves validation happens before writing.

**Fetch the student's report card:**
```bash
curl -s "http://localhost:4000/api/marks/report/$STUDENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
**Expected:** JSON with `subjects: [{ ..., "score": 85 }]`,
`totalScore: 85`, `totalMax: 100`, `average: 85`, `rank: 1`,
`classSize: 1` (rank/classSize will change once more students in S1 have
marks entered).

**Confirm a teacher without an assignment is blocked:**
Log in as a teacher who is *not* assigned to `class_subjects` for
(S1, $SUBJECT_ID), then repeat the roster `GET` above with their token —
**expected:** `403` with "You are not assigned to teach this subject for
this class."

**Confirm a student can't see someone else's report:**
Log in as a *different* student, call
`GET /api/marks/report/$STUDENT_ID` with their token — **expected:** `403`
"You can only view your own report."

**Check the audit log recorded all of this:**
```bash
curl -s "http://localhost:4000/api/audit-logs?entityType=student_marks" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
**Expected:** at least one entry with `action: "enter_marks"` and
`entityType: "student_marks"`, `details` showing `saved: 1`.

If every one of the steps above matches its "Expected" result, the grading
system and audit log work as documented. If any step's real output differs
from what's written here, **trust the real output, not this file** — and
update this document to match reality.

---

## 5. If you're an AI continuing this project

- Don't assume section 2 works just because it's described in detail —
  section 4.3 was written but not executed against a live database in this
  session (no MySQL was available in the sandbox). Run it for real before
  telling the user "this works."
- If you build the frontend UI for this, the contract to build against is
  exactly the endpoint list in section 2.A/2.B — don't guess at field names,
  read `server/src/routes/markRoutes.js` etc. directly, they're short and
  commented.
- Keep this file updated as the source of truth: when you add or change a
  feature, update the relevant section here in the same change, not as an
  afterthought.
