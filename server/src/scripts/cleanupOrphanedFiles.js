/**
 * Finds and deletes files sitting in Supabase Storage that no row in the
 * database points to anymore ("orphaned" uploads). Covers BOTH buckets:
 *   - the public bucket (SUPABASE_BUCKET)         — gallery/hero/teacher/
 *     resource images and public learning resources.
 *   - the private bucket (SUPABASE_PRIVATE_BUCKET) — student reports,
 *     admission report/feedback attachments.
 *
 * Why these pile up: whenever a file is replaced/removed, the old object
 * should be deleted right after the DB row is safely updated (see
 * utils/uploads.js#deleteUploadedFile) — but a crash between those two
 * steps, or a row deleted directly in the database, can still leave an
 * object with nothing pointing to it. Safe to re-run any time — it only
 * ever deletes what nothing in the database links to anymore.
 *
 * Usage:
 *   node server/src/scripts/cleanupOrphanedFiles.js            # dry run — lists what WOULD be deleted
 *   node server/src/scripts/cleanupOrphanedFiles.js --delete   # actually deletes them
 */
const pool = require("../db");
const supabase = require("../utils/supabaseStorage");

async function listAllObjects(bucket, prefix = "") {
  const res = await fetch(`${process.env.SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/list/${bucket}`, {
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
      keys.push(...(await listAllObjects(bucket, prefix ? `${prefix}/${entry.name}` : entry.name)));
    } else {
      keys.push(prefix ? `${prefix}/${entry.name}` : entry.name);
    }
  }
  return keys;
}

async function referencedKeys() {
  const publicUrls = new Set();
  const privateRefs = new Set();

  function addRef(value) {
    if (!value) return;
    if (value.startsWith("supabase-private:")) privateRefs.add(value);
    else publicUrls.add(value);
  }

  const [[site]] = await pool.query("SELECT hero_img, about_img FROM site_content WHERE id = 1");
  addRef(site?.hero_img);
  addRef(site?.about_img);

  const [gallery] = await pool.query("SELECT image_url FROM gallery_items");
  gallery.forEach((r) => addRef(r.image_url));

  const [teachers] = await pool.query("SELECT photo_url FROM teachers");
  teachers.forEach((r) => addRef(r.photo_url));

  const [resources] = await pool.query("SELECT file_url FROM resources");
  resources.forEach((r) => addRef(r.file_url));

  const [applications] = await pool.query("SELECT report_file_url, feedback_file_url FROM applications");
  applications.forEach((r) => { addRef(r.report_file_url); addRef(r.feedback_file_url); });

  const [reports] = await pool.query("SELECT file_url FROM student_reports");
  reports.forEach((r) => addRef(r.file_url));

  return {
    publicKeys: new Set(Array.from(publicUrls).map((url) => supabase.keyFromPublicUrl(url)).filter(Boolean)),
    privateKeys: new Set(Array.from(privateRefs).map((ref) => supabase.keyFromPrivateRef(ref)).filter(Boolean)),
  };
}

async function cleanBucket({ label, bucket, listedKeys, inUseKeys, doDelete, deleteFn }) {
  console.log(`\n— ${label} bucket ("${bucket}") —`);
  console.log(`Found ${listedKeys.length} file(s) in storage.`);
  console.log(`${inUseKeys.size} file(s) are referenced by the database.`);

  const orphaned = listedKeys.filter((key) => !inUseKeys.has(key));

  if (orphaned.length === 0) {
    console.log("No orphaned files found. This bucket is already clean.");
    return 0;
  }

  console.log(`${orphaned.length} orphaned file(s):`);
  orphaned.forEach((key) => console.log(`  - ${key}`));

  if (!doDelete) {
    console.log("Dry run — nothing was deleted here. Re-run with --delete to remove these files.");
    return 0;
  }

  console.log("Deleting...");
  for (const key of orphaned) {
    await deleteFn(key);
    console.log(`  deleted: ${key}`);
  }
  return orphaned.length;
}

async function run() {
  if (!supabase.isConfigured) {
    console.error("SUPABASE_URL / SUPABASE_SECRET_KEY are not set — nothing to clean up.");
    process.exit(1);
  }

  const doDelete = process.argv.includes("--delete");
  const publicBucket = process.env.SUPABASE_BUCKET || "uploads";
  const privateBucket = process.env.SUPABASE_PRIVATE_BUCKET || "private";

  console.log("Listing files in Supabase Storage...");
  const [publicListed, privateListed] = await Promise.all([
    listAllObjects(publicBucket),
    listAllObjects(privateBucket).catch((err) => {
      console.warn(`Could not list private bucket "${privateBucket}" (it may not exist yet): ${err.message}`);
      return [];
    }),
  ]);

  console.log("Checking which ones are still referenced in the database...");
  const { publicKeys, privateKeys } = await referencedKeys();

  let totalDeleted = 0;
  totalDeleted += await cleanBucket({
    label: "PUBLIC",
    bucket: publicBucket,
    listedKeys: publicListed,
    inUseKeys: publicKeys,
    doDelete,
    deleteFn: (key) => supabase.deleteObject(key),
  });
  totalDeleted += await cleanBucket({
    label: "PRIVATE",
    bucket: privateBucket,
    listedKeys: privateListed,
    inUseKeys: privateKeys,
    doDelete,
    deleteFn: (key) => supabase.deletePrivateObject(key),
  });

  if (doDelete) {
    console.log(`\nDone — removed ${totalDeleted} orphaned file(s) across both buckets.`);
  } else {
    console.log(`\nDry run complete. Re-run with --delete to actually remove the files listed above.`);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
