const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
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
  const { errors, data } = validate(req.body, {
    fullName: { type: "string", required: true, min: 2, max: 150, label: "Full name" },
    email:    { type: "email", required: true, max: 150, label: "Email" },
    password: { type: "string", required: true, min: 6, max: 128, label: "Password" },
    subject:  { type: "string", required: true, max: 120, label: "Subject" },
  });
  if (errors.length) return res.status(400).json({ error: errors[0], errors });
  const { fullName, email: normalizedEmail, password, subject } = data;

  const [existing] = await pool.query("SELECT id FROM teacher_accounts WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = await hashPassword(password);
  const [{ insertId }] = await pool.query(
    "INSERT INTO teacher_accounts (full_name, email, password_hash, subject, status) VALUES (?, ?, ?, ?, 'active')",
    [fullName, normalizedEmail, hash, subject]
  );

  const [rows] = await pool.query("SELECT * FROM teacher_accounts WHERE id = ?", [insertId]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "create",
    entityType: "teacher_account",
    entityId: insertId,
    details: { fullName, email: normalizedEmail, subject },
  });

  res.status(201).json(toPublic(rows[0]));
});

router.patch("/:id/activate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE teacher_accounts SET status = 'active' WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "activate",
    entityType: "teacher_account",
    entityId: req.params.id,
  });

  res.json({ message: "Account activated." });
});

router.patch("/:id/deactivate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE teacher_accounts SET status = 'deactivated' WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "deactivate",
    entityType: "teacher_account",
    entityId: req.params.id,
  });

  res.json({ message: "Account deactivated." });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT full_name, email FROM teacher_accounts WHERE id = ?", [req.params.id]);
  await pool.query("DELETE FROM teacher_accounts WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "delete",
    entityType: "teacher_account",
    entityId: req.params.id,
    details: rows[0] || null,
  });

  res.json({ message: "Account deleted." });
});

module.exports = router;
