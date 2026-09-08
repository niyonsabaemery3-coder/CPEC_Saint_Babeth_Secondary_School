const express = require("express");
const pool = require("../db");
const { requireAdmin, requireAnyAuth } = require("../middleware/auth");
const { logAction } = require("../utils/audit");

const router = express.Router();

function toPublic(row) {
  return {
    id: row.id,
    name: row.name,
    schoolYear: row.school_year,
    isCurrent: !!row.is_current,
    createdAt: row.created_at,
  };
}

function actorName(auth) {
  return auth.username || auth.email || null;
}

// Any logged-in role can see the list of terms — students need it to pick
// which term's report card to view, teachers need it to enter marks.
router.get("/", requireAnyAuth, async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM exam_terms ORDER BY created_at DESC");
  res.json(rows.map(toPublic));
});

// Admin: create a new term, e.g. { name: "Term 1", schoolYear: "2025-2026" }.
router.post("/", requireAdmin, async (req, res) => {
  const { name, schoolYear } = req.body || {};
  if (!name?.trim() || !schoolYear?.trim()) {
    return res.status(400).json({ error: "Term name and school year are required." });
  }

  const [existing] = await pool.query(
    "SELECT id FROM exam_terms WHERE name = ? AND school_year = ?",
    [name.trim(), schoolYear.trim()]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: "This term already exists for that school year." });
  }

  const [{ insertId }] = await pool.query(
    "INSERT INTO exam_terms (name, school_year) VALUES (?, ?)",
    [name.trim(), schoolYear.trim()]
  );
  const [rows] = await pool.query("SELECT * FROM exam_terms WHERE id = ?", [insertId]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "create",
    entityType: "exam_term",
    entityId: insertId,
    details: { name: name.trim(), schoolYear: schoolYear.trim() },
  });

  res.status(201).json(toPublic(rows[0]));
});

// Admin: mark one term as "current" — this is the term used by default
// whenever a request doesn't specify one explicitly (report cards, mark
// entry). Unsets every other term first so there is always at most one.
router.patch("/:id/set-current", requireAdmin, async (req, res) => {
  const [[term]] = await pool.query("SELECT id FROM exam_terms WHERE id = ?", [req.params.id]);
  if (!term) return res.status(404).json({ error: "Term not found." });

  await pool.query("UPDATE exam_terms SET is_current = 0");
  await pool.query("UPDATE exam_terms SET is_current = 1 WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "set_current",
    entityType: "exam_term",
    entityId: req.params.id,
  });

  res.json({ message: "Current term updated." });
});

// Admin: delete a term. Cascades to any marks recorded under it.
router.delete("/:id", requireAdmin, async (req, res) => {
  const [[term]] = await pool.query("SELECT * FROM exam_terms WHERE id = ?", [req.params.id]);
  if (!term) return res.status(404).json({ error: "Term not found." });

  await pool.query("DELETE FROM exam_terms WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "delete",
    entityType: "exam_term",
    entityId: req.params.id,
    details: { name: term.name, schoolYear: term.school_year },
  });

  res.json({ message: "Term deleted." });
});

module.exports = router;
