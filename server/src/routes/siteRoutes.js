const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { saveBase64File } = require("../utils/uploads");
const { toAbsoluteUploadUrl, toRelativeUploadPath } = require("../utils/publicUrl");

const router = express.Router();

async function assembleSiteContent(req) {
  const [[site]] = await pool.query("SELECT * FROM site_content WHERE id = 1");
  if (!site) return null;
  const [aboutPoints] = await pool.query("SELECT text FROM about_points WHERE site_content_id = 1 ORDER BY sort_order ASC");
  const [programs] = await pool.query("SELECT title, description FROM programs WHERE site_content_id = 1 ORDER BY sort_order ASC");
  const [gallery] = await pool.query("SELECT image_url, caption FROM gallery_items WHERE site_content_id = 1 ORDER BY sort_order ASC");

  return {
    heroImg: toAbsoluteUploadUrl(req, site.hero_img),
    heroMain: site.hero_main,
    heroAccent: site.hero_accent,
    heroSub: site.hero_sub,
    feat1Title: site.feat1_title,
    feat1Desc: site.feat1_desc,
    feat2Title: site.feat2_title,
    feat2Desc: site.feat2_desc,
    feat3Title: site.feat3_title,
    feat3Desc: site.feat3_desc,
    aboutImg: toAbsoluteUploadUrl(req, site.about_img),
    aboutTitle: site.about_title,
    aboutPara1: site.about_para1,
    aboutPara2: site.about_para2,
    aboutLi: aboutPoints.map((p) => p.text),
    programs: programs.map((p) => ({ title: p.title, desc: p.description })),
    stripTitle: site.strip_title,
    stripDesc: site.strip_desc,
    gallery: gallery.map((g) => ({ img: toAbsoluteUploadUrl(req, g.image_url), cap: g.caption })),
    contactAddress: site.contact_address,
    contactPhone: site.contact_phone,
    contactHours: site.contact_hours,
  };
}

// Public: everything the homepage needs to render its editable text/images.
router.get("/", async (req, res) => {
  const content = await assembleSiteContent(req);
  if (!content) return res.status(404).json({ error: "Site content not seeded yet — run `npm run db:seed`." });
  res.json(content);
});

// Admin: full replace of all editable site content.
router.put("/", requireAdmin, async (req, res) => {
  const b = req.body || {};

  // Images may arrive as base64 data URLs (freshly uploaded), an absolute
  // URL this same API previously returned (unchanged), or a frontend-bundled
  // default path like "/images/..." (unchanged) — only re-save the ones
  // that are actually new, and always store a portable relative path.
  const heroImg = b.heroImg?.startsWith("data:")
    ? saveBase64File(b.heroImg, "images")
    : toRelativeUploadPath(b.heroImg);
  const aboutImg = b.aboutImg?.startsWith("data:")
    ? saveBase64File(b.aboutImg, "images")
    : toRelativeUploadPath(b.aboutImg);
  const gallery = (b.gallery || []).map((g) => ({
    img: g.img?.startsWith("data:") ? saveBase64File(g.img, "images") : toRelativeUploadPath(g.img),
    cap: g.cap,
  }));

  await pool.query(
    `UPDATE site_content SET
      hero_img = ?, hero_main = ?, hero_accent = ?, hero_sub = ?,
      feat1_title = ?, feat1_desc = ?, feat2_title = ?, feat2_desc = ?, feat3_title = ?, feat3_desc = ?,
      about_img = ?, about_title = ?, about_para1 = ?, about_para2 = ?,
      strip_title = ?, strip_desc = ?, contact_address = ?, contact_phone = ?, contact_hours = ?
     WHERE id = 1`,
    [
      heroImg, b.heroMain, b.heroAccent, b.heroSub,
      b.feat1Title, b.feat1Desc, b.feat2Title, b.feat2Desc, b.feat3Title, b.feat3Desc,
      aboutImg, b.aboutTitle, b.aboutPara1, b.aboutPara2,
      b.stripTitle, b.stripDesc, b.contactAddress, b.contactPhone, b.contactHours,
    ]
  );

  await pool.query("DELETE FROM about_points WHERE site_content_id = 1");
  for (const [i, text] of (b.aboutLi || []).entries()) {
    await pool.query("INSERT INTO about_points (site_content_id, text, sort_order) VALUES (1, ?, ?)", [text, i]);
  }

  await pool.query("DELETE FROM programs WHERE site_content_id = 1");
  for (const [i, p] of (b.programs || []).entries()) {
    await pool.query("INSERT INTO programs (site_content_id, title, description, sort_order) VALUES (1, ?, ?, ?)", [p.title, p.desc, i]);
  }

  await pool.query("DELETE FROM gallery_items WHERE site_content_id = 1");
  for (const [i, g] of gallery.entries()) {
    await pool.query("INSERT INTO gallery_items (site_content_id, image_url, caption, sort_order) VALUES (1, ?, ?, ?)", [g.img, g.cap, i]);
  }

  res.json(await assembleSiteContent(req));
});

module.exports = router;
