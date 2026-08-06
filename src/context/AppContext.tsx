import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  Teacher,
  StudentApplication,
  Faq,
  SiteContent,
  AdminView,
  Theme,
  TeacherAccount,
  Resource,
} from "../types";
import {
  api,
  ApiError,
  getAdminToken,
  setAdminToken,
  getTeacherToken,
  setTeacherToken,
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

const DEFAULT_SITE: SiteContent = {
  heroImg: `${import.meta.env.BASE_URL}images/hero-styled.png`,
  heroMain: "CPEC Saint Babeth",
  heroAccent: "Secondary School",
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
    "CPEC Saint Babeth Secondary School is based in Byumba, Rwanda, offering lower secondary education (S1–S3) alongside specialised technology training. Our mission is to nurture disciplined, skilled and principled young people ready for the modern world.",
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
};

interface AppContextValue {
  // theme
  theme: Theme;
  toggleTheme: () => void;

  // teachers (public directory shown on the Teachers section)
  teachers: Teacher[];
  addTeacher: (t: Omit<Teacher, "id">) => Promise<void>;
  deleteTeacher: (index: number) => Promise<void>;

  // teacher accounts (login/register + admin approval)
  teacherAccounts: TeacherAccount[];
  registerTeacherAccount: (data: { fullName: string; email: string; password: string; subject: string }) => Promise<{ ok: boolean; message: string }>;
  activateTeacherAccount: (id: number) => Promise<void>;
  deactivateTeacherAccount: (id: number) => Promise<void>;
  teacherLoggedIn: boolean;
  currentTeacher: TeacherAccount | null;
  teacherLogin: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  teacherLogout: () => void;
  updateTeacherPassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;

  // resources (Notes / Presentations / Past Papers)
  resources: Resource[];
  addResource: (r: Omit<Resource, "id" | "createdAt">) => Promise<void>;
  deleteResource: (id: number) => Promise<void>;

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

  const [teacherAccounts, setTeacherAccounts] = useState<TeacherAccount[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<TeacherAccount | null>(null);
  const [teacherLoggedIn, setTeacherLoggedIn] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);

  const [adminUser, setAdminUser] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminView, setAdminView] = useState<AdminView>("dash");

  // ---- initial public data load -------------------------------------------------
  useEffect(() => {
    api.get<Teacher[]>("/api/teachers").then(setTeachers).catch((e) => console.error("Failed to load teachers:", e));
    api.get<Resource[]>("/api/resources").then(setResources).catch((e) => console.error("Failed to load resources:", e));
    api.get<Faq[]>("/api/faqs").then(setFaqsState).catch((e) => console.error("Failed to load FAQs:", e));
    api.get<SiteContent>("/api/site").then(setSiteState).catch((e) => console.error("Failed to load site content:", e));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminLoggedIn]);

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
  const setSite = (updater: SiteContent | ((prev: SiteContent) => SiteContent)) => {
    setSiteState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: SiteContent) => SiteContent)(prev) : updater;
      api
        .put<SiteContent>("/api/site", next, "admin")
        .then((saved) => setSiteState(saved))
        .catch((e) => console.error("Failed to save site content:", e));
      return next; // optimistic — overwritten by the server's response moments later
    });
  };

  // -------------------------------------------------------------- TEACHER AUTH --
  const registerTeacherAccount = async (data: { fullName: string; email: string; password: string; subject: string }) => {
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

  // ---------------------------------------------------------------------- RESOURCES --
  const addResource = async (r: Omit<Resource, "id" | "createdAt">) => {
    const created = await api.post<Resource>("/api/resources", r, "teacher");
    setResources((prev) => [created, ...prev]);
  };

  const deleteResource = async (id: number) => {
    await api.delete(`/api/resources/${id}`, adminLoggedIn ? "admin" : "teacher");
    setResources((prev) => prev.filter((r) => r.id !== id));
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
    registerTeacherAccount,
    activateTeacherAccount,
    deactivateTeacherAccount,
    teacherLoggedIn,
    currentTeacher,
    teacherLogin,
    teacherLogout,
    updateTeacherPassword,
    resources,
    addResource,
    deleteResource,
    applications,
    addApplication,
    deleteApplication,
    faqs,
    setFaqs,
    addFaq,
    deleteFaq,
    site,
    setSite,
    adminUser,
    setAdminCredentials,
    adminLoggedIn,
    login,
    logout,
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
