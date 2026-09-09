require("./config/env");

const db = require("./db");

const { databaseConfig } = require("./config/database");

const path = require("path");

const express = require("express");

const cors = require("cors");

const helmet = require("helmet");

const compression = require("compression");

const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");

const teacherRoutes = require("./routes/teacherRoutes");

const teacherAccountRoutes = require("./routes/teacherAccountRoutes");

const studentAccountRoutes = require("./routes/studentAccountRoutes");

const studentReportRoutes = require("./routes/studentReportRoutes");

const resourceRoutes = require("./routes/resourceRoutes");

const applicationRoutes = require("./routes/applicationRoutes");

const faqRoutes = require("./routes/faqRoutes");

const siteRoutes = require("./routes/siteRoutes");

const pageBannerRoutes = require("./routes/pageBannerRoutes");

const newsRoutes = require("./routes/newsRoutes");

const eventRoutes = require("./routes/eventRoutes");

const subjectRoutes = require("./routes/subjectRoutes");

const termRoutes = require("./routes/termRoutes");

const markRoutes = require("./routes/markRoutes");

const auditRoutes = require("./routes/auditRoutes");
const contactRoutes = require("./routes/contactRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

app.set("trust proxy", 1);

// ---------- SECURITY: HTTP headers ----------

// crossOriginResourcePolicy is relaxed to "cross-origin" so that images/uploads
// served from this API can still be loaded by a frontend on a different origin.

// The primary production deployment serves the SPA from a separate static
// host (GitHub Pages), which hardens itself via the <meta http-equiv="CSP">
// tag injected at build time (see vite.config.ts). This header is a
// defense-in-depth backstop for setups where Express itself serves `dist/`
// (e.g. the alternative all-in-one Clever Cloud deployment) and is harmless
// on plain JSON API responses either way.
const supabaseOrigin = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).origin
  : "https://*.supabase.co";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", supabaseOrigin],
        connectSrc: ["'self'", supabaseOrigin],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

// The app never uses camera/mic/geolocation/payment APIs — deny them outright
// so an XSS payload (or a compromised third-party script) can't invoke them.
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  next();
});

// ---------- PERFORMANCE: gzip/brotli-style compression for all responses ----------

app.use(compression());

// ---------- SECURITY: rate limiting ----------

// General API limiter — generous, just a backstop against abuse/scraping.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down and try again shortly.",
  },
});

// Strict limiter for auth endpoints — protects login/register from brute-force/credential-stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many login attempts. Please wait a few minutes before trying again.",
  },
});

app.use("/api", apiLimiter);

const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const localOrigins =
  process.env.ALLOW_LOCAL_ORIGINS === "true"
    ? [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
      ]
    : [];

const allowAllOrigins = configuredOrigins.includes("*");

const allowedOrigins = new Set([...configuredOrigins, ...localOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAllOrigins || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
  })
);

// 11 MB JSON limit — slightly above the 10 MB file upload limit so the
// base64-encoded payload (which adds ~33% overhead) fits within this budget.
// The 10 MB cap is enforced client-side before encoding; this acts as the
// final server-side backstop.
app.use(express.json({ limit: "11mb" }));

// Sensitive local-fallback uploads (student reports, application feedback
// attachments — see utils/uploads.js PRIVATE_CATEGORIES) live under
// uploads/private/ specifically so they can be excluded here. They are only
// ever reachable through the short-lived signed link issued by
// /api/files/signed (see routes/fileRoutes.js), never through this static
// mount, which has no access control of its own.
app.use("/uploads/private", (_req, res) => res.status(403).json({ error: "Forbidden" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

const distDir = path.join(__dirname, "../../dist");

app.use(express.static(distDir));

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      ok: true,
      database: "connected",
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);

    res.status(500).json({
      ok: false,
      database: "disconnected",
      error: error.message,
    });
  }
});

app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/teachers", teacherRoutes);

app.use("/api/teacher-accounts", teacherAccountRoutes);

app.use("/api/student-accounts", studentAccountRoutes);

app.use("/api/student-reports", studentReportRoutes);

app.use("/api/resources", resourceRoutes);

app.use("/api/applications", applicationRoutes);

app.use("/api/faqs", faqRoutes);

app.use("/api/site", siteRoutes);

app.use("/api/page-banners", pageBannerRoutes);

app.use("/api/news", newsRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/subjects", subjectRoutes);

app.use("/api/terms", termRoutes);

app.use("/api/marks", markRoutes);

app.use("/api/audit-logs", auditRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/files", fileRoutes);

// Client-side routes the SPA actually handles (kept in sync with src/App.tsx).
// A request for anything else is a genuine 404 — even though we still need
// to serve the SPA shell so React Router can render the NotFoundPage, we
// return a real 404 status instead of silently answering 200 for every
// unmatched path. Plain "200 for everything" is the classic SPA "soft 404"
// that confuses search engines; this keeps crawlable pages crawlable while
// giving unknown URLs a correct status code.
const KNOWN_SPA_ROUTES = new Set([
  "/",
  "/about",
  "/academics",
  "/admissions",
  "/teachers",
  "/students",
  "/news",
  "/events",
  "/events-news",
  "/gallery",
  "/resources",
  "/contact",
]);

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      error: "Not found",
    });
  }

  const status = KNOWN_SPA_ROUTES.has(req.path) ? 200 : 404;
  res.status(status).sendFile(path.join(distDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);

  // Known, safe-to-show client errors (e.g. UploadValidationError from
  // utils/uploads.js) carry their own status and a message that is already
  // written to be user-facing — pass those through as-is. Anything else is
  // an unexpected server-side failure, so its message is only shown when
  // DEBUG=true to avoid leaking internals (stack traces, SQL, file paths).
  const status = Number.isInteger(err.status) ? err.status : 500;
  const message =
    status < 500
      ? err.message || "Invalid request."
      : process.env.DEBUG === "true"
        ? err.message || "Something went wrong on the server."
        : "Something went wrong on the server.";

  res.status(status).json({
    error: message,
  });
});

const PORT = process.env.PORT || 4000;

// --------------------------------------------------------------------------
// Startup migration — ensures the database schema is up to date.
//
// db:init uses CREATE TABLE IF NOT EXISTS which won't alter existing tables,
// so we run these idempotent ALTERs here for databases created before the
// self-registration feature was added.
//
// The migration first checks whether the self-registration columns already
// exist. If they exist, no ALTER TABLE statements are executed.
// --------------------------------------------------------------------------

async function runNewsEventsMigration() {
  // Idempotent (CREATE TABLE IF NOT EXISTS) — safe to run on every startup so
  // databases created before the News & Events admin feature was added pick
  // up the two new tables without needing a manual `npm run db:init`.
  await db.query(`
    CREATE TABLE IF NOT EXISTS news_items (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      title      VARCHAR(200) NOT NULL,
      category   VARCHAR(80) NOT NULL DEFAULT 'Academics',
      excerpt    TEXT,
      image_url  VARCHAR(500),
      event_date DATE NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS upcoming_events (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(200) NOT NULL,
      category    VARCHAR(80) NOT NULL DEFAULT 'Academics',
      description TEXT,
      location    VARCHAR(200),
      event_date  DATE NOT NULL,
      event_time  VARCHAR(20),
      icon        VARCHAR(60) NOT NULL DEFAULT 'fa-calendar-days',
      color_key   ENUM('navy','green','gold','purple','rust') NOT NULL DEFAULT 'navy',
      image_url   VARCHAR(500),
      sort_order  INT NOT NULL DEFAULT 0,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
}

async function runProgramSectionsMigration() {
  const [[table]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'programs'"
  );
  if (!table || Number(table.cnt) === 0) return;

  const [[column]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'programs' AND COLUMN_NAME = 'section'"
  );
  if (Number(column?.cnt) > 0) return;

  console.log("🔧 Adding program section labels...");
  await db.query(
    "ALTER TABLE programs ADD COLUMN section VARCHAR(150) NOT NULL DEFAULT 'Ordinary Level' AFTER description"
  );
  console.log("✔ Program section labels are ready.");
}

async function runGalleryMigration() {
  // Adds the `category` column to gallery_items for databases created before
  // the gallery category feature was added.
  const [[col]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gallery_items' AND COLUMN_NAME = 'category'"
  );
  if (Number(col?.cnt) === 0) {
    console.log("🔧 Adding gallery category support...");
    await db.query("ALTER TABLE gallery_items ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General' AFTER caption");
    console.log("✔ Gallery category column added.");
  }
}

async function runHeroMigration() {
  // Adds the `hero_images` column to site_content for databases created before
  // the multi-image hero slideshow feature was added.
  const [[col]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'hero_images'"
  );
  if (Number(col?.cnt) === 0) {
    console.log("🔧 Adding hero slideshow support...");
    await db.query("ALTER TABLE site_content ADD COLUMN hero_images LONGTEXT AFTER hero_img");
    // Seed hero_images from the existing single hero_img so the slideshow
    // shows something immediately rather than being empty.
    const [[site]] = await db.query("SELECT hero_img FROM site_content WHERE id = 1");
    if (site?.hero_img) {
      await db.query("UPDATE site_content SET hero_images = ? WHERE id = 1", [JSON.stringify([site.hero_img])]);
    }
    console.log("✔ Hero slideshow column added.");
  }
}

async function runApplicationTemplatesMigration() {
  // Creates the application_feedback_templates table and seeds the default
  // messages for databases created before this feature was added.
  await db.query(`
    CREATE TABLE IF NOT EXISTS application_feedback_templates (
      id                 INT PRIMARY KEY DEFAULT 1,
      pending_message    TEXT NOT NULL,
      approved_message   TEXT NOT NULL,
      rejected_message   TEXT NOT NULL,
      updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT chk_application_feedback_templates_singleton CHECK (id = 1)
    ) ENGINE=InnoDB
  `);
  // Insert the default row only if it doesn't exist yet.
  await db.query(
    `INSERT INTO application_feedback_templates (id, pending_message, approved_message, rejected_message)
     SELECT 1, ?, ?, ? FROM DUAL
     WHERE NOT EXISTS (SELECT 1 FROM application_feedback_templates WHERE id = 1)`,
    [
      "Your application has been received and is waiting for review.",
      "Congratulations. Your application has been approved. Please contact the school for the next steps.",
      "Thank you for applying. Unfortunately, we cannot offer a place at this time because available places are full.",
    ]
  );
}

async function runAboutHistoryMigration() {
  // Adds the `about_history` column to site_content for databases created
  // before the Our History section was added.
  const [[col]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'about_history'"
  );
  if (Number(col?.cnt) === 0) {
    console.log("🔧 Adding about_history column...");
    await db.query("ALTER TABLE site_content ADD COLUMN about_history TEXT AFTER about_para2");
    console.log("✔ about_history column added.");
  }
}

async function runSchoolClassEnumMigration() {
  // Replaces the old ENUM (SC_SOD, L3MLT … SC_MLT) with the new set
  // (L3MRT, L4MRT, L5MRT, OTHER).  We first widen the column to VARCHAR so
  // existing rows survive, migrate old values to their new equivalents, then
  // tighten back to the correct ENUM.  Safe to run multiple times — the
  // information_schema check exits early once the new ENUM is already in place.
  const [[col]] = await db.query(`
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'resources'
      AND COLUMN_NAME  = 'school_class'
  `);
  const currentType = (col?.COLUMN_TYPE || "").toLowerCase();
  // If the column already contains 'l3mrt' or 'other' the migration is done.
  if (currentType.includes("l3mrt") || currentType.includes("other")) {
    return;
  }

  console.log("🔧 Migrating school_class ENUM to new values…");

  // 1. Widen to VARCHAR so no row is rejected during the data fix.
  await db.query("ALTER TABLE resources MODIFY COLUMN school_class VARCHAR(20) NOT NULL DEFAULT 'OTHER'");

  // 2. Map old values → new values in resources.
  const resourceMap = [
    ["SC_SOD", "OTHER"],
    ["L3MLT", "L3MRT"],
    ["L4MLT", "L4MRT"],
    ["L5MLT", "L5MRT"],
    ["SC_MLT", "OTHER"],
    // Empty string from previously broken saves → OTHER
    ["", "OTHER"],
  ];
  for (const [oldVal, newVal] of resourceMap) {
    await db.query("UPDATE resources SET school_class = ? WHERE school_class = ?", [newVal, oldVal]);
  }

  // 3. Re-apply the correct ENUM.
  await db.query(
    "ALTER TABLE resources MODIFY COLUMN school_class ENUM('S1','S2','S3','L3SOD','L4SOD','L5SOD','L3MRT','L4MRT','L5MRT','OTHER') NOT NULL DEFAULT 'OTHER'"
  );

  // 4. Do the same for student_accounts (same class list, same logic).
  const [[stCol]] = await db.query(`
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'student_accounts'
      AND COLUMN_NAME  = 'school_class'
  `);
  const stType = (stCol?.COLUMN_TYPE || "").toLowerCase();
  if (!stType.includes("l3mrt") && !stType.includes("other")) {
    await db.query("ALTER TABLE student_accounts MODIFY COLUMN school_class VARCHAR(20) NOT NULL DEFAULT 'OTHER'");
    const studentMap = [
      ["SC_SOD", "OTHER"],
      ["L3MLT", "L3MRT"],
      ["L4MLT", "L4MRT"],
      ["L5MLT", "L5MRT"],
      ["SC_MLT", "OTHER"],
      ["", "OTHER"],
    ];
    for (const [oldVal, newVal] of studentMap) {
      await db.query("UPDATE student_accounts SET school_class = ? WHERE school_class = ?", [newVal, oldVal]);
    }
    await db.query(
      "ALTER TABLE student_accounts MODIFY COLUMN school_class ENUM('S1','S2','S3','L3SOD','L4SOD','L5SOD','L3MRT','L4MRT','L5MRT','OTHER') NOT NULL DEFAULT 'OTHER'"
    );
  }

  console.log("✔ school_class ENUM updated on resources and student_accounts.");
}

async function runGradingSystemMigration() {
  // Idempotent (CREATE TABLE IF NOT EXISTS) — safe to run on every startup so
  // databases created before the grading feature was added pick up the four
  // new tables (subjects, exam_terms, class_subjects, student_marks)
  // without needing a manual `npm run db:init`.
  await db.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(120) NOT NULL,
      code       VARCHAR(20) NOT NULL UNIQUE,
      max_score  DECIMAL(6,2) NOT NULL DEFAULT 100.00,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS exam_terms (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      school_year VARCHAR(20) NOT NULL,
      is_current  TINYINT(1) NOT NULL DEFAULT 0,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_term_year (name, school_year)
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS class_subjects (
      id                 INT AUTO_INCREMENT PRIMARY KEY,
      school_class       ENUM('S1','S2','S3','L3SOD','L4SOD','L5SOD','L3MRT','L4MRT','L5MRT','OTHER') NOT NULL,
      subject_id         INT NOT NULL,
      teacher_account_id INT NULL,
      created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_class_subject (school_class, subject_id),
      CONSTRAINT fk_class_subjects_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      CONSTRAINT fk_class_subjects_teacher
        FOREIGN KEY (teacher_account_id) REFERENCES teacher_accounts(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS student_marks (
      id                    INT AUTO_INCREMENT PRIMARY KEY,
      student_id            INT NOT NULL,
      subject_id            INT NOT NULL,
      term_id               INT NOT NULL,
      score                 DECIMAL(6,2) NOT NULL,
      entered_by_teacher_id INT NULL,
      created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_student_subject_term (student_id, subject_id, term_id),
      CONSTRAINT fk_marks_student FOREIGN KEY (student_id) REFERENCES student_accounts(id) ON DELETE CASCADE,
      CONSTRAINT fk_marks_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      CONSTRAINT fk_marks_term FOREIGN KEY (term_id) REFERENCES exam_terms(id) ON DELETE CASCADE,
      CONSTRAINT fk_marks_teacher FOREIGN KEY (entered_by_teacher_id) REFERENCES teacher_accounts(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);
}

async function runAuditLogMigration() {
  // Idempotent — safe on every startup, same pattern as the tables above.
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      actor_role  VARCHAR(20) NOT NULL,
      actor_id    INT NULL,
      actor_name  VARCHAR(150),
      action      VARCHAR(60) NOT NULL,
      entity_type VARCHAR(60) NOT NULL,
      entity_id   VARCHAR(60),
      details     TEXT,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_logs_entity (entity_type, entity_id),
      INDEX idx_audit_logs_created (created_at)
    ) ENGINE=InnoDB
  `);
}


async function runApplicationsTableEnsureColumns() {
  // Ensures every column the application routes depend on actually exists.
  // Each ALTER is guarded by an information_schema check so it is a no-op
  // on databases that already have the column.
  const colsToEnsure = [
    { name: "parent_email",       sql: "ALTER TABLE applications ADD COLUMN parent_email VARCHAR(180) NULL AFTER parent_name" },
    { name: "status",             sql: "ALTER TABLE applications ADD COLUMN status ENUM('pending','under_review','approved','rejected','info_required') NOT NULL DEFAULT 'pending' AFTER report_file_name" },
    { name: "feedback",           sql: "ALTER TABLE applications ADD COLUMN feedback TEXT NULL AFTER status" },
    { name: "feedback_file_url",  sql: "ALTER TABLE applications ADD COLUMN feedback_file_url VARCHAR(500) NULL AFTER feedback" },
    { name: "feedback_file_name", sql: "ALTER TABLE applications ADD COLUMN feedback_file_name VARCHAR(255) NULL AFTER feedback_file_url" },
    { name: "updated_at",         sql: "ALTER TABLE applications ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER feedback_file_name" },
    { name: "admission_type",     sql: "ALTER TABLE applications ADD COLUMN admission_type VARCHAR(30) NULL AFTER track_year" },
    { name: "index_number",       sql: "ALTER TABLE applications ADD COLUMN index_number VARCHAR(80) NULL AFTER admission_type" },
    { name: "current_school",     sql: "ALTER TABLE applications ADD COLUMN current_school VARCHAR(200) NULL AFTER index_number" },
    { name: "current_level",      sql: "ALTER TABLE applications ADD COLUMN current_level VARCHAR(50) NULL AFTER current_school" },
  ];

  for (const col of colsToEnsure) {
    const [[row]] = await db.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = ?",
      [col.name]
    );
    if (Number(row?.cnt) === 0) {
      console.log(`🔧 Adding missing column applications.${col.name}...`);
      await db.query(col.sql);
      console.log(`✔ applications.${col.name} added.`);
    }
  }

  // Ensure status ENUM includes all 5 values (for columns that existed but
  // were created with the old 3-value ENUM).
  const [[statusCol]] = await db.query(
    "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'status'"
  );
  if (statusCol && !statusCol.COLUMN_TYPE.includes("under_review")) {
    console.log("🔧 Extending applications.status ENUM...");
    await db.query(
      "ALTER TABLE applications MODIFY COLUMN status ENUM('pending','under_review','approved','rejected','info_required') NOT NULL DEFAULT 'pending'"
    );
    console.log("✔ applications.status ENUM extended.");
  }
}
async function runProgramImageMigration() {
  // Adds image_url column to programs table for per-card background images.
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'programs' AND COLUMN_NAME = 'image_url'"
  );
  if (Number(row?.cnt) === 0) {
    console.log("🔧 Adding image_url column to programs...");
    await db.query("ALTER TABLE programs ADD COLUMN image_url VARCHAR(500) NULL AFTER section");
    console.log("✔ programs.image_url added.");
  }
}

async function runApplicationsIndexMigration() {
  // Adds indexes to the applications table for columns used in the public
  // tracking lookup and admin filtering. Without these, every tracking request
  // does a full table scan. Safe to run multiple times — checks first.

  const indexesToCreate = [
    {
      name: "idx_applications_phone1",
      sql: "ALTER TABLE applications ADD INDEX idx_applications_phone1 (phone1)",
    },
    {
      name: "idx_applications_phone2",
      sql: "ALTER TABLE applications ADD INDEX idx_applications_phone2 (phone2)",
    },
    {
      name: "idx_applications_parent_email",
      sql: "ALTER TABLE applications ADD INDEX idx_applications_parent_email (parent_email)",
    },
    {
      name: "idx_applications_status",
      sql: "ALTER TABLE applications ADD INDEX idx_applications_status (status)",
    },
    {
      name: "idx_applications_created_at",
      sql: "ALTER TABLE applications ADD INDEX idx_applications_created_at (created_at)",
    },
  ];

  for (const { name, sql } of indexesToCreate) {
    try {
      const [[row]] = await db.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND INDEX_NAME = ?`,
        [name]
      );
      if (Number(row?.cnt) === 0) {
        console.log(`🔧 Adding index ${name}...`);
        await db.query(sql);
        console.log(`✔ ${name} added.`);
      }
    } catch { /* skip — index may already exist or column may not exist yet */ }
  }
}

async function runAdmissionTypeMigration() {
  // Extends the status ENUM and adds under_review/info_required feedback
  // template columns — for databases created before the Admission Request
  // feature was added. Column additions are handled by
  // runApplicationsTableEnsureColumns(); this function only handles the
  // ENUM widening and the feedback templates table changes.

  // Extend status ENUM to include under_review and info_required
  const [[statusCol]] = await db.query(
    "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'status'"
  );
  if (statusCol && !statusCol.COLUMN_TYPE.includes("under_review")) {
    console.log("🔧 Extending applications status ENUM...");
    await db.query(
      "ALTER TABLE applications MODIFY COLUMN status ENUM('pending','under_review','approved','rejected','info_required') NOT NULL DEFAULT 'pending'"
    );
    console.log("✔ Applications status ENUM extended.");
  }

  // Add under_review_message and info_required_message to feedback templates
  const [[urCol]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_feedback_templates' AND COLUMN_NAME = 'under_review_message'"
  );
  if (Number(urCol?.cnt) === 0) {
    console.log("🔧 Adding under_review_message and info_required_message to feedback templates...");
    await db.query("ALTER TABLE application_feedback_templates ADD COLUMN under_review_message TEXT NULL AFTER rejected_message");
    await db.query("ALTER TABLE application_feedback_templates ADD COLUMN info_required_message TEXT NULL AFTER under_review_message");
    console.log("✔ Feedback template columns added.");
  }
}

async function runContactMessagesMigration() {
  // Idempotent — safe on every startup. Creates the contact_messages table
  // for databases set up before the contact form persistence feature was added.
  await db.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(150) NOT NULL,
      contact    VARCHAR(200) NOT NULL,
      message    TEXT NOT NULL,
      is_read    TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_contact_messages_read (is_read),
      INDEX idx_contact_messages_created (created_at)
    ) ENGINE=InnoDB
  `);
}

async function runMigrations() {
  await runContactMessagesMigration();
  await runApplicationsTableEnsureColumns();
  await runAboutHistoryMigration();
  await runGalleryMigration();
  await runHeroMigration();
  await runApplicationTemplatesMigration();
  await runNewsEventsMigration();
  await runProgramSectionsMigration();
  await runSchoolClassEnumMigration();
  await runGradingSystemMigration();
  await runAuditLogMigration();
  await runProgramImageMigration();
  await runApplicationsIndexMigration();
  await runAdmissionTypeMigration();

  const [cols] = await db.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'allow_student_register'"
  );

  if (cols[0].cnt > 0) {
    console.log("✔ Self-registration columns already exist. Migration skipped.");
    return;
  }

  console.log("🔧 Running self-registration migration...");

  await db.query(
    "ALTER TABLE teacher_accounts MODIFY COLUMN status ENUM('pending','active','deactivated') NOT NULL DEFAULT 'active'"
  );

  await db.query(
    "ALTER TABLE student_accounts MODIFY COLUMN status ENUM('pending','active','deactivated') NOT NULL DEFAULT 'active'"
  );

  await db.query(
    "ALTER TABLE site_content ADD COLUMN allow_student_register TINYINT(1) NOT NULL DEFAULT 0"
  );

  await db.query(
    "ALTER TABLE site_content ADD COLUMN allow_teacher_register TINYINT(1) NOT NULL DEFAULT 0"
  );

  await db.query(
    "ALTER TABLE site_content ADD COLUMN auto_activate_student_register TINYINT(1) NOT NULL DEFAULT 0"
  );

  await db.query(
    "ALTER TABLE site_content ADD COLUMN auto_activate_teacher_register TINYINT(1) NOT NULL DEFAULT 0"
  );

  console.log("✔ Self-registration migration complete.");
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`✔ API running at http://0.0.0.0:${PORT}`);

  console.log(
    `✔ Database target: ${databaseConfig.host}:${databaseConfig.port}/${
      databaseConfig.database || "(not selected)"
    }`
  );

  try {
    await db.query("SELECT 1");

    console.log("✔ MySQL connected successfully");

    await runMigrations();
  } catch (error) {
    console.error("❌ MySQL connection failed:");
    console.error(error.message);
    console.error(
      "  Run 'npm run db:init' and 'npm run db:seed' to set up the database."
    );
  }
});