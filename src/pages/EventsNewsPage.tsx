import { useState } from "react";
import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";
import EventCard from "../components/common/EventCard";
import { useApp } from "../context/AppContext";
import type { EventColorKey } from "../types";
import { formatNewsDate } from "../utils/format";

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

const MAX_VISIBLE_EVENTS = 20;

/* ─── Page ───────────────────────────────────────────── */

type Tab = "events" | "news";

export default function EventsNewsPage() {
  const [tab, setTab] = useState<Tab>("events");
  const { newsItems, eventItems } = useApp();
  const visibleEvents = eventItems.slice(0, MAX_VISIBLE_EVENTS);

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
          {visibleEvents.length === 0 ? (
            <p className="a-empty">No upcoming events right now — check back soon.</p>
          ) : (
            <div className="en-events-grid event-card-grid">
              {visibleEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} color={COLOR_MAP[ev.colorKey].bg} />
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
