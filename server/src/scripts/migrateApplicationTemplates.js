const pool = require("../db");

async function run() {
  await pool.query(`CREATE TABLE IF NOT EXISTS application_feedback_templates (
    id INT PRIMARY KEY DEFAULT 1,
    pending_message TEXT NOT NULL,
    approved_message TEXT NOT NULL,
    rejected_message TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_application_feedback_templates_singleton CHECK (id = 1)
  ) ENGINE=InnoDB`);
  await pool.query(
    `INSERT INTO application_feedback_templates (id, pending_message, approved_message, rejected_message)
     SELECT 1, ?, ?, ? FROM DUAL
     WHERE NOT EXISTS (SELECT 1 FROM application_feedback_templates WHERE id = 1)`,
    [
      "Your application has been received and is waiting for review.",
      "Congratulations. Your application has been approved. Please contact the school for the next steps.",
      "Thank you for applying. Unfortunately, we cannot offer a place at this time because available places are full.",
    ]
  );
  console.log("Application feedback templates are ready.");
  await pool.end();
}

run().catch(async (error) => {
  console.error("Application templates migration failed:", error.message);
  await pool.end();
  process.exit(1);
});