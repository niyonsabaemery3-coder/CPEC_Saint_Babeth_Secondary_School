import { useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useStaggerText } from "../../hooks/useScrollAnimations";

export default function Hero() {
  const { site } = useApp();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useStaggerText(titleRef, `${site.heroMain} ${site.heroAccent}`);

  return (
    <section id="home" className="card">
      <div className="hero-grid">
        <div>
          <div className="eyebrow">
            <span className="bar" /> Welcome to
          </div>
          <h1 className="hero-title text-balance" ref={titleRef} aria-label={`${site.heroMain} ${site.heroAccent}`}>
            {`${site.heroMain} ${site.heroAccent}`}
          </h1>
          <p className="sub">{site.heroSub}</p>
          <div className="cta-row">
            <Link to="/admissions" className="btn-primary">
              <i className="fa-solid fa-pen-to-square" /> Apply Now
            </Link>
            <Link to="/contact" className="btn-outline">
              Contact Us
            </Link>
          </div>
        </div>
        <div className="hero-media">
          <div className="glass-card p-4 sm:p-6 rounded-2xl">
            <img
              src={site.heroImg}
              alt="Students of CPEC Saint Babeth TSS"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={900}
              height={700}
            />
          </div>
        </div>
      </div>

      <div className="features" aria-label="CPEC Saint Babeth school facts">
        {[
          {
            icon: "fa-layer-group",
            value: site.programs.length,
            label: "Programs Offered",
            to: "/academics",
          },
          {
            icon: "fa-laptop-code",
            value: 3,
            label: "Technology Pathways",
            to: "/academics",
          },
          {
            icon: "fa-shield-heart",
            value: site.aboutLi.length,
            label: "School Commitments",
            to: "/about",
          },
          {
            icon: "fa-images",
            value: site.gallery.length,
            label: "Campus Highlights",
            to: "/gallery",
          },
        ].map((stat) => (
          <Link key={stat.label} to={stat.to} className="feature">
            <span className="icon" aria-hidden="true">
              <i className={`fa-solid ${stat.icon}`} />
            </span>
            <strong className="feature-value">{stat.value}</strong>
            <h4>{stat.label}</h4>
          </Link>
        ))}
      </div>
    </section>
  );
}
