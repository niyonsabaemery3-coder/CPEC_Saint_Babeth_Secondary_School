/**
 * The frontend and this API are typically hosted on two different origins
 * (e.g. frontend on GitHub Pages, API on Render/Railway/a VPS). Relative
 * "/uploads/..." paths saved by uploads.js need to become full URLs pointing
 * back at THIS server before they're sent to the frontend, otherwise the
 * browser would try to load them from the frontend's own origin and 404.
 *
 * Paths that are NOT under /uploads/ (e.g. the default "/images/..." seed
 * placeholders, which are bundled with the frontend's own build) are left
 * untouched — those are meant to resolve against the frontend's own origin.
 */
function toAbsoluteUploadUrl(req, relativePath) {
  if (!relativePath) return relativePath;
  if (!relativePath.startsWith("/uploads/")) return relativePath;
  if (/^https?:\/\//.test(relativePath)) return relativePath;

  const configuredBase = process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  const base = configuredBase || `${req.protocol}://${req.get("host")}`;
  return `${base}${relativePath}`;
}

/**
 * The inverse of the above — used when SAVING data that was echoed back from
 * a previous GET (e.g. an admin submits a settings form without changing an
 * image). Strips a known absolute origin back down to a relative
 * "/uploads/..." path so the database always stores portable relative paths.
 */
function toRelativeUploadPath(value) {
  if (!value) return value;
  const match = value.match(/\/uploads\/.*/);
  return match ? match[0] : value;
}

module.exports = { toAbsoluteUploadUrl, toRelativeUploadPath };
