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
            <h2 id="admissions-cta-title">Interested in Joining?</h2>
            <p>Submit an admission request online. All requests are reviewed by the school and are subject to eligibility, available places, and the applicable admission process.</p>
          </div>
        </div>

        <div className="admissions-cta-actions" aria-label="Admissions actions">
          <Link to="/admissions" className="btn-primary admissions-cta-primary">
            <i className="fa-solid fa-file-pen" aria-hidden="true" /> Request Admission
          </Link>
          <Link to="/track-application" className="btn-outline admissions-cta-secondary">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" /> Track application
          </Link>
        </div>
      </div>
    </section>
  );
}
