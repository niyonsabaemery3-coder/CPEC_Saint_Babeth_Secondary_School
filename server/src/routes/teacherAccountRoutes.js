const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

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

// Admin: list every teacher account (pending/active/deactivated).
router.get("/", requireAdmin, async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM teacher_accounts ORDER BY created_at DESC");
  res.json(rows.map(toPublic));
});

router.patch("/:id/activate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE teacher_accounts SET status = 'active' WHERE id = ?", [req.params.id]);
  res.json({ message: "Account activated." });
});

router.patch("/:id/deactivate", requireAdmin, async (req, res) => {
  await pool.query("UPDATE teacher_accounts SET status = 'deactivated' WHERE id = ?", [req.params.id]);
  res.json({ message: "Account deactivated." });
});

module.exports = router;
