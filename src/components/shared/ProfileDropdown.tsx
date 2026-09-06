import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";

interface ProfileDropdownProps {
  /** Display name shown in the button and dropdown header */
  name: string;
  /** Secondary line (role / subject / class) */
  role: string;
  /** Called when "Log out" is clicked */
  onLogout: () => void;
  /** Called when "My Profile" is clicked (optional — omit if no profile tab) */
  onProfile?: () => void;
}

/** Generates a 1-2 character initials avatar from a name string. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ProfileDropdown({ name, role, onLogout, onProfile }: ProfileDropdownProps) {
  const { theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="pd-wrap" ref={ref}>
      <button
        className="pd-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        title={name}
      >
        <span className="pd-avatar">{initials(name)}</span>
        <span className="pd-name">{name}</span>
        <i className={`fa-solid fa-chevron-down pd-caret ${open ? "open" : ""}`} />
      </button>

      {open && (
        <div className="pd-menu" role="menu">
          {/* Header */}
          <div className="pd-header">
            <span className="pd-header-avatar">{initials(name)}</span>
            <div>
              <div className="pd-header-name">{name}</div>
              <div className="pd-header-role">{role}</div>
            </div>
          </div>

          <div className="pd-divider" />

          {/* Theme toggle */}
          <button
            className="pd-item"
            role="menuitem"
            onClick={() => { toggleTheme(); }}
          >
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
            {theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
            <span className={`pd-theme-badge ${theme}`}>{theme === "dark" ? "Dark" : "Light"}</span>
          </button>

          {onProfile && (
            <button
              className="pd-item"
              role="menuitem"
              onClick={() => { setOpen(false); onProfile(); }}
            >
              <i className="fa-solid fa-user" />
              My Profile
            </button>
          )}

          <div className="pd-divider" />

          <button
            className="pd-item pd-logout"
            role="menuitem"
            onClick={() => { setOpen(false); onLogout(); }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
