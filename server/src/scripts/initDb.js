/**
 * Creates all tables from schema.sql in the configured database.
 * Run with: npm run db:init
 *
 * Supports Clever Cloud's MYSQL_ADDON_URI/MYSQL_ADDON_* variables as well as
 * the DB_* and MYSQL_* variables used by other hosting providers.
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { databaseConfig } = require("../config/database");

async function main() {
  let schema = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
  const dbName = process.env.DB_NAME || process.env.MYSQL_ADDON_DB || process.env.MYSQL_DATABASE || "stbabeth_tss";
  schema = schema.replace(/stbabeth_tss/g, dbName);

  const connection = await mysql.createConnection({
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.query(`USE \`${dbName}\``);

  console.log(`Connected to ${databaseConfig.host}. Applying schema.sql to database "${dbName}" ...`);
  await connection.query(schema);
  console.log("✔ Database & tables are ready.");

  await connection.end();
}

main().catch((err) => {
  console.error("✘ Failed to initialise database:", err.message);
  process.exit(1);
});