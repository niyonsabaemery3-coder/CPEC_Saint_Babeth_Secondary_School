import { useRef, useState } from "react";
import logo from "../../assets/logo-navbar.webp";
import { useApp } from "../../context/AppContext";
import type { TeacherView } from "../../types";
import TeacherDashboardView from "./views/TeacherDashboardView";
import MyResourcesView from "./views/MyResourcesView";
import AddResourceView from "./views/AddResourceView";
import TeacherProfileView from "./views/TeacherProfileView";
import TeacherSettingsView from "./views/TeacherSettingsView";
import ProfileDropdown from "../shared/ProfileDropdown";
import { useNotifications } from "../../hooks/useNotifications";

const NAV: { key: TeacherView; icon: string; label: string }[] = [
  { key: "home",      icon: "fa-house",         label: "Home"         },
  { key: "resources", icon: "fa-folder-open",   label: "My Resources" },
  { key: "add",       icon: "fa-circle-plus",   label: "Add Resource" },
  { key: "settings",  icon: "fa-gear",          label: "Settings"     },
];

const TITLES: Record<TeacherView, string> = {
  home:      "Dashboard",
  resources: "My Resources",
  add:       "Add New Resource",
  profile:   "My Profile",
  settings:  "Settings",
};

interface TeacherShellProps {
  open: boolean;
  onExit: () => void;
}

export default function TeacherShell({ open, onExit }: TeacherShellProps) {
  const { currentTeacher, teacherLogout } = useApp();
  const [view, setView] = useState<TeacherView>("home");
  const prevView = useRef<TeacherView>("home");

  // Notification bell count — same storageKey as the dashboard view
  const { unreadCount, markAllRead } = useNotifications(
    `notifs-teacher-${currentTeacher?.id ?? "x"}`
  );

  if (!currentTeacher) return null;

  const goToProfile = () => {
    if (view !== "profile") prevView.current = view;
    setView("profile");
  };
  const goBack = () => setView(prevView.current);
  const handleLogout = () => { teacherLogout(); onExit(); };
  const isProfile = view === "profile";

  const handleBellClick = () => {
    // Navigate to home (dashboard) so the user sees notifications, mark all read
    setView("home");
    markAllRead();
  };

  return (
    <div className={`t-shell ${open ? "open" : ""}`} style={{ display: open ? "flex" : "none" }}>
      <aside className="t-shell-sidebar">
        <div className="a-brand">
          <img src={logo} alt="logo" />
          <span>Teacher Panel</span>
        </div>

        {NAV.map((n) => (
          <button
            key={n.key}
            className={`t-nav-item ${view === n.key ? "active" : ""}`}
            onClick={() => setView(n.key)}
          >
            <i className={`fa-solid ${n.icon}`} />
            {n.label}
            {/* Bell badge on Home item in sidebar */}
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
            <p>Welcome, {currentTeacher.fullName} — {currentTeacher.subject}</p>
          </div>

          <div className="admin-top-actions">
            {/* Notification bell — top bar */}
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
              name={currentTeacher.fullName}
              role={currentTeacher.subject}
              onLogout={handleLogout}
              onProfile={goToProfile}
            />
          </div>
        </div>

        {view === "home"      && <TeacherDashboardView onNavigate={(v) => setView(v)} />}
        {view === "resources" && <MyResourcesView />}
        {view === "add"       && <AddResourceView onDone={() => setView("resources")} />}
        {view === "profile"   && <TeacherProfileView />}
        {view === "settings"  && <TeacherSettingsView />}
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
