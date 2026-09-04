const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

// Cloudflare R2 speaks the S3 API, so the official AWS S3 client works
// unchanged — we just point it at R2's endpoint instead of AWS's.
//
// Required env vars (put these in server/.env, never commit real values):
//   R2_ACCOUNT_ID        Cloudflare account ID (dashboard URL or R2 overview page)
//   R2_ACCESS_KEY_ID      From an R2 API token
//   R2_SECRET_ACCESS_KEY  From the same R2 API token
//   R2_BUCKET_NAME        The bucket you created for this project
//   R2_PUBLIC_URL         The bucket's public base URL, no trailing slash
//                         (custom domain, or the r2.dev URL from bucket settings)
const isConfigured = Boolean(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME &&
  process.env.R2_PUBLIC_URL
);

let client = null;
if (isConfigured) {
  client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadBuffer(buffer, key, contentType) {
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  const base = process.env.R2_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}/${key}`;
}

async function deleteObject(key) {
  await client.send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  );
}

/** Given a public R2 URL this app generated, recover the object key so it can be deleted. */
function keyFromPublicUrl(url) {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
  if (!base || !url || !url.startsWith(`${base}/`)) return null;
  return url.slice(base.length + 1);
}

module.exports = { isConfigured, uploadBuffer, deleteObject, keyFromPublicUrl };
