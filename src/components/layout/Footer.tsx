import { Link } from "react-router-dom";
import logo from "../../assets/logo-navbar.png";
import { useApp } from "../../context/AppContext";

interface FooterProps {
  onOpenLogin: () => void;
}

export default function Footer({ onOpenLogin }: FooterProps) {
  const { site } = useApp();

  return (
    <footer className="card dark">
      <div className="foot-grid foot-grid-wide">
        <div>
          <div className="foot-brand">
            <img src={logo} alt="logo" />
            <span>CPEC Saint Babeth TSS</span>
          </div>
          <p>Discipline – Work – Integrity. Educating the next generation in Byumba, Rwanda.</p>
        </div>

        <div>
          <h5>School</h5>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/news">News</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
          </ul>
        </div>

        <div>
          <h5>Quick Links</h5>
          <ul>
            <li><Link to="/academics">Academic Programs</Link></li>
            <li><Link to="/admissions">Admissions</Link></li>
            <li><Link to="/teachers">Our Teachers</Link></li>
            <li><Link to="/resources">Resources</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h5>Academic Links</h5>
          <ul>
            <li><Link to="/students">Student Life</Link></li>
            <li><Link to="/resources">Notes & Past Papers</Link></li>
            <li>
              <button type="button" className="link-btn" onClick={onOpenLogin}>Student Portal</button>
            </li>
            <li>
              <button type="button" className="link-btn" onClick={onOpenLogin}>Teacher Portal</button>
            </li>
          </ul>
        </div>

        <div>
          <h5>Contact</h5>
          <ul>
            <li>{site.contactAddress}</li>
            <li>{site.contactPhone}</li>
            <li>Mon – Fri, 7:00 AM – 5:00 PM</li>
            <li className="foot-social">
              <a href={site.contactPhone ? `https://wa.me/${site.contactPhone.replace(/[^\d]/g, "")}` : "#"} aria-label="WhatsApp" target="_blank" rel="noreferrer">
                <i className="fa-brands fa-whatsapp" />
              </a>
              <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook" /></a>
              <a href="#" aria-label="X / Twitter"><i className="fa-brands fa-x-twitter" /></a>
            </li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        © 2026 CPEC Saint Babeth TSS. All rights reserved. — Demo website. &nbsp;·&nbsp;{" "}
        <button type="button" className="admin-link" onClick={onOpenLogin}>
          <i className="fa-solid fa-right-to-bracket" /> Sign In
        </button>
      </div>
    </footer>
  );
}
