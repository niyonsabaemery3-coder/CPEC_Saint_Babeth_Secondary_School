import logo from "../../assets/logo.png";
import { useApp } from "../../context/AppContext";

interface FooterProps {
  onOpenAdminLogin: () => void;
  onOpenTeacherAuth: () => void;
}

export default function Footer({ onOpenAdminLogin, onOpenTeacherAuth }: FooterProps) {
  const { site } = useApp();

  return (
    <footer className="card dark">
      <div className="foot-grid">
        <div>
          <div className="foot-brand">
            <img src={logo} alt="logo" />
            <span>CPEC Saint Babeth Secondary School</span>
          </div>
          <p>Discipline – Work – Integrity. Educating the next generation in Byumba, Rwanda.</p>
        </div>
        <div>
          <h5>Quick Links</h5>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#academics">Academics</a></li>
            <li><a href="#resources">Resources</a></li>
            <li><a href="#gallery">Gallery</a></li>
          </ul>
        </div>
        <div>
          <h5>Contact</h5>
          <ul>
            <li>{site.contactAddress}</li>
            <li>{site.contactPhone}</li>
            <li>Open Mon – Fri</li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        © 2026 CPEC Saint Babeth Secondary School. All rights reserved. — Demo website. &nbsp;·&nbsp;{" "}
        <a className="admin-link" href="javascript:void(0)" onClick={onOpenTeacherAuth}>
          <i className="fa-solid fa-chalkboard-user" /> Teacher Portal
        </a>
        &nbsp;·&nbsp;
        <a className="admin-link" href="javascript:void(0)" onClick={onOpenAdminLogin}>
          <i className="fa-solid fa-user-shield" /> Staff / Admin Login
        </a>
      </div>
    </footer>
  );
}
