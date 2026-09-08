/**
 * migrateAll.js — run every pending migration in the correct order.
 *
 * Safe to run multiple times: every ALTER TABLE uses IF NOT EXISTS /
 * MODIFY COLUMN (idempotent) so columns that already exist are left alone.
 *
 * Usage:  npm run db:migrate-all
 *         (or from the server folder: node src/scripts/migrateAll.js)
 */
const pool = require("../db");

// ─── helpers ────────────────────────────────────────────────────────────────

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?
       AND COLUMN_NAME  = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function addColumn(table, column, definition) {
  if (await columnExists(table, column)) {
    console.log(`  skip  ${table}.${column} (already exists)`);
    return;
  }
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`  added ${table}.${column}`);
}

async function tableExists(name) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [name]
  );
  return rows[0].cnt > 0;
}

// ─── migrations ─────────────────────────────────────────────────────────────

async function migrateApplications() {
  console.log("\n[1/5] applications table …");

  // Round 1 — parent contact, status tracking, feedback attachment
  await addColumn("applications", "parent_email",       "VARCHAR(180) NULL AFTER parent_name");
  await addColumn("applications", "status",             "ENUM('pending','under_review','approved','rejected','info_required') NOT NULL DEFAULT 'pending' AFTER report_file_name");
  await addColumn("applications", "feedback",           "TEXT NULL AFTER status");
  await addColumn("applications", "feedback_file_url",  "VARCHAR(500) NULL AFTER feedback");
  await addColumn("applications", "feedback_file_name", "VARCHAR(255) NULL AFTER feedback_file_url");
  await addColumn("applications", "updated_at",         "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER feedback_file_name");

  // Round 2 — admission type and school level
  await addColumn("applications", "admission_type",  "VARCHAR(30)  NULL AFTER track_year");
  await addColumn("applications", "index_number",    "VARCHAR(80)  NULL AFTER admission_type");
  await addColumn("applications", "current_school",  "VARCHAR(200) NULL AFTER index_number");
  await addColumn("applications", "current_level",   "VARCHAR(50)  NULL AFTER current_school");

  // Widen status ENUM (idempotent — MySQL only rewrites if the definition differs)
  await pool.query(
    `ALTER TABLE applications
     MODIFY COLUMN status
       ENUM('pending','under_review','approved','rejected','info_required')
       NOT NULL DEFAULT 'pending'`
  );
  console.log("  ensured status ENUM includes under_review and info_required");
}

async function migrateApplicationFeedbackTemplates() {
  console.log("\n[2/5] application_feedback_templates table …");

  if (!(await tableExists("application_feedback_templates"))) {
    await pool.query(`
      CREATE TABLE application_feedback_templates (
        id                    INT PRIMARY KEY DEFAULT 1,
        pending_message       TEXT NOT NULL,
        approved_message      TEXT NOT NULL,
        rejected_message      TEXT NOT NULL,
        under_review_message  TEXT NULL,
        info_required_message TEXT NULL,
        updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_application_feedback_templates_singleton CHECK (id = 1)
      ) ENGINE=InnoDB
    `);
    console.log("  created application_feedback_templates");
  } else {
    await addColumn("application_feedback_templates", "under_review_message",  "TEXT NULL AFTER rejected_message");
    await addColumn("application_feedback_templates", "info_required_message", "TEXT NULL AFTER under_review_message");
  }

  // Seed a default row if none exists yet
  await pool.query(
    `INSERT INTO application_feedback_templates
       (id, pending_message, approved_message, rejected_message, under_review_message, info_required_message)
     SELECT 1, ?, ?, ?, ?, ? FROM DUAL
     WHERE NOT EXISTS (SELECT 1 FROM application_feedback_templates WHERE id = 1)`,
    [
      "Your application has been received and is waiting for review.",
      "Congratulations! Your application has been approved. Please contact the school for the next steps.",
      "Thank you for applying. Unfortunately, we cannot offer a place at this time.",
      "Your application is currently under review. We will be in touch shortly.",
      "We need some additional information to process your application. Please contact the school.",
    ]
  );
  console.log("  default template row is present");
}

async function migrateSchoolClasses() {
  console.log("\n[3/5] school_class ENUM …");
  const newEnum =
    "ENUM('S1','S2','S3','L3SOD','L4SOD','L5SOD','SC_SOD','L3MLT','L4MLT','L5MLT','SC_MLT') NOT NULL";
  await pool.query(`ALTER TABLE student_accounts MODIFY COLUMN school_class ${newEnum}`);
  await pool.query(`ALTER TABLE resources        MODIFY COLUMN school_class ${newEnum}`);
  console.log("  student_accounts and resources school_class ENUM widened");
}

async function migrateRegistration() {
  console.log("\n[4/5] site_content self-registration flags …");
  await addColumn("site_content", "allow_student_register",          "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumn("site_content", "allow_teacher_register",          "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumn("site_content", "auto_activate_student_register",  "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumn("site_content", "auto_activate_teacher_register",  "TINYINT(1) NOT NULL DEFAULT 0");
}

async function migrateHeroImages() {
  console.log("\n[5/5] site_content hero_images column …");
  await addColumn("site_content", "hero_images", "LONGTEXT NULL AFTER hero_img");
}

// ─── main ────────────────────────────────────────────────────────────────────

async function run() {
  console.log("=== migrateAll — applying all pending migrations ===");

  await migrateApplications();
  await migrateApplicationFeedbackTemplates();
  await migrateSchoolClasses();
  await migrateRegistration();
  await migrateHeroImages();

  console.log("\n=== All migrations complete. ===\n");
  await pool.end();
}

run().catch(async (err) => {
  console.error("\nMigration failed:", err.message);
  await pool.end();
  process.exit(1);
});
