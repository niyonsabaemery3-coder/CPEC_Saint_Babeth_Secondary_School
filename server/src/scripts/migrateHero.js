/** Adds support for multiple rotating homepage hero images. */
const pool = require("../db");

async function run() {
  const [columns] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'hero_images'`
  );
  if (!columns[0].count) {
    await pool.query("ALTER TABLE site_content ADD COLUMN hero_images LONGTEXT AFTER hero_img");
    const [[site]] = await pool.query("SELECT hero_img FROM site_content WHERE id = 1");
    if (site?.hero_img) await pool.query("UPDATE site_content SET hero_images = ? WHERE id = 1", [JSON.stringify([site.hero_img])]);
    console.log("Added homepage hero slideshow support.");
  } else {
    console.log("Homepage hero slideshow support already exists - skipping.");
  }
  await pool.end();
}

run().catch(async (err) => {
  console.error("Hero migration failed:", err.message);
  await pool.end();
  process.exit(1);
});