-- CPEC Saint Babeth Secondary School — database schema
-- Run automatically by `npm run db:init`, or paste manually into MySQL.


-- ---------------------------------------------------------------------------
-- Admins — staff who manage the whole site from the Admin panel.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Teacher accounts — created by the admin. Accounts start active and can
-- be deactivated/reactivated by the admin at any time. Only active accounts
-- can log in and upload resources.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_accounts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  subject       VARCHAR(120) NOT NULL,
  status        ENUM('pending','active','deactivated') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Student accounts — created by the admin. Accounts are active immediately
-- so students can log in and access their study materials right away.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_accounts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  school_class  ENUM('S1','S2','S3','L3SOD','L4SOD','L5SOD','SC_SOD','L3MLT','L4MLT','L5MLT','SC_MLT') NOT NULL,
  status        ENUM('pending','active','deactivated') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Student reports — one report file per student (e.g. a term report card)
-- that an admin uploads for them from the Admin > Student Reports screen.
-- Uploading again for the same student replaces the previous file (see the
-- UNIQUE key on student_id + the upsert in studentReportRoutes.js).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_reports (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL UNIQUE,
  title        VARCHAR(200),
  file_url     VARCHAR(500) NOT NULL,
  file_name    VARCHAR(255),
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_reports_student
    FOREIGN KEY (student_id) REFERENCES student_accounts(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Teachers — the public "Meet Our Teachers" directory. Optionally linked to
-- a teacher_account (nullable) since an admin can also add a teacher profile
-- by hand without that person having a login account.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  teacher_account_id INT NULL,
  name               VARCHAR(150) NOT NULL,
  subject            VARCHAR(120) NOT NULL,
  quote              TEXT,
  photo_url          VARCHAR(500),
  color              VARCHAR(20) NOT NULL DEFAULT '#e6a935',
  sort_order         INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_teachers_account
    FOREIGN KEY (teacher_account_id) REFERENCES teacher_accounts(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Resources — Notes / Presentations / Past Papers uploaded by a teacher
-- account. Every resource belongs to exactly one uploader; if that teacher
-- account is removed, their resources go with it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  subject      VARCHAR(120) NOT NULL,
  school_class ENUM('S1','S2','S3','L3SOD','L4SOD','L5SOD','SC_SOD','L3MLT','L4MLT','L5MLT','SC_MLT') NOT NULL,
  type         ENUM('notes','presentation','pastpaper') NOT NULL,
  file_url     VARCHAR(500),
  file_name    VARCHAR(255),
  link_url     VARCHAR(500),
  uploader_id  INT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resources_uploader
    FOREIGN KEY (uploader_id) REFERENCES teacher_accounts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_resources_filter (school_class, type, subject)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Applications — submissions from the public 5-step Apply wizard.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  student_name     VARCHAR(150) NOT NULL,
  dob              VARCHAR(30),
  gender           VARCHAR(20),
  track_year       VARCHAR(50),
  prev_school      VARCHAR(200),
  district         VARCHAR(100),
  sector           VARCHAR(100),
  parent_name      VARCHAR(150),
  parent_email     VARCHAR(180),
  phone1           VARCHAR(30),
  phone2           VARCHAR(30),
  report_file_url  VARCHAR(500),
  report_file_name VARCHAR(255),
  status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  feedback        TEXT,
  feedback_file_url  VARCHAR(500),
  feedback_file_name VARCHAR(255),
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS application_feedback_templates (
  id                 INT PRIMARY KEY DEFAULT 1,
  pending_message    TEXT NOT NULL,
  approved_message   TEXT NOT NULL,
  rejected_message   TEXT NOT NULL,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_application_feedback_templates_singleton CHECK (id = 1)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- FAQs — powers the floating chat widget.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faqs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  question   VARCHAR(300) NOT NULL,
  answer     TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Site content — one singleton row (id=1) holding all editable page text,
-- plus three related child tables for the list-shaped parts of the page
-- (About bullet points, Academic programs, Gallery photos).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_content (
  id              INT PRIMARY KEY DEFAULT 1,
  hero_img        VARCHAR(500),
  hero_images     LONGTEXT,
  hero_main       VARCHAR(150),
  hero_accent     VARCHAR(150),
  hero_sub        TEXT,
  feat1_title     VARCHAR(150),
  feat1_desc      TEXT,
  feat2_title     VARCHAR(150),
  feat2_desc      TEXT,
  feat3_title     VARCHAR(150),
  feat3_desc      TEXT,
  about_img       VARCHAR(500),
  about_title     VARCHAR(200),
  about_para1     TEXT,
  about_para2     TEXT,
  about_history   TEXT,
  mission         TEXT,
  vision          TEXT,
  core_values     LONGTEXT,
  strip_title     VARCHAR(200),
  strip_desc      TEXT,
  contact_address VARCHAR(300),
  contact_phone   VARCHAR(50),
  contact_hours   VARCHAR(150),
  allow_student_register TINYINT(1) NOT NULL DEFAULT 0,
  allow_teacher_register TINYINT(1) NOT NULL DEFAULT 0,
  -- When an admin lets the public self-register, this controls the starting
  -- status of each new self-registered account: ON => 'active' (auto-approved,
  -- can log in immediately); OFF => 'deactivated' (admin must review/activate).
  auto_activate_student_register TINYINT(1) NOT NULL DEFAULT 0,
  auto_activate_teacher_register TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT chk_site_content_singleton CHECK (id = 1)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS about_points (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  site_content_id INT NOT NULL DEFAULT 1,
  text            VARCHAR(300) NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_about_points_site
    FOREIGN KEY (site_content_id) REFERENCES site_content(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS programs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  site_content_id INT NOT NULL DEFAULT 1,
  title           VARCHAR(150) NOT NULL,
  description     TEXT,
  section         VARCHAR(150) NOT NULL DEFAULT 'Ordinary Level',
  sort_order      INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_programs_site
    FOREIGN KEY (site_content_id) REFERENCES site_content(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gallery_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  site_content_id INT NOT NULL DEFAULT 1,
  image_url       VARCHAR(500) NOT NULL,
  caption         VARCHAR(150),
  category        VARCHAR(100) NOT NULL DEFAULT 'General',
  sort_order      INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_gallery_items_site
    FOREIGN KEY (site_content_id) REFERENCES site_content(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Page banners — the "card page-banner" shown at the top of About, Academics,
-- Admissions, Teachers, Gallery and Contact. One row per page, keyed by
-- page_key, so editing one page's banner (content or background image) can
-- never touch another page's row -- true per-page isolation at the DB level.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_banners (
  page_key VARCHAR(30) PRIMARY KEY,
  eyebrow  VARCHAR(150),
  title    VARCHAR(200),
  subtitle TEXT,
  bg_image VARCHAR(500),
  CONSTRAINT chk_page_banner_key
    CHECK (page_key IN ('about', 'academics', 'admissions', 'teachers', 'gallery', 'contact'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- News items — the "News & Announcements" tab on the public Events & News
-- page. Managed from Admin > News & Events > News.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  category   VARCHAR(80) NOT NULL DEFAULT 'Academics',
  excerpt    TEXT,
  image_url  VARCHAR(500),
  event_date DATE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Upcoming events — the "Upcoming Events" tab on the public Events & News
-- page. Managed from Admin > News & Events > Upcoming Events. image_url is
-- optional: when the admin doesn't choose a photo, the public page falls
-- back to the plain colored header (color_key) it has always used.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS upcoming_events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  category    VARCHAR(80) NOT NULL DEFAULT 'Academics',
  description TEXT,
  location    VARCHAR(200),
  event_date  DATE NOT NULL,
  event_time  VARCHAR(20),
  icon        VARCHAR(60) NOT NULL DEFAULT 'fa-calendar-days',
  color_key   ENUM('navy','green','gold','purple','rust') NOT NULL DEFAULT 'navy',
  image_url   VARCHAR(500),
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Migrations: safe to re-run on existing databases (uses IF NOT EXISTS).
-- New databases created via db:init already have these columns from the
-- CREATE TABLE statements above and MySQL will silently skip them.
-- ---------------------------------------------------------------------------

-- Admission Request improvements (round 1): parent contact + tracking fields.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS parent_email      VARCHAR(180) NULL AFTER parent_name,
  ADD COLUMN IF NOT EXISTS status            ENUM('pending','under_review','approved','rejected','info_required') NOT NULL DEFAULT 'pending' AFTER report_file_name,
  ADD COLUMN IF NOT EXISTS feedback          TEXT         NULL AFTER status,
  ADD COLUMN IF NOT EXISTS feedback_file_url  VARCHAR(500) NULL AFTER feedback,
  ADD COLUMN IF NOT EXISTS feedback_file_name VARCHAR(255) NULL AFTER feedback_file_url,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER feedback_file_name;

-- Admission Request improvements (round 2): admission type + school level.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS admission_type  VARCHAR(30)  NULL AFTER track_year,
  ADD COLUMN IF NOT EXISTS index_number    VARCHAR(80)  NULL AFTER admission_type,
  ADD COLUMN IF NOT EXISTS current_school  VARCHAR(200) NULL AFTER index_number,
  ADD COLUMN IF NOT EXISTS current_level   VARCHAR(50)  NULL AFTER current_school;

-- Widen status ENUM to include the two new review statuses.
-- Safe for existing rows — they keep their current status value.
ALTER TABLE applications
  MODIFY COLUMN status ENUM('pending','under_review','approved','rejected','info_required') NOT NULL DEFAULT 'pending';

-- Feedback templates: add the two new message columns.
ALTER TABLE application_feedback_templates
  ADD COLUMN IF NOT EXISTS under_review_message  TEXT NULL AFTER rejected_message,
  ADD COLUMN IF NOT EXISTS info_required_message TEXT NULL AFTER under_review_message;

-- ---------------------------------------------------------------------------
-- Grading system — subjects, exam terms, per-class subject/teacher
-- assignment, and the marks themselves. Averages, totals and class rank are
-- computed on read (see markRoutes.js) rather than stored, so they can never
-- go stale relative to the raw marks.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  code       VARCHAR(20) NOT NULL UNIQUE,
  max_score  DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_terms (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  school_year VARCHAR(20) NOT NULL,
  is_current  TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_term_year (name, school_year)
) ENGINE=InnoDB;

-- Which subjects each class takes, and who teaches each one (nullable —
-- a subject can be assigned to a class before a teacher is staffed on it).
CREATE TABLE IF NOT EXISTS class_subjects (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  school_class       ENUM('S1','S2','S3','L3SOD','L4SOD','L5SOD','L3MRT','L4MRT','L5MRT','OTHER') NOT NULL,
  subject_id         INT NOT NULL,
  teacher_account_id INT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_class_subject (school_class, subject_id),
  CONSTRAINT fk_class_subjects_subject
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_class_subjects_teacher
    FOREIGN KEY (teacher_account_id) REFERENCES teacher_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- One row per student/subject/term. entered_by_teacher_id records who last
-- saved the mark (feeds the audit trail alongside audit_logs below).
CREATE TABLE IF NOT EXISTS student_marks (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  student_id            INT NOT NULL,
  subject_id            INT NOT NULL,
  term_id               INT NOT NULL,
  score                 DECIMAL(6,2) NOT NULL,
  entered_by_teacher_id INT NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_student_subject_term (student_id, subject_id, term_id),
  CONSTRAINT fk_marks_student FOREIGN KEY (student_id) REFERENCES student_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_marks_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_marks_term FOREIGN KEY (term_id) REFERENCES exam_terms(id) ON DELETE CASCADE,
  CONSTRAINT fk_marks_teacher FOREIGN KEY (entered_by_teacher_id) REFERENCES teacher_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Audit log — a durable record of who changed what, across accounts,
-- grades, subjects and terms. Never blocks the action it describes (see
-- utils/audit.js); a logging failure is swallowed and only console-logged.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  actor_role  VARCHAR(20) NOT NULL,
  actor_id    INT NULL,
  actor_name  VARCHAR(150),
  action      VARCHAR(60) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id   VARCHAR(60),
  details     TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_created (created_at)
) ENGINE=InnoDB;
