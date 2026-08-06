/**
 * Creates the database + all tables from schema.sql.
 * Run with: npm run db:init
 *
 * Connects WITHOUT selecting a database first (since schema.sql itself runs
 * CREATE DATABASE IF NOT EXISTS ... ; USE ...), so this is safe to run
 * against a brand-new MySQL server that only has root/user credentials.
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  console.log("Connected to MySQL. Applying schema.sql ...");
  await connection.query(schema);
  console.log("✔ Database & tables are ready.");

  await connection.end();
}

main().catch((err) => {
  console.error("✘ Failed to initialise database:", err.message);
  process.exit(1);
});
