const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile } = require("../utils/uploads");
const { toAbsoluteUploadUrl, toRelativeUploadPath } = require("../utils/publicUrl");

const router = express.Router();

// Kept as an allow-list so a bad/typo'd color key can never be stored.
const COLOR_KEYS = ["navy", "green", "gold", "purple", "rust"];

function toPublic(req, row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description || "",
    location: row.location || "",
    date: row.event_date, // "YYYY-MM-DD" (dateStrings: true)
    time: row.event_time || "",
    icon: row.icon || "fa-calendar-days",
    colorKey: row.color_key || "navy",
    // Empty string (not null) so the frontend's `ev.image ? ... : colorFallback`
    // check works the same way it does for every other optional-image field.
    image: toAbsoluteUploadUrl(req, row.image_url) || "",
  };
}

// Public: powers the "Upcoming Events" tab on the Events & News page.
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM upcoming_events ORDER BY event_date ASC, sort_order ASC, id ASC");
    res.json(rows.map((r) => toPublic(req, r)));
  } catch (err) {
    next(err);
  }
});

// Admin: create an upcoming event. `image` (header photo) is optional —
// when omitted, the public card falls back to its plain colored header.
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { title, category, description, location, date, time, icon, colorKey, image } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ error: "Title is required." });
    if (!date) return res.status(400).json({ error: "Date is required." });
    if (colorKey && !COLOR_KEYS.includes(colorKey)) {
      return res.status(400).json({ error: "Invalid color." });
    }

    const imageUrl = image ? await saveBase64File(image, "images") : null;
    const [[{ n }]] = await pool.query("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM upcoming_events");
    const [{ insertId }] = await pool.query(
      `INSERT INTO upcoming_events (title, category, description, location, event_date, event_time, icon, color_key, image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        category?.trim() || "Academics",
        description?.trim() || "",
        location?.trim() || "",
        date,
        time?.trim() || "",
        icon?.trim() || "fa-calendar-days",
        colorKey || "navy",
        imageUrl,
        n,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM upcoming_events WHERE id = ?", [insertId]);
    res.status(201).json(toPublic(req, rows[0]));
  } catch (err) {
    next(err);
  }
});

// Admin: update an upcoming event. `image` may be a new base64 upload, an
// existing (possibly absolute) URL echoed back unchanged, or empty to clear
// it — clearing it makes the card fall back to its colored header again.
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { title, category, description, location, date, time, icon, colorKey, image } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ error: "Title is required." });
    if (!date) return res.status(400).json({ error: "Date is required." });
    if (colorKey && !COLOR_KEYS.includes(colorKey)) {
      return res.status(400).json({ error: "Invalid color." });
    }

    const [[existing]] = await pool.query("SELECT image_url FROM upcoming_events WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Event not found." });
    const oldImage = existing.image_url || null;

    const imageUrl = image?.startsWith("data:")
      ? await saveBase64File(image, "images")
      : toRelativeUploadPath(image || "") || null;

    await pool.query(
      `UPDATE upcoming_events
       SET title = ?, category = ?, description = ?, location = ?, event_date = ?, event_time = ?, icon = ?, color_key = ?, image_url = ?
       WHERE id = ?`,
      [
        title.trim(),
        category?.trim() || "Academics",
        description?.trim() || "",
        location?.trim() || "",
        date,
        time?.trim() || "",
        icon?.trim() || "fa-calendar-days",
        colorKey || "navy",
        imageUrl,
        req.params.id,
      ]
    );

    if (imageUrl !== oldImage && oldImage) await deleteUploadedFile(oldImage).catch(() => {});

    const [rows] = await pool.query("SELECT * FROM upcoming_events WHERE id = ?", [req.params.id]);
    res.json(toPublic(req, rows[0]));
  } catch (err) {
    next(err);
  }
});

// Admin: delete an upcoming event.
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM upcoming_events WHERE id = ?", [req.params.id]);
    if (rows[0]?.image_url) await deleteUploadedFile(rows[0].image_url).catch(() => {});
    await pool.query("DELETE FROM upcoming_events WHERE id = ?", [req.params.id]);
    res.json({ message: "Event deleted." });
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, _next) => {
  console.error("Event route error:", err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong. Please try again." });
});

module.exports = router;
