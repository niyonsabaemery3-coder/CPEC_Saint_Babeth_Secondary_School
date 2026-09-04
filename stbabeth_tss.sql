-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 08, 2026 at 09:45 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `stbabeth_tss`
--

-- --------------------------------------------------------

--
-- Table structure for table `about_points`
--

CREATE TABLE if not exists `about_points` (
  `id` int(11) NOT NULL,
  `site_content_id` int(11) NOT NULL DEFAULT 1,
  `text` varchar(300) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `about_points`
--

INSERT INTO `about_points` (`id`, `site_content_id`, `text`, `sort_order`) VALUES
(1, 1, 'Certified teaching staff across all core subjects', 0),
(2, 1, 'Dedicated computer lab for ICT & software classes', 1),
(3, 1, 'Multimedia production studio for student projects', 2),
(4, 1, 'Strong discipline and mentorship culture', 3);

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE if not exists `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password_hash`, `created_at`) VALUES
(1, 'admin', '$2a$10$LNCKhTz2V8f2pZ6zNQWsRuQY4JPB9M7KtlQmWz/b2Znruvy.4qIby', '2026-08-08 19:27:55');

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE if not exists `applications` (
  `id` int(11) NOT NULL,
  `student_name` varchar(150) NOT NULL,
  `dob` varchar(30) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `track_year` varchar(50) DEFAULT NULL,
  `prev_school` varchar(200) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `sector` varchar(100) DEFAULT NULL,
  `parent_name` varchar(150) DEFAULT NULL,
  `phone1` varchar(30) DEFAULT NULL,
  `phone2` varchar(30) DEFAULT NULL,
  `report_file_url` varchar(500) DEFAULT NULL,
  `report_file_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE if not exists `faqs` (
  `id` int(11) NOT NULL,
  `question` varchar(300) NOT NULL,
  `answer` text NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`id`, `question`, `answer`, `sort_order`) VALUES
(1, 'What documents do I need to apply?', 'You\'ll need the student\'s full name, date of birth and gender, a photo/scan of the previous school report, the parent/guardian\'s name and phone number(s), your home district and sector, the previous school attended, and the preferred track/year.', 0),
(2, 'How long does the application take to review?', 'Our admissions office typically reviews applications and contacts the parent/guardian by phone within a few working days of submission.', 1),
(3, 'Which tracks / classes do you offer?', 'We offer Senior 1 to Senior 3 (S1–S3) with a Technology & Media track covering Software Development, ICT and Multimedia Production.', 2),
(4, 'What are your office hours?', 'Our office is open Monday – Friday, 7:00 AM – 5:00 PM. You can also reach us by phone or WhatsApp using the button below.', 3),
(5, 'Can I apply if I don\'t have a scanned report yet?', 'Yes — you can submit the online application without the report and bring the original report card, along with your birth certificate and any transfer letter, in person once your application is approved.', 4);

-- --------------------------------------------------------

--
-- Table structure for table `gallery_items`
--

CREATE TABLE if not exists `gallery_items` (
  `id` int(11) NOT NULL,
  `site_content_id` int(11) NOT NULL DEFAULT 1,
  `image_url` varchar(500) NOT NULL,
  `caption` varchar(150) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gallery_items`
--

INSERT INTO `gallery_items` (`id`, `site_content_id`, `image_url`, `caption`, `sort_order`) VALUES
(1, 1, '/images/gallery/school-gate.jpg', 'School Gate', 0),
(2, 1, '/images/gallery/football-team.jpg', 'Football Team', 1),
(3, 1, '/images/gallery/agriculture.jpg', 'Agriculture Club', 2),
(4, 1, '/images/gallery/readers.jpg', 'Reading Time', 3),
(5, 1, '/images/gallery/head-teachers.jpg', 'Our Staff', 4);

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE if not exists `programs` (
  `id` int(11) NOT NULL,
  `site_content_id` int(11) NOT NULL DEFAULT 1,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`id`, `site_content_id`, `title`, `description`, `sort_order`) VALUES
(1, 1, 'Senior 1 (S1)', 'Foundational subjects in mathematics, sciences, languages and general studies, building strong learning habits from the start.', 0),
(2, 1, 'Senior 2 (S2)', 'Deeper subject exploration with continued focus on discipline, teamwork and academic performance.', 1),
(3, 1, 'Senior 3 (S3)', 'Consolidation year preparing students for national exams and future specialisation choices.', 2);

-- --------------------------------------------------------

--
-- Table structure for table `resources`
--

CREATE TABLE if not exists `resources` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `subject` varchar(120) NOT NULL,
  `school_class` enum('S1','S2','S3','L3SOD','L4SOD','L5SOD','SC_SOD','L3MLT','L4MLT','L5MLT','SC_MLT') NOT NULL,
  `type` enum('notes','presentation','pastpaper') NOT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `uploader_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `resources`
--

INSERT INTO `resources` (`id`, `title`, `subject`, `school_class`, `type`, `file_url`, `file_name`, `link_url`, `uploader_id`, `created_at`) VALUES
(1, 'Introduction to Algorithms & Flowcharts', 'Software Development', 'S2', 'notes', NULL, NULL, NULL, 1, '2026-08-08 19:27:55'),
(2, 'End of Term 2 Past Paper — ICT', 'ICT', 'S3', 'pastpaper', NULL, NULL, NULL, 2, '2026-08-08 19:27:55'),
(3, 'Multimedia Editing Basics — Slides', 'Multimedia Production', 'S1', 'presentation', NULL, NULL, NULL, 1, '2026-08-08 19:27:55');

-- --------------------------------------------------------

--
-- Table structure for table `site_content`
--

CREATE TABLE if not exists `site_content` (
  `id` int(11) NOT NULL DEFAULT 1,
  `hero_img` varchar(500) DEFAULT NULL,
  `hero_main` varchar(150) DEFAULT NULL,
  `hero_accent` varchar(150) DEFAULT NULL,
  `hero_sub` text DEFAULT NULL,
  `feat1_title` varchar(150) DEFAULT NULL,
  `feat1_desc` text DEFAULT NULL,
  `feat2_title` varchar(150) DEFAULT NULL,
  `feat2_desc` text DEFAULT NULL,
  `feat3_title` varchar(150) DEFAULT NULL,
  `feat3_desc` text DEFAULT NULL,
  `about_img` varchar(500) DEFAULT NULL,
  `about_title` varchar(200) DEFAULT NULL,
  `about_para1` text DEFAULT NULL,
  `about_para2` text DEFAULT NULL,
  `strip_title` varchar(200) DEFAULT NULL,
  `strip_desc` text DEFAULT NULL,
  `contact_address` varchar(300) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_hours` varchar(150) DEFAULT NULL,
  `allow_student_register` tinyint(1) NOT NULL DEFAULT 0,
  `allow_teacher_register` tinyint(1) NOT NULL DEFAULT 0,
  `auto_activate_student_register` tinyint(1) NOT NULL DEFAULT 0,
  `auto_activate_teacher_register` tinyint(1) NOT NULL DEFAULT 0
)  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_content`
--

INSERT INTO `site_content` (`id`, `hero_img`, `hero_main`, `hero_accent`, `hero_sub`, `feat1_title`, `feat1_desc`, `feat2_title`, `feat2_desc`, `feat3_title`, `feat3_desc`, `about_img`, `about_title`, `about_para1`, `about_para2`, `strip_title`, `strip_desc`, `contact_address`, `contact_phone`, `contact_hours`, `allow_student_register`, `allow_teacher_register`, `auto_activate_student_register`, `auto_activate_teacher_register`) VALUES
(1, '/images/hero-styled.png', 'CPEC Saint Babeth', 'Secondary School', 'Located in Byumba, we prepare students in S1–S3 for national excellence while building strong foundations in Software Development, ICT and Multimedia Production.', 'Quality Education', 'Delivering knowledge in S1–S3 with modern, hands-on teaching methods.', 'Tech-Focused Curriculum', 'Software Development, ICT and Multimedia Production taught from the foundation.', 'Discipline & Integrity', 'Building character, responsibility and respect in every student.', '/images/demo-student.jpeg', 'Discipline, Work, Integrity — since day one', 'CPEC Saint Babeth Secondary School is based in Byumba, Rwanda, offering lower secondary education (S1–S3) alongside specialised technology training. Our mission is to nurture disciplined, skilled and principled young people ready for the modern world.', 'Guided by our motto — Discipline, Work, Integrity — we combine strong academic fundamentals with practical Software Development, ICT and Multimedia Production skills that open doors beyond the classroom.', 'Technology & Media Track', 'Hands-on classes designed to give students real, practical digital skills alongside their core curriculum.', 'C3F8+QM8, Byumba, Rwanda', '0788 451 698', 'Monday – Friday, 7:00 AM – 5:00 PM', 1, 1, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE if not exists `teachers` (
  `id` int(11) NOT NULL,
  `teacher_account_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `subject` varchar(120) NOT NULL,
  `quote` text DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `color` varchar(20) NOT NULL DEFAULT '#e6a935',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `teacher_account_id`, `name`, `subject`, `quote`, `photo_url`, `color`, `sort_order`, `created_at`) VALUES
(1, NULL, 'Mugisha Eric', 'Software Development', 'I want every student to leave my class able to build something real.', NULL, '#e6a935', 0, '2026-08-08 19:27:55'),
(2, NULL, 'Uwimana Claudine', 'ICT', 'Technology should feel exciting, not intimidating — that\'s my job.', NULL, '#3f7d3a', 1, '2026-08-08 19:27:55'),
(3, NULL, 'Niyonzima Jean', 'Multimedia Production', 'Creativity plus discipline is how our students tell their own stories.', NULL, '#8e5a2f', 2, '2026-08-08 19:27:55'),
(4, NULL, 'Mukamana Alice', 'Mathematics', 'Every learner can master math with the right patience and practice.', NULL, '#c1860f', 3, '2026-08-08 19:27:55'),
(5, NULL, 'Habimana Pascal', 'Physics', 'I love the moment a student finally sees how the world actually works.', NULL, '#4a5568', 4, '2026-08-08 19:27:55'),
(6, NULL, 'Ingabire Solange', 'English Language', 'Confidence in language opens every other door for our students.', NULL, '#a8552b', 5, '2026-08-08 19:27:55'),
(7, NULL, 'Bizimana Fabrice', 'Biology', 'Curiosity is the best tool I can give a young scientist.', NULL, '#2f6b6b', 6, '2026-08-08 19:27:55');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_accounts`
--

CREATE TABLE if not exists `teacher_accounts` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `subject` varchar(120) NOT NULL,
  `status` enum('pending','active','deactivated') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_accounts`
--

INSERT INTO `teacher_accounts` (`id`, `full_name`, `email`, `password_hash`, `subject`, `status`, `created_at`) VALUES
(1, 'Mugisha Eric', 'mugisha.eric@stbabeth.rw', '$2a$10$fwOz2Z0oVxYD2jDH0Q7TRuUr6B9OSrf64NbOlY6C5oFVRKVNsle1u', 'Software Development', 'active', '2026-08-08 19:27:55'),
(2, 'Uwimana Claudine', 'uwimana.claudine@stbabeth.rw', '$2a$10$fwOz2Z0oVxYD2jDH0Q7TRuUr6B9OSrf64NbOlY6C5oFVRKVNsle1u', 'ICT', 'active', '2026-08-08 19:27:55'),
(3, 'Niyonzima Jean', 'niyonzima.jean@stbabeth.rw', '$2a$10$fwOz2Z0oVxYD2jDH0Q7TRuUr6B9OSrf64NbOlY6C5oFVRKVNsle1u', 'Multimedia Production', 'pending', '2026-08-08 19:27:55');

-- --------------------------------------------------------

--
-- Table structure for table `student_accounts`
--

CREATE TABLE if not exists `student_accounts` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `school_class` enum('S1','S2','S3','L3SOD','L4SOD','L5SOD','SC_SOD','L3MLT','L4MLT','L5MLT','SC_MLT') NOT NULL,
  `status` enum('pending','active','deactivated') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_accounts`
--

INSERT INTO `student_accounts` (`id`, `full_name`, `email`, `password_hash`, `school_class`, `status`, `created_at`) VALUES
(1, 'Iradukunda Divine', 'iradukunda.divine@student.stbabeth.rw', '$2a$10$fwOz2Z0oVxYD2jDH0Q7TRuUr6B9OSrf64NbOlY6C5oFVRKVNsle1u', 'S2', 'active', '2026-08-08 19:27:55');

-- --------------------------------------------------------

--
-- Table structure for table `student_reports`
--

CREATE TABLE if not exists `student_reports` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL UNIQUE,
  `title` varchar(200) DEFAULT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `page_banners`
--

CREATE TABLE if not exists `page_banners` (
  `page_key` varchar(30) NOT NULL,
  `eyebrow` varchar(150) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `subtitle` text DEFAULT NULL,
  `bg_image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `page_banners`
--

INSERT INTO `page_banners` (`page_key`, `eyebrow`, `title`, `subtitle`, `bg_image`) VALUES
('about', 'About Our School', 'Who We Are', 'Discipline, work and integrity guiding every student at CPEC Saint Babeth TSS.', NULL),
('academics', 'Academics', 'What We Teach', 'A well-rounded lower-secondary curriculum paired with in-demand technology skills.', NULL),
('admissions', 'Admissions', 'Apply to CPEC Saint Babeth TSS', 'Start your application online — it only takes a few minutes.', NULL),
('teachers', 'Our Team', 'Meet Our Teachers', 'Dedicated educators guiding every student in and beyond the classroom.', NULL),
('gallery', 'Gallery', 'Life at Our School', 'A look at student life, facilities and campus moments.', NULL),
('contact', 'Contact', 'Get In Touch', 'Reach out for admissions, partnerships, or general questions.', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `about_points`
--
ALTER TABLE `about_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_about_points_site` (`site_content_id`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gallery_items`
--
ALTER TABLE `gallery_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_gallery_items_site` (`site_content_id`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_programs_site` (`site_content_id`);

--
-- Indexes for table `resources`
--
ALTER TABLE `resources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_resources_uploader` (`uploader_id`),
  ADD KEY `idx_resources_filter` (`school_class`,`type`,`subject`);

--
-- Indexes for table `site_content`
--
ALTER TABLE `site_content`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_teachers_account` (`teacher_account_id`);

--
-- Indexes for table `teacher_accounts`
--
ALTER TABLE `teacher_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `student_accounts`
--
ALTER TABLE `student_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `student_reports`
--
ALTER TABLE `student_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`);

--
-- Indexes for table `page_banners`
--
ALTER TABLE `page_banners`
  ADD PRIMARY KEY (`page_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `about_points`
--
ALTER TABLE `about_points`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `gallery_items`
--
ALTER TABLE `gallery_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `resources`
--
ALTER TABLE `resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `teacher_accounts`
--
ALTER TABLE `teacher_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_accounts`
--
ALTER TABLE `student_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `student_reports`
--
ALTER TABLE `student_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `page_banners`
--
-- (page_banners uses page_key as PRIMARY KEY, no AUTO_INCREMENT)

--
-- Constraints for dumped tables
--

--
-- Constraints for table `about_points`
--
ALTER TABLE `about_points`
  ADD CONSTRAINT `fk_about_points_site` FOREIGN KEY (`site_content_id`) REFERENCES `site_content` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `gallery_items`
--
ALTER TABLE `gallery_items`
  ADD CONSTRAINT `fk_gallery_items_site` FOREIGN KEY (`site_content_id`) REFERENCES `site_content` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `programs`
--
ALTER TABLE `programs`
  ADD CONSTRAINT `fk_programs_site` FOREIGN KEY (`site_content_id`) REFERENCES `site_content` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `resources`
--
ALTER TABLE `resources`
  ADD CONSTRAINT `fk_resources_uploader` FOREIGN KEY (`uploader_id`) REFERENCES `teacher_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `fk_teachers_account` FOREIGN KEY (`teacher_account_id`) REFERENCES `teacher_accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `student_reports`
--
ALTER TABLE `student_reports`
  ADD CONSTRAINT `fk_student_reports_student` FOREIGN KEY (`student_id`) REFERENCES `student_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
