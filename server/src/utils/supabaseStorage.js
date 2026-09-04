// Uploads/deletes files in a Supabase Storage bucket via its REST API.
// No extra SDK needed — Node 18+ has a global fetch, and the Storage API
// is a handful of plain HTTP calls.
//
// Required env vars (server/.env):
//   SUPABASE_URL           e.g. https://xxxxxxxx.supabase.co
//   SUPABASE_SECRET_KEY    The "secret" key from Project Settings -> API Keys
//                          (this replaces the older service_role key — same
//                          privileged access, just a new key format).
//   SUPABASE_BUCKET        The public bucket you created (default: "uploads")
const isConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

const BASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const BUCKET = process.env.SUPABASE_BUCKET || "uploads";
const KEY = process.env.SUPABASE_SECRET_KEY;

async function uploadBuffer(buffer, key, contentType) {
  const res = await fetch(`${BASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
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

  return `${BASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

async function deleteObject(key) {
  await fetch(`${BASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
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

module.exports = { isConfigured, uploadBuffer, deleteObject, keyFromPublicUrl };
