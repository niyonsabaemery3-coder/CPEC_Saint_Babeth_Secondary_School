const jwt = require("jsonwebtoken");
require("../config/env");

// A predictable fallback secret would let anyone who has read the source
// forge valid admin/teacher/student tokens. So: only allow the fallback in
// local development (ALLOW_LOCAL_ORIGINS=true, the same flag already used
// elsewhere in this codebase to mark a local dev run) — any other
// environment without a real JWT_SECRET set refuses to start at all.
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  if (process.env.ALLOW_LOCAL_ORIGINS === "true") {
    console.warn(
      "⚠ JWT_SECRET is not set — using an insecure development-only fallback. " +
        "Set a long random JWT_SECRET before deploying."
    );
  } else {
    throw new Error(
      "JWT_SECRET is not set. Refusing to start without it — set a long random JWT_SECRET " +
        "in your environment (see server/README.md)."
    );
  }
}
const EFFECTIVE_SECRET = SECRET || "dev_secret_change_me";

function signToken(payload) {
  // payload: { role: 'admin' | 'teacher', id, ...extra }
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: "30d" });
}

function readToken(req) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) return null;
  try {
    return jwt.verify(token, EFFECTIVE_SECRET);
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

function requireStudent(req, res, next) {
  const auth = readToken(req);
  if (!auth || auth.role !== "student") {
    return res.status(401).json({ error: "Student login required." });
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

module.exports = { signToken, optionalAuth, requireAdmin, requireTeacher, requireStudent, requireAdminOrTeacher };
