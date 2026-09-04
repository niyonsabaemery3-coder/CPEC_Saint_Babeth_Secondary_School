const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile } = require("../utils/uploads");
const { toAbsoluteUploadUrl, toRelativeUploadPath } = require("../utils/publicUrl");

const router = express.Router();

// The only pages that have a "card page-banner". Kept as an allow-list so a
// bad/typo'd page key can never create a stray row.
const PAGE_KEYS = ["about", "academics", "admissions", "teachers", "gallery", "contact"];

// Public: every page's banner in one object, keyed by page. Pages that were
// never customised simply aren't in the response — the frontend falls back
// to that page's built-in default text in that case.
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM page_banners");
    const byKey = {};
    for (const row of rows) {
      byKey[row.page_key] = {
        eyebrow: row.eyebrow || "",
        title: row.title || "",
        subtitle: row.subtitle || "",
        bgImage: toAbsoluteUploadUrl(req, row.bg_image) || "",
      };
    }
    res.json(byKey);
  } catch (err) {
    next(err);
  }
});

// Admin: save ONE page's banner. This UPSERTs (INSERT ... ON DUPLICATE KEY
// UPDATE) a single row identified by :pageKey — it can never write to, or
// even read, another page's row. Editing the About banner's background can
// never touch Academics/Admissions/Teachers/Gallery/Contact, and vice versa.
router.put("/:pageKey", requireAdmin, async (req, res, next) => {
  try {
    const { pageKey } = req.params;
    if (!PAGE_KEYS.includes(pageKey)) {
      return res.status(400).json({ error: `Unknown page "${pageKey}".` });
    }

    const b = req.body || {};
    const [[existing]] = await pool.query("SELECT bg_image FROM page_banners WHERE page_key = ?", [pageKey]);
    const oldBgImage = existing?.bg_image || null;

    const bgImage = b.bgImage?.startsWith("data:")
      ? await saveBase64File(b.bgImage, "images")
      : toRelativeUploadPath(b.bgImage || "");

    await pool.query(
      `INSERT INTO page_banners (page_key, eyebrow, title, subtitle, bg_image)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE eyebrow = VALUES(eyebrow), title = VALUES(title), subtitle = VALUES(subtitle), bg_image = VALUES(bg_image)`,
      [pageKey, b.eyebrow || "", b.title || "", b.subtitle || "", bgImage || null]
    );

    if (bgImage !== oldBgImage && oldBgImage) await deleteUploadedFile(oldBgImage).catch(() => {});

    res.json({
      eyebrow: b.eyebrow || "",
      title: b.title || "",
      subtitle: b.subtitle || "",
      bgImage: toAbsoluteUploadUrl(req, bgImage) || "",
    });
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, _next) => {
  console.error("Page banner route error:", err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Failed to save. Please try again." });
});

module.exports = router;
