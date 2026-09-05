const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile } = require("../utils/uploads");
const { toAbsoluteUploadUrl, toRelativeUploadPath } = require("../utils/publicUrl");

const router = express.Router();

function toPublic(req, row) {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    quote: row.quote,
    photo: toAbsoluteUploadUrl(req, row.photo_url),
    color: row.color,
  };
}

// Public: shown on the Teachers section of the website.
router.get("/", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM teachers ORDER BY sort_order ASC, id ASC");
  res.json(rows.map((r) => toPublic(req, r)));
});

// Admin: add a teacher to the public directory.
router.post("/", requireAdmin, async (req, res) => {
  const { name, subject, quote, photo, color } = req.body || {};
  if (!name?.trim() || !subject?.trim()) {
    return res.status(400).json({ error: "Name and subject are required." });
  }

  const photoUrl = photo ? await saveBase64File(photo, "images") : null;
  const [{ insertId }] = await pool.query(
    "INSERT INTO teachers (name, subject, quote, photo_url, color, sort_order) VALUES (?, ?, ?, ?, ?, (SELECT n FROM (SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM teachers) t))",
    [name.trim(), subject.trim(), quote?.trim() || "Passionate about helping students grow.", photoUrl, color || "#e6a935"]
  );

  const [rows] = await pool.query("SELECT * FROM teachers WHERE id = ?", [insertId]);
  res.status(201).json(toPublic(req, rows[0]));
});

// Admin: update one existing teacher in the public directory. Body:
// { name, subject, quote, photo, color }. Never touches any other row —
// only this teacher's own record is affected.
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [[existing]] = await pool.query("SELECT * FROM teachers WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: "Teacher not found." });

    const { name, subject, quote, photo, color } = req.body || {};
    if (!name?.trim() || !subject?.trim()) {
      return res.status(400).json({ error: "Name and subject are required." });
    }

    const photoUrl = photo?.startsWith("data:") ? await saveBase64File(photo, "images") : toRelativeUploadPath(photo);

    await pool.query(
      "UPDATE teachers SET name = ?, subject = ?, quote = ?, photo_url = ?, color = ? WHERE id = ?",
      [name.trim(), subject.trim(), quote?.trim() || "Passionate about helping students grow.", photoUrl, color || existing.color, id]
    );

    if (photoUrl !== existing.photo_url && existing.photo_url) await deleteUploadedFile(existing.photo_url).catch(() => {});

    const [rows] = await pool.query("SELECT * FROM teachers WHERE id = ?", [id]);
    res.json(toPublic(req, rows[0]));
  } catch (err) {
    next(err);
  }
});

// Admin: remove a teacher from the public directory.
router.delete("/:id", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM teachers WHERE id = ?", [req.params.id]);
  if (rows[0]?.photo_url) await deleteUploadedFile(rows[0].photo_url);
  await pool.query("DELETE FROM teachers WHERE id = ?", [req.params.id]);
  res.json({ message: "Teacher removed." });
});

module.exports = router;
