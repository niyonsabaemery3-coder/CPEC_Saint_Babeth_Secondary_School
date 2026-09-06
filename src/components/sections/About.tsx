import { useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useFadeUp } from "../../hooks/useScrollAnimations";

export default function About() {
  const { site } = useApp();
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section id="about" className="card" ref={ref}>
      <div className="about-grid">
        <div className="about-img">
          <img src={site.aboutImg} alt="A student at CPEC Saint Babeth" loading="lazy" decoding="async" />
        </div>
        <div className="about-copy">
          <div className="eyebrow">
            <span className="bar" /> About Our School
          </div>
          <h2>{site.aboutTitle}</h2>
          <p>{site.aboutPara1}</p>
          <p>{site.aboutPara2}</p>

          <div className="about-pill-grid">
            <div className="about-pill-card">
              <span className="about-pill-icon"><i className="fa-solid fa-bullseye" /></span>
              <div>
                <h3>Mission</h3>
                <p>{site.mission}</p>
              </div>
            </div>
            <div className="about-pill-card">
              <span className="about-pill-icon"><i className="fa-solid fa-eye" /></span>
              <div>
                <h3>Vision</h3>
                <p>{site.vision}</p>
              </div>
            </div>
            <div className="about-pill-card about-pill-card-wide">
              <span className="about-pill-icon"><i className="fa-solid fa-shield-heart" /></span>
              <div>
                <h3>Core Values</h3>
                <ul className="about-core-list">
                  {site.coreValues.map((item, i) => (
                    <li key={i}>
                      <span className="dot">
                        <i className="fa-solid fa-check" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <ul className="about-list">
            {site.aboutLi.map((item, i) => (
              <li key={i}>
                <span className="dot">
                  <i className="fa-solid fa-check" />
                </span>{" "}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
