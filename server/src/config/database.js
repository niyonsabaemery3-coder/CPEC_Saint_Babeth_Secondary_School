require("./env");

function pick(...values) {
  return values.find((value) => typeof value === "string" && value.trim() !== "")?.trim();
}

function parseMysqlUri(rawUri) {
  if (!rawUri) return null;

  try {
    const uri = new URL(rawUri);
    if (uri.protocol !== "mysql:" && uri.protocol !== "mysql2:") {
      throw new Error("the URI must use mysql:// or mysql2://");
    }

    const database = decodeURIComponent(uri.pathname.replace(/^\/+/, ""));
    if (!uri.hostname || !uri.username || !database) {
      throw new Error("the URI must include a host, username, and database name");
    }

    return {
      host: uri.hostname,
      port: Number(uri.port || 3306),
      user: decodeURIComponent(uri.username),
      password: decodeURIComponent(uri.password),
      database,
    };
  } catch (error) {
    throw new Error(`Invalid MySQL connection URI: ${error.message}`);
  }
}

// Clever Cloud exposes MYSQL_ADDON_URI (and often MYSQL_ADDON_* variables).
// Keep DB_* and MYSQL_* fallbacks for Render, local development, and other hosts.
// A complete platform URI takes priority so placeholder DB_* values cannot
// accidentally override the credentials supplied by Clever Cloud.
const rawDatabaseUri = process.env.MYSQL_ADDON_URI || process.env.MYSQL_URL || process.env.DATABASE_URL;
const addonConfig = rawDatabaseUri ? parseMysqlUri(rawDatabaseUri) : null;

const databaseConfig = {
  host: addonConfig?.host || pick(process.env.DB_HOST, process.env.MYSQL_ADDON_HOST, process.env.MYSQL_HOST) || "127.0.0.1",
  port:
    addonConfig?.port ||
    Number(pick(process.env.DB_PORT, process.env.MYSQL_ADDON_PORT, process.env.MYSQL_PORT)) ||
    3306,
  user: addonConfig?.user || pick(process.env.DB_USER, process.env.MYSQL_ADDON_USER, process.env.MYSQL_USER) || "root",
  password: addonConfig?.password ?? pick(process.env.DB_PASSWORD, process.env.MYSQL_ADDON_PASSWORD, process.env.MYSQL_PASSWORD) ?? "",
  database:
    addonConfig?.database ||
    pick(
      process.env.DB_NAME,
      process.env.MYSQL_ADDON_DB,
      process.env.MYSQL_ADDON_DATABASE,
      process.env.MYSQL_DATABASE
    ),
   waitForConnections: true,
   connectionLimit: 4,
   queueLimit: 0,
  dateStrings: true,
};

module.exports = { databaseConfig, parseMysqlUri };
