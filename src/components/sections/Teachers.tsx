import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { initials } from "../../utils/format";
import { useFadeUp } from "../../hooks/useGsapAnimations";

export default function Teachers() {
  const { teachers } = useApp();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  const visibleCount = expanded ? teachers.length : 4;

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
