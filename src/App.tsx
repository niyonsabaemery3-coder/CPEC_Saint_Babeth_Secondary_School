import { useState } from "react";
import { useApp } from "./context/AppContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import FloatingActions from "./components/layout/FloatingActions";
import Hero from "./components/sections/Hero";
import About from "./components/sections/About";
import Academics from "./components/sections/Academics";
import Teachers from "./components/sections/Teachers";
import Resources from "./components/sections/Resources";
import Gallery from "./components/sections/Gallery";
import Apply from "./components/sections/Apply";
import Contact from "./components/sections/Contact";
import AdminLogin from "./components/admin/AdminLogin";
import AdminShell from "./components/admin/AdminShell";
import TeacherAuth from "./components/teacher/TeacherAuth";
import TeacherShell from "./components/teacher/TeacherShell";

export default function App() {
  const { adminLoggedIn, logout, teacherLoggedIn, teacherLogout } = useApp();
  const [loginOpen, setLoginOpen] = useState(false);
  const [teacherAuthOpen, setTeacherAuthOpen] = useState(false);

  return (
    <>
      <div className="page">
        <Navbar />
        <Hero />
        <About />
        <Academics />
        <Teachers />
        <Resources />
        <Gallery />
        <Apply />
        <Contact />
        <Footer
          onOpenAdminLogin={() => setLoginOpen(true)}
          onOpenTeacherAuth={() => setTeacherAuthOpen(true)}
        />
      </div>

      <FloatingActions />

      <AdminLogin
        open={loginOpen && !adminLoggedIn}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
      />

      <AdminShell
        open={adminLoggedIn}
        onExit={() => {
          logout();
          setLoginOpen(false);
        }}
      />

      <TeacherAuth
        open={teacherAuthOpen && !teacherLoggedIn}
        onClose={() => setTeacherAuthOpen(false)}
        onSuccess={() => setTeacherAuthOpen(false)}
      />

      <TeacherShell
        open={teacherLoggedIn}
        onExit={() => {
          teacherLogout();
          setTeacherAuthOpen(false);
        }}
      />
    </>
  );
}
