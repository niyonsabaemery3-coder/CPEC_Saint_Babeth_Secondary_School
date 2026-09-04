const express = require("express");
const pool = require("../db");
const { requireAdmin, requireStudent } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile } = require("../utils/uploads");
const { toAbsoluteUploadUrl } = require("../utils/publicUrl");

const router = express.Router();

function toPublic(req, row) {
  if (!row) return null;
  return {
    studentId: row.student_id,
    title: row.title,
    fileName: row.file_name,
    fileData: toAbsoluteUploadUrl(req, row.file_url),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

// Admin: every report currently on file, for the Student Reports screen —
// used to know which students already have one uploaded.
router.get("/", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM student_reports");
  res.json(rows.map((r) => toPublic(req, r)));
});

// Student: their own report (or null if the admin hasn't uploaded one yet).
router.get("/mine", requireStudent, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM student_reports WHERE student_id = ?", [req.auth.id]);
  res.json(toPublic(req, rows[0]));
});

// Admin: upload (or re-upload) a report file for one or several students at
// once — the same file/title is attached to every id in studentIds. Re-using
// this for a student who already has a report replaces their previous file,
// which is what powers both the "Upload" and "Update" actions on the client.
router.post("/", requireAdmin, async (req, res) => {
  const { studentIds, title, fileData, fileName } = req.body || {};
  const ids = Array.isArray(studentIds) ? studentIds.map(Number).filter(Boolean) : [];

  if (ids.length === 0) {
    return res.status(400).json({ error: "Select at least one student." });
  }
  if (!fileData) {
    return res.status(400).json({ error: "Attach a report file." });
  }

  const [students] = await pool.query(`SELECT id FROM student_accounts WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
  if (students.length !== ids.length) {
    return res.status(404).json({ error: "One or more selected students could not be found." });
  }

  const fileUrl = await saveBase64File(fileData, "reports", fileName);

  const oldFiles = new Map();
  const [existing] = await pool.query(`SELECT student_id, file_url FROM student_reports WHERE student_id IN (${ids.map(() => "?").join(",")})`, ids);
  existing.forEach((r) => oldFiles.set(r.student_id, r.file_url));

  for (const id of ids) {
    await pool.query(
      `INSERT INTO student_reports (student_id, title, file_url, file_name)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), file_url = VALUES(file_url), file_name = VALUES(file_name)`,
      [id, title?.trim() || null, fileUrl, fileName || null]
    );
  }

  // Clean up replaced files only after the new rows are safely saved.
  await Promise.all(Array.from(oldFiles.values()).filter(Boolean).map((url) => deleteUploadedFile(url)));

  const [rows] = await pool.query(`SELECT * FROM student_reports WHERE student_id IN (${ids.map(() => "?").join(",")})`, ids);
  res.status(201).json(rows.map((r) => toPublic(req, r)));
});

// Admin: remove a student's report file entirely.
router.delete("/:studentId", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM student_reports WHERE student_id = ?", [req.params.studentId]);
  const report = rows[0];
  if (!report) return res.status(404).json({ error: "This student has no report on file." });

  if (report.file_url) await deleteUploadedFile(report.file_url);
  await pool.query("DELETE FROM student_reports WHERE student_id = ?", [req.params.studentId]);
  res.json({ message: "Report deleted." });
});

module.exports = router;
