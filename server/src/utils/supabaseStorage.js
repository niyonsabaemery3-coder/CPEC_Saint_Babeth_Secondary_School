// Uploads/deletes files in Supabase Storage via its REST API.
// No extra SDK needed — Node 18+ has a global fetch, and the Storage API
// is a handful of plain HTTP calls.
//
// Required env vars (server/.env):
//   SUPABASE_URL            e.g. https://xxxxxxxx.supabase.co
//   SUPABASE_SECRET_KEY     The "secret" key from Project Settings -> API Keys
//                           (this replaces the older service_role key — same
//                           privileged access, just a new key format).
//   SUPABASE_BUCKET         The PUBLIC bucket for non-sensitive files (default: "uploads")
//   SUPABASE_PRIVATE_BUCKET The PRIVATE bucket for sensitive files — student
//                           reports, admission report/feedback attachments
//                           (default: "private"). This bucket must be created
//                           in the Supabase dashboard WITHOUT the "Public"
//                           toggle enabled, otherwise objects are reachable
//                           via their public URL regardless of any signed
//                           URL this app generates, which would defeat the
//                           point of signing.
const isConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

const BASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const BUCKET = process.env.SUPABASE_BUCKET || "uploads";
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || "private";
const KEY = process.env.SUPABASE_SECRET_KEY;

async function uploadToBucket(bucket, buffer, key, contentType) {
  const res = await fetch(`${BASE_URL}/storage/v1/object/${bucket}/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      apikey: KEY,
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed (${res.status}): ${text}`);
  }
}

/** Uploads to the PUBLIC bucket and returns a permanent public URL. */
async function uploadBuffer(buffer, key, contentType) {
  await uploadToBucket(BUCKET, buffer, key, contentType);
  return `${BASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

/**
 * Uploads to the PRIVATE bucket and returns an internal reference string
 * (NOT a usable URL — the private bucket has no public URL by design).
 * Callers must resolve this reference to a short-lived signed URL at read
 * time via getSignedUrl() below, right before handing it to an authorized
 * user.
 */
async function uploadPrivateBuffer(buffer, key, contentType) {
  await uploadToBucket(PRIVATE_BUCKET, buffer, key, contentType);
  return `supabase-private:${key}`;
}

async function deleteObject(key) {
  await fetch(`${BASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY },
  });
}

async function deletePrivateObject(key) {
  await fetch(`${BASE_URL}/storage/v1/object/${PRIVATE_BUCKET}/${key}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY },
  });
}

/** Given a public Supabase Storage URL this app generated, recover the object key so it can be deleted. */
function keyFromPublicUrl(url) {
  const prefix = `${BASE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (!url || !url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

/** Given an internal "supabase-private:<key>" reference, recover the object key. */
function keyFromPrivateRef(ref) {
  if (!ref || !ref.startsWith("supabase-private:")) return null;
  return ref.slice("supabase-private:".length);
}

/**
 * Generates a short-lived signed URL for an object in the PRIVATE bucket.
 * Returns null if signing fails (e.g. object missing, bucket misconfigured)
 * so callers can fall back to a clear "unavailable" state instead of a
 * broken link.
 */
async function getSignedUrl(key, expiresIn = 3600) {
  try {
    const res = await fetch(
      `${BASE_URL}/storage/v1/object/sign/${PRIVATE_BUCKET}/${key}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KEY}`,
          apikey: KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn }),
      }
    );
    if (!res.ok) return null;
    const { signedURL } = await res.json();
    if (!signedURL) return null;
    return signedURL.startsWith("http") ? signedURL : `${BASE_URL}${signedURL}`;
  } catch {
    return null;
  }
}

module.exports = {
  isConfigured,
  uploadBuffer,
  uploadPrivateBuffer,
  deleteObject,
  deletePrivateObject,
  keyFromPublicUrl,
  keyFromPrivateRef,
  getSignedUrl,
};
