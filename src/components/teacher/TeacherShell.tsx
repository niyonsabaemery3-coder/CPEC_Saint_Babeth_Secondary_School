import { useState } from "react";
import logo from "../../assets/logo.png";
import { useApp } from "../../context/AppContext";
import type { TeacherView } from "../../types";
import MyResourcesView from "./views/MyResourcesView";
import AddResourceView from "./views/AddResourceView";
import TeacherProfileView from "./views/TeacherProfileView";

const NAV: { key: TeacherView; icon: string; label: string }[] = [
  { key: "resources", icon: "fa-folder-open", label: "My Resources" },
  { key: "add", icon: "fa-circle-plus", label: "Add Resource" },
  { key: "profile", icon: "fa-user", label: "Profile" },
];

const TITLES: Record<TeacherView, string> = {
  resources: "My Resources",
  add: "Add New Resource",
  profile: "My Profile",
};

interface TeacherShellProps {
  open: boolean;
  onExit: () => void;
}

export default function TeacherShell({ open, onExit }: TeacherShellProps) {
  const { currentTeacher } = useApp();
  const [view, setView] = useState<TeacherView>("resources");

  if (!currentTeacher) return null;

  return (
    <div className={`t-shell ${open ? "open" : ""}`} style={{ display: open ? "flex" : "none" }}>
      <aside className="t-shell-sidebar">
        <div className="a-brand">
          <img src={logo} alt="logo" />
          <span>Teacher Panel</span>
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
              Welcome, {currentTeacher.fullName} — {currentTeacher.subject}
            </p>
          </div>
          <button className="a-add-btn" onClick={onExit}>
            <i className="fa-solid fa-arrow-left" /> Back to website
          </button>
        </div>

        {view === "resources" && <MyResourcesView />}
        {view === "add" && <AddResourceView onDone={() => setView("resources")} />}
        {view === "profile" && <TeacherProfileView />}
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
