const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

function toPublic(row) {
  let details = null;
  if (row.details) {
    try {
      details = JSON.parse(row.details);
    } catch {
      details = row.details;
    }
  }
  return {
    id: row.id,
    actorRole: row.actor_role,
    actorId: row.actor_id,
    actorName: row.actor_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details,
    createdAt: row.created_at,
  };
}

// Admin only: paginated, filterable audit trail.
//   GET /api/audit-logs?page=1&limit=50&entityType=student_marks&actorId=3
router.get("/", requireAdmin, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  if (req.query.entityType) {
    where.push("entity_type = ?");
    params.push(req.query.entityType);
  }
  if (req.query.actorId) {
    where.push("actor_id = ?");
    params.push(Number(req.query.actorId));
  }
  if (req.query.action) {
    where.push("action = ?");
    params.push(req.query.action);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM audit_logs ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT * FROM audit_logs ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    entries: rows.map(toPublic),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

module.exports = router;
