import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { formatNewsDate } from "../../utils/format";
import EventCard from "../common/EventCard";
import type { EventColorKey } from "../../types";

const EVENT_COLORS: Record<EventColorKey, string> = {
  navy: "var(--navy)", green: "var(--green)", gold: "var(--gold-dark)", purple: "#6b4fa3", rust: "#b84c26",
};
const NEWS_COLORS: Record<string, string> = {
  Academics: "var(--navy)", Achievement: "var(--green)", Admissions: "var(--gold-dark)", Community: "#6b4fa3",
};

export default function HomeEventsTeaser() {
  const { eventItems, newsItems } = useApp();
  const [tab, setTab] = useState<"events" | "news">("events");
  const events = eventItems.slice(0, 4);
  const news = newsItems.slice(0, 2);

  return (
    <section className="card home-events-teaser" aria-labelledby="home-updates-title">
      <div className="section-head home-teaser-head">
        <div className="eyebrow"><span className="bar" /> Stay in the loop</div>
        <h2 id="home-updates-title">Events &amp; News</h2>
        <p>Upcoming events, announcements and achievements from our school.</p>
      </div>

      <div className="en-tabs home-en-tabs">
        <button type="button" className={`en-tab${tab === "events" ? " active" : ""}`} onClick={() => setTab("events")}>
          <i className="fa-solid fa-calendar-days" /> Upcoming Events <span className="en-count">{eventItems.length}</span>
        </button>
        <button type="button" className={`en-tab${tab === "news" ? " active" : ""}`} onClick={() => setTab("news")}>
          <i className="fa-solid fa-newspaper" /> News &amp; Announcements <span className="en-count">{newsItems.length}</span>
        </button>
      </div>

      <div className="en-panel home-en-panel">
        {tab === "events" ? (
          events.length === 0 ? <p className="a-empty">No upcoming events right now.</p> :
          <div className="en-events-grid event-card-grid home-en-events-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                color={EVENT_COLORS[event.colorKey]}
                interactive
              />
            ))}
          </div>
        ) : (
          news.length === 0 ? <p className="a-empty">No news posted yet.</p> :
          <div className="en-news-grid home-en-news-grid">
            {news.map((item) => (
              <Link to="/events-news" className="en-news-card" key={item.id}>
                <div className="en-nc-img" style={{ backgroundImage: item.image ? `url('${item.image}')` : undefined }} />
                <div className="en-nc-overlay" />
                <div className="en-nc-content"><span className="en-category" style={{ background: NEWS_COLORS[item.category] ?? "var(--navy)" }}>{item.category}</span><h3 className="en-news-title">{item.title}</h3><p className="en-news-excerpt">{item.excerpt}</p><time className="en-news-date"><i className="fa-regular fa-clock" /> {formatNewsDate(item.date)}</time></div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="home-en-more"><Link to="/events-news" className="btn-ghost">View all Events &amp; News <i className="fa-solid fa-arrow-right" /></Link></div>
    </section>
  );
}
