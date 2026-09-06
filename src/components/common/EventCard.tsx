import { Link } from "react-router-dom";
import type { EventItem } from "../../types";
import { formatEventDateParts } from "../../utils/format";

interface EventCardProps {
  event: EventItem;
  color: string;
  interactive?: boolean;
}

function EventCardContent({ event, color }: Omit<EventCardProps, "interactive">) {
  const { month, day, year } = formatEventDateParts(event.date);
  const headerStyle = event.image
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.45)), url('${event.image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: color };

  return (
    <>
      <div className="en-ev-header" style={headerStyle}>
        <div className="en-ev-date-box">
          <span className="en-ev-month">{month}</span>
          <span className="en-ev-day">{day}</span>
          <span className="en-ev-year">{year}</span>
        </div>
        <div className="en-ev-icon-wrap" aria-hidden="true">
          <i className={`fa-solid ${event.icon} en-ev-icon`} />
        </div>
      </div>

      <div className="en-ev-body home-en-event-body">
        <div className="en-ev-body-fixed">
          <span className="en-ev-category" style={{ color, borderColor: color }}>
            {event.category}
          </span>
          <h3 className="en-ev-title">{event.title}</h3>
        </div>
        <div className="en-ev-desc-wrap home-en-event-desc-wrap">
          <p className="en-ev-desc">{event.description}</p>
        </div>
      </div>

      <div className="en-ev-footer home-en-event-footer">
        <span className="en-ev-footer-item">
          <i className="fa-regular fa-clock" aria-hidden="true" /> {event.time || "See event details"}
        </span>
        <span className="en-ev-footer-item">
          <i className="fa-solid fa-location-dot" aria-hidden="true" /> {event.location}
        </span>
      </div>
    </>
  );
}

export default function EventCard({ event, color, interactive = false }: EventCardProps) {
  const className = "en-ev-card home-en-event-card";
  const content = <EventCardContent event={event} color={color} />;

  if (interactive) {
    return (
      <Link to="/events-news" className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}
