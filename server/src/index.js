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

const app = express();

app.set("trust proxy", 1);

// ---------- SECURITY: HTTP headers ----------

// crossOriginResourcePolicy is relaxed to "cross-origin" so that images/uploads
// served from this API can still be loaded by a frontend on a different origin.

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // the SPA is served separately (or via its own CSP); avoid double-restricting here
  })
);

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

app.use(express.json({ limit: "15mb" }));

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

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      error: "Not found",
    });
  }

  res.sendFile(path.join(distDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);

  const message =
    process.env.DEBUG === "true"
      ? err.message || "Something went wrong on the server."
      : "Something went wrong on the server.";

  res.status(500).json({
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

async function runMigrations() {
  await runNewsEventsMigration();

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