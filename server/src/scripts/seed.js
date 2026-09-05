/**
 * Inserts starter/demo data — same content the old front-end-only demo
 * shipped with. Safe to re-run: it only inserts rows that don't exist yet.
 * Run with: npm run db:seed
 */
require("../config/env");
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

async function ensureStudentAccounts() {
  const [rows] = await pool.query("SELECT id FROM student_accounts LIMIT 1");
  if (rows.length > 0) {
    console.log("• Student accounts already exist, skipping.");
    return;
  }
  const demoPassword = "student123";
  const hash = await bcrypt.hash(demoPassword, 10);
  await pool.query(
    "INSERT INTO student_accounts (full_name, email, password_hash, school_class, status) VALUES (?, ?, ?, ?, 'active')",
    ["Iradukunda Divine", "iradukunda.divine@student.stbabeth.rw", hash, "S2"]
  );
  console.log(`✔ Created 1 demo student account (password: ${demoPassword})`);
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
      "/images/hero-styled.webp",
      "CPEC Saint Babeth",
      "TSS",
      "Located in Byumba, we prepare students in S1–S3 for national excellence while building strong foundations in Software Development, ICT and Multimedia Production.",
      "Quality Education",
      "Delivering knowledge in S1–S3 with modern, hands-on teaching methods.",
      "Tech-Focused Curriculum",
      "Software Development, ICT and Multimedia Production taught from the foundation.",
      "Discipline & Integrity",
      "Building character, responsibility and respect in every student.",
      "/images/demo-student.webp",
      "Discipline, Work, Integrity — since day one",
      "CPEC Saint Babeth TSS is based in Byumba, Rwanda, offering lower secondary education (S1–S3) alongside specialised technology training. Our mission is to nurture disciplined, skilled and principled young people ready for the modern world.",
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
    ["/images/gallery/school-gate.webp", "School Gate"],
    ["/images/gallery/football-team.webp", "Football Team"],
    ["/images/gallery/agriculture.webp", "Agriculture Club"],
    ["/images/gallery/readers.webp", "Reading Time"],
    ["/images/gallery/head-teachers.webp", "Our Staff"],
  ];
  order = 0;
  for (const [imageUrl, caption] of gallery) {
    await pool.query("INSERT INTO gallery_items (site_content_id, image_url, caption, sort_order) VALUES (1, ?, ?, ?)", [imageUrl, caption, order++]);
  }

  console.log("✔ Added default site content, about points, programs & gallery items.");
}

async function ensurePageBanners() {
  const [rows] = await pool.query("SELECT page_key FROM page_banners");
  if (rows.length > 0) {
    console.log("• Page banners already exist, skipping.");
    return;
  }

  const banners = [
    ["about", "About Our School", "Who We Are", "Discipline, work and integrity guiding every student at CPEC Saint Babeth TSS."],
    ["academics", "Academics", "What We Teach", "A well-rounded lower-secondary curriculum paired with in-demand technology skills."],
    ["admissions", "Admissions", "Apply to CPEC Saint Babeth TSS", "Start your application online — it only takes a few minutes."],
    ["teachers", "Our Team", "Meet Our Teachers", "Dedicated educators guiding every student in and beyond the classroom."],
    ["gallery", "Gallery", "Life at Our School", "A look at student life, facilities and campus moments."],
    ["contact", "Contact", "Get In Touch", "Reach out for admissions, partnerships, or general questions."],
  ];
  for (const [pageKey, eyebrow, title, subtitle] of banners) {
    await pool.query(
      "INSERT INTO page_banners (page_key, eyebrow, title, subtitle, bg_image) VALUES (?, ?, ?, ?, NULL)",
      [pageKey, eyebrow, title, subtitle]
    );
  }
  console.log("✔ Added default page banners.");
}

async function ensureNewsItems() {
  const [rows] = await pool.query("SELECT id FROM news_items LIMIT 1");
  if (rows.length > 0) {
    console.log("• News items already exist, skipping.");
    return;
  }
  const news = [
    ["2026-08-18", "Academics", "Term 3 timetable and exam schedule released",
      "The Term 3 class timetable and end-of-term exam schedule are now available to students and parents. Check the Resources page for your class copy.",
      "/images/gallery/readers.webp"],
    ["2026-08-05", "Achievement", "Software Development class wins district ICT competition",
      "Our Level 3 Software Development students took first place at the district ICT innovation competition, presenting a mobile app to help local farmers track produce prices.",
      "/images/gallery/head-teachers.webp"],
    ["2026-07-22", "Admissions", "2027 admissions open for Senior 1 and Senior 4",
      "Applications for the next academic year are now open. Parents and prospective students can apply online or visit the school office in Byumba.",
      "/images/gallery/school-gate.webp"],
    ["2026-07-10", "Community", "Parents' day: strong turnout for Term 2 report discussions",
      "Parents and guardians met with class teachers to review Term 2 progress reports and discuss support plans ahead of Term 3.",
      "/images/gallery/football-team.webp"],
  ];
  let order = news.length;
  for (const [date, category, title, excerpt, image] of news) {
    await pool.query(
      "INSERT INTO news_items (title, category, excerpt, image_url, event_date, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
      [title, category, excerpt, image, date, order--]
    );
  }
  console.log(`✔ Added ${news.length} news items.`);
}

async function ensureUpcomingEvents() {
  const [rows] = await pool.query("SELECT id FROM upcoming_events LIMIT 1");
  if (rows.length > 0) {
    console.log("• Upcoming events already exist, skipping.");
    return;
  }
  const events = [
    ["2026-09-01", "07:30 AM", "Academics", "Term 3 Begins",
      "Official opening of Term 3 for all classes. Students are expected to be at school by 7:30 AM.",
      "School Campus", "fa-graduation-cap", "navy"],
    ["2026-09-14", "08:00 AM", "Academics", "End of Term Exams",
      "Term 3 examinations for all levels. Make sure to prepare well and revise your notes.",
      "Classrooms", "fa-display", "green"],
    ["2026-09-26", "09:00 AM", "Meeting", "Parents' Meeting",
      "Parents are invited to discuss students' progress and development with teachers.",
      "School Hall", "fa-people-group", "purple"],
    ["2026-10-10", "10:00 AM", "ICT Event", "ICT Innovation Day",
      "Students will showcase their projects and innovations in Software & Multimedia.",
      "ICT Lab", "fa-microchip", "gold"],
    ["2026-10-24", "08:30 AM", "Sports", "Inter-Class Sports",
      "Annual inter-class sports competition. Let's promote talent and teamwork!",
      "Sports Field", "fa-trophy", "rust"],
  ];
  let order = 0;
  for (const [date, time, category, title, description, location, icon, colorKey] of events) {
    await pool.query(
      `INSERT INTO upcoming_events (title, category, description, location, event_date, event_time, icon, color_key, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, category, description, location, date, time, icon, colorKey, order++]
    );
  }
  console.log(`✔ Added ${events.length} upcoming events.`);
}

async function main() {
  await ensureAdmin();
  await ensureTeacherAccounts();
  await ensureStudentAccounts();
  await ensureTeachersDirectory();
  await ensureResources();
  await ensureFaqs();
  await ensureSiteContent();
  await ensurePageBanners();
  await ensureNewsItems();
  await ensureUpcomingEvents();
  console.log("\nSeeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("✘ Seeding failed:", err);
  process.exit(1);
});
