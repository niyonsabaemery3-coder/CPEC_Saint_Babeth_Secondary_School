const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile } = require("../utils/uploads");
const { toAbsoluteUploadUrl, toRelativeUploadPath } = require("../utils/publicUrl");

const router = express.Router();

function toPublic(req, row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt || "",
    image: toAbsoluteUploadUrl(req, row.image_url) || "",
    date: row.event_date, // "YYYY-MM-DD" (dateStrings: true)
  };
}

// Public: powers the "News & Announcements" tab on the Events & News page.
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM news_items ORDER BY event_date DESC, sort_order DESC, id DESC");
    res.json(rows.map((r) => toPublic(req, r)));
  } catch (err) {
    next(err);
  }
});

// Admin: create a news item.
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { title, category, excerpt, image, date } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ error: "Title is required." });
    if (!date) return res.status(400).json({ error: "Date is required." });

    const imageUrl = image ? await saveBase64File(image, "images") : null;
    const [[{ n }]] = await pool.query("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM news_items");
    const [{ insertId }] = await pool.query(
      "INSERT INTO news_items (title, category, excerpt, image_url, event_date, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
      [title.trim(), category?.trim() || "Academics", excerpt?.trim() || "", imageUrl, date, n]
    );

    const [rows] = await pool.query("SELECT * FROM news_items WHERE id = ?", [insertId]);
    res.status(201).json(toPublic(req, rows[0]));
  } catch (err) {
    next(err);
  }
});

// Admin: update a news item. `image` may be a new base64 upload, an
// existing (possibly absolute) URL echoed back unchanged, or empty to clear it.
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { title, category, excerpt, image, date } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ error: "Title is required." });
    if (!date) return res.status(400).json({ error: "Date is required." });

    const [[existing]] = await pool.query("SELECT image_url FROM news_items WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "News item not found." });
    const oldImage = existing.image_url || null;

    const imageUrl = image?.startsWith("data:")
      ? await saveBase64File(image, "images")
      : toRelativeUploadPath(image || "") || null;

    await pool.query(
      "UPDATE news_items SET title = ?, category = ?, excerpt = ?, image_url = ?, event_date = ? WHERE id = ?",
      [title.trim(), category?.trim() || "Academics", excerpt?.trim() || "", imageUrl, date, req.params.id]
    );

    if (imageUrl !== oldImage && oldImage) await deleteUploadedFile(oldImage).catch(() => {});

    const [rows] = await pool.query("SELECT * FROM news_items WHERE id = ?", [req.params.id]);
    res.json(toPublic(req, rows[0]));
  } catch (err) {
    next(err);
  }
});

// Admin: delete a news item.
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM news_items WHERE id = ?", [req.params.id]);
    if (rows[0]?.image_url) await deleteUploadedFile(rows[0].image_url).catch(() => {});
    await pool.query("DELETE FROM news_items WHERE id = ?", [req.params.id]);
    res.json({ message: "News item deleted." });
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, _next) => {
  console.error("News route error:", err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong. Please try again." });
});

module.exports = router;
