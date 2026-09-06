import { useRef, useState } from "react";
import logo from "../../assets/logo-navbar.webp";
import { useApp } from "../../context/AppContext";
import type { StudentView } from "../../types";
import StudentDashboardView from "./views/StudentDashboardView";
import StudentResourcesView from "./views/StudentResourcesView";
import StudentReportsView from "./views/StudentReportsView";
import StudentProfileView from "./views/StudentProfileView";
import ProfileDropdown from "../shared/ProfileDropdown";
import { useNotifications } from "../../hooks/useNotifications";

const NAV: { key: StudentView; icon: string; label: string }[] = [
  { key: "home",      icon: "fa-house",        label: "Home"        },
  { key: "resources", icon: "fa-folder-open",  label: "Resources"   },
  { key: "reports",   icon: "fa-file-medical", label: "My Reports"  },
];

const TITLES: Record<StudentView, string> = {
  home:      "Dashboard",
  resources: "Learning Resources",
  reports:   "My Reports",
  profile:   "My Profile",
};

interface StudentShellProps {
  open: boolean;
  onExit: () => void;
}

export default function StudentShell({ open, onExit }: StudentShellProps) {
  const { currentStudent, studentLogout } = useApp();
  const [view, setView] = useState<StudentView>("home");
  const prevView = useRef<StudentView>("home");

  const { unreadCount, markAllRead } = useNotifications(
    `notifs-student-${currentStudent?.id ?? "x"}`
  );

  if (!currentStudent) return null;

  const goToProfile = () => {
    if (view !== "profile") prevView.current = view;
    setView("profile");
  };
  const goBack = () => setView(prevView.current);
  const handleLogout = () => { studentLogout(); onExit(); };
  const isProfile = view === "profile";

  const handleBellClick = () => {
    setView("home");
    markAllRead();
  };

  return (
    <div className={`t-shell ${open ? "open" : ""}`} style={{ display: open ? "flex" : "none" }}>
      <aside className="t-shell-sidebar">
        <div className="a-brand">
          <img src={logo} alt="logo" />
          <span>Student Panel</span>
        </div>

        {NAV.map((n) => (
          <button
            key={n.key}
            className={`t-nav-item ${view === n.key ? "active" : ""}`}
            onClick={() => setView(n.key)}
          >
            <i className={`fa-solid ${n.icon}`} />
            {n.label}
            {n.key === "home" && unreadCount > 0 && (
              <span className="t-nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
        ))}

        <button className="t-nav-item t-logout" onClick={handleLogout}>
          <i className="fa-solid fa-arrow-right-from-bracket" /> Log Out
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <div>
            {isProfile && (
              <button className="shell-back-btn" onClick={goBack}>
                <i className="fa-solid fa-arrow-left" /> {TITLES[prevView.current]}
              </button>
            )}
            <h2>{TITLES[view]}</h2>
            <p>Welcome, {currentStudent.fullName} — {currentStudent.schoolClass}</p>
          </div>

          <div className="admin-top-actions">
            {!isProfile && (
              <button
                className="shell-bell-btn"
                onClick={handleBellClick}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                title="Notifications"
              >
                <i className="fa-solid fa-bell" />
                {unreadCount > 0 && (
                  <span className="shell-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
            )}
            {!isProfile && (
              <button className="a-add-btn" onClick={onExit}>
                <i className="fa-solid fa-arrow-left" /> Back to website
              </button>
            )}
            <ProfileDropdown
              name={currentStudent.fullName}
              role={currentStudent.schoolClass}
              onLogout={handleLogout}
              onProfile={goToProfile}
            />
          </div>
        </div>

        {view === "home"      && <StudentDashboardView onNavigate={(v) => setView(v)} />}
        {view === "resources" && <StudentResourcesView />}
        {view === "reports"   && <StudentReportsView />}
        {view === "profile"   && <StudentProfileView />}
      </main>

      <div className="t-bottom-tabs">
        {NAV.map((n) => (
          <button key={n.key} className={view === n.key ? "active" : ""} onClick={() => setView(n.key)}>
            <span className="ti">
              <i className={`fa-solid ${n.icon}`} />
              {n.key === "home" && unreadCount > 0 && (
                <span className="t-tab-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
