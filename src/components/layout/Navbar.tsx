import { useState, type MouseEvent } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../../assets/logo-navbar.webp";
import { useApp } from "../../context/AppContext";

type NavChild = { to: string; label: string };
type NavEntry = { to?: string; label: string; end?: boolean; icon?: string; isNew?: boolean; children?: readonly NavChild[] };

const NAV_LINKS: readonly NavEntry[] = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  {
    to: "/academics",
    label: "Academics",
    children: [
      { to: "/academics", label: "Programs" },
      { to: "/resources", label: "Resources" },
    ],
  },
  {
    label: "School",
    children: [
      { to: "/teachers", label: "Teachers" },
      { to: "/admissions", label: "Admissions" },
    ],
  },
  { to: "/events-news", label: "Events & News", icon: "fa-calendar-days", isNew: true },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

interface NavbarProps {
  onOpenLogin: () => void;
}

export default function Navbar({ onOpenLogin }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [desktopDim, setDesktopDim] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme, studentLoggedIn, teacherLoggedIn, adminLoggedIn } = useApp();

  const close = () => {
    setOpen(false);
    setMobileDropdown(null);
    setDesktopDim(false);
  };
  const openDesktopDropdown = () => {
    setDesktopDim(true);
  };
  const closeDesktopDropdown = () => {
    setDesktopDim(false);
  };
  const selectDropdownItem = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.blur();
    setDesktopDim(false);
  };
  const loggedIn = studentLoggedIn || teacherLoggedIn || adminLoggedIn;

  const isDropdownActive = (links: readonly { to: string }[]) =>
    links.some((link) => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`));

  const selectedChild = (links: readonly NavChild[]) =>
    links.find((link) => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`));

  return (
    <>
      {desktopDim && <div className="nav-dim" aria-hidden="true" />}
      <div className="nav-wrap">
      <header className="glass">
        <Link className="brand" to="/" onClick={close}>
          <img src={logo} alt="CPEC Saint Babeth logo" />
          <div className="brand-text">
            <div className="name">CPEC Saint Babeth</div>
            <div className="tag">TSS</div>
          </div>
        </Link>

        <nav className="links" aria-label="Primary">
          {NAV_LINKS.map((l) => l.children ? (
            <div className="nav-dropdown" key={l.label} onMouseEnter={openDesktopDropdown} onMouseLeave={closeDesktopDropdown}>
              {l.to ? (
                <NavLink to={l.to} onClick={selectDropdownItem} className={isDropdownActive(l.children) ? "active nav-dropdown-trigger" : "nav-dropdown-trigger"}>
                  {selectedChild(l.children)?.label || l.label} <i className="fa-solid fa-chevron-down nav-chevron" />
                </NavLink>
              ) : (
                <button onClick={openDesktopDropdown} className={isDropdownActive(l.children) ? "active nav-dropdown-trigger" : "nav-dropdown-trigger"} type="button">
                  {selectedChild(l.children)?.label || l.label} <i className="fa-solid fa-chevron-down nav-chevron" />
                </button>
              )}
              <div className="nav-dropdown-menu">
                {l.children.map((child) => <NavLink key={child.to} to={child.to} onClick={selectDropdownItem} className={location.pathname === child.to || location.pathname.startsWith(`${child.to}/`) ? "active" : ""}>{child.label}</NavLink>)}
              </div>
            </div>
          ) : l.to ? (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.icon && <i className={`fa-solid ${l.icon} nav-link-icon`} />}
              {l.label}
              {l.isNew && <span className="nav-new-badge">NEW</span>}
            </NavLink>
          ) : null)}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
          </button>

          <button
            className="portal-btn"
            onClick={onOpenLogin}
            aria-label={loggedIn ? "My Account" : "Sign In"}
          >
            <i className="fa-solid fa-right-to-bracket" />{" "}
            <span className="portal-btn-label">{loggedIn ? "My Account" : "Sign In"}</span>
          </button>
        </div>

        <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
        </button>

        <div className={`mobile-menu ${open ? "open" : ""}`} id="mMenu">
          {NAV_LINKS.map((l) => l.children ? (
            <div className="mobile-nav-dropdown" key={l.label}>
              <button
                type="button"
                className={isDropdownActive(l.children) ? "active" : ""}
                onClick={() => setMobileDropdown((current) => current === l.label ? null : l.label)}
              >
                {selectedChild(l.children)?.label || l.label} <i className={`fa-solid fa-chevron-down nav-chevron ${mobileDropdown === l.label ? "open" : ""}`} />
              </button>
              <div className={`mobile-nav-submenu ${mobileDropdown === l.label ? "open" : ""}`}>
                {l.children.map((child) => <NavLink key={child.to} to={child.to} onClick={close}>{child.label}</NavLink>)}
              </div>
            </div>
          ) : l.to ? (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={close} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.icon && <i className={`fa-solid ${l.icon}`} />}
              {l.label}
              {l.isNew && <span className="nav-new-badge">NEW</span>}
            </NavLink>
          ) : null)}
          <button
            type="button"
            className="m-login-alt"
            onClick={() => {
              close();
              onOpenLogin();
            }}
          >
            <i className="fa-solid fa-right-to-bracket" /> {loggedIn ? "My Account" : "Sign In"}
          </button>
        </div>
      </header>
      </div>
    </>
  );
}
