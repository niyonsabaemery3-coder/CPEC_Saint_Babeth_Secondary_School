/**
 * Inserts starter/demo data — same content the old front-end-only demo
 * shipped with. Safe to re-run: it only inserts rows that don't exist yet.
 * Run with: npm run db:seed
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

async function ensureAdmin() {
  const [rows] = await pool.query("SELECT id FROM admins LIMIT 1");
  if (rows.length > 0) {
    console.log("• Admin already exists, skipping.");
    return;
  }
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 10);
  await pool.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [username, hash]);
  console.log(`✔ Created admin "${username}" (password: ${password})`);
}

async function ensureTeacherAccounts() {
  const [rows] = await pool.query("SELECT id FROM teacher_accounts LIMIT 1");
  if (rows.length > 0) {
    console.log("• Teacher accounts already exist, skipping.");
    return await pool.query("SELECT id, email FROM teacher_accounts");
  }
  const demoPassword = "teach123";
  const hash = await bcrypt.hash(demoPassword, 10);
  const accounts = [
    ["Mugisha Eric", "mugisha.eric@stbabeth.rw", "Software Development", "active"],
    ["Uwimana Claudine", "uwimana.claudine@stbabeth.rw", "ICT", "active"],
    ["Niyonzima Jean", "niyonzima.jean@stbabeth.rw", "Multimedia Production", "pending"],
  ];
  for (const [fullName, email, subject, status] of accounts) {
    await pool.query(
      "INSERT INTO teacher_accounts (full_name, email, password_hash, subject, status) VALUES (?, ?, ?, ?, ?)",
      [fullName, email, hash, subject, status]
    );
  }
  console.log(`✔ Created ${accounts.length} teacher accounts (password for all: ${demoPassword})`);
  return await pool.query("SELECT id, email FROM teacher_accounts");
}

async function ensureTeachersDirectory() {
  const [rows] = await pool.query("SELECT id FROM teachers LIMIT 1");
  if (rows.length > 0) {
    console.log("• Teacher directory already has entries, skipping.");
    return;
  }
  const teachers = [
    ["Mugisha Eric", "Software Development", "I want every student to leave my class able to build something real.", "#e6a935"],
    ["Uwimana Claudine", "ICT", "Technology should feel exciting, not intimidating — that's my job.", "#3f7d3a"],
    ["Niyonzima Jean", "Multimedia Production", "Creativity plus discipline is how our students tell their own stories.", "#8e5a2f"],
    ["Mukamana Alice", "Mathematics", "Every learner can master math with the right patience and practice.", "#c1860f"],
    ["Habimana Pascal", "Physics", "I love the moment a student finally sees how the world actually works.", "#4a5568"],
    ["Ingabire Solange", "English Language", "Confidence in language opens every other door for our students.", "#a8552b"],
    ["Bizimana Fabrice", "Biology", "Curiosity is the best tool I can give a young scientist.", "#2f6b6b"],
  ];
  let order = 0;
  for (const [name, subject, quote, color] of teachers) {
    await pool.query(
      "INSERT INTO teachers (name, subject, quote, color, sort_order) VALUES (?, ?, ?, ?, ?)",
      [name, subject, quote, color, order++]
    );
  }
  console.log(`✔ Added ${teachers.length} teachers to the public directory.`);
}

async function ensureResources() {
  const [rows] = await pool.query("SELECT id FROM resources LIMIT 1");
  if (rows.length > 0) {
    console.log("• Resources already exist, skipping.");
    return;
  }
  const [accounts] = await pool.query("SELECT id, email FROM teacher_accounts");
  const byEmail = Object.fromEntries(accounts.map((a) => [a.email, a.id]));
  const eric = byEmail["mugisha.eric@stbabeth.rw"];
  const claudine = byEmail["uwimana.claudine@stbabeth.rw"];
  if (!eric || !claudine) {
    console.log("• Skipping demo resources (demo teacher accounts not found).");
    return;
  }
  const resources = [
    ["Introduction to Algorithms & Flowcharts", "Software Development", "S2", "notes", eric],
    ["End of Term 2 Past Paper — ICT", "ICT", "S3", "pastpaper", claudine],
    ["Multimedia Editing Basics — Slides", "Multimedia Production", "S1", "presentation", eric],
  ];
  for (const [title, subject, schoolClass, type, uploaderId] of resources) {
    await pool.query(
      "INSERT INTO resources (title, subject, school_class, type, uploader_id) VALUES (?, ?, ?, ?, ?)",
      [title, subject, schoolClass, type, uploaderId]
    );
  }
  console.log(`✔ Added ${resources.length} demo resources.`);
}

async function ensureFaqs() {
  const [rows] = await pool.query("SELECT id FROM faqs LIMIT 1");
  if (rows.length > 0) {
    console.log("• FAQs already exist, skipping.");
    return;
  }
  const faqs = [
    ["What documents do I need to apply?", "You'll need the student's full name, date of birth and gender, a photo/scan of the previous school report, the parent/guardian's name and phone number(s), your home district and sector, the previous school attended, and the preferred track/year."],
    ["How long does the application take to review?", "Our admissions office typically reviews applications and contacts the parent/guardian by phone within a few working days of submission."],
    ["Which tracks / classes do you offer?", "We offer Senior 1 to Senior 3 (S1–S3) with a Technology & Media track covering Software Development, ICT and Multimedia Production."],
    ["What are your office hours?", "Our office is open Monday – Friday, 7:00 AM – 5:00 PM. You can also reach us by phone or WhatsApp using the button below."],
    ["Can I apply if I don't have a scanned report yet?", "Yes — you can submit the online application without the report and bring the original report card, along with your birth certificate and any transfer letter, in person once your application is approved."],
  ];
  let order = 0;
  for (const [q, a] of faqs) {
    await pool.query("INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)", [q, a, order++]);
  }
  console.log(`✔ Added ${faqs.length} FAQs.`);
}

async function ensureSiteContent() {
  const [rows] = await pool.query("SELECT id FROM site_content WHERE id = 1");
  if (rows.length > 0) {
    console.log("• Site content already exists, skipping.");
    return;
  }
  await pool.query(
    `INSERT INTO site_content
      (id, hero_img, hero_main, hero_accent, hero_sub,
       feat1_title, feat1_desc, feat2_title, feat2_desc, feat3_title, feat3_desc,
       about_img, about_title, about_para1, about_para2,
       strip_title, strip_desc, contact_address, contact_phone, contact_hours)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "/images/hero-styled.png",
      "CPEC Saint Babeth",
      "Secondary School",
      "Located in Byumba, we prepare students in S1–S3 for national excellence while building strong foundations in Software Development, ICT and Multimedia Production.",
      "Quality Education",
      "Delivering knowledge in S1–S3 with modern, hands-on teaching methods.",
      "Tech-Focused Curriculum",
      "Software Development, ICT and Multimedia Production taught from the foundation.",
      "Discipline & Integrity",
      "Building character, responsibility and respect in every student.",
      "/images/demo-student.jpeg",
      "Discipline, Work, Integrity — since day one",
      "CPEC Saint Babeth Secondary School is based in Byumba, Rwanda, offering lower secondary education (S1–S3) alongside specialised technology training. Our mission is to nurture disciplined, skilled and principled young people ready for the modern world.",
      "Guided by our motto — Discipline, Work, Integrity — we combine strong academic fundamentals with practical Software Development, ICT and Multimedia Production skills that open doors beyond the classroom.",
      "Technology & Media Track",
      "Hands-on classes designed to give students real, practical digital skills alongside their core curriculum.",
      "C3F8+QM8, Byumba, Rwanda",
      "0788 451 698",
      "Monday – Friday, 7:00 AM – 5:00 PM",
    ]
  );

  const aboutPoints = [
    "Certified teaching staff across all core subjects",
    "Dedicated computer lab for ICT & software classes",
    "Multimedia production studio for student projects",
    "Strong discipline and mentorship culture",
  ];
  let order = 0;
  for (const text of aboutPoints) {
    await pool.query("INSERT INTO about_points (site_content_id, text, sort_order) VALUES (1, ?, ?)", [text, order++]);
  }

  const programs = [
    ["Senior 1 (S1)", "Foundational subjects in mathematics, sciences, languages and general studies, building strong learning habits from the start."],
    ["Senior 2 (S2)", "Deeper subject exploration with continued focus on discipline, teamwork and academic performance."],
    ["Senior 3 (S3)", "Consolidation year preparing students for national exams and future specialisation choices."],
  ];
  order = 0;
  for (const [title, description] of programs) {
    await pool.query("INSERT INTO programs (site_content_id, title, description, sort_order) VALUES (1, ?, ?, ?)", [title, description, order++]);
  }

  const gallery = [
    ["/images/gallery/school-gate.jpg", "School Gate"],
    ["/images/gallery/football-team.jpg", "Football Team"],
    ["/images/gallery/agriculture.jpg", "Agriculture Club"],
    ["/images/gallery/readers.jpg", "Reading Time"],
    ["/images/gallery/head-teachers.jpg", "Our Staff"],
  ];
  order = 0;
  for (const [imageUrl, caption] of gallery) {
    await pool.query("INSERT INTO gallery_items (site_content_id, image_url, caption, sort_order) VALUES (1, ?, ?, ?)", [imageUrl, caption, order++]);
  }

  console.log("✔ Added default site content, about points, programs & gallery items.");
}

async function main() {
  await ensureAdmin();
  await ensureTeacherAccounts();
  await ensureTeachersDirectory();
  await ensureResources();
  await ensureFaqs();
  await ensureSiteContent();
  console.log("\nSeeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("✘ Seeding failed:", err);
  process.exit(1);
});
