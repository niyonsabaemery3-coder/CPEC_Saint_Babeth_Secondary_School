const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
 * Saves a base64 data URL (e.g. "data:application/pdf;base64,....") to disk
 * under uploads/<category>/, and returns the public URL path to store in the
 * database (e.g. "/uploads/resources/1699999999-ab12cd.pdf").
 *
 * Returns null if dataUrl is falsy (nothing to save — e.g. a link-only resource).
 */
function saveBase64File(dataUrl, category, originalFileName) {
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
  if (!ext) ext = "bin";

  const dir = path.join(UPLOADS_ROOT, category);
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));

  return `/uploads/${category}/${filename}`;
}

/** Deletes a previously-saved upload given its public URL path, ignoring missing files. */
function deleteUploadedFile(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOADS_ROOT, publicUrl.replace("/uploads/", ""));
  fs.unlink(filePath, () => {});
}

module.exports = { saveBase64File, deleteUploadedFile, UPLOADS_ROOT };
