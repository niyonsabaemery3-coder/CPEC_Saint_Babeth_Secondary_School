const pool = require("../db");

/**
 * Records one audit-log entry. Used across the admin/teacher mutation routes
 * (accounts, grades, subjects, terms, reports, ...) so there is always a
 * durable answer to "who changed this, and when".
 *
 * Deliberately never throws: an audit-log failure must not take down the
 * primary action it is describing. Any failure is logged to the console
 * instead so it is still visible to whoever operates the server.
 */
async function logAction({ actorRole, actorId, actorName, action, entityType, entityId, details }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_role, actor_id, actor_name, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        actorRole || null,
        actorId ?? null,
        actorName || null,
        action,
        entityType,
        entityId != null ? String(entityId) : null,
        details ? (typeof details === "string" ? details : JSON.stringify(details)) : null,
      ]
    );
  } catch (error) {
    console.error("⚠ Failed to write audit log:", error.message);
  }
}

module.exports = { logAction };
