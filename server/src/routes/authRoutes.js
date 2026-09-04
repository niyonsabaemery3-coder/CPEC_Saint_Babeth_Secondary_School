const express = require("express");
const pool = require("../db");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken, requireAdmin, requireTeacher, requireStudent } = require("../middleware/auth");
const { SCHOOL_CLASS_VALUES } = require("../constants/academics");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function studentAccountPublic(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    schoolClass: row.school_class,
    status: row.status,
    createdAt: row.created_at,
  };
}

// --------------------------------------------------------- UNIFIED LOGIN ----
// Single endpoint for all roles. Checks admins (by username OR email),
// then teacher_accounts, then student_accounts. Returns a JWT whose
// payload carries the matched role so the frontend never has to guess.
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email/username and password are required." });
  }
  const identifier = email.trim().toLowerCase();

  // 1. Check admins table (match on username)
  const [adminRows] = await pool.query(
    "SELECT * FROM admins WHERE LOWER(username) = ?",
    [identifier]
  );
  if (adminRows[0]) {
    const admin = adminRows[0];
    if (!(await verifyPassword(password, admin.password_hash))) {
      return res.status(401).json({ error: "Incorrect password." });
    }
    const token = signToken({ role: "admin", id: admin.id, username: admin.username });
    return res.json({ role: "admin", token, username: admin.username });
  }

  // 2. Check teacher_accounts table (match on email)
  const [teacherRows] = await pool.query(
    "SELECT * FROM teacher_accounts WHERE email = ?",
    [identifier]
  );
  if (teacherRows[0]) {
    const account = teacherRows[0];
    if (!(await verifyPassword(password, account.password_hash))) {
      return res.status(401).json({ error: "Incorrect password." });
    }
    if (account.status === "pending") {
      return res.status(403).json({ error: "Your account is pending admin approval. Please check back soon." });
    }
    if (account.status === "deactivated") {
      return res.status(403).json({ error: "Your account has been deactivated. Contact the admin." });
    }
    const token = signToken({ role: "teacher", id: account.id, email: account.email });
    return res.json({ role: "teacher", token, teacher: teacherAccountPublic(account) });
  }

  // 3. Check student_accounts table (match on email)
  const [studentRows] = await pool.query(
    "SELECT * FROM student_accounts WHERE email = ?",
    [identifier]
  );
  if (studentRows[0]) {
    const account = studentRows[0];
    if (!(await verifyPassword(password, account.password_hash))) {
      return res.status(401).json({ error: "Incorrect password." });
    }
    if (account.status === "pending") {
      return res.status(403).json({ error: "Your account is pending admin approval. Please check back soon." });
    }
    if (account.status === "deactivated") {
      return res.status(403).json({ error: "Your account has been deactivated. Contact the admin." });
    }
    const token = signToken({ role: "student", id: account.id, email: account.email });
    return res.json({ role: "student", token, student: studentAccountPublic(account) });
  }

  return res.status(401).json({ error: "No account found with those credentials." });
});

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
// Teacher accounts are created by the admin, OR self-registered by the
// public when an admin has turned that on (see /teacher/register below).
// Either way, only 'active' accounts can log in.
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
    return res.status(403).json({ error: "Your account is pending admin approval. Please check back soon." });
  }
  if (account.status === "deactivated") {
    return res.status(403).json({ error: "Your account has been deactivated. Contact the admin." });
  }

  const token = signToken({ role: "teacher", id: account.id, email: account.email });
  res.json({ token, teacher: teacherAccountPublic(account) });
});

// Public self-registration — only accepted while an admin has turned this
// on via Settings > Self-Registration (allow_teacher_register on
// site_content). Each new account starts 'deactivated' by default, unless the
// admin has enabled auto-activation for teachers (auto_activate_teacher_register),
// in which case it starts 'active' and can log in immediately.
router.post("/teacher/register", async (req, res) => {
  const { fullName, email, password, subject } = req.body || {};

  const [[site]] = await pool.query(
    "SELECT allow_teacher_register, auto_activate_teacher_register FROM site_content WHERE id = 1"
  );
  if (!site || !site.allow_teacher_register) {
    return res.status(403).json({ error: "Self-registration is currently disabled. Contact the admin." });
  }

  if (!fullName?.trim() || !email?.trim() || !password || !subject?.trim()) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await pool.query("SELECT id FROM teacher_accounts WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const autoActivate = !!site.auto_activate_teacher_register;
  const hash = await hashPassword(password);
  await pool.query(
    "INSERT INTO teacher_accounts (full_name, email, password_hash, subject, status) VALUES (?, ?, ?, ?, ?)",
    [fullName.trim(), normalizedEmail, hash, subject.trim(), autoActivate ? "active" : "deactivated"]
  );

  res.status(201).json({
    message: autoActivate
      ? "Registration successful! You can now sign in with your email and password."
      : "Registration submitted! Your account is currently deactivated and will be reviewed by an admin.",
  });
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

// -------------------------------------------------------------- STUDENT ----
// Student accounts are created by the admin, OR self-registered by the
// public when an admin has turned that on (see /student/register below).
// Either way, only 'active' accounts can log in.
router.post("/student/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const [rows] = await pool.query("SELECT * FROM student_accounts WHERE email = ?", [email.trim().toLowerCase()]);
  const account = rows[0];
  if (!account) return res.status(401).json({ error: "No account found with this email." });
  if (!(await verifyPassword(password, account.password_hash))) {
    return res.status(401).json({ error: "Incorrect password." });
  }
  if (account.status === "pending") {
    return res.status(403).json({ error: "Your account is pending admin approval. Please check back soon." });
  }
  if (account.status === "deactivated") {
    return res.status(403).json({ error: "Your account has been deactivated. Contact the admin." });
  }

  const token = signToken({ role: "student", id: account.id, email: account.email });
  res.json({ token, student: studentAccountPublic(account) });
});

// Public self-registration — only accepted while an admin has turned this
// on via Settings > Self-Registration (allow_student_register on
// site_content). Each new account starts 'deactivated' by default, unless the
// admin has enabled auto-activation for students (auto_activate_student_register),
// in which case it starts 'active' and can log in immediately.
router.post("/student/register", async (req, res) => {
  const { fullName, email, password, schoolClass } = req.body || {};

  const [[site]] = await pool.query(
    "SELECT allow_student_register, auto_activate_student_register FROM site_content WHERE id = 1"
  );
  if (!site || !site.allow_student_register) {
    return res.status(403).json({ error: "Self-registration is currently disabled. Contact the admin." });
  }

  if (!fullName?.trim() || !email?.trim() || !password || !schoolClass) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }
  if (!SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    return res.status(400).json({ error: "Please choose a valid class." });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await pool.query("SELECT id FROM student_accounts WHERE email = ?", [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const autoActivate = !!site.auto_activate_student_register;
  const hash = await hashPassword(password);
  await pool.query(
    "INSERT INTO student_accounts (full_name, email, password_hash, school_class, status) VALUES (?, ?, ?, ?, ?)",
    [fullName.trim(), normalizedEmail, hash, schoolClass, autoActivate ? "active" : "deactivated"]
  );

  res.status(201).json({
    message: autoActivate
      ? "Registration successful! You can now sign in with your email and password."
      : "Registration submitted! Your account is currently deactivated and will be reviewed by an admin.",
  });
});

router.put("/student/password", requireStudent, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters." });
  }

  const [rows] = await pool.query("SELECT * FROM student_accounts WHERE id = ?", [req.auth.id]);
  const account = rows[0];
  if (!account || !(await verifyPassword(currentPassword, account.password_hash))) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  const hash = await hashPassword(newPassword);
  await pool.query("UPDATE student_accounts SET password_hash = ? WHERE id = ?", [hash, account.id]);
  res.json({ message: "Password updated successfully." });
});

router.get("/student/me", requireStudent, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM student_accounts WHERE id = ?", [req.auth.id]);
  if (!rows[0]) return res.status(404).json({ error: "Account not found." });
  res.json(studentAccountPublic(rows[0]));
});

module.exports = router;
