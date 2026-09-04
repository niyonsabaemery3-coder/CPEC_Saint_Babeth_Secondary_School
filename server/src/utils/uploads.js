const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const supabase = require("./supabaseStorage");
const r2 = require("./r2");

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");

const EXT_BY_MIME = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.ms-powerpoint": "ppt",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Saves a base64 data URL (e.g. "data:application/pdf;base64,....") and
 * returns the public URL to store in the database.
 *
 * Storage backend is picked automatically, in this order:
 *   1. Supabase Storage, if SUPABASE_URL + SUPABASE_SECRET_KEY are set.
 *   2. Cloudflare R2, if its env vars are set instead.
 *   3. Local disk under uploads/<category>/ (the original behaviour) —
 *      only fine for hosts with a persistent filesystem; on Clever Cloud /
 *      Render this is lost on every redeploy, which is why 1 or 2 exist.
 *
 * Returns null if dataUrl is falsy (nothing to save — e.g. a link-only resource).
 */
async function saveBase64File(dataUrl, category, originalFileName) {
  if (!dataUrl) return null;

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid file data — expected a base64 data URL.");
  }
  const [, mime, base64] = match;

  let ext = EXT_BY_MIME[mime];
  if (!ext && originalFileName && originalFileName.includes(".")) {
    ext = originalFileName.split(".").pop();
  }
  // originalFileName is client-supplied — without this check, an extension
  // like "png/../../evil" (taken verbatim from a crafted filename) could
  // escape the uploads directory when joined into filePath below. Only
  // allow a short run of safe filename characters; anything else falls
  // back to a generic, harmless extension.
  if (!ext || !/^[a-zA-Z0-9]{1,10}$/.test(ext)) ext = "bin";

  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const buffer = Buffer.from(base64, "base64");

  if (supabase.isConfigured) {
    const key = `${category}/${filename}`;
    return supabase.uploadBuffer(buffer, key, mime);
  }

  if (r2.isConfigured) {
    const key = `${category}/${filename}`;
    return r2.uploadBuffer(buffer, key, mime);
  }

  const dir = path.join(UPLOADS_ROOT, category);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${category}/${filename}`;
}

/**
 * Deletes a previously-saved upload given its public URL, ignoring missing
 * files. Handles Supabase URLs, R2 URLs (https://...) and legacy local
 * paths (/uploads/...) so old rows created under any prior setup still
 * clean up correctly.
 */
async function deleteUploadedFile(publicUrl) {
  if (!publicUrl) return;

  if (supabase.isConfigured) {
    const key = supabase.keyFromPublicUrl(publicUrl);
    if (key) {
      await supabase.deleteObject(key).catch(() => {});
      return;
    }
  }

  if (r2.isConfigured) {
    const key = r2.keyFromPublicUrl(publicUrl);
    if (key) {
      await r2.deleteObject(key).catch(() => {});
      return;
    }
  }

  if (!publicUrl.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOADS_ROOT, publicUrl.replace("/uploads/", ""));
  // Defense in depth: never unlink a path that resolves outside UPLOADS_ROOT,
  // even though every caller only ever passes back a value this module
  // itself generated and saved earlier.
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(UPLOADS_ROOT) + path.sep)) return;
  fs.unlink(resolved, () => {});
}

module.exports = { saveBase64File, deleteUploadedFile, UPLOADS_ROOT };
