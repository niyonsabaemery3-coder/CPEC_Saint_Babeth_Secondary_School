const express = require("express");
const pool = require("../db");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken, requireAdmin, requireTeacher } = require("../middleware/auth");

const router = express.Router();

function teacherAccountPublic(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    subject: row.subject,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------- ADMIN ----
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password are required." });

  const [rows] = await pool.query("SELECT * FROM admins WHERE username = ?", [username]);
  const admin = rows[0];
  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = signToken({ role: "admin", id: admin.id, username: admin.username });
  res.json({ token, username: admin.username });
});

router.put("/admin/credentials", requireAdmin, async (req, res) => {
  const { currentPassword, username, password } = req.body || {};
  const adminAuth = req.auth;

  const [rows] = await pool.query("SELECT * FROM admins WHERE id = ?", [adminAuth.id]);
  const admin = rows[0];
  if (!admin) return res.status(404).json({ error: "Admin account not found." });
  if (!currentPassword || !(await verifyPassword(currentPassword, admin.password_hash))) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  if (username) {
    await pool.query("UPDATE admins SET username = ? WHERE id = ?", [username, admin.id]);
  }
  if (password) {
    const hash = await hashPassword(password);
    await pool.query("UPDATE admins SET password_hash = ? WHERE id = ?", [hash, admin.id]);
  }

  const [updated] = await pool.query("SELECT username FROM admins WHERE id = ?", [admin.id]);
  const token = signToken({ role: "admin", id: admin.id, username: updated[0].username });
  res.json({ token, username: updated[0].username });
});

// -------------------------------------------------------------- TEACHER ----
router.post("/teacher/register", async (req, res) => {
  const { fullName, email, password, subject } = req.body || {};
  if (!fullName?.trim() || !email?.trim() || !password || !subject?.trim()) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await pool.query("SELECT id FROM teacher_accounts WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hash = await hashPassword(password);
  await pool.query(
    "INSERT INTO teacher_accounts (full_name, email, password_hash, subject, status) VALUES (?, ?, ?, ?, 'pending')",
    [fullName.trim(), normalizedEmail, hash, subject.trim()]
  );

  res.status(201).json({ message: "Account created! Please wait for admin approval before logging in." });
});

router.post("/teacher/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const [rows] = await pool.query("SELECT * FROM teacher_accounts WHERE email = ?", [email.trim().toLowerCase()]);
  const account = rows[0];
  if (!account) return res.status(401).json({ error: "No account found with this email." });
  if (!(await verifyPassword(password, account.password_hash))) {
    return res.status(401).json({ error: "Incorrect password." });
  }
  if (account.status === "pending") {
    return res.status(403).json({ error: "Your account is still awaiting admin approval." });
  }
  if (account.status === "deactivated") {
    return res.status(403).json({ error: "Your account has been deactivated. Contact the admin." });
  }

  const token = signToken({ role: "teacher", id: account.id, email: account.email });
  res.json({ token, teacher: teacherAccountPublic(account) });
});

router.put("/teacher/password", requireTeacher, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required." });
  }

  const [rows] = await pool.query("SELECT * FROM teacher_accounts WHERE id = ?", [req.auth.id]);
  const account = rows[0];
  if (!account || !(await verifyPassword(currentPassword, account.password_hash))) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  const hash = await hashPassword(newPassword);
  await pool.query("UPDATE teacher_accounts SET password_hash = ? WHERE id = ?", [hash, account.id]);
  res.json({ message: "Password updated successfully." });
});

router.get("/teacher/me", requireTeacher, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM teacher_accounts WHERE id = ?", [req.auth.id]);
  if (!rows[0]) return res.status(404).json({ error: "Account not found." });
  res.json(teacherAccountPublic(rows[0]));
});

module.exports = router;
