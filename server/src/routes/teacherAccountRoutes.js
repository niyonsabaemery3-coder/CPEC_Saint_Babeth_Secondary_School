const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { hashPassword } = require("../utils/password");

const router = express.Router();

function toPublic(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    subject: row.subject,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Admin: list every teacher account (active/deactivated).
router.get("/", requireAdmin, async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM teacher_accounts ORDER BY created_at DESC");
  res.json(rows.map(toPublic));
});

// Admin: create a new teacher account directly (active from the start).
router.post("/", requireAdmin, async (req, res) => {
  const { fullName, email, password, subject } = req.body || {};
  if (!fullName?.trim() || !email?.trim() || !password || !subject?.trim()) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await pool.query("SELECT id FROM teacher_accounts WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = await hashPassword(password);
  const [{ insertId }] = await pool.query(
    "INSERT INTO teacher_accounts (full_name, email, password_hash, subject, status) VALUES (?, ?, ?, ?, 'active')",
    [fullName.trim(), normalizedEmail, hash, subject.trim()]
  );

  const [rows] = await pool.query("SELECT * FROM teacher_accounts WHERE id = ?", [insertId]);
  res.status(201).json(toPublic(rows[0]));
});

router.patch("/:id/activate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE teacher_accounts SET status = 'active' WHERE id = ?", [req.params.id]);
  res.json({ message: "Account activated." });
});

router.patch("/:id/deactivate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE teacher_accounts SET status = 'deactivated' WHERE id = ?", [req.params.id]);
  res.json({ message: "Account deactivated." });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM teacher_accounts WHERE id = ?", [req.params.id]);
  res.json({ message: "Account deleted." });
});

module.exports = router;
