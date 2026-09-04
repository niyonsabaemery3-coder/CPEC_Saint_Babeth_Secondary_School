import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  Teacher,
  StudentApplication,
  Faq,
  SiteContent,
  GalleryItem,
  AdminView,
  Theme,
  TeacherAccount,
  StudentAccount,
  Resource,
  StudentReport,
  PageBanner,
  PageBanners,
  PageBannerKey,
  RegistrationSettings,
  NewsItem,
  EventItem,
} from "../types";
import {
  api,
  ApiError,
  getAdminToken,
  setAdminToken,
  getTeacherToken,
  setTeacherToken,
  getStudentToken,
  setStudentToken,
} from "../lib/api";

/* =========================================================
   BACKEND-DRIVEN STATE (MySQL, via the Express API in /server)
   Everything below is fetched from — and saved to — the real
   database on mount / on each action, so data is shared across
   every visitor and every device (unlike a purely local demo).
   React state here is just a client-side cache of what the API
   returned, kept in sync as actions succeed.
========================================================= */

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const THEME_KEY = "stbabeth-theme";

// Sensible fallback content shown instantly while the real data loads from
// the API (and if the API is briefly unreachable) so the UI never looks broken.
const DEFAULT_TEACHERS: Teacher[] = [];

const DEFAULT_FAQS: Faq[] = [];

const DEFAULT_PAGE_BANNERS: PageBanners = {
  about: { eyebrow: "About Our School", title: "Who We Are", subtitle: "Discipline, work and integrity guiding every student at CPEC Saint Babeth TSS.", bgImage: "" },
  academics: { eyebrow: "Academics", title: "What We Teach", subtitle: "A well-rounded lower-secondary curriculum paired with in-demand technology skills.", bgImage: "" },
  admissions: { eyebrow: "Admissions", title: "Apply to CPEC Saint Babeth TSS", subtitle: "Start your application online — it only takes a few minutes.", bgImage: "" },
  teachers: { eyebrow: "Our Team", title: "Meet Our Teachers", subtitle: "Dedicated educators guiding every student in and beyond the classroom.", bgImage: "" },
  gallery: { eyebrow: "Gallery", title: "Life at Our School", subtitle: "A look at student life, facilities and campus moments.", bgImage: "" },
  contact: { eyebrow: "Contact", title: "Get In Touch", subtitle: "Reach out for admissions, partnerships, or general questions.", bgImage: "" },
};

const DEFAULT_SITE: SiteContent = {
  heroImg: `${import.meta.env.BASE_URL}images/hero-styled.png`,
  heroMain: "CPEC Saint Babeth",
  heroAccent: "TSS",
  heroSub:
    "Located in Byumba, we prepare students in S1–S3 for national excellence while building strong foundations in Software Development, ICT and Multimedia Production.",
  feat1Title: "Quality Education",
  feat1Desc: "Delivering knowledge in S1–S3 with modern, hands-on teaching methods.",
  feat2Title: "Tech-Focused Curriculum",
  feat2Desc: "Software Development, ICT and Multimedia Production taught from the foundation.",
  feat3Title: "Discipline & Integrity",
  feat3Desc: "Building character, responsibility and respect in every student.",

  aboutImg: `${import.meta.env.BASE_URL}images/demo-student.jpeg`,
  aboutTitle: "Discipline, Work, Integrity — since day one",
  aboutPara1:
    "CPEC Saint Babeth TSS is based in Byumba, Rwanda, offering lower secondary education (S1–S3) alongside specialised technology training. Our mission is to nurture disciplined, skilled and principled young people ready for the modern world.",
  aboutPara2:
    "Guided by our motto — Discipline, Work, Integrity — we combine strong academic fundamentals with practical Software Development, ICT and Multimedia Production skills that open doors beyond the classroom.",
  aboutLi: [
    "Certified teaching staff across all core subjects",
    "Dedicated computer lab for ICT & software classes",
    "Multimedia production studio for student projects",
    "Strong discipline and mentorship culture",
  ],

  programs: [
    { title: "Senior 1 (S1)", desc: "Foundational subjects in mathematics, sciences, languages and general studies, building strong learning habits from the start." },
    { title: "Senior 2 (S2)", desc: "Deeper subject exploration with continued focus on discipline, teamwork and academic performance." },
    { title: "Senior 3 (S3)", desc: "Consolidation year preparing students for national exams and future specialisation choices." },
  ],
  stripTitle: "Technology & Media Track",
  stripDesc: "Hands-on classes designed to give students real, practical digital skills alongside their core curriculum.",

  gallery: [
    { img: `${import.meta.env.BASE_URL}images/gallery/school-gate.jpg`, cap: "School Gate" },
    { img: `${import.meta.env.BASE_URL}images/gallery/football-team.jpg`, cap: "Football Team" },
    { img: `${import.meta.env.BASE_URL}images/gallery/agriculture.jpg`, cap: "Agriculture Club" },
    { img: `${import.meta.env.BASE_URL}images/gallery/readers.jpg`, cap: "Reading Time" },
    { img: `${import.meta.env.BASE_URL}images/gallery/head-teachers.jpg`, cap: "Our Staff" },
  ],

  contactAddress: "C3F8+QM8, Byumba, Rwanda",
  contactPhone: "0788 451 698",
  contactHours: "Monday – Friday, 7:00 AM – 5:00 PM",

  // Phase 1 default: self-registration OFF until an admin turns it on.
  // When an admin enables it, new accounts start deactivated unless the
  // matching auto-activate toggle is also on.
  registrationSettings: {
    allowStudentRegister: false,
    allowTeacherRegister: false,
    autoActivateStudentRegister: false,
    autoActivateTeacherRegister: false,
  },
};

interface AppContextValue {
  // theme
  theme: Theme;
  toggleTheme: () => void;

  // teachers (public directory shown on the Teachers section)
  teachers: Teacher[];
  addTeacher: (t: Omit<Teacher, "id">) => Promise<void>;
  deleteTeacher: (index: number) => Promise<void>;

  // teacher accounts (admin-managed, plus optional self-registration — see registrationSettings)
  teacherAccounts: TeacherAccount[];
  createTeacherAccount: (data: { fullName: string; email: string; password: string; subject: string }) => Promise<{ ok: boolean; message: string }>;
  activateTeacherAccount: (id: number) => Promise<void>;
  deactivateTeacherAccount: (id: number) => Promise<void>;
  deleteTeacherAccount: (id: number) => Promise<void>;
  teacherSelfRegister: (data: { fullName: string; email: string; password: string; subject: string }) => Promise<{ ok: boolean; message: string }>;
  teacherLoggedIn: boolean;
  currentTeacher: TeacherAccount | null;
  teacherLogin: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  teacherLogout: () => void;
  updateTeacherPassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;

  // student accounts (admin-managed, plus optional self-registration — see registrationSettings)
  studentAccounts: StudentAccount[];
  fetchStudentAccounts: (params?: { schoolClass?: string; sort?: string; order?: string; search?: string }) => Promise<void>;
  createStudentAccount: (data: { fullName: string; email: string; password: string; schoolClass: string }) => Promise<{ ok: boolean; message: string }>;
  activateStudentAccount: (id: number) => Promise<void>;
  deactivateStudentAccount: (id: number) => Promise<void>;
  deleteStudentAccount: (id: number) => Promise<void>;
  studentSelfRegister: (data: { fullName: string; email: string; password: string; schoolClass: string }) => Promise<{ ok: boolean; message: string }>;
  studentLoggedIn: boolean;
  currentStudent: StudentAccount | null;
  studentLogin: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  studentLogout: () => void;
  updateStudentPassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;

  // resources (Notes / Presentations / Past Papers)
  resources: Resource[];
  addResource: (r: Omit<Resource, "id" | "createdAt">) => Promise<void>;
  deleteResource: (id: number) => Promise<void>;

  // student reports (one report file per student, uploaded by an admin)
  studentReports: StudentReport[];
  fetchStudentReports: () => Promise<void>;
  uploadStudentReports: (data: { studentIds: number[]; title?: string; fileData: string; fileName: string | null }) => Promise<void>;
  deleteStudentReport: (studentId: number) => Promise<void>;
  myReport: StudentReport | null;
  fetchMyReport: () => Promise<void>;

  // applications
  applications: StudentApplication[];
  addApplication: (a: StudentApplication) => void;
  deleteApplication: (id: number) => Promise<void>;

  // faqs
  faqs: Faq[];
  setFaqs: (faqs: Faq[]) => void;
  addFaq: (f: Faq) => Promise<void>;
  deleteFaq: (index: number) => Promise<void>;

  // site content (editable via Admin > Settings)
  site: SiteContent;
  setSite: (updater: SiteContent | ((prev: SiteContent) => SiteContent)) => void;
  // Saves ONE section (home/about/academics/gallery/contact) to its own
  // endpoint — the payload should only contain that section's own fields.
  saveSiteSection: (
    section: "home" | "about" | "academics" | "gallery" | "contact",
    payload: Partial<SiteContent>
  ) => Promise<void>;
  // Toggles whether the public Login modals show a "Register" tab. Persists
  // to the backend (PUT /api/site/registration, admin-only).
  updateRegistrationSettings: (payload: Partial<RegistrationSettings>) => Promise<void>;
  // Per-photo gallery endpoints — each call touches exactly ONE photo, so
  // saving one photo can never lose or overwrite any of the others.
  addGalleryPhoto: (photo: { img: string; cap: string }) => Promise<void>;
  updateGalleryPhoto: (id: number, photo: { img: string; cap: string }) => Promise<void>;
  deleteGalleryPhoto: (id: number) => Promise<void>;

  // page banners (the "card page-banner" header shown at the top of
  // About/Academics/Admissions/Teachers/Gallery/Contact)
  pageBanners: PageBanners;
  savePageBanner: (pageKey: PageBannerKey, payload: PageBanner) => Promise<void>;

  // news items (Admin > News & Events > News) — powers the "News &
  // Announcements" tab of the public Events & News page.
  newsItems: NewsItem[];
  addNewsItem: (n: Omit<NewsItem, "id">) => Promise<void>;
  updateNewsItem: (id: number, n: Omit<NewsItem, "id">) => Promise<void>;
  deleteNewsItem: (id: number) => Promise<void>;

  // upcoming events (Admin > News & Events > Upcoming Events) — powers the
  // "Upcoming Events" tab of the public Events & News page.
  eventItems: EventItem[];
  addEventItem: (e: Omit<EventItem, "id">) => Promise<void>;
  updateEventItem: (id: number, e: Omit<EventItem, "id">) => Promise<void>;
  deleteEventItem: (id: number) => Promise<void>;

  // unified login — auto-detects role from backend response
  unifiedLogin: (identifier: string, password: string) => Promise<{ ok: boolean; message: string }>;

  // admin auth
  adminUser: string;
  setAdminCredentials: (currentPassword: string, newUsername: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  adminLoggedIn: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;

  // admin panel navigation
  adminView: AdminView;
  setAdminView: (v: AdminView) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const [teachers, setTeachers] = useState<Teacher[]>(DEFAULT_TEACHERS);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [faqs, setFaqsState] = useState<Faq[]>(DEFAULT_FAQS);
  const [site, setSiteState] = useState<SiteContent>(DEFAULT_SITE);
  const [pageBanners, setPageBanners] = useState<PageBanners>(DEFAULT_PAGE_BANNERS);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [eventItems, setEventItems] = useState<EventItem[]>([]);

  const [teacherAccounts, setTeacherAccounts] = useState<TeacherAccount[]>([]);
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<TeacherAccount | null>(null);
  const [teacherLoggedIn, setTeacherLoggedIn] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<StudentAccount | null>(null);
  const [studentLoggedIn, setStudentLoggedIn] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [myReport, setMyReport] = useState<StudentReport | null>(null);

  const [adminUser, setAdminUser] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminView, setAdminView] = useState<AdminView>("dash");

   // ---- initial public data load -------------------------------------------------
  useEffect(() => {
    api
      .get<Teacher[]>("/api/teachers")
      .then((data) => Array.isArray(data) && setTeachers(data))
      .catch((e) => console.error("Failed to load teachers:", e));

    api
      .get<Faq[]>("/api/faqs")
      .then((data) => Array.isArray(data) && setFaqsState(data))
      .catch((e) => console.error("Failed to load FAQs:", e));

    api
      .get<SiteContent>("/api/site")
      .then((data) => {
        if (data && typeof data === "object") {
          setSiteState((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((e) => console.error("Failed to load site content:", e));

    api
      .get<Partial<PageBanners>>("/api/page-banners")
      .then((data) => {
        if (data && typeof data === "object") {
          setPageBanners((prev) => {
            const next = { ...prev };
            (Object.keys(data) as PageBannerKey[]).forEach((key) => {
              const value = data[key];
              if (value) next[key] = value;
            });
            return next;
          });
        }
      })
      .catch((e) => console.error("Failed to load page banners:", e));

    api
      .get<NewsItem[]>("/api/news")
      .then((data) => Array.isArray(data) && setNewsItems(data))
      .catch((e) => console.error("Failed to load news:", e));

    api
      .get<EventItem[]>("/api/events")
      .then((data) => Array.isArray(data) && setEventItems(data))
      .catch((e) => console.error("Failed to load events:", e));
  }, []);
  // ---- restore admin session from a saved token --------------------------------
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    const claims = decodeJwtPayload(token);
    if (claims?.role === "admin") {
      setAdminLoggedIn(true);
      setAdminUser(String(claims.username || ""));
    } else {
      setAdminToken(null);
    }
  }, []);

  // ---- restore teacher session from a saved token ------------------------------
  useEffect(() => {
    const token = getTeacherToken();
    if (!token) return;
    api
      .get<TeacherAccount>("/api/auth/teacher/me", "teacher")
      .then((teacher) => {
        setCurrentTeacher(teacher);
        setTeacherLoggedIn(true);
      })
      .catch(() => setTeacherToken(null));
  }, []);

  // ---- restore student session from a saved token ------------------------------
  useEffect(() => {
    const token = getStudentToken();
    if (!token) return;
    api
      .get<StudentAccount>("/api/auth/student/me", "student")
      .then((student) => {
        setCurrentStudent(student);
        setStudentLoggedIn(true);
      })
      .catch(() => setStudentToken(null));
  }, []);

  // ---- resources: reloaded whenever the logged-in role changes, so a locked
  // preview/download link becomes a real one the moment someone logs in ------
  useEffect(() => {
    const auth = adminLoggedIn ? "admin" : teacherLoggedIn ? "teacher" : studentLoggedIn ? "student" : "none";
    api
      .get<Resource[]>("/api/resources", auth)
      .then((data) => Array.isArray(data) && setResources(data))
      .catch((e) => console.error("Failed to load resources:", e));
  }, [adminLoggedIn, teacherLoggedIn, studentLoggedIn]);

  // ---- admin-only data: fetched whenever an admin session becomes active ------
  useEffect(() => {
    if (!adminLoggedIn) return;
    api
      .get<TeacherAccount[]>("/api/teacher-accounts", "admin")
      .then(setTeacherAccounts)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) logout();
        else console.error("Failed to load teacher accounts:", e);
      });
    api
      .get<StudentApplication[]>("/api/applications", "admin")
      .then(setApplications)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) logout();
        else console.error("Failed to load applications:", e);
      });
    api
      .get<StudentAccount[]>("/api/student-accounts", "admin")
      .then(setStudentAccounts)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) logout();
        else console.error("Failed to load student accounts:", e);
      });
    api
      .get<StudentReport[]>("/api/student-reports", "admin")
      .then((data) => Array.isArray(data) && setStudentReports(data))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) logout();
        else console.error("Failed to load student reports:", e);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminLoggedIn]);

  // ---- student's own report: (re)fetched whenever a student session becomes active ----
  useEffect(() => {
    if (!studentLoggedIn) {
      setMyReport(null);
      return;
    }
    api
      .get<StudentReport | null>("/api/student-reports/mine", "student")
      .then(setMyReport)
      .catch((e) => console.error("Failed to load your report:", e));
  }, [studentLoggedIn]);

  // ------------------------------------------------------------------ TEACHERS --
  const addTeacher = async (t: Omit<Teacher, "id">) => {
    const created = await api.post<Teacher>("/api/teachers", t, "admin");
    setTeachers((prev) => [...prev, created]);
  };

  const deleteTeacher = async (index: number) => {
    const target = teachers[index];
    if (!target) return;
    await api.delete(`/api/teachers/${target.id}`, "admin");
    setTeachers((prev) => prev.filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------- APPLICATIONS --
  const addApplication = (a: StudentApplication) => {
    // Fire-and-forget: any visitor can submit one, no login required. The
    // admin's own applications list is (re)loaded from the server whenever
    // they open the Admin panel, so it doesn't need this local echo.
    api.post("/api/applications", a).catch((e) => console.error("Failed to submit application:", e));
  };

  const deleteApplication = async (id: number) => {
    await api.delete(`/api/applications/${id}`, "admin");
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  // ---------------------------------------------------------------------- FAQS --
  const addFaq = async (f: Faq) => {
    const created = await api.post<Faq>("/api/faqs", f, "admin");
    setFaqsState((prev) => [...prev, created]);
  };

  const deleteFaq = async (index: number) => {
    const target = faqs[index];
    if (!target?.id) return;
    await api.delete(`/api/faqs/${target.id}`, "admin");
    setFaqsState((prev) => prev.filter((_, i) => i !== index));
  };

  // Used by FaqPanel to persist in-place edits to existing questions/answers.
  const setFaqs = (nextFaqs: Faq[]) => {
    nextFaqs.forEach((next, i) => {
      const prev = faqs[i];
      if (prev?.id && (prev.q !== next.q || prev.a !== next.a)) {
        api.put(`/api/faqs/${prev.id}`, { q: next.q, a: next.a }, "admin").catch((e) => console.error("Failed to save FAQ:", e));
      }
    });
    setFaqsState(nextFaqs);
  };

  // --------------------------------------------------------------- SITE CONTENT --
  // Local-only update (no network call) — used for live-editing a draft
  // before "Save" is pressed. Never hits the API by itself.
  const setSite = (updater: SiteContent | ((prev: SiteContent) => SiteContent)) => {
    setSiteState((prev) => (typeof updater === "function" ? (updater as (p: SiteContent) => SiteContent)(prev) : updater));
  };

  // Persists to PUT /api/site/registration (admin-only) and updates local
  // state from the server's response, mirroring saveSiteSection's pattern.
  const updateRegistrationSettings = async (payload: Partial<RegistrationSettings>) => {
    const next = { ...site.registrationSettings, ...payload };
    // Optimistic local update so the checkbox feels instant...
    setSiteState((prev) => ({ ...prev, registrationSettings: next }));
    try {
      await api.put<SiteContent>("/api/site/registration", next, "admin");
    } catch (e) {
      // ...rolled back if the save actually failed server-side.
      setSiteState((prev) => ({ ...prev, registrationSettings: site.registrationSettings }));
      throw e;
    }
  };

  // Persists ONE section to its OWN endpoint (/api/site/:section), sending
  // ONLY that section's own fields — never the full site object. This is
  // the real isolation boundary: each section panel calls this with its own
  // section name and its own payload, so a Home save can only ever hit
  // PUT /api/site/home, an About save can only ever hit PUT /api/site/about,
  // etc. The backend route for each section is likewise hard-wired to only
  // touch that section's own columns/tables (see server/src/routes/siteRoutes.js).
  const saveSiteSection = async (
    section: "home" | "about" | "academics" | "gallery" | "contact",
    payload: Partial<SiteContent>
  ) => {
    const saved = await api.put<SiteContent>(`/api/site/${section}`, payload, "admin");
    setSiteState((prev) => ({ ...prev, ...saved }));
  };

  // Adds ONE new gallery photo (POST /api/site/gallery). Only appends the
  // returned row to local state — every other photo is left untouched.
  const addGalleryPhoto = async (photo: { img: string; cap: string }) => {
    const saved = await api.post<GalleryItem>("/api/site/gallery", photo, "admin");
    setSiteState((prev) => ({ ...prev, gallery: [...prev.gallery, saved] }));
  };

  // Updates ONE existing gallery photo by id (PUT /api/site/gallery/:id).
  // Only that photo's entry in local state is replaced.
  const updateGalleryPhoto = async (id: number, photo: { img: string; cap: string }) => {
    const saved = await api.put<GalleryItem>(`/api/site/gallery/${id}`, photo, "admin");
    setSiteState((prev) => ({ ...prev, gallery: prev.gallery.map((g) => (g.id === id ? saved : g)) }));
  };

  // Deletes ONE gallery photo by id (DELETE /api/site/gallery/:id). Only
  // that photo is removed from local state.
  const deleteGalleryPhoto = async (id: number) => {
    await api.delete(`/api/site/gallery/${id}`, "admin");
    setSiteState((prev) => ({ ...prev, gallery: prev.gallery.filter((g) => g.id !== id) }));
  };

  // Persists ONE page's banner to its OWN endpoint (/api/page-banners/:pageKey).
  // Selecting a different page in the admin UI simply changes which key this
  // is called with — it can never write to another page's banner.
  const savePageBanner = async (pageKey: PageBannerKey, payload: PageBanner) => {
    const saved = await api.put<PageBanner>(`/api/page-banners/${pageKey}`, payload, "admin");
    setPageBanners((prev) => ({ ...prev, [pageKey]: saved }));
  };

  // ---------------------------------------------------------------- NEWS ITEMS --
  const addNewsItem = async (n: Omit<NewsItem, "id">) => {
    const created = await api.post<NewsItem>("/api/news", n, "admin");
    setNewsItems((prev) => [created, ...prev]);
  };

  const updateNewsItem = async (id: number, n: Omit<NewsItem, "id">) => {
    const saved = await api.put<NewsItem>(`/api/news/${id}`, n, "admin");
    setNewsItems((prev) => prev.map((item) => (item.id === id ? saved : item)));
  };

  const deleteNewsItem = async (id: number) => {
    await api.delete(`/api/news/${id}`, "admin");
    setNewsItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ------------------------------------------------------------ UPCOMING EVENTS --
  const addEventItem = async (ev: Omit<EventItem, "id">) => {
    const created = await api.post<EventItem>("/api/events", ev, "admin");
    setEventItems((prev) => [...prev, created]);
  };

  const updateEventItem = async (id: number, ev: Omit<EventItem, "id">) => {
    const saved = await api.put<EventItem>(`/api/events/${id}`, ev, "admin");
    setEventItems((prev) => prev.map((item) => (item.id === id ? saved : item)));
  };

  const deleteEventItem = async (id: number) => {
    await api.delete(`/api/events/${id}`, "admin");
    setEventItems((prev) => prev.filter((item) => item.id !== id));
  };

  // -------------------------------------------------------------- TEACHER AUTH --
  const createTeacherAccount = async (data: { fullName: string; email: string; password: string; subject: string }) => {
    try {
      const created = await api.post<TeacherAccount>("/api/teacher-accounts", data, "admin");
      setTeacherAccounts((prev) => [created, ...prev]);
      return { ok: true, message: "Account created successfully." };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  // Public self-registration — accepted only while an admin has turned this
  // on via Settings > Self-Registration; enforced server-side too, so this
  // will fail with a clear message even if someone bypasses the UI toggle.
  // The new account starts "pending" in the database; it is NOT added to
  // local `teacherAccounts` state here (this call can happen on the public
  // site with no admin session) — an admin will see it next time they open
  // Teacher Accounts, which re-fetches from the server.
  const teacherSelfRegister = async (data: { fullName: string; email: string; password: string; subject: string }) => {
    try {
      const res = await api.post<{ message: string }>("/api/auth/teacher/register", data);
      return { ok: true, message: res.message };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  const activateTeacherAccount = async (id: number) => {
    await api.patch(`/api/teacher-accounts/${id}/activate`, undefined, "admin");
    setTeacherAccounts((prev) => prev.map((t) => (t.id === id ? { ...t, status: "active" } : t)));
  };

  const deactivateTeacherAccount = async (id: number) => {
    await api.patch(`/api/teacher-accounts/${id}/deactivate`, undefined, "admin");
    setTeacherAccounts((prev) => prev.map((t) => (t.id === id ? { ...t, status: "deactivated" } : t)));
  };

  const deleteTeacherAccount = async (id: number) => {
    await api.delete(`/api/teacher-accounts/${id}`, "admin");
    setTeacherAccounts((prev) => prev.filter((t) => t.id !== id));
  };

  // -------------------------------------------------------------- STUDENT ACCOUNTS (admin report) --
  // Used by the admin's Students report screen: re-fetches with the class /
  // sort / search the admin picked, so "generate report" always reflects
  // exactly what's on screen.
  const fetchStudentAccounts = async (params?: { schoolClass?: string; sort?: string; order?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.schoolClass && params.schoolClass !== "all") qs.set("class", params.schoolClass);
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.order) qs.set("order", params.order);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    try {
      const data = await api.get<StudentAccount[]>(`/api/student-accounts${query ? `?${query}` : ""}`, "admin");
      setStudentAccounts(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) logout();
      else console.error("Failed to load student accounts:", e);
    }
  };

  const activateStudentAccount = async (id: number) => {
    await api.patch(`/api/student-accounts/${id}/activate`, undefined, "admin");
    setStudentAccounts((prev) => prev.map((s) => (s.id === id ? { ...s, status: "active" } : s)));
  };

  const deactivateStudentAccount = async (id: number) => {
    await api.patch(`/api/student-accounts/${id}/deactivate`, undefined, "admin");
    setStudentAccounts((prev) => prev.map((s) => (s.id === id ? { ...s, status: "deactivated" } : s)));
  };

  // --------------------------------------------------------- UNIFIED LOGIN --
  const unifiedLogin = async (identifier: string, password: string) => {
    try {
      const res = await api.post<{
        role: "admin" | "teacher" | "student";
        token: string;
        username?: string;
        teacher?: TeacherAccount;
        student?: StudentAccount;
      }>("/api/auth/login", { email: identifier, password });

      if (res.role === "admin") {
        setAdminToken(res.token);
        setAdminUser(res.username ?? "");
        setAdminLoggedIn(true);
        setAdminView("dash");
      } else if (res.role === "teacher" && res.teacher) {
        setTeacherToken(res.token);
        setCurrentTeacher(res.teacher);
        setTeacherLoggedIn(true);
      } else if (res.role === "student" && res.student) {
        setStudentToken(res.token);
        setCurrentStudent(res.student);
        setStudentLoggedIn(true);
      }
      return { ok: true, message: "Welcome!" };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  const teacherLogin = async (email: string, password: string) => {
    try {
      const res = await api.post<{ token: string; teacher: TeacherAccount }>("/api/auth/teacher/login", { email, password });
      setTeacherToken(res.token);
      setCurrentTeacher(res.teacher);
      setTeacherLoggedIn(true);
      return { ok: true, message: "Welcome back!" };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  const teacherLogout = () => {
    setTeacherToken(null);
    setTeacherLoggedIn(false);
    setCurrentTeacher(null);
  };

  const updateTeacherPassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await api.put<{ message: string }>("/api/auth/teacher/password", { currentPassword, newPassword }, "teacher");
      return { ok: true, message: res.message };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  // -------------------------------------------------------------- STUDENT AUTH --
  const createStudentAccount = async (data: { fullName: string; email: string; password: string; schoolClass: string }) => {
    try {
      const created = await api.post<StudentAccount>("/api/student-accounts", data, "admin");
      setStudentAccounts((prev) => [created, ...prev]);
      return { ok: true, message: "Account created successfully." };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  // Public self-registration — same pattern as teacherSelfRegister above.
  const studentSelfRegister = async (data: { fullName: string; email: string; password: string; schoolClass: string }) => {
    try {
      const res = await api.post<{ message: string }>("/api/auth/student/register", data);
      return { ok: true, message: res.message };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  const deleteStudentAccount = async (id: number) => {
    await api.delete(`/api/student-accounts/${id}`, "admin");
    setStudentAccounts((prev) => prev.filter((s) => s.id !== id));
  };

  const studentLogin = async (email: string, password: string) => {
    try {
      const res = await api.post<{ token: string; student: StudentAccount }>("/api/auth/student/login", { email, password });
      setStudentToken(res.token);
      setCurrentStudent(res.student);
      setStudentLoggedIn(true);
      return { ok: true, message: "Welcome back!" };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  const studentLogout = () => {
    setStudentToken(null);
    setStudentLoggedIn(false);
    setCurrentStudent(null);
  };

  const updateStudentPassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await api.put<{ message: string }>("/api/auth/student/password", { currentPassword, newPassword }, "student");
      return { ok: true, message: res.message };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  // ---------------------------------------------------------------------- RESOURCES --
  const addResource = async (r: Omit<Resource, "id" | "createdAt">) => {
    const created = await api.post<Resource>("/api/resources", r, "teacher");
    setResources((prev) => [created, ...prev]);
  };

  const deleteResource = async (id: number) => {
    await api.delete(`/api/resources/${id}`, adminLoggedIn ? "admin" : "teacher");
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  // ---------------------------------------------------------------- STUDENT REPORTS --
  const fetchStudentReports = async () => {
    try {
      const data = await api.get<StudentReport[]>("/api/student-reports", "admin");
      setStudentReports(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) logout();
      else console.error("Failed to load student reports:", e);
    }
  };

  const uploadStudentReports = async (data: { studentIds: number[]; title?: string; fileData: string; fileName: string | null }) => {
    const saved = await api.post<StudentReport[]>("/api/student-reports", data, "admin");
    setStudentReports((prev) => {
      const byId = new Map(prev.map((r) => [r.studentId, r]));
      saved.forEach((r) => byId.set(r.studentId, r));
      return Array.from(byId.values());
    });
  };

  const deleteStudentReport = async (studentId: number) => {
    await api.delete(`/api/student-reports/${studentId}`, "admin");
    setStudentReports((prev) => prev.filter((r) => r.studentId !== studentId));
  };

  const fetchMyReport = async () => {
    try {
      const data = await api.get<StudentReport | null>("/api/student-reports/mine", "student");
      setMyReport(data);
    } catch (e) {
      console.error("Failed to load your report:", e);
    }
  };

  // ------------------------------------------------------------------ ADMIN AUTH --
  const login = async (user: string, pass: string) => {
    try {
      const res = await api.post<{ token: string; username: string }>("/api/auth/admin/login", { username: user, password: pass });
      setAdminToken(res.token);
      setAdminUser(res.username);
      setAdminLoggedIn(true);
      setAdminView("dash");
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setAdminToken(null);
    setAdminLoggedIn(false);
  };

  const setAdminCredentials = async (currentPassword: string, newUsername: string, newPassword: string) => {
    try {
      const res = await api.put<{ token: string; username: string }>(
        "/api/auth/admin/credentials",
        { currentPassword, username: newUsername || undefined, password: newPassword || undefined },
        "admin"
      );
      setAdminToken(res.token);
      setAdminUser(res.username);
      return { ok: true, message: "Security settings updated." };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Something went wrong. Please try again." };
    }
  };

  const value: AppContextValue = {
    theme,
    toggleTheme,
    teachers,
    addTeacher,
    deleteTeacher,
    teacherAccounts,
    createTeacherAccount,
    activateTeacherAccount,
    deactivateTeacherAccount,
    deleteTeacherAccount,
    teacherSelfRegister,
    teacherLoggedIn,
    currentTeacher,
    teacherLogin,
    teacherLogout,
    updateTeacherPassword,
    studentAccounts,
    fetchStudentAccounts,
    createStudentAccount,
    activateStudentAccount,
    deactivateStudentAccount,
    deleteStudentAccount,
    studentSelfRegister,
    studentLoggedIn,
    currentStudent,
    studentLogin,
    studentLogout,
    updateStudentPassword,
    resources,
    addResource,
    deleteResource,
    studentReports,
    fetchStudentReports,
    uploadStudentReports,
    deleteStudentReport,
    myReport,
    fetchMyReport,
    applications,
    addApplication,
    deleteApplication,
    faqs,
    setFaqs,
    addFaq,
    deleteFaq,
    site,
    setSite,
    saveSiteSection,
    updateRegistrationSettings,
    addGalleryPhoto,
    updateGalleryPhoto,
    deleteGalleryPhoto,
    pageBanners,
    savePageBanner,
    newsItems,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
    eventItems,
    addEventItem,
    updateEventItem,
    deleteEventItem,
    adminUser,
    setAdminCredentials,
    adminLoggedIn,
    login,
    logout,
    unifiedLogin,
    adminView,
    setAdminView,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
