import { useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useStaggerText } from "../../hooks/useGsapAnimations";

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
            <a href="#apply" className="btn-primary">
              <i className="fa-solid fa-pen-to-square" /> Apply Now
            </a>
            <a href="#contact" className="btn-outline">
              Contact Us
            </a>
          </div>
        </div>
        <div className="hero-media">
          <img src={site.heroImg} alt="Students of CPEC Saint Babeth TSS" loading="eager" />
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <div className="icon">
            <i className="fa-solid fa-graduation-cap" />
          </div>
          <div>
            <h4>{site.feat1Title}</h4>
            <p>{site.feat1Desc}</p>
          </div>
        </div>
        <div className="feature">
          <div className="icon">
            <i className="fa-solid fa-laptop-code" />
          </div>
          <div>
            <h4>{site.feat2Title}</h4>
            <p>{site.feat2Desc}</p>
          </div>
        </div>
        <div className="feature">
          <div className="icon">
            <i className="fa-solid fa-trophy" />
          </div>
          <div>
            <h4>{site.feat3Title}</h4>
            <p>{site.feat3Desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
