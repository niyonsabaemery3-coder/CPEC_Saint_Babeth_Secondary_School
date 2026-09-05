import { useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useFadeUp } from "../../hooks/useScrollAnimations";

interface AcademicsProps {
  // Homepage preview mode: shows only the program cards (the most important
  // category info) and skips the technology-track strip below, so the full
  // curriculum detail lives only on the dedicated /academics page — see
  // AcademicsPage.tsx, which renders this same component with no prop.
  teaser?: boolean;
}

export default function Academics({ teaser = false }: AcademicsProps) {
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

      {!teaser && (
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
      )}
    </section>
  );
}
