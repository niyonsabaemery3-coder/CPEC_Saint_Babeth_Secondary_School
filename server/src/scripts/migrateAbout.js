/**
 * Adds the mission, vision, and core-values fields to an existing database.
 * New databases receive these columns from schema.sql automatically.
 *
 * Usage: npm run db:migrate-about
 */
const pool = require("../db");

async function columnExists(column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = ?`,
    [column]
  );
  return rows[0].cnt > 0;
}

async function addColumn(column, definition) {
  if (await columnExists(column)) {
    console.log(`${column} already exists - skipping.`);
    return;
  }
  console.log(`Adding ${column} to site_content...`);
  await pool.query(`ALTER TABLE site_content ADD COLUMN ${column} ${definition}`);
}

async function run() {
  await addColumn("mission", "TEXT NULL");
  await addColumn("vision", "TEXT NULL");
  await addColumn("core_values", "LONGTEXT NULL");
  console.log("Done - About mission, vision, and core values are ready.");
  await pool.end();
}

run().catch(async (err) => {
  console.error("About migration failed:", err.message);
  await pool.end();
  process.exit(1);
});
