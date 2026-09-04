/**
 * Run this ONCE against an existing database to add self-registration
 * support: widens the `status` ENUM on teacher_accounts/student_accounts to
 * include 'pending', and adds the allow_student_register /
 * allow_teacher_register toggle columns to site_content.
 *
 * Brand-new databases created via `npm run db:init` already get all of this
 * straight from schema.sql and do NOT need this script.
 *
 * Usage:  node server/src/scripts/migrateRegistration.js
 *   (or)  npm run db:migrate-registration
 */
const pool = require("../db");

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function run() {
  console.log("Widening status ENUM on teacher_accounts...");
  await pool.query(
    "ALTER TABLE teacher_accounts MODIFY COLUMN status ENUM('pending','active','deactivated') NOT NULL DEFAULT 'active'"
  );

  console.log("Widening status ENUM on student_accounts...");
  await pool.query(
    "ALTER TABLE student_accounts MODIFY COLUMN status ENUM('pending','active','deactivated') NOT NULL DEFAULT 'active'"
  );

  if (!(await columnExists("site_content", "allow_student_register"))) {
    console.log("Adding allow_student_register to site_content...");
    await pool.query("ALTER TABLE site_content ADD COLUMN allow_student_register TINYINT(1) NOT NULL DEFAULT 0");
  } else {
    console.log("allow_student_register already exists — skipping.");
  }

  if (!(await columnExists("site_content", "allow_teacher_register"))) {
    console.log("Adding allow_teacher_register to site_content...");
    await pool.query("ALTER TABLE site_content ADD COLUMN allow_teacher_register TINYINT(1) NOT NULL DEFAULT 0");
  } else {
    console.log("allow_teacher_register already exists — skipping.");
  }

  if (!(await columnExists("site_content", "auto_activate_student_register"))) {
    console.log("Adding auto_activate_student_register to site_content...");
    await pool.query("ALTER TABLE site_content ADD COLUMN auto_activate_student_register TINYINT(1) NOT NULL DEFAULT 0");
  } else {
    console.log("auto_activate_student_register already exists — skipping.");
  }

  if (!(await columnExists("site_content", "auto_activate_teacher_register"))) {
    console.log("Adding auto_activate_teacher_register to site_content...");
    await pool.query("ALTER TABLE site_content ADD COLUMN auto_activate_teacher_register TINYINT(1) NOT NULL DEFAULT 0");
  } else {
    console.log("auto_activate_teacher_register already exists — skipping.");
  }

  console.log("Done — self-registration support is ready.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
