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
  phone1           VARCHAR(30),
  phone2           VARCHAR(30),
  report_file_url  VARCHAR(500),
  report_file_name VARCHAR(255),
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
