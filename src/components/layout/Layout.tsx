import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingActions from "./FloatingActions";
import UnifiedLogin from "../auth/UnifiedLogin";
import StudentAuth from "../student/StudentAuth";
import TeacherAuth from "../teacher/TeacherAuth";
import AdminShell from "../admin/AdminShell";
import TeacherShell from "../teacher/TeacherShell";
import StudentShell from "../student/StudentShell";

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

      {/* Single login modal — shown whenever no session is active */}
      <UnifiedLogin
        open={loginOpen && !anyLoggedIn}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
        onOpenRegister={openRegister}
      />

      {/* Self-registration modals — opened from the login modal when an admin
          has enabled that role's self-registration. */}
      <StudentAuth
        open={registerRole === "student"}
        initialMode="register"
        onClose={() => setRegisterRole(null)}
        onSuccess={() => setRegisterRole(null)}
      />
      <TeacherAuth
        open={registerRole === "teacher"}
        initialMode="register"
        onClose={() => setRegisterRole(null)}
        onSuccess={() => setRegisterRole(null)}
      />

      <AdminShell
        open={adminLoggedIn}
        onExit={() => {
          logout();
          setLoginOpen(false);
        }}
      />

      <TeacherShell
        open={teacherLoggedIn}
        onExit={() => {
          teacherLogout();
          setLoginOpen(false);
        }}
      />

      <StudentShell
        open={studentLoggedIn}
        onExit={() => {
          studentLogout();
          setLoginOpen(false);
        }}
      />
    </>
  );
}
