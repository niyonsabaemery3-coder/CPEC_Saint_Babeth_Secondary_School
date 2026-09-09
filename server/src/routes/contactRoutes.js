const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

function toPublic(row) {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    message: row.message,
    isRead: !!row.is_read,
    createdAt: row.created_at,
  };
}

// Public: submit a contact message from the website contact form.
router.post("/", async (req, res) => {
  const b = req.body || {};
  const name = (b.name || "").trim();
  const contact = (b.contact || "").trim();
  const message = (b.message || "").trim();

  if (!name || name.length < 2)
    return res.status(400).json({ error: "Full name must be at least 2 characters." });
  if (!contact)
    return res.status(400).json({ error: "Email or phone number is required." });
  if (!message || message.length < 5)
    return res.status(400).json({ error: "Message must be at least 5 characters." });

  const [{ insertId }] = await pool.query(
    "INSERT INTO contact_messages (name, contact, message) VALUES (?, ?, ?)",
    [name, contact, message]
  );
  const [[row]] = await pool.query("SELECT * FROM contact_messages WHERE id = ?", [insertId]);
  res.status(201).json(toPublic(row));
});

// Admin: list all messages, newest first. Optional ?unread=1 to filter unread only.
router.get("/", requireAdmin, async (req, res) => {
  const unreadOnly = req.query.unread === "1";
  const [rows] = await pool.query(
    `SELECT * FROM contact_messages ${unreadOnly ? "WHERE is_read = 0" : ""} ORDER BY created_at DESC`
  );
  res.json(rows.map(toPublic));
});

// Admin: count of unread messages (used for the badge in the sidebar).
router.get("/unread-count", requireAdmin, async (_req, res) => {
  const [[row]] = await pool.query(
    "SELECT COUNT(*) AS count FROM contact_messages WHERE is_read = 0"
  );
  res.json({ count: Number(row.count) });
});

// Admin: mark a single message as read.
router.patch("/:id/read", requireAdmin, async (req, res) => {
  await pool.query("UPDATE contact_messages SET is_read = 1 WHERE id = ?", [req.params.id]);
  const [[row]] = await pool.query("SELECT * FROM contact_messages WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Message not found." });
  res.json(toPublic(row));
});

// Admin: mark ALL messages as read.
router.patch("/read-all", requireAdmin, async (_req, res) => {
  await pool.query("UPDATE contact_messages SET is_read = 1 WHERE is_read = 0");
  res.json({ ok: true });
});

// Admin: delete a single message.
router.delete("/:id", requireAdmin, async (req, res) => {
  const [[row]] = await pool.query("SELECT id FROM contact_messages WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Message not found." });
  await pool.query("DELETE FROM contact_messages WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// Admin: delete ALL messages (bulk clear).
router.delete("/", requireAdmin, async (_req, res) => {
  await pool.query("DELETE FROM contact_messages");
  res.json({ ok: true });
});

module.exports = router;
