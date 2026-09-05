import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { initials } from "../../utils/format";
import { useFadeUp } from "../../hooks/useScrollAnimations";

interface TeachersProps {
  // Homepage preview mode: shows only a handful of teachers with no
  // "View More" expansion — the full team lives on the dedicated /teachers
  // page (TeachersPage.tsx renders this same component with no prop).
  teaser?: boolean;
}

export default function Teachers({ teaser = false }: TeachersProps) {
  const { teachers } = useApp();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  const defaultCount = teaser ? 3 : 4;
  const visibleCount = expanded ? teachers.length : defaultCount;

  return (
    <section id="teachers" className="card" ref={ref}>
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Our Team
        </div>
        <h2>Meet our teachers</h2>
        <p>Dedicated educators guiding every student in and beyond the classroom.</p>
      </div>

      <div className="teachers-grid">
        {teachers.map((t, i) => (
          <div className={`teacher-card ${i < visibleCount ? "show" : ""}`} key={t.id}>
            <div
              className="teacher-avatar"
              style={
                t.photo
                  ? { backgroundImage: `url('${t.photo}')` }
                  : { background: t.color }
              }
            >
              {!t.photo && initials(t.name)}
            </div>
            <h4>{t.name}</h4>
            <span className="subj">{t.subject}</span>
            <p className="quote">"{t.quote}"</p>
          </div>
        ))}
      </div>

      {pathname === "/teachers" && teachers.length > 4 && (
        <div className="teachers-more-row">
          <button className="btn-ghost" onClick={() => setExpanded((e) => !e)}>
            {expanded ? (
              <>
                <i className="fa-solid fa-chevron-up" /> Show Less
              </>
            ) : (
              <>View More Teachers <i className="fa-solid fa-arrow-right" /></>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
