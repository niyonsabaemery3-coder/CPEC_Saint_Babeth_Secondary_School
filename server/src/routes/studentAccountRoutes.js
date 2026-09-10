const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { SCHOOL_CLASS_VALUES } = require("../constants/academics");
const { hashPassword } = require("../utils/password");
const { logAction } = require("../utils/audit");
const { validate } = require("../utils/validate");

const router = express.Router();

function actorName(auth) {
  return auth.username || auth.email || null;
}

function toPublic(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    schoolClass: row.school_class,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Admin: list student accounts — powers the Students report screen.
// Supports optional filtering/sorting so the report can be generated exactly
// the way the admin picked it: by class, and always ordered by name unless
// a different sort is requested.
//   GET /api/student-accounts?class=S1&sort=name&order=asc&search=alice
router.get("/", requireAdmin, async (req, res) => {
  const { class: schoolClass, sort, order, search } = req.query || {};

  const where = [];
  const params = [];

  if (schoolClass && SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    where.push("school_class = ?");
    params.push(schoolClass);
  }
  if (search && String(search).trim()) {
    where.push("(full_name LIKE ? OR email LIKE ?)");
    const like = `%${String(search).trim()}%`;
    params.push(like, like);
  }

  const sortColumn = sort === "class" ? "school_class" : sort === "created" ? "created_at" : "full_name";
  const sortOrder = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

  const sql = `SELECT * FROM student_accounts ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${sortColumn} ${sortOrder}, full_name ASC`;

  const [rows] = await pool.query(sql, params);
  res.json(rows.map(toPublic));
});

// Admin: create a new student account directly (active from the start).
router.post("/", requireAdmin, async (req, res) => {
  const { errors, data } = validate(req.body, {
    fullName:    { type: "string", required: true, min: 2, max: 150, label: "Full name" },
    email:       { type: "email", required: true, max: 150, label: "Email" },
    password:    { type: "string", required: true, min: 6, max: 128, label: "Password" },
    schoolClass: { type: "enum", required: true, values: SCHOOL_CLASS_VALUES, label: "Class" },
  });
  if (errors.length) return res.status(400).json({ error: errors[0], errors });
  const { fullName, email: normalizedEmail, password, schoolClass } = data;

  const [existing] = await pool.query("SELECT id FROM student_accounts WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = await hashPassword(password);
  const [{ insertId }] = await pool.query(
    "INSERT INTO student_accounts (full_name, email, password_hash, school_class, status) VALUES (?, ?, ?, ?, 'active')",
    [fullName, normalizedEmail, hash, schoolClass]
  );

  const [rows] = await pool.query("SELECT * FROM student_accounts WHERE id = ?", [insertId]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "create",
    entityType: "student_account",
    entityId: insertId,
    details: { fullName, email: normalizedEmail, schoolClass },
  });

  res.status(201).json(toPublic(rows[0]));
});

router.patch("/:id/activate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE student_accounts SET status = 'active' WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "activate",
    entityType: "student_account",
    entityId: req.params.id,
  });

  res.json({ message: "Account activated." });
});

router.patch("/:id/deactivate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE student_accounts SET status = 'deactivated' WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "deactivate",
    entityType: "student_account",
    entityId: req.params.id,
  });

  res.json({ message: "Account deactivated." });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT full_name, email FROM student_accounts WHERE id = ?", [req.params.id]);
  await pool.query("DELETE FROM student_accounts WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "delete",
    entityType: "student_account",
    entityId: req.params.id,
    details: rows[0] || null,
  });

  res.json({ message: "Account deleted." });
});

module.exports = router;
