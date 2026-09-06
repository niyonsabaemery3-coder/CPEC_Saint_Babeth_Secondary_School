import { useRef } from "react";
import { Link } from "react-router-dom";
import { useFadeUp } from "../../hooks/useScrollAnimations";

// Short homepage teaser for Admissions. The full multi-step application
// wizard lives on its own page (/admissions) — see AdmissionsPage.tsx,
// which renders the <Apply /> component. Keeping the full form off the
// homepage avoids duplicating that entire wizard on two pages at once.
export default function AdmissionsCTA() {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section id="apply" className="card admissions-cta" ref={ref} aria-labelledby="admissions-cta-title">
      <div className="admissions-cta-inner">
        <div className="admissions-cta-copy">
          <span className="admissions-cta-icon" aria-hidden="true">
            <i className="fa-solid fa-graduation-cap" />
          </span>
          <div>
            <h2 id="admissions-cta-title">Admissions Are Open!</h2>
            <p>Join CPEC Saint Babeth TSS today. Apply online in minutes — no account required.</p>
          </div>
        </div>

        <div className="admissions-cta-actions" aria-label="Admissions actions">
          <Link to="/admissions" className="btn-primary admissions-cta-primary">
            <i className="fa-solid fa-pen-to-square" aria-hidden="true" /> Apply Now
          </Link>
          <Link to="/track-application" className="btn-outline admissions-cta-secondary">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" /> Track application
          </Link>
        </div>
      </div>
    </section>
  );
}
