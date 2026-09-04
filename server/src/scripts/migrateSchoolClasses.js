/**
 * Run this ONCE against an existing database to widen the `school_class`
 * ENUM on `student_accounts` and `resources` to the full class/track list
 * (S1–S3 plus the SOD/MLT levels and short courses). Brand-new databases
 * created via `npm run db:init` already get the wide ENUM straight from
 * schema.sql and do NOT need this script.
 *
 * Usage:  node server/src/scripts/migrateSchoolClasses.js
 */
const pool = require("../db");

const NEW_ENUM =
  "ENUM('S1','S2','S3','L3SOD','L4SOD','L5SOD','SC_SOD','L3MLT','L4MLT','L5MLT','SC_MLT')";

async function run() {
  console.log("Widening school_class on student_accounts...");
  await pool.query(`ALTER TABLE student_accounts MODIFY COLUMN school_class ${NEW_ENUM} NOT NULL`);

  console.log("Widening school_class on resources...");
  await pool.query(`ALTER TABLE resources MODIFY COLUMN school_class ${NEW_ENUM} NOT NULL`);

  console.log("Done — both tables now accept the full class/track list.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
