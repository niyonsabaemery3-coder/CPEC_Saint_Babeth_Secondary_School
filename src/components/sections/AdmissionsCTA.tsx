import { useRef } from "react";
import { Link } from "react-router-dom";
import { useFadeUp } from "../../hooks/useGsapAnimations";

// Short homepage teaser for Admissions. The full multi-step application
// wizard lives on its own page (/admissions) — see AdmissionsPage.tsx,
// which renders the <Apply /> component. Keeping the full form off the
// homepage avoids duplicating that entire wizard on two pages at once.
export default function AdmissionsCTA() {
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  return (
    <section id="apply" className="card" ref={ref}>
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Admissions
        </div>
        <h2>Ready to enroll?</h2>
        <p>
          Start your application online in a few simple steps — our admissions office will reach out on the phone
          number you provide once it's reviewed.
        </p>
      </div>

      <div className="cta-row">
        <Link to="/admissions" className="btn-primary">
          <i className="fa-solid fa-pen-to-square" /> Apply Now
        </Link>
        <Link to="/admissions" className="btn-outline">
          Learn About Admissions
        </Link>
      </div>
    </section>
  );
}
