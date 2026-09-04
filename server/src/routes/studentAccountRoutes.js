const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { SCHOOL_CLASS_VALUES } = require("../constants/academics");
const { hashPassword } = require("../utils/password");

const router = express.Router();

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
  const { fullName, email, password, schoolClass } = req.body || {};
  if (!fullName?.trim() || !email?.trim() || !password || !schoolClass) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }
  if (!SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    return res.status(400).json({ error: "Please choose a valid class." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await pool.query("SELECT id FROM student_accounts WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = await hashPassword(password);
  const [{ insertId }] = await pool.query(
    "INSERT INTO student_accounts (full_name, email, password_hash, school_class, status) VALUES (?, ?, ?, ?, 'active')",
    [fullName.trim(), normalizedEmail, hash, schoolClass]
  );

  const [rows] = await pool.query("SELECT * FROM student_accounts WHERE id = ?", [insertId]);
  res.status(201).json(toPublic(rows[0]));
});

router.patch("/:id/activate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE student_accounts SET status = 'active' WHERE id = ?", [req.params.id]);
  res.json({ message: "Account activated." });
});

router.patch("/:id/deactivate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE student_accounts SET status = 'deactivated' WHERE id = ?", [req.params.id]);
  res.json({ message: "Account deactivated." });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM student_accounts WHERE id = ?", [req.params.id]);
  res.json({ message: "Account deleted." });
});

module.exports = router;
