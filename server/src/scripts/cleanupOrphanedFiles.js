/**
 * Finds and deletes files sitting in Supabase Storage that no row in the
 * database points to anymore ("orphaned" uploads).
 *
 * Why these pile up: for a long time, `PUT /api/site` crashed part-way
 * through (missing `deleteUploadedFile` import — fixed now in siteRoutes.js)
 * whenever a gallery photo was removed or replaced, or the hero/about image
 * was changed. The database row was already updated/deleted by the time it
 * crashed, but the matching Supabase Storage file was never cleaned up — so
 * the bucket kept growing with photos the site no longer references, and any
 * OTHER site-content changes in that same save silently failed to persist.
 * That bug is now fixed, so this only needs to be run once to clear out the
 * backlog (safe to re-run any time — it only ever deletes what nothing links
 * to anymore).
 *
 * Usage:
 *   node server/src/scripts/cleanupOrphanedFiles.js            # dry run — lists what WOULD be deleted
 *   node server/src/scripts/cleanupOrphanedFiles.js --delete   # actually deletes them
 */
const pool = require("../db");
const supabase = require("../utils/supabaseStorage");

async function listAllObjects(prefix = "") {
  const res = await fetch(`${process.env.SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/list/${process.env.SUPABASE_BUCKET || "uploads"}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      apikey: process.env.SUPABASE_SECRET_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: "name", order: "asc" } }),
  });
  if (!res.ok) throw new Error(`Supabase list failed (${res.status}): ${await res.text().catch(() => "")}`);
  const entries = await res.json();

  const keys = [];
  for (const entry of entries) {
    // A "folder" placeholder has no id/metadata — recurse into it.
    if (entry.id === null) {
      keys.push(...(await listAllObjects(prefix ? `${prefix}/${entry.name}` : entry.name)));
    } else {
      keys.push(prefix ? `${prefix}/${entry.name}` : entry.name);
    }
  }
  return keys;
}

async function referencedKeys() {
  const urls = new Set();

  const [[site]] = await pool.query("SELECT hero_img, about_img FROM site_content WHERE id = 1");
  if (site?.hero_img) urls.add(site.hero_img);
  if (site?.about_img) urls.add(site.about_img);

  const [gallery] = await pool.query("SELECT image_url FROM gallery_items");
  gallery.forEach((r) => r.image_url && urls.add(r.image_url));

  const [teachers] = await pool.query("SELECT photo_url FROM teachers");
  teachers.forEach((r) => r.photo_url && urls.add(r.photo_url));

  const [resources] = await pool.query("SELECT file_url FROM resources");
  resources.forEach((r) => r.file_url && urls.add(r.file_url));

  const [applications] = await pool.query("SELECT report_file_url FROM applications");
  applications.forEach((r) => r.report_file_url && urls.add(r.report_file_url));

  const [reports] = await pool.query("SELECT file_url FROM student_reports");
  reports.forEach((r) => r.file_url && urls.add(r.file_url));

  return new Set(
    Array.from(urls)
      .map((url) => supabase.keyFromPublicUrl(url))
      .filter(Boolean)
  );
}

async function run() {
  if (!supabase.isConfigured) {
    console.error("SUPABASE_URL / SUPABASE_SECRET_KEY are not set — nothing to clean up.");
    process.exit(1);
  }

  const doDelete = process.argv.includes("--delete");

  console.log("Listing files in Supabase Storage...");
  const allKeys = await listAllObjects();
  console.log(`Found ${allKeys.length} file(s) in storage.`);

  console.log("Checking which ones are still referenced in the database...");
  const inUse = await referencedKeys();
  console.log(`${inUse.size} file(s) are referenced by the database.`);

  const orphaned = allKeys.filter((key) => !inUse.has(key));

  if (orphaned.length === 0) {
    console.log("No orphaned files found. Storage is already clean.");
    process.exit(0);
  }

  console.log(`\n${orphaned.length} orphaned file(s):`);
  orphaned.forEach((key) => console.log(`  - ${key}`));

  if (!doDelete) {
    console.log("\nThis was a dry run — nothing was deleted. Re-run with --delete to remove these files.");
    process.exit(0);
  }

  console.log("\nDeleting...");
  for (const key of orphaned) {
    await supabase.deleteObject(key);
    console.log(`  deleted: ${key}`);
  }
  console.log(`\nDone — removed ${orphaned.length} orphaned file(s).`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
