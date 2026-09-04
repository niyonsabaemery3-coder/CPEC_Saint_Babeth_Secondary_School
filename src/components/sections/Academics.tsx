import { useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useFadeUp } from "../../hooks/useGsapAnimations";

export default function Academics() {
  const { site } = useApp();
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section id="academics" className="card" ref={ref}>
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Academics
        </div>
        <h2>What we teach</h2>
        <p>A well-rounded lower-secondary curriculum paired with in-demand technology skills.</p>
      </div>

      <div className="prog-grid">
        {site.programs.map((p, i) => (
          <div className="prog-card" key={i}>
            <span className="tag">Ordinary Level</span>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="subject-strip">
        <div>
          <h3>{site.stripTitle}</h3>
          <p>{site.stripDesc}</p>
        </div>
        <div className="chip-row">
          <span className="chip on">Software Development</span>
          <span className="chip on">ICT</span>
          <span className="chip on">Multimedia Production</span>
          <span className="chip">Web Design</span>
          <span className="chip">Graphic Design</span>
          <span className="chip">Digital Literacy</span>
        </div>
      </div>
    </section>
  );
}
