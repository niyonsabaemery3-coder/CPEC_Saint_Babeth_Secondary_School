import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useCountUp, useStaggerText } from "../../hooks/useScrollAnimations";

export default function Hero() {
  const { site, teachers, resources, studentAccounts, siteLoaded } = useApp();
  const heroImages = site.heroImages?.length ? site.heroImages : [site.heroImg];
  const heroImageKey = heroImages.join("|");
  const [heroIndex, setHeroIndex] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const compactNumber = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    if (value < 1000) return String(value);
    const compact = value / 1000;
    return compact >= 100 ? `${Math.round(compact)}K` : `${compact.toFixed(1).replace(/\.0$/, "")}K`;
  };

  const statCards = [
    { icon: "fa-users", value: studentAccounts.length, label: "Students", to: "/students" },
    { icon: "fa-graduation-cap", value: site.programs.length, label: "Academic Programs", to: "/academics" },
    { icon: "fa-chalkboard-user", value: teachers.length, label: "Teachers", to: "/teachers" },
    { icon: "fa-book-open", value: resources.length, label: "Learning Resources", to: "/resources" },
  ];

  useStaggerText(titleRef, siteLoaded ? site.heroMain : "", siteLoaded ? site.heroAccent : "");
  useCountUp(featuresRef);

  useEffect(() => {
    setHeroIndex((current) => Math.min(current, heroImages.length - 1));
    if (heroImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const nextImage = new Image();
    nextImage.decoding = "async";
    nextImage.src = heroImages[(heroIndex + 1) % heroImages.length];
  }, [heroImageKey, heroIndex]);

  return (
    <section id="home" className="card">
      <div className="hero-grid">
        <div>
          <div className="eyebrow" style={siteLoaded ? undefined : { visibility: "hidden" }}>
            <span className="bar" /> Welcome to
          </div>
          <h1 className="hero-title text-balance" ref={titleRef} aria-label={`${site.heroMain} ${site.heroAccent}`} />
          <p className="sub" style={siteLoaded ? undefined : { visibility: "hidden" }}>{site.heroSub}</p>
          <div className="cta-row" style={siteLoaded ? undefined : { visibility: "hidden" }}>
            <Link to="/admissions" className="btn-primary">
              <i className="fa-solid fa-file-pen" /> Request Admission
            </Link>
            <Link to="/contact" className="btn-outline">
              Contact Us
            </Link>
          </div>
        </div>
        <div className="hero-media">
          <div className="glass-card p-4 sm:p-6 rounded-2xl">
            <img
              key={heroImages[heroIndex]}
              className="hero-slideshow-image"
              src={heroImages[heroIndex]}
              alt="Students of CPEC Saint Babeth TSS"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              sizes="(max-width: 900px) 100vw, 50vw"
              width={900}
              height={700}
            />
          </div>
        </div>
      </div>

      <div className="features" ref={featuresRef} aria-label="CPEC Saint Babeth school facts">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.to} className="feature">
            <span className="icon" aria-hidden="true">
              <i className={`fa-solid ${stat.icon}`} />
            </span>
            <strong
              className="feature-value"
              data-count={stat.value}
              data-format={stat.value >= 1000 ? "compact" : "plain"}
              aria-label={String(stat.value)}
            >
              {compactNumber(stat.value)}
            </strong>
            <h4>{stat.label}</h4>
          </Link>
        ))}
      </div>
    </section>
  );
}
