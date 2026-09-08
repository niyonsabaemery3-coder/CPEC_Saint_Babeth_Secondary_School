const express = require("express");
const pool = require("../db");
const { requireAdmin, requireAdminOrTeacher } = require("../middleware/auth");
const { SCHOOL_CLASS_VALUES } = require("../constants/academics");
const { logAction } = require("../utils/audit");

const router = express.Router();

function toPublic(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    maxScore: Number(row.max_score),
    createdAt: row.created_at,
  };
}

function actorName(auth) {
  return auth.username || auth.email || null;
}

// Admin + Teacher: every subject on file — needed to build mark-entry forms
// and the "assign subject to class" screen.
router.get("/", requireAdminOrTeacher, async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM subjects ORDER BY name ASC");
  res.json(rows.map(toPublic));
});

// Admin: create a subject (e.g. "Mathematics", code "MATH", out of 100).
router.post("/", requireAdmin, async (req, res) => {
  const { name, code, maxScore } = req.body || {};
  if (!name?.trim() || !code?.trim()) {
    return res.status(400).json({ error: "Subject name and code are required." });
  }
  const max = maxScore != null ? Number(maxScore) : 100;
  if (!Number.isFinite(max) || max <= 0) {
    return res.status(400).json({ error: "Max score must be a positive number." });
  }
  const normalizedCode = code.trim().toUpperCase();

  const [existing] = await pool.query("SELECT id FROM subjects WHERE code = ?", [normalizedCode]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "A subject with this code already exists." });
  }

  const [{ insertId }] = await pool.query(
    "INSERT INTO subjects (name, code, max_score) VALUES (?, ?, ?)",
    [name.trim(), normalizedCode, max]
  );
  const [rows] = await pool.query("SELECT * FROM subjects WHERE id = ?", [insertId]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "create",
    entityType: "subject",
    entityId: insertId,
    details: { name: name.trim(), code: normalizedCode, maxScore: max },
  });

  res.status(201).json(toPublic(rows[0]));
});

// Admin: update a subject's name, code or max score.
router.put("/:id", requireAdmin, async (req, res) => {
  const { name, code, maxScore } = req.body || {};
  const [rows] = await pool.query("SELECT * FROM subjects WHERE id = ?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Subject not found." });

  const updates = [];
  const params = [];
  if (name?.trim()) {
    updates.push("name = ?");
    params.push(name.trim());
  }
  if (code?.trim()) {
    updates.push("code = ?");
    params.push(code.trim().toUpperCase());
  }
  if (maxScore != null) {
    const max = Number(maxScore);
    if (!Number.isFinite(max) || max <= 0) {
      return res.status(400).json({ error: "Max score must be a positive number." });
    }
    updates.push("max_score = ?");
    params.push(max);
  }
  if (updates.length === 0) return res.status(400).json({ error: "Nothing to update." });

  params.push(req.params.id);
  await pool.query(`UPDATE subjects SET ${updates.join(", ")} WHERE id = ?`, params);
  const [updated] = await pool.query("SELECT * FROM subjects WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "update",
    entityType: "subject",
    entityId: req.params.id,
    details: { name, code, maxScore },
  });

  res.json(toPublic(updated[0]));
});

// Admin: delete a subject. Cascades to its class assignments and any marks
// already recorded for it (see the foreign keys in schema.sql).
router.delete("/:id", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM subjects WHERE id = ?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Subject not found." });

  await pool.query("DELETE FROM subjects WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "delete",
    entityType: "subject",
    entityId: req.params.id,
    details: { name: rows[0].name, code: rows[0].code },
  });

  res.json({ message: "Subject deleted." });
});

// Admin + Teacher: subjects assigned to one class, with the teacher on each
// (null teacher = assigned but not yet staffed).
router.get("/class/:schoolClass", requireAdminOrTeacher, async (req, res) => {
  const { schoolClass } = req.params;
  if (!SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    return res.status(400).json({ error: "Unknown class." });
  }

  const [rows] = await pool.query(
    `SELECT cs.id AS assignment_id, s.id AS subject_id, s.name, s.code, s.max_score,
            ta.id AS teacher_id, ta.full_name AS teacher_name
     FROM class_subjects cs
     JOIN subjects s ON s.id = cs.subject_id
     LEFT JOIN teacher_accounts ta ON ta.id = cs.teacher_account_id
     WHERE cs.school_class = ?
     ORDER BY s.name ASC`,
    [schoolClass]
  );

  res.json(
    rows.map((r) => ({
      assignmentId: r.assignment_id,
      subjectId: r.subject_id,
      name: r.name,
      code: r.code,
      maxScore: Number(r.max_score),
      teacherId: r.teacher_id,
      teacherName: r.teacher_name,
    }))
  );
});

// Admin: assign a subject (optionally with a teacher) to a class. Calling
// this again for the same class+subject just re-assigns the teacher.
router.post("/class/:schoolClass", requireAdmin, async (req, res) => {
  const { schoolClass } = req.params;
  const { subjectId, teacherAccountId } = req.body || {};
  if (!SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    return res.status(400).json({ error: "Unknown class." });
  }
  if (!subjectId) return res.status(400).json({ error: "subjectId is required." });

  const [[subject]] = await pool.query("SELECT id FROM subjects WHERE id = ?", [subjectId]);
  if (!subject) return res.status(404).json({ error: "Subject not found." });

  if (teacherAccountId) {
    const [[teacher]] = await pool.query("SELECT id FROM teacher_accounts WHERE id = ?", [teacherAccountId]);
    if (!teacher) return res.status(404).json({ error: "Teacher not found." });
  }

  await pool.query(
    `INSERT INTO class_subjects (school_class, subject_id, teacher_account_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE teacher_account_id = VALUES(teacher_account_id)`,
    [schoolClass, subjectId, teacherAccountId || null]
  );

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "assign",
    entityType: "class_subject",
    entityId: `${schoolClass}:${subjectId}`,
    details: { schoolClass, subjectId, teacherAccountId: teacherAccountId || null },
  });

  res.status(201).json({ message: "Subject assigned to class." });
});

// Admin: remove a subject from a class entirely.
router.delete("/class/:schoolClass/:subjectId", requireAdmin, async (req, res) => {
  const { schoolClass, subjectId } = req.params;
  const [result] = await pool.query(
    "DELETE FROM class_subjects WHERE school_class = ? AND subject_id = ?",
    [schoolClass, subjectId]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "This subject is not assigned to that class." });
  }

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "unassign",
    entityType: "class_subject",
    entityId: `${schoolClass}:${subjectId}`,
  });

  res.json({ message: "Subject removed from class." });
});

module.exports = router;
