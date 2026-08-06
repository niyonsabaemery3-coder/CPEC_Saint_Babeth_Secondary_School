import logo from "../../assets/logo.png";
import { useApp } from "../../context/AppContext";
import type { AdminView } from "../../types";
import DashboardView from "./views/DashboardView";
import ApplicationsView from "./views/ApplicationsView";
import TeachersView from "./views/TeachersView";
import SettingsView from "./views/SettingsView";

const NAV: { key: AdminView; icon: string; label: string }[] = [
  { key: "dash", icon: "fa-gauge-high", label: "Dashboard" },
  { key: "apps", icon: "fa-file-lines", label: "Applications" },
  { key: "teach", icon: "fa-chalkboard-user", label: "Teachers" },
  { key: "settings", icon: "fa-gear", label: "Settings" },
];

const TITLES: Record<AdminView, string> = {
  dash: "Dashboard",
  apps: "Applications",
  teach: "Teachers",
  settings: "Settings",
};

interface AdminShellProps {
  open: boolean;
  onExit: () => void;
}

export default function AdminShell({ open, onExit }: AdminShellProps) {
  const { adminView, setAdminView } = useApp();

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
            <span>
              <i className={`fa-solid ${n.icon}`} />
            </span>{" "}
            {n.label}
          </button>
        ))}
        <button className="a-nav-item a-logout" onClick={onExit}>
          <span>
            <i className="fa-solid fa-arrow-right-from-bracket" />
          </span>{" "}
          Exit to Website
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <div>
            <h2>{TITLES[adminView]}</h2>
            <p>Welcome back, Admin — you have full access to this system.</p>
          </div>
          <button className="a-add-btn" onClick={onExit}>
            <i className="fa-solid fa-arrow-left" /> Back to website
          </button>
        </div>

        {adminView === "dash" && <DashboardView />}
        {adminView === "apps" && <ApplicationsView />}
        {adminView === "teach" && <TeachersView />}
        {adminView === "settings" && <SettingsView onGoToTeachers={() => setAdminView("teach")} />}
      </main>

      <div className="a-bottom-tabs">
        {NAV.map((n) => (
          <button key={n.key} className={adminView === n.key ? "active" : ""} onClick={() => setAdminView(n.key)}>
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
