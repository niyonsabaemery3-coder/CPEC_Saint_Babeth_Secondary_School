import { useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useFadeUp } from "../../hooks/useGsapAnimations";

export default function About() {
  const { site } = useApp();
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section id="about" className="card" ref={ref}>
      <div className="about-grid">
        <div className="about-img">
          <img src={site.aboutImg} alt="A student at CPEC Saint Babeth" loading="lazy" />
        </div>
        <div className="about-copy">
          <div className="eyebrow">
            <span className="bar" /> About Our School
          </div>
          <h2>{site.aboutTitle}</h2>
          <p>{site.aboutPara1}</p>
          <p>{site.aboutPara2}</p>
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
