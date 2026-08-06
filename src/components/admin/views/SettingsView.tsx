import { useState } from "react";
import type { SettingsSection } from "../../../types";
import { useApp } from "../../../context/AppContext";
import SecurityPanel from "../settings/SecurityPanel";
import HomePanel from "../settings/HomePanel";
import AboutPanel from "../settings/AboutPanel";
import AcademicsPanel from "../settings/AcademicsPanel";
import GalleryPanel from "../settings/GalleryPanel";
import ContactPanel from "../settings/ContactPanel";
import FaqPanel from "../settings/FaqPanel";
import DataPanel from "../settings/DataPanel";

const MENU: { key: SettingsSection; icon: string; title: string; desc: string; iconClass?: string }[] = [
  { key: "security", icon: "fa-shield-halved", title: "Security", desc: "Change admin username & password", iconClass: "si-security" },
  { key: "home", icon: "fa-house", title: "Home", desc: "Edit hero section & highlight cards" },
  { key: "about", icon: "fa-circle-info", title: "About", desc: "Edit the About Our School section" },
  { key: "academics", icon: "fa-graduation-cap", title: "Academics", desc: "Edit programs & technology track" },
  { key: "teachers", icon: "fa-chalkboard-user", title: "Teachers", desc: "Manage the teachers list" },
  { key: "gallery", icon: "fa-images", title: "Gallery", desc: "Swap photos & edit captions" },
  { key: "contact", icon: "fa-address-book", title: "Contact", desc: "Edit address, phone & office hours" },
  { key: "faq", icon: "fa-comment-dots", title: "Chat Questions (FAQ)", desc: "Edit the questions & answers in the chat widget" },
  { key: "data", icon: "fa-database", title: "Data & Storage", desc: "How your data is saved, and reset options" },
];

interface SettingsViewProps {
  onGoToTeachers: () => void;
}

export default function SettingsView({ onGoToTeachers }: SettingsViewProps) {
  const { logout } = useApp();
  const [section, setSection] = useState<SettingsSection | null>(null);

  const openSection = (key: SettingsSection) => {
    if (key === "teachers") {
      onGoToTeachers();
      return;
    }
    setSection(key);
  };

  if (section) {
    return (
      <div className="admin-panel-view active">
        <div className="settings-panel">
          <div className="settings-back">
            <button className="btn-ghost" onClick={() => setSection(null)}>
              <i className="fa-solid fa-arrow-left" /> Back to Settings
            </button>
          </div>
          {section === "security" && <SecurityPanel />}
          {section === "home" && <HomePanel />}
          {section === "about" && <AboutPanel />}
          {section === "academics" && <AcademicsPanel />}
          {section === "gallery" && <GalleryPanel />}
          {section === "contact" && <ContactPanel />}
          {section === "faq" && <FaqPanel />}
          {section === "data" && <DataPanel />}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-view active">
      <div className="settings-menu">
        {MENU.map((m) => (
          <button key={m.key} className={`settings-item ${m.iconClass || ""}`} onClick={() => openSection(m.key)}>
            <span className="si-icon">
              <i className={`fa-solid ${m.icon}`} />
            </span>
            <span className="si-text">
              <b>{m.title}</b>
              <small>{m.desc}</small>
            </span>
            <i className="fa-solid fa-chevron-right" />
          </button>
        ))}
        <button className="settings-item" onClick={logout}>
          <span className="si-icon" style={{ background: "#fdeceb", color: "#c0392b" }}>
            <i className="fa-solid fa-right-from-bracket" />
          </span>
          <span className="si-text">
            <b>Log Out</b>
            <small>Exit the admin panel</small>
          </span>
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>
  );
}
