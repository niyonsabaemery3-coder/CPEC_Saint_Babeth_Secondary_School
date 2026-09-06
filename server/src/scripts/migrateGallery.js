/** Adds category support to gallery_items in an existing database. */
const pool = require("../db");

async function run() {
  const [columns] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gallery_items' AND COLUMN_NAME = 'category'`
  );
  if (!columns[0].count) {
    await pool.query("ALTER TABLE gallery_items ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General' AFTER caption");
    console.log("Added gallery category support.");
  } else {
    console.log("Gallery category support already exists - skipping.");
  }
  await pool.end();
}

run().catch(async (err) => {
  console.error("Gallery migration failed:", err.message);
  await pool.end();
  process.exit(1);
});