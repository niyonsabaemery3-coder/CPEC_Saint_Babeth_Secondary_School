/**
 * Shared domain types for the CPEC Saint Babeth TSS site.
 * This is a front-end only demo: there is no backend/database — every
 * piece of data below lives in memory (React state) and resets on reload.
 */

export interface Teacher {
  id: number;
  name: string;
  subject: string;
  quote: string;
  photo?: string | null;
  color: string;
}

export interface StudentApplication {
  id: number;
  name: string;
  dob: string;
  gender: string;
  trackyear: string;
  report: string | null;
  reportData: string | null; // base64 data URL, held in memory only
  prevschool: string;
  district: string;
  sector: string;
  parent: string;
  phone1: string;
  phone2: string;
}

export interface Faq {
  id?: number;
  q: string;
  a: string;
}

export interface ProgramCard {
  title: string;
  desc: string;
}

export interface GalleryItem {
  id?: number; // present once saved to the server; absent for a newly-added, unsaved photo
  img: string;
  cap: string;
}

export interface SiteContent {
  heroImg: string;
  heroMain: string;
  heroAccent: string;
  heroSub: string;
  feat1Title: string;
  feat1Desc: string;
  feat2Title: string;
  feat2Desc: string;
  feat3Title: string;
  feat3Desc: string;

  aboutImg: string;
  aboutTitle: string;
  aboutPara1: string;
  aboutPara2: string;
  aboutLi: [string, string, string, string];

  programs: [ProgramCard, ProgramCard, ProgramCard];
  stripTitle: string;
  stripDesc: string;

  gallery: GalleryItem[];

  contactAddress: string;
  contactPhone: string;
  contactHours: string;

  // Phase 1 (frontend only): controls whether the public Login/Register
  // modals show a "Register" tab. Not yet persisted by the backend — falls
  // back to these defaults on every reload until a /api/site/registration
  // endpoint exists (Phase 2).
  registrationSettings: RegistrationSettings;
}

export interface RegistrationSettings {
  allowStudentRegister: boolean;
  allowTeacherRegister: boolean;
  autoActivateStudentRegister: boolean;
  autoActivateTeacherRegister: boolean;
}

export type PageBannerKey = "about" | "academics" | "admissions" | "teachers" | "gallery" | "contact";

export interface PageBanner {
  eyebrow: string;
  title: string;
  subtitle: string;
  bgImage: string; // "" when no custom background has been set
}

export type PageBanners = Record<PageBannerKey, PageBanner>;

/* ─── News & Events (Admin > News & Events) ───────────────────────────── */

// News & Announcements — shown on the "News & Announcements" tab of the
// public Events & News page.
export interface NewsItem {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  image: string; // background photo shown on the card
  date: string; // "YYYY-MM-DD"
}

export type EventColorKey = "navy" | "green" | "gold" | "purple" | "rust";

// Upcoming Events — shown on the "Upcoming Events" tab of the public
// Events & News page. `image` is optional: when empty, the card falls back
// to its plain colored header (colorKey) instead.
export interface EventItem {
  id: number;
  title: string;
  category: string;
  description: string;
  location: string;
  date: string; // "YYYY-MM-DD"
  time: string; // e.g. "07:30 AM"
  icon: string; // Font Awesome class, e.g. "fa-graduation-cap"
  colorKey: EventColorKey;
  image: string; // "" when no custom header photo has been set
}

export type ResourceType = "notes" | "presentation" | "pastpaper";
export type SchoolClass =
  | "S1"
  | "S2"
  | "S3"
  | "L3SOD"
  | "L4SOD"
  | "L5SOD"
  | "SC_SOD"
  | "L3MLT"
  | "L4MLT"
  | "L5MLT"
  | "SC_MLT";
export type AccountStatus = "pending" | "active" | "deactivated";

export interface TeacherAccount {
  id: number;
  fullName: string;
  email: string;
  subject: string;
  status: AccountStatus;
  createdAt: string;
}

export type StudentAccountStatus = "pending" | "active" | "deactivated";

export interface StudentAccount {
  id: number;
  fullName: string;
  email: string;
  schoolClass: SchoolClass;
  status: StudentAccountStatus;
  createdAt: string;
}

export interface Resource {
  id: number;
  title: string;
  subject: string;
  schoolClass: SchoolClass;
  type: ResourceType;
  fileName: string | null;
  fileData: string | null; // preview/download href — only present once a student/teacher/admin is logged in
  link: string | null; // optional external link instead of a file — same login gate as fileData
  locked?: boolean; // true when this resource has a file/link but the viewer isn't logged in yet
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
}

// A single report file (e.g. a term report card) an admin has uploaded for
// one student. At most one per student — uploading again replaces it.
export interface StudentReport {
  studentId: number;
  title: string | null;
  fileName: string | null;
  fileData: string | null;
  updatedAt: string;
  createdAt: string;
}

export type Theme = "light" | "dark";

export type AdminView = "dash" | "apps" | "teach" | "students" | "newsEvents" | "settings";
export type TeachAdminTab = "accounts" | "resources";
export type StudentsAdminTab = "accounts" | "reports";
export type NewsEventsAdminTab = "news" | "events";
export type TeacherView = "resources" | "add" | "profile" | "settings";
export type StudentView = "resources" | "reports" | "profile";
export type SettingsSection =
  | "security"
  | "registration"
  | "home"
  | "about"
  | "academics"
  | "teachers"
  | "gallery"
  | "contact"
  | "banners"
  | "faq"
  | "data";
