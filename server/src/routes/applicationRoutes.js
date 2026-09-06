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
    email: row.parent_email || "",
    phone1: row.phone1,
    phone2: row.phone2,
    status: row.status || "pending",
    feedback: row.feedback || "",
    feedbackFile: row.feedback_file_name ? toAbsoluteUploadUrl(req, row.feedback_file_url) : null,
    feedbackFileName: row.feedback_file_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Public: submit a new application from the Apply wizard.
router.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.name?.trim() || !b.parent?.trim() || !b.phone1?.trim()) {
    return res.status(400).json({ error: "Student name, parent name and phone number are required." });
  }

  const reportUrl = b.reportData ? await saveBase64File(b.reportData, "reports", b.report) : null;
  const [[templates]] = await pool.query("SELECT pending_message FROM application_feedback_templates WHERE id = 1");

  const [{ insertId }] = await pool.query(
    `INSERT INTO applications
      (student_name, dob, gender, track_year, prev_school, district, sector, parent_name, parent_email, phone1, phone2, report_file_url, report_file_name, status, feedback)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      b.name.trim(),
      b.dob || null,
      b.gender || null,
      b.trackyear || null,
      b.prevschool || null,
      b.district || null,
      b.sector || null,
      b.parent.trim(),
      b.email?.trim() || null,
      b.phone1.trim(),
      b.phone2 || null,
      reportUrl,
      reportUrl ? b.report || null : null,
      templates?.pending_message || "Your application has been received and is waiting for review.",
    ]
  );

  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [insertId]);
  res.status(201).json(toPublic(req, rows[0]));
});

// Admin: list every application.
router.get("/", requireAdmin, async (req, res) => {
  const { from, to } = req.query;
  const conditions = [];
  const params = [];
  if (from) { conditions.push("DATE(created_at) >= ?"); params.push(from); }
  if (to) { conditions.push("DATE(created_at) <= ?"); params.push(to); }
  const [rows] = await pool.query(`SELECT * FROM applications ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY created_at DESC`, params);
  res.json(rows.map((r) => toPublic(req, r)));
});

// Public: applicants can track their application with the returned ID and
// the parent/guardian phone used during submission.
router.get("/track/:id", async (req, res) => {
  const value = String(req.query.value || "").trim();
  const numericId = /^\d+$/.test(value) ? Number(value) : 0;
  const [[row]] = await pool.query(
    "SELECT * FROM applications WHERE id = ? OR phone1 = ? OR phone2 = ? OR LOWER(parent_email) = LOWER(?) LIMIT 1",
    [numericId, value, value, value]
  );
  if (!row) return res.status(404).json({ error: "Application not found. Check the application number and phone number." });
  res.json(toPublic(req, row));
});

router.get("/templates", requireAdmin, async (_req, res) => {
  const [[row]] = await pool.query("SELECT pending_message AS pending, approved_message AS approved, rejected_message AS rejected FROM application_feedback_templates WHERE id = 1");
  res.json(row || { pending: "", approved: "", rejected: "" });
});

router.put("/templates", requireAdmin, async (req, res) => {
  const b = req.body || {};
  await pool.query(
    `INSERT INTO application_feedback_templates (id, pending_message, approved_message, rejected_message)
     VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE pending_message = VALUES(pending_message), approved_message = VALUES(approved_message), rejected_message = VALUES(rejected_message)`,
    [b.pending || "", b.approved || "", b.rejected || ""]
  );
  res.json({ pending: b.pending || "", approved: b.approved || "", rejected: b.rejected || "" });
});

// Admin: approve or reject an application and optionally send feedback with
// an attached image/document.
router.put("/:id/review", requireAdmin, async (req, res) => {
  const b = req.body || {};
  if (!["pending", "approved", "rejected"].includes(b.status)) return res.status(400).json({ error: "Invalid application status." });
  const [[existing]] = await pool.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
  if (!existing) return res.status(404).json({ error: "Application not found." });

  let feedbackFileUrl = existing.feedback_file_url;
  let feedbackFileName = existing.feedback_file_name;
  if (b.feedbackFileData) {
    feedbackFileUrl = await saveBase64File(b.feedbackFileData, "application-feedback", b.feedbackFileName || "feedback-file");
    feedbackFileName = b.feedbackFileName || "feedback-file";
  }
  let feedback = typeof b.feedback === "string" ? b.feedback.trim() : "";
  if (!feedback) {
    const [[template]] = await pool.query(`SELECT ${b.status}_message AS message FROM application_feedback_templates WHERE id = 1`);
    feedback = template?.message || "";
  }
  await pool.query(
    "UPDATE applications SET status = ?, feedback = ?, feedback_file_url = ?, feedback_file_name = ? WHERE id = ?",
    [b.status, feedback, feedbackFileUrl, feedbackFileName, req.params.id]
  );
  const [[updated]] = await pool.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
  res.json(toPublic(req, updated));
});

// Admin: remove an application (and its uploaded report file, if any).
router.delete("/:id", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
  if (rows[0]?.report_file_url) await deleteUploadedFile(rows[0].report_file_url);
  await pool.query("DELETE FROM applications WHERE id = ?", [req.params.id]);
  res.json({ message: "Application deleted." });
});

module.exports = router;
