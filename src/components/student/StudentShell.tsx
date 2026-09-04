import { useState } from "react";
import logo from "../../assets/logo-navbar.png";
import { useApp } from "../../context/AppContext";
import type { StudentView } from "../../types";
import StudentResourcesView from "./views/StudentResourcesView";
import StudentReportsView from "./views/StudentReportsView";
import StudentProfileView from "./views/StudentProfileView";

// Keep this list short (2–5 items) so the panel stays scannable on desktop
// and fits comfortably as a bottom tab bar on mobile devices.
const NAV: { key: StudentView; icon: string; label: string }[] = [
  { key: "resources", icon: "fa-folder-open", label: "Resources" },
  { key: "reports", icon: "fa-file-medical", label: "My Reports" },
  { key: "profile", icon: "fa-user", label: "Profile" },
];

const TITLES: Record<StudentView, string> = {
  resources: "Learning Resources",
  reports: "My Reports",
  profile: "My Profile",
};

interface StudentShellProps {
  open: boolean;
  onExit: () => void;
}

export default function StudentShell({ open, onExit }: StudentShellProps) {
  const { currentStudent } = useApp();
  const [view, setView] = useState<StudentView>("resources");

  if (!currentStudent) return null;

  return (
    <div className={`t-shell ${open ? "open" : ""}`} style={{ display: open ? "flex" : "none" }}>
      <aside className="t-shell-sidebar">
        <div className="a-brand">
          <img src={logo} alt="logo" />
          <span>Student Panel</span>
        </div>
        {NAV.map((n) => (
          <button key={n.key} className={`t-nav-item ${view === n.key ? "active" : ""}`} onClick={() => setView(n.key)}>
            <i className={`fa-solid ${n.icon}`} /> {n.label}
          </button>
        ))}
        <button className="t-nav-item t-logout" onClick={onExit}>
          <i className="fa-solid fa-arrow-right-from-bracket" /> Log Out
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <div>
            <h2>{TITLES[view]}</h2>
            <p>
              Welcome, {currentStudent.fullName} — {currentStudent.schoolClass}
            </p>
          </div>
          <button className="a-add-btn" onClick={onExit}>
            <i className="fa-solid fa-arrow-left" /> Back to website
          </button>
        </div>

        {view === "resources" && <StudentResourcesView />}
        {view === "reports" && <StudentReportsView />}
        {view === "profile" && <StudentProfileView />}
      </main>

      <div className="t-bottom-tabs">
        {NAV.map((n) => (
          <button key={n.key} className={view === n.key ? "active" : ""} onClick={() => setView(n.key)}>
            <span className="ti">
              <i className={`fa-solid ${n.icon}`} />
            </span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
