-- CPEC Saint Babeth Secondary School — database schema
-- Run automatically by `npm run db:init`, or paste manually into MySQL.

CREATE DATABASE IF NOT EXISTS stbabeth_tss
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE stbabeth_tss;

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
-- Teacher accounts — teachers register themselves from the public Teacher
-- Portal. They start "pending" until an admin approves ("active") them, or
-- an admin can "deactivated" them at any time. Only active accounts can log
-- in and upload resources.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_accounts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  subject       VARCHAR(120) NOT NULL,
  status        ENUM('pending','active','deactivated') NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  school_class ENUM('S1','S2','S3') NOT NULL,
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
