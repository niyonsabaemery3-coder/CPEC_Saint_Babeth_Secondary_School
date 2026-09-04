import { useCallback, useState } from "react";
import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";
import { useApp } from "../context/AppContext";
import type { EventItem, EventColorKey } from "../types";
import { formatNewsDate, formatEventDateParts } from "../utils/format";

/* ─── Colors ───────────────────────────────────────────
   Used as the plain header background on an event card
   whenever the admin hasn't chosen a header photo for it. ── */

const COLOR_MAP: Record<EventColorKey, { bg: string }> = {
  navy:   { bg: "var(--navy)"      },
  green:  { bg: "var(--green)"     },
  gold:   { bg: "var(--gold-dark)" },
  purple: { bg: "#6b4fa3"          },
  rust:   { bg: "#b84c26"          },
};

const NEWS_CATEGORY_COLORS: Record<string, string> = {
  Academics:   "var(--navy)",
  Achievement: "var(--green)",
  Admissions:  "var(--gold-dark)",
  Community:   "#6b4fa3",
};

/* ─── SplitEventCard ──────────────────────────────────
   Fixed-height vertical card.
   Structure (top → bottom):
     [header: icon (or admin-chosen photo), fixed-height colored zone]  ← draggable
     [divider handle]
     [body: category pill + title (fixed) + description (fills rest)]
     [footer: time + location — always pinned, never resized]
   Dragging only moves pixels between header height and
   description height. Card total height never changes.
──────────────────────────────────────────────────────── */

const CARD_H       = 360;   // total card height px (fixed)
const FOOTER_H     = 56;    // footer height px (fixed)
const DIVIDER_H    = 3;     // divider strip height px
const BODY_FIXED_H = 68;    // category pill + title rows (fixed)
const MIN_HDR_PX   = 60;
const DEFAULT_HDR_PX = 140;
// max header = total − footer − divider − body-fixed − at least 40px for description
const MAX_HDR_PX   = CARD_H - FOOTER_H - DIVIDER_H - BODY_FIXED_H - 40;

function SplitEventCard({ ev, col }: { ev: EventItem; col: { bg: string } }) {
  const [hdrH, setHdrH]         = useState(DEFAULT_HDR_PX);
  const [dragging, setDragging] = useState(false);
  const { month, day, year } = formatEventDateParts(ev.date);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);

    const startY    = e.clientY;
    const startHdrH = hdrH;

    const move = (ev2: PointerEvent) => {
      const delta = ev2.clientY - startY;
      const newH  = Math.min(MAX_HDR_PX, Math.max(MIN_HDR_PX, startHdrH + delta));
      setHdrH(newH);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup",   up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup",   up);
  }, [hdrH]);

  // Description area height = everything not taken by header, divider, body-fixed, footer
  const descH = CARD_H - hdrH - DIVIDER_H - BODY_FIXED_H - FOOTER_H;

  // The admin can optionally choose a header photo for this event. When one
  // is set, it's shown as the header background (with a dark scrim so the
  // date badge and icon stay readable); otherwise the header falls back to
  // the plain colored background it has always used.
  const headerStyle: React.CSSProperties = ev.image
    ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.45)), url('${ev.image}')`, backgroundSize: "cover", backgroundPosition: "center", height: `${hdrH}px` }
    : { background: col.bg, height: `${hdrH}px` };

  return (
    <article className={`en-ev-card${dragging ? " is-dragging" : ""}`}
      style={{ height: `${CARD_H}px` }}>

      {/* ── Colored (or photo) header — icon centered, date top-right ── */}
      <div className="en-ev-header" style={headerStyle}>
        {/* Date badge — always top-right */}
        <div className="en-ev-date-box">
          <span className="en-ev-month">{month}</span>
          <span className="en-ev-day">{day}</span>
          <span className="en-ev-year">{year}</span>
        </div>
        {/* Icon centered */}
        <div className="en-ev-icon-wrap">
          <i className={`fa-solid ${ev.icon} en-ev-icon`} />
        </div>
      </div>

      {/* ── Draggable horizontal divider ── */}
      <div
        className="en-hdivider"
        onPointerDown={onPointerDown}
        role="separator"
        aria-label="Drag to resize"
        aria-valuenow={Math.round(hdrH)}
        aria-valuemin={MIN_HDR_PX}
        aria-valuemax={MAX_HDR_PX}
      >
        <div className="en-hdivider-knob">
          <i className="fa-solid fa-arrows-up-down" />
        </div>
      </div>

      {/* ── Body: category + title (fixed) + description (resizes) ── */}
      <div className="en-ev-body" style={{ height: `${BODY_FIXED_H + descH}px` }}>
        <div className="en-ev-body-fixed">
          <span className="en-ev-category" style={{ color: col.bg, borderColor: col.bg }}>
            {ev.category}
          </span>
          <h3 className="en-ev-title">{ev.title}</h3>
        </div>
        <div className="en-ev-desc-wrap" style={{ height: `${descH}px` }}>
          <p className="en-ev-desc">{ev.description}</p>
        </div>
      </div>

      {/* ── Footer: always pinned, fixed height ── */}
      <div className="en-ev-footer" style={{ height: `${FOOTER_H}px` }}>
        <span className="en-ev-footer-item">
          <i className="fa-regular fa-clock" /> {ev.time}
        </span>
        <span className="en-ev-footer-item">
          <i className="fa-solid fa-location-dot" /> {ev.location}
        </span>
      </div>
    </article>
  );
}

/* ─── Page ───────────────────────────────────────────── */

type Tab = "events" | "news";

export default function EventsNewsPage() {
  const [tab, setTab] = useState<Tab>("events");
  const { newsItems, eventItems } = useApp();

  useSEO({
    title: "Events & News",
    description:
      "Stay up to date with upcoming events, announcements and achievements at CPEC Saint Babeth TSS in Byumba, Rwanda.",
    path: "/events-news",
  });

  return (
    <>
      <PageHeader
        eyebrow="What's happening"
        title="Events & News"
        subtitle="Upcoming events, latest announcements and achievements from CPEC Saint Babeth TSS."
      />

      {/* ── Tab switcher ── */}
      <div className="en-tabs">
        <button
          className={`en-tab${tab === "events" ? " active" : ""}`}
          onClick={() => setTab("events")}
          aria-selected={tab === "events"}
        >
          <i className="fa-solid fa-calendar-days" /> Upcoming Events
          <span className="en-count">{eventItems.length}</span>
        </button>
        <button
          className={`en-tab${tab === "news" ? " active" : ""}`}
          onClick={() => setTab("news")}
          aria-selected={tab === "news"}
        >
          <i className="fa-solid fa-newspaper" /> News &amp; Announcements
          <span className="en-count">{newsItems.length}</span>
        </button>
      </div>

      {/* ── Events ── */}
      {tab === "events" && (
        <section className="card en-panel">
          {eventItems.length === 0 ? (
            <p className="a-empty">No upcoming events right now — check back soon.</p>
          ) : (
            <div className="en-events-grid">
              {eventItems.map((ev) => (
                <SplitEventCard key={ev.id} ev={ev} col={COLOR_MAP[ev.colorKey]} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── News ── */}
      {tab === "news" && (
        <section className="card en-panel">
          {newsItems.length === 0 ? (
            <p className="a-empty">No news posted yet — check back soon.</p>
          ) : (
            <div className="en-news-grid">
              {newsItems.map((item) => {
                const accent = NEWS_CATEGORY_COLORS[item.category] ?? "var(--navy)";
                return (
                  <article key={item.id} className="en-news-card">

                    {/* Image layer — clips in from a diamond polygon on hover */}
                    <div
                      className="en-nc-img"
                      style={{ backgroundImage: `url(${item.image})` }}
                      aria-hidden="true"
                    />

                    {/* Dark gradient overlay — fades in with image */}
                    <div className="en-nc-overlay" aria-hidden="true" />

                    {/* Content layer — always on top */}
                    <div className="en-nc-content">
                      <span className="en-category" style={{ background: accent }}>
                        {item.category}
                      </span>
                      <h3 className="en-news-title">{item.title}</h3>
                      <p className="en-news-excerpt">{item.excerpt}</p>
                      <time className="en-news-date">
                        <i className="fa-regular fa-clock" /> {formatNewsDate(item.date)}
                      </time>
                    </div>

                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}
