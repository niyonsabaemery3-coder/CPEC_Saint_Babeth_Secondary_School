import { Suspense, lazy, useState } from "react";
import { Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingActions from "./FloatingActions";

// These are only ever needed once someone actually opens a login/register
// modal or is signed in to a portal — never on a plain public-page visit.
// Lazy-loading them keeps the Admin/Teacher/Student dashboards (and the
// login/register forms) completely out of the JS every homepage visitor
// downloads; the chunk is only fetched the moment it's actually rendered.
const UnifiedLogin = lazy(() => import("../auth/UnifiedLogin"));
const StudentAuth = lazy(() => import("../student/StudentAuth"));
const TeacherAuth = lazy(() => import("../teacher/TeacherAuth"));
const AdminShell = lazy(() => import("../admin/AdminShell"));
const TeacherShell = lazy(() => import("../teacher/TeacherShell"));
const StudentShell = lazy(() => import("../student/StudentShell"));

export interface LayoutContext {
  onOpenLogin: () => void;
  onOpenRegister: (role: "student" | "teacher") => void;
}

export default function Layout() {
  const {
    adminLoggedIn, logout,
    teacherLoggedIn, teacherLogout,
    studentLoggedIn, studentLogout,
  } = useApp();

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerRole, setRegisterRole] = useState<"student" | "teacher" | null>(null);
  const anyLoggedIn = adminLoggedIn || teacherLoggedIn || studentLoggedIn;

  const openRegister = (role: "student" | "teacher") => {
    setLoginOpen(false);
    setRegisterRole(role);
  };

  return (
    <>
      <div className="page">
        <Navbar onOpenLogin={() => setLoginOpen(true)} />

        <Outlet context={{ onOpenLogin: () => setLoginOpen(true), onOpenRegister: openRegister }} />

        <Footer onOpenLogin={() => setLoginOpen(true)} />
      </div>

      <FloatingActions />

      {/* Single login modal — only mounted (and only fetched) once a visitor
          actually clicks "Login" and no session is already active. */}
      {loginOpen && !anyLoggedIn && (
        <Suspense fallback={null}>
          <UnifiedLogin
            open
            onClose={() => setLoginOpen(false)}
            onSuccess={() => setLoginOpen(false)}
            onOpenRegister={openRegister}
          />
        </Suspense>
      )}

      {/* Self-registration modals — opened from the login modal when an admin
          has enabled that role's self-registration. Only mounted while open. */}
      {registerRole === "student" && (
        <Suspense fallback={null}>
          <StudentAuth
            open
            initialMode="register"
            onClose={() => setRegisterRole(null)}
            onSuccess={() => setRegisterRole(null)}
          />
        </Suspense>
      )}
      {registerRole === "teacher" && (
        <Suspense fallback={null}>
          <TeacherAuth
            open
            initialMode="register"
            onClose={() => setRegisterRole(null)}
            onSuccess={() => setRegisterRole(null)}
          />
        </Suspense>
      )}

      {/* Portal shells — each one (and its own admin/teacher/student views)
          is only fetched once that role actually has an active session. */}
      {adminLoggedIn && (
        <Suspense fallback={null}>
          <AdminShell
            open={adminLoggedIn}
            onExit={() => {
              logout();
              setLoginOpen(false);
            }}
          />
        </Suspense>
      )}

      {teacherLoggedIn && (
        <Suspense fallback={null}>
          <TeacherShell
            open={teacherLoggedIn}
            onExit={() => {
              teacherLogout();
              setLoginOpen(false);
            }}
          />
        </Suspense>
      )}

      {studentLoggedIn && (
        <Suspense fallback={null}>
          <StudentShell
            open={studentLoggedIn}
            onExit={() => {
              studentLogout();
              setLoginOpen(false);
            }}
          />
        </Suspense>
      )}
    </>
  );
}
