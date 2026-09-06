import { useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useFadeUp } from "../../hooks/useScrollAnimations";

/* ─────────────────────────────────────────────────────────────────────────
   About section — two modes:

   teaser={true}   Used on the homepage. Shows the decorative image, heading,
                   two paragraphs, and the Mission / Vision / Core Values pill
                   cards. No highlights list. CTA link to /about.

   teaser={false}  Used on the full About page. Same image layout + a tab bar
                   that switches between "Who We Are" (all existing content +
                   highlights) and "Our History" (the new aboutHistory field).
───────────────────────────────────────────────────────────────────────── */

interface AboutProps {
  teaser?: boolean;
}

export default function About({ teaser = false }: AboutProps) {
  const { site } = useApp();
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);
  const [tab, setTab] = useState<"who" | "history">("who");

  /* ── Shared: decorative image frame ────────────────────────────── */
  const imageBlock = (
    <div className="about-img-frame">
      <div className="about-img-backdrop" aria-hidden="true" />
      <div className="about-img">
        <img
          src={site.aboutImg}
          alt="CPEC Saint Babeth TSS"
          loading="lazy"
          decoding="async"
        />
      </div>
      {/* floating badge */}
      <div className="about-img-badge" aria-hidden="true">
        <i className="fa-solid fa-graduation-cap" />
        <span>Excellence<br />Since Day One</span>
      </div>
    </div>
  );

  /* ── Shared: Mission / Vision / Core Values cards ───────────────── */
  const pillCards = (
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
                <span className="dot"><i className="fa-solid fa-check" /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     TEASER — homepage: image + heading + 1 paragraph + Mission/Vision/
     Core Values cards + "Learn more" CTA. Compact, no tabs, no list.
  ══════════════════════════════════════════════════════════════════ */
  if (teaser) {
    return (
      <section id="about" className="card about-teaser-section" ref={ref}>
        <div className="about-teaser-grid">
          {imageBlock}
          <div className="about-copy">
            <div className="eyebrow">
              <span className="bar" /> About Our School
            </div>
            <h2>{site.aboutTitle}</h2>
            <p>{site.aboutPara1}</p>
            {pillCards}
          </div>
        </div>
      </section>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     FULL PAGE — two tabs: Who We Are | Our History
  ══════════════════════════════════════════════════════════════════ */
  return (
    <section id="about" className="card about-full-section" ref={ref}>
      {/* Tab bar */}
      <div className="about-tabs" role="tablist" aria-label="About sections">
        <button
          role="tab"
          aria-selected={tab === "who"}
          className={`about-tab ${tab === "who" ? "active" : ""}`}
          onClick={() => setTab("who")}
        >
          <i className="fa-solid fa-users" /> Who We Are
        </button>
        <button
          role="tab"
          aria-selected={tab === "history"}
          className={`about-tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          <i className="fa-solid fa-landmark" /> Our History
        </button>
      </div>

      {/* ── Who We Are tab ─────────────────────────────────────── */}
      {tab === "who" && (
        <div className="about-grid" role="tabpanel">
          {imageBlock}
          <div className="about-copy">
            <div className="eyebrow">
              <span className="bar" /> About Our School
            </div>
            <h2>{site.aboutTitle}</h2>
            <p>{site.aboutPara1}</p>
            <p>{site.aboutPara2}</p>
            {pillCards}
            <ul className="about-list">
              {site.aboutLi.map((item, i) => (
                <li key={i}>
                  <span className="dot"><i className="fa-solid fa-check" /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Our History tab ────────────────────────────────────── */}
      {tab === "history" && (
        <div className="about-history-layout" role="tabpanel">
          <div className="about-history-img-col">
            {imageBlock}
          </div>
          <div className="about-history-text">
            <div className="eyebrow">
              <span className="bar" /> Our History
            </div>
            <h2>How We Got Here</h2>
            <div className="about-history-body">
              {(site.aboutHistory || "").split("\n\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {/* Milestone timeline strip */}
            <div className="about-timeline">
              <div className="about-timeline-item">
                <span className="about-timeline-dot"><i className="fa-solid fa-flag" /></span>
                <div>
                  <strong>Founded</strong>
                  <p>Established in Byumba with a commitment to quality technical education.</p>
                </div>
              </div>
              <div className="about-timeline-item">
                <span className="about-timeline-dot"><i className="fa-solid fa-computer" /></span>
                <div>
                  <strong>Technology Programs</strong>
                  <p>Launched Software Development, ICT and Multimedia Production tracks.</p>
                </div>
              </div>
              <div className="about-timeline-item">
                <span className="about-timeline-dot"><i className="fa-solid fa-trophy" /></span>
                <div>
                  <strong>Growing Excellence</strong>
                  <p>Continuously improving outcomes for students across the Northern Province.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
