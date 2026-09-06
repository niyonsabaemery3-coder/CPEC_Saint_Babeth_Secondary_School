const pool = require("../db");

async function columnExists(column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = ?`,
    [column]
  );
  return rows[0].count > 0;
}

async function addColumn(column, definition) {
  if (await columnExists(column)) return;
  await pool.query(`ALTER TABLE applications ADD COLUMN ${column} ${definition}`);
  console.log(`Added applications.${column}`);
}

async function run() {
  await addColumn("status", "ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'");
  await addColumn("parent_email", "VARCHAR(180) NULL AFTER parent_name");
  await addColumn("feedback", "TEXT NULL");
  await addColumn("feedback_file_url", "VARCHAR(500) NULL");
  await addColumn("feedback_file_name", "VARCHAR(255) NULL");
  await addColumn("updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  console.log("Application tracking and review fields are ready.");
  await pool.end();
}

run().catch(async (error) => {
  console.error("Applications migration failed:", error.message);
  await pool.end();
  process.exit(1);
});