const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(payload) {
  // payload: { role: 'admin' | 'teacher', id, ...extra }
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

function readToken(req) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/** Attaches req.auth if a valid token is present; never blocks the request. */
function optionalAuth(req, _res, next) {
  req.auth = readToken(req);
  next();
}

function requireAdmin(req, res, next) {
  const auth = readToken(req);
  if (!auth || auth.role !== "admin") {
    return res.status(401).json({ error: "Admin login required." });
  }
  req.auth = auth;
  next();
}

function requireTeacher(req, res, next) {
  const auth = readToken(req);
  if (!auth || auth.role !== "teacher") {
    return res.status(401).json({ error: "Teacher login required." });
  }
  req.auth = auth;
  next();
}

/** Admin OR the teacher who owns the resource (checked per-route) may proceed. */
function requireAdminOrTeacher(req, res, next) {
  const auth = readToken(req);
  if (!auth || (auth.role !== "admin" && auth.role !== "teacher")) {
    return res.status(401).json({ error: "Login required." });
  }
  req.auth = auth;
  next();
}

module.exports = { signToken, optionalAuth, requireAdmin, requireTeacher, requireAdminOrTeacher };
