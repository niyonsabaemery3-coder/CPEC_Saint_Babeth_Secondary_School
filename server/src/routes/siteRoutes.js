const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { saveBase64File, deleteUploadedFile } = require("../utils/uploads");
const { toAbsoluteUploadUrl, toRelativeUploadPath } = require("../utils/publicUrl");

const router = express.Router();

/* =========================================================================
   TRUE PER-SECTION ISOLATION
   ---------------------------------------------------------------------
   Home / About / Academics / Gallery / Contact each get their OWN PUT
   endpoint below, and each one runs its OWN SQL statements against ONLY
   the column(s)/table(s) that section owns:

     PUT /api/site/home       -> site_content: hero_*, feat1_*, feat2_*, feat3_*
     PUT /api/site/about      -> site_content: about_img/title/para1/para2
                                  + about_points (child table)
     PUT /api/site/academics  -> site_content: strip_title, strip_desc
                                  + programs (child table)
     POST/PUT/DELETE /api/site/gallery(/:id) -> gallery_items, ONE row per call
     PUT /api/site/contact    -> site_content: contact_address/phone/hours

   No endpoint ever issues an UPDATE that touches a column outside its own
   list, and no endpoint ever writes to a table owned by another section.
   Saving Home cannot execute a single statement that references About's,
   Gallery's or Contact's columns/tables -- the isolation lives in the SQL
   itself, not just in what the frontend chooses to send.
========================================================================= */

async function assembleSiteContent(req) {
  const [[site]] = await pool.query("SELECT * FROM site_content WHERE id = 1");
  if (!site) return null;
  const [aboutPoints] = await pool.query("SELECT text FROM about_points WHERE site_content_id = 1 ORDER BY sort_order ASC");
  const [programs] = await pool.query("SELECT title, description, section FROM programs WHERE site_content_id = 1 ORDER BY sort_order ASC");
  const [gallery] = await pool.query("SELECT id, image_url, caption, category FROM gallery_items WHERE site_content_id = 1 ORDER BY sort_order ASC");

  let heroImages = [];
  try {
    const parsedHeroImages = JSON.parse(site.hero_images || "[]");
    heroImages = Array.isArray(parsedHeroImages) ? parsedHeroImages.filter((image) => typeof image === "string" && image.trim()) : [];
  } catch {
    heroImages = [];
  }
  if (heroImages.length === 0 && site.hero_img) heroImages = [site.hero_img];

  let coreValues = [];
  try {
    const parsed = JSON.parse(site.core_values || "[]");
    coreValues = Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean) : [];
  } catch {
    coreValues = [];
  }

  return {
    heroImg: toAbsoluteUploadUrl(req, site.hero_img),
    heroImages: heroImages.map((image) => toAbsoluteUploadUrl(req, image)),
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
    mission: site.mission || "",
    vision: site.vision || "",
    coreValues,
    aboutLi: aboutPoints.map((p) => p.text),
    programs: programs.map((p) => ({
      section: p.section?.trim() || "Ordinary Level",
      title: p.title,
      desc: p.description,
    })),
    stripTitle: site.strip_title,
    stripDesc: site.strip_desc,
    gallery: gallery.map((g) => ({ id: g.id, img: toAbsoluteUploadUrl(req, g.image_url), cap: g.caption, category: g.category || "General" })),
    contactAddress: site.contact_address,
    contactPhone: site.contact_phone,
    contactHours: site.contact_hours,
    registrationSettings: {
      allowStudentRegister: !!site.allow_student_register,
      allowTeacherRegister: !!site.allow_teacher_register,
      autoActivateStudentRegister: !!site.auto_activate_student_register,
      autoActivateTeacherRegister: !!site.auto_activate_teacher_register,
    },
  };
}

// Public: everything the site needs to render its editable text/images.
// (Read-only aggregate, kept for the public homepage. Every WRITE below is
// split per section; only this GET still reads all sections at once.)
router.get("/", async (req, res) => {
  const content = await assembleSiteContent(req);
  if (!content) return res.status(404).json({ error: "Site content not seeded yet -- run `npm run db:seed`." });
  res.json(content);
});

async function ensureSiteRow() {
  const [[row]] = await pool.query("SELECT id FROM site_content WHERE id = 1");
  if (!row) throw Object.assign(new Error("Site content not seeded yet -- run `npm run db:seed`."), { status: 404 });
}

// ---------------------------------------------------------------- HOME --
// Owns ONLY: hero_img, hero_main, hero_accent, hero_sub, feat1/2/3 title+desc.
// This statement cannot reference about_*, strip_*, contact_*, or any child
// table -- so a Home save is physically incapable of touching them.
router.put("/home", requireAdmin, async (req, res, next) => {
  try {
    await ensureSiteRow();
    const b = req.body || {};

    const [[existing]] = await pool.query("SELECT hero_img, hero_images FROM site_content WHERE id = 1");
    const oldHeroImg = existing?.hero_img || null;

    const requestedImages = Array.isArray(b.heroImages) ? b.heroImages : [b.heroImg];
    const heroImages = [];
    for (const image of requestedImages) {
      if (typeof image !== "string" || !image.trim()) continue;
      heroImages.push(image.startsWith("data:") ? await saveBase64File(image, "images") : toRelativeUploadPath(image));
    }
    const savedHeroImages = heroImages.length ? heroImages : [toRelativeUploadPath(b.heroImg)];
    const heroImg = savedHeroImages[0];

    await pool.query(
      `UPDATE site_content SET
        hero_img = ?, hero_images = ?, hero_main = ?, hero_accent = ?, hero_sub = ?,
        feat1_title = ?, feat1_desc = ?, feat2_title = ?, feat2_desc = ?, feat3_title = ?, feat3_desc = ?
       WHERE id = 1`,
      [heroImg, JSON.stringify(savedHeroImages), b.heroMain, b.heroAccent, b.heroSub, b.feat1Title, b.feat1Desc, b.feat2Title, b.feat2Desc, b.feat3Title, b.feat3Desc]
    );

    if (heroImg !== oldHeroImg && oldHeroImg) await deleteUploadedFile(oldHeroImg).catch(() => {});

    res.json(await assembleSiteContent(req));
  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------------------- ABOUT --
// Owns ONLY: about_img, about_title, about_para1, about_para2, about_points.
router.put("/about", requireAdmin, async (req, res, next) => {
  const b = req.body || {};
  const conn = await pool.getConnection();
  let oldAboutImg = null;
  try {
    await conn.beginTransaction();
    await ensureSiteRow();

    const [[existing]] = await conn.query("SELECT about_img FROM site_content WHERE id = 1");
    oldAboutImg = existing?.about_img || null;

    const aboutImg = b.aboutImg?.startsWith("data:")
      ? await saveBase64File(b.aboutImg, "images")
      : toRelativeUploadPath(b.aboutImg);

    const coreValues = Array.isArray(b.coreValues)
      ? b.coreValues.map((value) => String(value).trim()).filter(Boolean)
      : [];

    await conn.query(
      `UPDATE site_content SET about_img = ?, about_title = ?, about_para1 = ?, about_para2 = ?, mission = ?, vision = ?, core_values = ? WHERE id = 1`,
      [aboutImg, b.aboutTitle, b.aboutPara1, b.aboutPara2, b.mission || "", b.vision || "", JSON.stringify(coreValues)]
    );

    await conn.query("DELETE FROM about_points WHERE site_content_id = 1");
    const aboutHighlights = Array.isArray(b.aboutLi)
      ? b.aboutLi.map((text) => String(text).trim()).filter(Boolean)
      : [];
    for (const [i, text] of aboutHighlights.entries()) {
      await conn.query("INSERT INTO about_points (site_content_id, text, sort_order) VALUES (1, ?, ?)", [text, i]);
    }

    await conn.commit();
    if (aboutImg !== oldAboutImg && oldAboutImg) await deleteUploadedFile(oldAboutImg).catch(() => {});
    res.json(await assembleSiteContent(req));
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// ----------------------------------------------------------- ACADEMICS --
// Owns ONLY: strip_title, strip_desc, programs.
router.put("/academics", requireAdmin, async (req, res, next) => {
  const b = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensureSiteRow();

    await conn.query(`UPDATE site_content SET strip_title = ?, strip_desc = ? WHERE id = 1`, [b.stripTitle, b.stripDesc]);

    await conn.query("DELETE FROM programs WHERE site_content_id = 1");
    for (const [i, p] of (b.programs || []).entries()) {
      const section = typeof p.section === "string" && p.section.trim() ? p.section.trim() : "Ordinary Level";
      await conn.query(
        "INSERT INTO programs (site_content_id, title, description, section, sort_order) VALUES (1, ?, ?, ?, ?)",
        [p.title, p.desc, section, i]
      );
    }

    await conn.commit();
    res.json(await assembleSiteContent(req));
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// -------------------------------------------------------------- GALLERY --
// Per-photo endpoints. Each one touches exactly ONE row in gallery_items and
// nothing else — adding, editing or removing one photo can never affect any
// other photo, so it is now impossible to "forget" or lose photos that
// weren't part of the save you just clicked.

// Add a brand-new photo. Body: { img, cap, category }.
router.post("/gallery", requireAdmin, async (req, res, next) => {
  try {
    await ensureSiteRow();
    const b = req.body || {};
    const imageUrl = b.img?.startsWith("data:") ? await saveBase64File(b.img, "images") : toRelativeUploadPath(b.img);
    const category = typeof b.category === "string" && b.category.trim() ? b.category.trim() : "General";

    const [[{ maxOrder }]] = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM gallery_items WHERE site_content_id = 1"
    );
    const [result] = await pool.query(
      "INSERT INTO gallery_items (site_content_id, image_url, caption, category, sort_order) VALUES (1, ?, ?, ?, ?)",
      [imageUrl, b.cap || "", category, maxOrder + 1]
    );

    res.json({ id: result.insertId, img: toAbsoluteUploadUrl(req, imageUrl), cap: b.cap || "", category });
  } catch (err) {
    next(err);
  }
});

// Update ONE existing photo by id. Body: { img, cap, category }. Never touches any
// other gallery_items row.
router.put("/gallery/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [[existing]] = await pool.query("SELECT image_url FROM gallery_items WHERE id = ? AND site_content_id = 1", [id]);
    if (!existing) return res.status(404).json({ error: "Photo not found." });

    const b = req.body || {};
    const imageUrl = b.img?.startsWith("data:") ? await saveBase64File(b.img, "images") : toRelativeUploadPath(b.img);
    const category = typeof b.category === "string" && b.category.trim() ? b.category.trim() : "General";

    await pool.query("UPDATE gallery_items SET image_url = ?, caption = ?, category = ? WHERE id = ?", [imageUrl, b.cap || "", category, id]);

    if (imageUrl !== existing.image_url && existing.image_url) await deleteUploadedFile(existing.image_url).catch(() => {});

    res.json({ id, img: toAbsoluteUploadUrl(req, imageUrl), cap: b.cap || "", category });
  } catch (err) {
    next(err);
  }
});

// Delete ONE photo by id. Never touches any other gallery_items row.
router.delete("/gallery/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [[existing]] = await pool.query("SELECT image_url FROM gallery_items WHERE id = ? AND site_content_id = 1", [id]);
    if (!existing) return res.status(404).json({ error: "Photo not found." });

    await pool.query("DELETE FROM gallery_items WHERE id = ?", [id]);
    if (existing.image_url) await deleteUploadedFile(existing.image_url).catch(() => {});

    res.json({ id, deleted: true });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------- CONTACT --
// Owns ONLY: contact_address, contact_phone, contact_hours.
router.put("/contact", requireAdmin, async (req, res, next) => {
  try {
    await ensureSiteRow();
    const b = req.body || {};
    await pool.query(
      `UPDATE site_content SET contact_address = ?, contact_phone = ?, contact_hours = ? WHERE id = 1`,
      [b.contactAddress, b.contactPhone, b.contactHours]
    );
    res.json(await assembleSiteContent(req));
  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------------- REGISTRATION --
// Owns ONLY: allow_student_register, allow_teacher_register. Controls
// whether the public self-registration endpoints in authRoutes.js
// (/api/auth/student/register, /api/auth/teacher/register) accept new
// submissions — those endpoints re-check these same columns server-side
// before inserting, so this toggle is enforced even if the frontend UI is
// bypassed.
router.put("/registration", requireAdmin, async (req, res, next) => {
  try {
    await ensureSiteRow();
    const b = req.body || {};
    await pool.query(
      `UPDATE site_content SET allow_student_register = ?, allow_teacher_register = ?, auto_activate_student_register = ?, auto_activate_teacher_register = ? WHERE id = 1`,
      [b.allowStudentRegister ? 1 : 0, b.allowTeacherRegister ? 1 : 0, b.autoActivateStudentRegister ? 1 : 0, b.autoActivateTeacherRegister ? 1 : 0]
    );
    res.json(await assembleSiteContent(req));
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, _next) => {
  console.error("Site route error:", err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Failed to save. Please try again." });
});

module.exports = router;
