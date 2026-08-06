/**
 * Shared domain types for the CPEC Saint Babeth Secondary School site.
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

  gallery: [GalleryItem, GalleryItem, GalleryItem, GalleryItem, GalleryItem];

  contactAddress: string;
  contactPhone: string;
  contactHours: string;
}

export type ResourceType = "notes" | "presentation" | "pastpaper";
export type SchoolClass = "S1" | "S2" | "S3";
export type AccountStatus = "pending" | "active" | "deactivated";

export interface TeacherAccount {
  id: number;
  fullName: string;
  email: string;
  subject: string;
  status: AccountStatus;
  createdAt: string;
}

export interface Resource {
  id: number;
  title: string;
  subject: string;
  schoolClass: SchoolClass;
  type: ResourceType;
  fileName: string | null;
  fileData: string | null; // base64 data URL, held in memory only
  link: string | null; // optional external link instead of a file
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
}

export type Theme = "light" | "dark";

export type AdminView = "dash" | "apps" | "teach" | "settings";
export type TeachAdminTab = "directory" | "accounts" | "resources";
export type TeacherView = "resources" | "add" | "profile";
export type SettingsSection =
  | "security"
  | "home"
  | "about"
  | "academics"
  | "teachers"
  | "gallery"
  | "contact"
  | "faq"
  | "data";
