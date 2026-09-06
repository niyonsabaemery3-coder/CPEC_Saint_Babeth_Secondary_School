import { useRef } from "react";
import logo from "../../assets/logo-navbar.webp";
import { useApp } from "../../context/AppContext";
import type { AdminView } from "../../types";
import DashboardView from "./views/DashboardView";
import ApplicationsView from "./views/ApplicationsView";
import TeachersView from "./views/TeachersView";
import StudentsView from "./views/StudentsView";
import NewsEventsView from "./views/NewsEventsView";
import SettingsView from "./views/SettingsView";
import AdminProfileView from "./views/AdminProfileView";
import ProfileDropdown from "../shared/ProfileDropdown";

const NAV: { key: AdminView; icon: string; label: string }[] = [
  { key: "dash",       icon: "fa-gauge-high",      label: "Dashboard"     },
  { key: "apps",       icon: "fa-file-lines",       label: "Applications"  },
  { key: "teach",      icon: "fa-chalkboard-user",  label: "Team"          },
  { key: "students",   icon: "fa-user-graduate",    label: "Students"      },
  { key: "newsEvents", icon: "fa-calendar-days",    label: "News & Events" },
  { key: "settings",   icon: "fa-gear",             label: "Settings"      },
];

const TITLES: Record<AdminView, string> = {
  dash:       "Dashboard",
  apps:       "Applications",
  teach:      "Team",
  students:   "Students",
  newsEvents: "News & Events",
  settings:   "Settings",
  profile:    "My Profile",
};

interface AdminShellProps {
  open: boolean;
  onExit: () => void;
}

export default function AdminShell({ open, onExit }: AdminShellProps) {
  const { adminView, setAdminView, adminUser, logout } = useApp();

  // Remember which view was active before opening Profile so we can go back
  const prevView = useRef<AdminView>("dash");

  const goToProfile = () => {
    if (adminView !== "profile") prevView.current = adminView;
    setAdminView("profile");
  };

  const goBack = () => setAdminView(prevView.current);

  const handleLogout = () => {
    logout();
    onExit();
  };

  const isProfile = adminView === "profile";

  return (
    <div className={`admin-shell ${open ? "open" : ""}`}>
      <aside className="admin-sidebar">
        <div className="a-brand">
          <img src={logo} alt="logo" />
          <span>Admin Panel</span>
        </div>

        {NAV.map((n) => (
          <button
            key={n.key}
            className={`a-nav-item ${adminView === n.key ? "active" : ""}`}
            onClick={() => setAdminView(n.key)}
          >
            <span><i className={`fa-solid ${n.icon}`} /></span>{" "}
            {n.label}
          </button>
        ))}

        <button className="a-nav-item a-logout" onClick={handleLogout}>
          <span><i className="fa-solid fa-arrow-right-from-bracket" /></span>{" "}
          Log Out
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <div>
            {/* Back breadcrumb — only visible on the Profile view */}
            {isProfile && (
              <button className="shell-back-btn" onClick={goBack}>
                <i className="fa-solid fa-arrow-left" /> {TITLES[prevView.current]}
              </button>
            )}
            <h2>{TITLES[adminView]}</h2>
            <p>Welcome back, {adminUser || "Admin"} — you have full access to this system.</p>
          </div>

          <div className="admin-top-actions">
            {!isProfile && (
              <button className="a-add-btn" onClick={onExit}>
                <i className="fa-solid fa-arrow-left" /> Back to website
              </button>
            )}
            <ProfileDropdown
              name={adminUser || "Admin"}
              role="Administrator"
              onLogout={handleLogout}
              onProfile={goToProfile}
            />
          </div>
        </div>

        {adminView === "dash"       && <DashboardView />}
        {adminView === "apps"       && <ApplicationsView />}
        {adminView === "teach"      && <TeachersView />}
        {adminView === "students"   && <StudentsView />}
        {adminView === "newsEvents" && <NewsEventsView />}
        {adminView === "settings"   && <SettingsView onGoToTeachers={() => setAdminView("teach")} />}
        {adminView === "profile"    && <AdminProfileView />}
      </main>

      <div className="a-bottom-tabs">
        {NAV.map((n) => (
          <button key={n.key} className={adminView === n.key ? "active" : ""} onClick={() => setAdminView(n.key)}>
            <span className="ti"><i className={`fa-solid ${n.icon}`} /></span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
