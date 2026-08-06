import { useState } from "react";
import logo from "../../assets/logo.png";
import { useApp } from "../../context/AppContext";

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#academics", label: "Academics" },
  { href: "#teachers", label: "Teachers" },
  { href: "#resources", label: "Resources" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useApp();

  const close = () => setOpen(false);

  return (
    <div className="nav-wrap">
      <header className="glass">
        <a className="brand" href="#home">
          <img src={logo} alt="CPEC Saint Babeth logo" />
          <div className="brand-text">
            <div className="name">CPEC Saint Babeth</div>
            <div className="tag">Secondary School</div>
          </div>
        </a>

        <nav className="links">
          {NAV_LINKS.map((l, i) => (
            <a key={l.href} href={l.href} className={i === 0 ? "active" : ""}>
              {l.label}
            </a>
          ))}
        </nav>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{ marginRight: "10px" }}
        >
          <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
        </button>

        <a className="portal-btn" href="#apply">
          <i className="fa-solid fa-pen-to-square" /> Apply Now
        </a>

        <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          <i className="fa-solid fa-bars" />
        </button>

        <div className={`mobile-menu ${open ? "open" : ""}`} id="mMenu">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
            </a>
          ))}
          <a href="#apply" className="m-apply" onClick={close}>
            <i className="fa-solid fa-pen-to-square" /> Apply Now
          </a>
        </div>
      </header>
    </div>
  );
}
