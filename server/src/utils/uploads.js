const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const supabase = require("./supabaseStorage");
const r2 = require("./r2");
const { signLocalPath } = require("./localSign");

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

// Single source of truth for what this app accepts, shared by the
// server-side check below and mirrored in the /api/site/stats payload the
// admin Data & Storage panel reads its "Supported File Types" from — see
// server/src/routes/siteRoutes.js.
const ALLOWED_MIME_TYPES = new Set(Object.keys(EXT_BY_MIME));
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — keep in sync with index.js's JSON body limit.

// Categories that hold sensitive, per-person documents. Everything else
// (gallery/hero/banner/teacher images, public learning resources, etc.) is
// treated as public. Centralising this list means a route can never
// accidentally leave a sensitive category world-readable just by forgetting
// to pass an option.
const PRIVATE_CATEGORIES = new Set(["reports", "application-feedback"]);

class UploadValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UploadValidationError";
    this.status = 400;
  }
}

let warnedLocalFallback = false;

/**
 * Saves a base64 data URL (e.g. "data:application/pdf;base64,....") and
 * returns a reference to store in the database. What that reference looks
 * like depends on where the file ended up — callers never need to know
 * this; always pass it back into deleteUploadedFile()/resolveFileUrl() as-is.
 *
 * Storage backend, in order:
 *   1. Supabase Storage, if SUPABASE_URL + SUPABASE_SECRET_KEY are set. This
 *      is the only backend intended for production use. Sensitive
 *      categories (see PRIVATE_CATEGORIES) go to the private bucket and get
 *      back an internal "supabase-private:<key>" reference instead of a
 *      real URL; everything else goes to the public bucket and gets back a
 *      permanent public URL.
 *   2. Local disk under uploads/<category>/ (or uploads/private/<category>/
 *      for sensitive categories) — for LOCAL DEVELOPMENT ONLY. Render/Clever
 *      Cloud/most hosts do not persist the local filesystem across
 *      redeploys, and express.static() has no access control, so this path
 *      is never suitable for production. A warning is logged the first time
 *      it's used.
 *
 * (Cloudflare R2 is intentionally no longer written to by new uploads — see
 * server/README.md. deleteUploadedFile() still knows how to clean up R2
 * objects created before this change, so nothing already migrated is
 * orphaned.)
 *
 * Returns null if dataUrl is falsy (nothing to save — e.g. a link-only resource).
 */
async function saveBase64File(dataUrl, category, originalFileName, opts = {}) {
  if (!dataUrl) return null;

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new UploadValidationError("Invalid file data — expected a base64 data URL.");
  }
  const [, mime, base64] = match;

  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new UploadValidationError(
      `Unsupported file type (${mime}). Allowed types: images (JPG, PNG, WebP, GIF) and documents (PDF, DOC, DOCX, PPT, PPTX).`
    );
  }

  // Rough size check on the base64 payload before decoding (base64 is ~4/3
  // the size of the raw bytes) — rejects clearly-oversized uploads before
  // spending memory on a Buffer we're going to throw away anyway.
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > MAX_FILE_BYTES) {
    throw new UploadValidationError(
      `File is too large — the maximum allowed size is ${MAX_FILE_BYTES / (1024 * 1024)} MB.`
    );
  }

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

  // Actual decoded size as the authoritative check (the base64-length
  // estimate above is a fast pre-check, not a substitute for this).
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new UploadValidationError(
      `File is too large — the maximum allowed size is ${MAX_FILE_BYTES / (1024 * 1024)} MB.`
    );
  }

  const isPrivate =
    opts.visibility === "private" ||
    (opts.visibility !== "public" && PRIVATE_CATEGORIES.has(category));

  if (supabase.isConfigured) {
    const key = `${category}/${filename}`;
    return isPrivate
      ? supabase.uploadPrivateBuffer(buffer, key, mime)
      : supabase.uploadBuffer(buffer, key, mime);
  }

  if (!warnedLocalFallback) {
    warnedLocalFallback = true;
    console.warn(
      "⚠ SUPABASE_URL/SUPABASE_SECRET_KEY are not set — falling back to local disk storage. " +
        "This is fine for local development only; it is NOT persistent or secure enough for " +
        "production. Configure Supabase Storage before deploying (see server/README.md)."
    );
  }

  const dir = isPrivate
    ? path.join(UPLOADS_ROOT, "private", category)
    : path.join(UPLOADS_ROOT, category);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);

  return isPrivate ? `/uploads/private/${category}/${filename}` : `/uploads/${category}/${filename}`;
}

/**
 * Deletes a previously-saved upload given its stored reference, ignoring
 * missing files. Handles Supabase public URLs, Supabase private refs
 * ("supabase-private:<key>"), R2 URLs (https://...), and legacy local paths
 * (/uploads/... and /uploads/private/...) so old rows created under any
 * prior setup still clean up correctly.
 */
async function deleteUploadedFile(ref) {
  if (!ref) return;

  const privateKey = supabase.keyFromPrivateRef(ref);
  if (privateKey) {
    await supabase.deletePrivateObject(privateKey).catch(() => {});
    return;
  }

  if (supabase.isConfigured) {
    const key = supabase.keyFromPublicUrl(ref);
    if (key) {
      await supabase.deleteObject(key).catch(() => {});
      return;
    }
  }

  if (r2.isConfigured) {
    const key = r2.keyFromPublicUrl(ref);
    if (key) {
      await r2.deleteObject(key).catch(() => {});
      return;
    }
  }

  if (!ref.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOADS_ROOT, ref.replace("/uploads/", ""));
  // Defense in depth: never unlink a path that resolves outside UPLOADS_ROOT,
  // even though every caller only ever passes back a value this module
  // itself generated and saved earlier.
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(UPLOADS_ROOT) + path.sep)) return;
  fs.unlink(resolved, () => {});
}

/**
 * Resolves a stored file reference (of any of the shapes saveBase64File can
 * produce, plus legacy formats from earlier storage setups) into a URL the
 * frontend can actually use right now:
 *   - "supabase-private:<key>"   -> short-lived Supabase signed URL
 *   - "/uploads/private/..."     -> short-lived locally-signed URL (dev only)
 *   - anything else (a permanent public URL, or a legacy "/uploads/..."
 *     public path) -> made absolute against this API's own origin, unchanged
 *
 * This is the ONLY function route handlers should use to turn a DB value
 * into something sent to the browser — it guarantees a private file is
 * never handed out as a permanent link, regardless of which storage backend
 * originally saved it.
 */
async function resolveFileUrl(req, ref, { expiresIn = 3600 } = {}) {
  if (!ref) return null;

  const privateKey = supabase.keyFromPrivateRef(ref);
  if (privateKey) {
    const signed = await supabase.getSignedUrl(privateKey, expiresIn);
    return signed; // null if signing failed — frontend shows "unavailable" rather than a broken/leaked link
  }

  if (ref.startsWith("/uploads/private/")) {
    const configuredBase = process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    const base = configuredBase || `${req.protocol}://${req.get("host")}`;
    const token = signLocalPath(ref, expiresIn);
    return `${base}/api/files/signed?token=${encodeURIComponent(token)}`;
  }

  // Not a private reference — resolve it the normal (public) way.
  const { toAbsoluteUploadUrl } = require("./publicUrl");
  return toAbsoluteUploadUrl(req, ref);
}

module.exports = {
  saveBase64File,
  deleteUploadedFile,
  resolveFileUrl,
  UploadValidationError,
  UPLOADS_ROOT,
  MAX_FILE_BYTES,
  ALLOWED_MIME_TYPES,
};
