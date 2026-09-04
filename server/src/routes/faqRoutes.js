const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

function toPublic(row) {
  return { id: row.id, q: row.question, a: row.answer };
}

// Public: powers the floating chat widget.
router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM faqs ORDER BY sort_order ASC, id ASC");
  res.json(rows.map(toPublic));
});

router.post("/", requireAdmin, async (req, res) => {
  const { q, a } = req.body || {};
  if (!q?.trim() || !a?.trim()) return res.status(400).json({ error: "Question and answer are required." });

  const [[{ n }]] = await pool.query("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM faqs");
  const [{ insertId }] = await pool.query("INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)", [q.trim(), a.trim(), n]);

  const [rows] = await pool.query("SELECT * FROM faqs WHERE id = ?", [insertId]);
  res.status(201).json(toPublic(rows[0]));
});

router.put("/:id", requireAdmin, async (req, res) => {
  const { q, a } = req.body || {};
  await pool.query("UPDATE faqs SET question = ?, answer = ? WHERE id = ?", [q, a, req.params.id]);
  res.json({ message: "FAQ updated." });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM faqs WHERE id = ?", [req.params.id]);
  res.json({ message: "FAQ deleted." });
});

module.exports = router;
