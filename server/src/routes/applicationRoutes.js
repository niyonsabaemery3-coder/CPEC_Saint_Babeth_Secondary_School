const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile } = require("../utils/uploads");
const { toAbsoluteUploadUrl } = require("../utils/publicUrl");

const router = express.Router();

function toPublic(req, row) {
  return {
    id: row.id,
    name: row.student_name,
    dob: row.dob,
    gender: row.gender,
    trackyear: row.track_year,
    report: row.report_file_name,
    reportData: toAbsoluteUploadUrl(req, row.report_file_url),
    prevschool: row.prev_school,
    district: row.district,
    sector: row.sector,
    parent: row.parent_name,
    phone1: row.phone1,
    phone2: row.phone2,
  };
}

// Public: submit a new application from the Apply wizard.
router.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.name?.trim() || !b.parent?.trim() || !b.phone1?.trim()) {
    return res.status(400).json({ error: "Student name, parent name and phone number are required." });
  }

  const reportUrl = b.reportData ? await saveBase64File(b.reportData, "reports", b.report) : null;

  const [{ insertId }] = await pool.query(
    `INSERT INTO applications
      (student_name, dob, gender, track_year, prev_school, district, sector, parent_name, phone1, phone2, report_file_url, report_file_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      b.name.trim(),
      b.dob || null,
      b.gender || null,
      b.trackyear || null,
      b.prevschool || null,
      b.district || null,
      b.sector || null,
      b.parent.trim(),
      b.phone1.trim(),
      b.phone2 || null,
      reportUrl,
      reportUrl ? b.report || null : null,
    ]
  );

  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [insertId]);
  res.status(201).json(toPublic(req, rows[0]));
});

// Admin: list every application.
router.get("/", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM applications ORDER BY created_at DESC");
  res.json(rows.map((r) => toPublic(req, r)));
});

// Admin: remove an application (and its uploaded report file, if any).
router.delete("/:id", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
  if (rows[0]?.report_file_url) await deleteUploadedFile(rows[0].report_file_url);
  await pool.query("DELETE FROM applications WHERE id = ?", [req.params.id]);
  res.json({ message: "Application deleted." });
});

module.exports = router;
