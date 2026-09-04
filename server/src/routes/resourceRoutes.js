const express = require("express");
const pool = require("../db");
const { optionalAuth, requireTeacher, requireAdminOrTeacher } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile } = require("../utils/uploads");
const { toAbsoluteUploadUrl } = require("../utils/publicUrl");
const { SCHOOL_CLASS_VALUES } = require("../constants/academics");

const router = express.Router();

// Any logged-in account (student, teacher or admin) unlocks the real file/
// link. Anonymous visitors only ever see the resource's metadata — the
// actual href never reaches the browser until someone has logged in, so
// gating the Preview / Download buttons on the client can't be bypassed by
// just reading the API response.
function toPublic(req, row, unlocked) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    schoolClass: row.school_class,
    type: row.type,
    fileName: row.file_name,
    fileData: unlocked ? toAbsoluteUploadUrl(req, row.file_url) : null,
    link: unlocked ? row.link_url : null,
    locked: !unlocked && Boolean(row.file_url || row.link_url),
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name,
    createdAt: row.created_at,
  };
}

const BASE_QUERY = `
  SELECT r.*, t.full_name AS uploader_name
  FROM resources r
  JOIN teacher_accounts t ON t.id = r.uploader_id
`;

// Public: filterable list used on the Resources section. optionalAuth lets a
// logged-in student/teacher/admin see real file links while a visitor who
// hasn't logged in only gets metadata (title, class, subject…) and a
// "locked" flag.
router.get("/", optionalAuth, async (req, res) => {
  const { schoolClass, type, subject } = req.query;
  const clauses = [];
  const params = [];

  if (schoolClass && schoolClass !== "all") {
    clauses.push("r.school_class = ?");
    params.push(schoolClass);
  }
  if (type && type !== "all") {
    clauses.push("r.type = ?");
    params.push(type);
  }
  if (subject && subject !== "all") {
    clauses.push("r.subject = ?");
    params.push(subject);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.query(`${BASE_QUERY} ${where} ORDER BY r.created_at DESC`, params);
  const unlocked = Boolean(req.auth);
  res.json(rows.map((r) => toPublic(req, r, unlocked)));
});

// Teacher: only their own uploads, for the "My Resources" dashboard tab.
router.get("/mine", requireTeacher, async (req, res) => {
  const [rows] = await pool.query(`${BASE_QUERY} WHERE r.uploader_id = ? ORDER BY r.created_at DESC`, [req.auth.id]);
  res.json(rows.map((r) => toPublic(req, r, true)));
});

// Teacher: publish a new resource.
router.post("/", requireTeacher, async (req, res) => {
  const { title, subject, schoolClass, type, fileData, fileName, link } = req.body || {};
  if (!title?.trim() || !subject?.trim() || !schoolClass || !type) {
    return res.status(400).json({ error: "Title, subject, class and type are required." });
  }
  if (!SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    return res.status(400).json({ error: "Please choose a valid class." });
  }
  if (!fileData && !link?.trim()) {
    return res.status(400).json({ error: "Attach a file or provide a link." });
  }

  const fileUrl = fileData ? await saveBase64File(fileData, "resources", fileName) : null;

  const [{ insertId }] = await pool.query(
    "INSERT INTO resources (title, subject, school_class, type, file_url, file_name, link_url, uploader_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [title.trim(), subject.trim(), schoolClass, type, fileUrl, fileUrl ? fileName || null : null, link?.trim() || null, req.auth.id]
  );

  const [rows] = await pool.query(`${BASE_QUERY} WHERE r.id = ?`, [insertId]);
  res.status(201).json(toPublic(req, rows[0], true));
});

// Teacher (own resource) or Admin (any resource) can delete.
router.delete("/:id", requireAdminOrTeacher, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM resources WHERE id = ?", [req.params.id]);
  const resource = rows[0];
  if (!resource) return res.status(404).json({ error: "Resource not found." });

  if (req.auth.role === "teacher" && resource.uploader_id !== req.auth.id) {
    return res.status(403).json({ error: "You can only delete your own resources." });
  }

  if (resource.file_url) await deleteUploadedFile(resource.file_url);
  await pool.query("DELETE FROM resources WHERE id = ?", [req.params.id]);
  res.json({ message: "Resource deleted." });
});

module.exports = router;
