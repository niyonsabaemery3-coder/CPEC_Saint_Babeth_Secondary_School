const crypto = require("crypto");

// Local-disk storage has no concept of a "private bucket" the way Supabase
// does — express.static() has no access control at all. So when neither
// Supabase nor R2 is configured (local development only; NOT recommended in
// production — see server/README.md), private files saved under
// uploads/private/... are kept out of the blanket /uploads static mount
// (see index.js) and are only reachable through this short-lived signed
// token, mirroring the same "signed URL, expires soon" behaviour used for
// Supabase's private bucket so the two code paths behave consistently.

function getSecret() {
  // Falls back to the same value auth.js falls back to in local dev, so this
  // never needs its own separate env var; production always has JWT_SECRET
  // set (auth.js refuses to start otherwise).
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

function sign(payload) {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [b64, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  // Constant-time comparison to avoid leaking timing information about the signature.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Signs a relative "/uploads/private/..." path, valid for expiresIn seconds. */
function signLocalPath(relativePath, expiresIn = 3600) {
  return sign({ p: relativePath, exp: Date.now() + expiresIn * 1000 });
}

/** Verifies a token and returns the original relative path, or null if invalid/expired. */
function verifyLocalToken(token) {
  const payload = verify(token);
  return payload?.p || null;
}

module.exports = { signLocalPath, verifyLocalToken };
