const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile, resolveFileUrl } = require("../utils/uploads");
const { logAction } = require("../utils/audit");

const router = express.Router();

function actorName(auth) {
  return auth.username || auth.email || null;
}

// The admission report and any feedback attachment are sensitive per-
// applicant documents (categories "reports" / "application-feedback" are
// private by default — see utils/uploads.js PRIVATE_CATEGORIES), so this
// admin-only view always resolves them to a short-lived signed link rather
// than a permanent public URL — even here, where the viewer is already an
// authenticated admin, because a permanent link visible in a browser's
// network tab or history could still leak beyond that admin session.
async function toPublic(req, row) {
  return {
    id: row.id,
    name: row.student_name,
    dob: row.dob,
    gender: row.gender,
    trackyear: row.track_year,
    admissionType: row.admission_type || "",
    indexNumber: row.index_number || "",
    currentSchool: row.current_school || "",
    currentLevel: row.current_level || "",
    report: row.report_file_name,
    reportData: await resolveFileUrl(req, row.report_file_url),
    prevschool: row.prev_school,
    district: row.district,
    sector: row.sector,
    parent: row.parent_name,
    email: row.parent_email || "",
    phone1: row.phone1,
    phone2: row.phone2,
    status: row.status || "pending",
    feedback: row.feedback || "",
    feedbackFile: row.feedback_file_name ? await resolveFileUrl(req, row.feedback_file_url) : null,
    feedbackFileName: row.feedback_file_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Public: submit a new application from the Apply wizard.
router.post("/", async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name?.trim() || !b.parent?.trim() || !b.phone1?.trim()) {
      return res.status(400).json({ error: "Student name, parent name and phone number are required." });
    }

    const reportUrl = b.reportData ? await saveBase64File(b.reportData, "reports", b.report) : null;
    const [[templates]] = await pool.query("SELECT pending_message FROM application_feedback_templates WHERE id = 1");

    const [{ insertId }] = await pool.query(
      `INSERT INTO applications
        (student_name, dob, gender, track_year, admission_type, index_number, current_level, prev_school, district, sector, parent_name, parent_email, phone1, phone2, report_file_url, report_file_name, status, feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        b.name.trim(),
        b.dob || null,
        b.gender || null,
        b.trackyear || null,
        b.admissionType || null,
        b.indexNumber || null,
        b.currentLevel || null,
        b.prevschool || null,
        b.district || null,
        b.sector || null,
        b.parent.trim(),
        b.email?.trim() || null,
        b.phone1.trim(),
        b.phone2 || null,
        reportUrl,
        reportUrl ? b.report || null : null,
        templates?.pending_message || "Your admission request has been received and is waiting for review.",
      ]
    );

    const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [insertId]);
    res.status(201).json(await toPublic(req, rows[0]));
  } catch (err) { next(err); }
});

// Admin: list every application.
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const conditions = [];
    const params = [];
    if (from) { conditions.push("DATE(created_at) >= ?"); params.push(from); }
    if (to) { conditions.push("DATE(created_at) <= ?"); params.push(to); }
    const [rows] = await pool.query(`SELECT * FROM applications ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY created_at DESC`, params);
    res.json(await Promise.all(rows.map((r) => toPublic(req, r))));
  } catch (err) { next(err); }
});

// Stripped-down public view — safe to return without authentication.
// Deliberately omits uploaded file URLs (report, feedback attachment) so
// private documents are never exposed via the public tracking endpoint.
function toPublicTrack(row) {
  return {
    id: row.id,
    name: row.student_name,
    admissionType: row.admission_type || "",
    trackyear: row.track_year,
    status: row.status || "pending",
    feedback: row.feedback || "",
    // feedbackFileName shown (just the name, not the URL) so the applicant
    // knows a document was attached, but cannot download it without admin access.
    feedbackFileName: row.feedback_file_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Public: applicants can track their application with the returned ID and
// the parent/guardian phone used during submission.
// NOTE: deliberately returns only safe fields — no file URLs.
router.get("/track/:id", async (req, res) => {
  const value = String(req.query.value || "").trim();
  const numericId = /^\d+$/.test(value) ? Number(value) : 0;
  const [[row]] = await pool.query(
    "SELECT * FROM applications WHERE id = ? OR phone1 = ? OR phone2 = ? OR LOWER(parent_email) = LOWER(?) LIMIT 1",
    [numericId, value, value, value]
  );
  if (!row) return res.status(404).json({ error: "Application not found. Check the reference number and phone number." });
  res.json(toPublicTrack(row));
});

router.get("/templates", requireAdmin, async (_req, res) => {
  const [[row]] = await pool.query(
    "SELECT pending_message AS pending, approved_message AS approved, rejected_message AS rejected, under_review_message AS under_review, info_required_message AS info_required FROM application_feedback_templates WHERE id = 1"
  );
  res.json(row || { pending: "", approved: "", rejected: "", under_review: "", info_required: "" });
});

router.put("/templates", requireAdmin, async (req, res) => {
  const b = req.body || {};
  await pool.query(
    `INSERT INTO application_feedback_templates (id, pending_message, approved_message, rejected_message, under_review_message, info_required_message)
     VALUES (1, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE pending_message = VALUES(pending_message), approved_message = VALUES(approved_message), rejected_message = VALUES(rejected_message), under_review_message = VALUES(under_review_message), info_required_message = VALUES(info_required_message)`,
    [b.pending || "", b.approved || "", b.rejected || "", b.under_review || "", b.info_required || ""]
  );
  res.json({ pending: b.pending || "", approved: b.approved || "", rejected: b.rejected || "", under_review: b.under_review || "", info_required: b.info_required || "" });
});

// Admin: approve or reject an application and optionally send feedback with
// an attached image/document.
router.put("/:id/review", requireAdmin, async (req, res, next) => {
  try {
  const b = req.body || {};
  if (!["pending", "under_review", "approved", "rejected", "info_required"].includes(b.status)) return res.status(400).json({ error: "Invalid application status." });
  const [[existing]] = await pool.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
  if (!existing) return res.status(404).json({ error: "Application not found." });

  let feedbackFileUrl = existing.feedback_file_url;
  let feedbackFileName = existing.feedback_file_name;
  let feedbackFileReplaced = false;
  if (b.feedbackFileData) {
    if (existing.feedback_file_url) await deleteUploadedFile(existing.feedback_file_url).catch(() => {});
    feedbackFileUrl = await saveBase64File(b.feedbackFileData, "application-feedback", b.feedbackFileName || "feedback-file");
    feedbackFileName = b.feedbackFileName || "feedback-file";
    feedbackFileReplaced = true;
  }
  let feedback = typeof b.feedback === "string" ? b.feedback.trim() : "";
  if (!feedback) {
    const colMap = {
      pending: "pending_message",
      under_review: "under_review_message",
      approved: "approved_message",
      rejected: "rejected_message",
      info_required: "info_required_message",
    };
    const col = colMap[b.status];
    if (col) {
      try {
        const [[template]] = await pool.query(`SELECT ${col} AS message FROM application_feedback_templates WHERE id = 1`);
        feedback = template?.message || "";
      } catch { feedback = ""; }
    }
  }
  await pool.query(
    "UPDATE applications SET status = ?, feedback = ?, feedback_file_url = ?, feedback_file_name = ? WHERE id = ?",
    [b.status, feedback, feedbackFileUrl, feedbackFileName, req.params.id]
  );
  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "review",
    entityType: "application",
    entityId: req.params.id,
    details: { status: b.status, feedbackFileReplaced },
  });

  const [[updated]] = await pool.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
  res.json(await toPublic(req, updated));
  } catch (err) { next(err); }
});

// Admin: remove an application (and its uploaded report file, if any).
router.delete("/:id", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [req.params.id]);
  if (rows[0]?.report_file_url) await deleteUploadedFile(rows[0].report_file_url);
  if (rows[0]?.feedback_file_url) await deleteUploadedFile(rows[0].feedback_file_url);
  await pool.query("DELETE FROM applications WHERE id = ?", [req.params.id]);

  await logAction({
    actorRole: "admin",
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "delete",
    entityType: "application",
    entityId: req.params.id,
  });

  res.json({ message: "Application deleted." });
});

module.exports = router;
