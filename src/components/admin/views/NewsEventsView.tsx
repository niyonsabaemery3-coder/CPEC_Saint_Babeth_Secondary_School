import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { NewsEventsAdminTab, NewsItem, EventItem, EventColorKey } from "../../../types";
import { formatNewsDate, formatEventDateParts } from "../../../utils/format";
import FField from "../settings/FField";
import ImgTile from "../settings/ImgTile";
import FieldError from "../../common/FieldError";
import { isValid } from "../../../utils/validation";

const NEWS_CATEGORIES = ["Academics", "Achievement", "Admissions", "Community"];
const EVENT_CATEGORIES = ["Academics", "Meeting", "ICT Event", "Sports", "Community"];

const ICONS = [
  "fa-graduation-cap", "fa-display", "fa-people-group", "fa-microchip", "fa-trophy",
  "fa-calendar-days", "fa-book-open", "fa-music", "fa-flag", "fa-star",
  "fa-users", "fa-school", "fa-medal", "fa-clipboard-list", "fa-bullhorn",
];

const COLORS: { key: EventColorKey; label: string; swatch: string }[] = [
  { key: "navy",   label: "Navy",   swatch: "var(--navy)"      },
  { key: "green",  label: "Green",  swatch: "var(--green)"     },
  { key: "gold",   label: "Gold",   swatch: "var(--gold-dark)" },
  { key: "purple", label: "Purple", swatch: "#6b4fa3"          },
  { key: "rust",   label: "Rust",   swatch: "#b84c26"          },
];

const EMPTY_NEWS = { title: "", category: "Academics", excerpt: "", image: "", date: "" };
const EMPTY_EVENT = {
  title: "", category: "Academics", description: "", location: "",
  date: "", time: "", icon: "fa-calendar-days", colorKey: "navy" as EventColorKey, image: "",
};

export default function NewsEventsView() {
  const {
    newsItems, addNewsItem, updateNewsItem, deleteNewsItem,
    eventItems, addEventItem, updateEventItem, deleteEventItem,
  } = useApp();

  const [tab, setTab] = useState<NewsEventsAdminTab>("news");

  // ── News form ────────────────────────────────────────────
  const [newsFormOpen, setNewsFormOpen] = useState(false);
  const [newsEditId, setNewsEditId] = useState<number | null>(null);
  const [newsDraft, setNewsDraft] = useState(EMPTY_NEWS);
  const [newsErrors, setNewsErrors] = useState<Record<string, string>>({});
  const [newsBusy, setNewsBusy] = useState(false);
  const [newsNotice, setNewsNotice] = useState<string | null>(null);

  const openAddNews = () => {
    setNewsEditId(null);
    setNewsDraft(EMPTY_NEWS);
    setNewsErrors({});
    setNewsNotice(null);
    setNewsFormOpen(true);
  };

  const openEditNews = (n: NewsItem) => {
    setNewsEditId(n.id);
    setNewsDraft({ title: n.title, category: n.category, excerpt: n.excerpt, image: n.image, date: n.date });
    setNewsErrors({});
    setNewsNotice(null);
    setNewsFormOpen(true);
  };

  const closeNewsForm = () => setNewsFormOpen(false);

  const submitNews = async () => {
    const nextErrors = {
      title: newsDraft.title.trim() ? "" : "Title is required.",
      category: newsDraft.category.trim() ? "" : "Category is required.",
      date: newsDraft.date ? "" : "Date is required.",
      excerpt: newsDraft.excerpt.trim() ? "" : "A short excerpt is required.",
      image: newsDraft.image ? "" : "Choose a photo for this news item.",
    };
    setNewsErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setNewsBusy(true);
    try {
      if (newsEditId) await updateNewsItem(newsEditId, newsDraft);
      else await addNewsItem(newsDraft);
      setNewsFormOpen(false);
    } catch {
      setNewsNotice("Failed to save. Please try again.");
    } finally {
      setNewsBusy(false);
    }
  };

  const removeNews = (n: NewsItem) => {
    if (confirm(`Delete "${n.title}"? This cannot be undone.`)) deleteNewsItem(n.id);
  };

  // ── Event form ───────────────────────────────────────────
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [eventEditId, setEventEditId] = useState<number | null>(null);
  const [eventDraft, setEventDraft] = useState(EMPTY_EVENT);
  const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
  const [eventBusy, setEventBusy] = useState(false);
  const [eventNotice, setEventNotice] = useState<string | null>(null);

  const openAddEvent = () => {
    setEventEditId(null);
    setEventDraft(EMPTY_EVENT);
    setEventErrors({});
    setEventNotice(null);
    setEventFormOpen(true);
  };

  const openEditEvent = (ev: EventItem) => {
    setEventEditId(ev.id);
    setEventDraft({
      title: ev.title, category: ev.category, description: ev.description, location: ev.location,
      date: ev.date, time: ev.time, icon: ev.icon, colorKey: ev.colorKey, image: ev.image,
    });
    setEventErrors({});
    setEventNotice(null);
    setEventFormOpen(true);
  };

  const closeEventForm = () => setEventFormOpen(false);

  const submitEvent = async () => {
    const nextErrors = {
      title: eventDraft.title.trim() ? "" : "Title is required.",
      category: eventDraft.category.trim() ? "" : "Category is required.",
      date: eventDraft.date ? "" : "Date is required.",
      time: eventDraft.time.trim() ? "" : "Time is required.",
      location: eventDraft.location.trim() ? "" : "Location is required.",
      description: eventDraft.description.trim() ? "" : "A short description is required.",
    };
    setEventErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setEventBusy(true);
    try {
      if (eventEditId) await updateEventItem(eventEditId, eventDraft);
      else await addEventItem(eventDraft);
      setEventFormOpen(false);
    } catch {
      setEventNotice("Failed to save. Please try again.");
    } finally {
      setEventBusy(false);
    }
  };

  const removeEvent = (ev: EventItem) => {
    if (confirm(`Delete "${ev.title}"? This cannot be undone.`)) deleteEventItem(ev.id);
  };

  return (
    <div className="admin-panel-view active">

      {/* ══════════════ ADD/EDIT NEWS — card form (overlay, like login) ══════════════ */}
      <div className={`admin-overlay ${newsFormOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && closeNewsForm()}>
        <div className="admin-login-card teacher-auth-card news-event-form-card">
          <button className="a-close-btn" style={{ position: "static", float: "right", marginTop: "-10px", marginRight: "-10px" }} onClick={closeNewsForm}>
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="lock-icon"><i className="fa-solid fa-newspaper" /></div>
          <h3>{newsEditId ? "Edit News Item" : "New News Item"}</h3>
          <p>Shown on the "News &amp; Announcements" tab of the public Events &amp; News page.</p>
          {newsNotice && <div className="ta-notice err">{newsNotice}</div>}

          <div style={{ textAlign: "left" }}>
            <label className="nev-label">Photo</label>
            <ImgTile src={newsDraft.image} onChange={(v) => setNewsDraft((d) => ({ ...d, image: v }))} />
            <FieldError message={newsErrors.image} />

            <FField label="Title" value={newsDraft.title} onChange={(v) => setNewsDraft((d) => ({ ...d, title: v }))} />
            <FieldError message={newsErrors.title} />

            <div className="ffield always-float">
              <input list="news-categories" value={newsDraft.category} placeholder=" "
                onChange={(e) => setNewsDraft((d) => ({ ...d, category: e.target.value }))} />
              <label>Category</label>
              <datalist id="news-categories">
                {NEWS_CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <FieldError message={newsErrors.category} />

            <FField label="Date" type="date" value={newsDraft.date} onChange={(v) => setNewsDraft((d) => ({ ...d, date: v }))} />
            <FieldError message={newsErrors.date} />

            <FField label="Excerpt" value={newsDraft.excerpt} onChange={(v) => setNewsDraft((d) => ({ ...d, excerpt: v }))} multiline />
            <FieldError message={newsErrors.excerpt} />
          </div>

          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitNews} disabled={newsBusy}>
            <i className="fa-solid fa-check" /> {newsBusy ? "Saving…" : newsEditId ? "Save Changes" : "Publish News"}
          </button>
        </div>
      </div>

      {/* ══════════════ ADD/EDIT EVENT — card form (overlay, like login) ══════════════ */}
      <div className={`admin-overlay ${eventFormOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && closeEventForm()}>
        <div className="admin-login-card teacher-auth-card news-event-form-card">
          <button className="a-close-btn" style={{ position: "static", float: "right", marginTop: "-10px", marginRight: "-10px" }} onClick={closeEventForm}>
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="lock-icon"><i className="fa-solid fa-calendar-days" /></div>
          <h3>{eventEditId ? "Edit Upcoming Event" : "New Upcoming Event"}</h3>
          <p>Shown on the "Upcoming Events" tab of the public Events &amp; News page.</p>
          {eventNotice && <div className="ta-notice err">{eventNotice}</div>}

          <div style={{ textAlign: "left" }}>
            <label className="nev-label">Header photo (optional)</label>
            <ImgTile src={eventDraft.image} onChange={(v) => setEventDraft((d) => ({ ...d, image: v }))} />
            {eventDraft.image && (
              <button type="button" className="btn-ghost" style={{ marginBottom: 12 }} onClick={() => setEventDraft((d) => ({ ...d, image: "" }))}>
                <i className="fa-solid fa-xmark" /> Remove photo — use the plain color header instead
              </button>
            )}
            {!eventDraft.image && (
              <p className="nev-hint">No photo chosen — the card header will use the color you pick below, like every event has today.</p>
            )}

            <FField label="Title" value={eventDraft.title} onChange={(v) => setEventDraft((d) => ({ ...d, title: v }))} />
            <FieldError message={eventErrors.title} />

            <div className="ffield always-float">
              <input list="event-categories" value={eventDraft.category} placeholder=" "
                onChange={(e) => setEventDraft((d) => ({ ...d, category: e.target.value }))} />
              <label>Category</label>
              <datalist id="event-categories">
                {EVENT_CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <FieldError message={eventErrors.category} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <FField label="Date" type="date" value={eventDraft.date} onChange={(v) => setEventDraft((d) => ({ ...d, date: v }))} />
                <FieldError message={eventErrors.date} />
              </div>
              <div>
                <FField label="Time (e.g. 07:30 AM)" value={eventDraft.time} onChange={(v) => setEventDraft((d) => ({ ...d, time: v }))} />
                <FieldError message={eventErrors.time} />
              </div>
            </div>

            <FField label="Location" value={eventDraft.location} onChange={(v) => setEventDraft((d) => ({ ...d, location: v }))} />
            <FieldError message={eventErrors.location} />

            <FField label="Description" value={eventDraft.description} onChange={(v) => setEventDraft((d) => ({ ...d, description: v }))} multiline />
            <FieldError message={eventErrors.description} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="ffield always-float">
                <select value={eventDraft.icon} onChange={(e) => setEventDraft((d) => ({ ...d, icon: e.target.value }))}>
                  {ICONS.map((ic) => <option key={ic} value={ic}>{ic.replace("fa-", "")}</option>)}
                </select>
                <label>Icon</label>
              </div>
              <div className="ffield always-float">
                <select value={eventDraft.colorKey} onChange={(e) => setEventDraft((d) => ({ ...d, colorKey: e.target.value as EventColorKey }))}>
                  {COLORS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <label>Header color</label>
              </div>
            </div>
            <div className="nev-color-preview">
              <i className={`fa-solid ${eventDraft.icon}`} style={{ background: COLORS.find((c) => c.key === eventDraft.colorKey)?.swatch }} />
              <span>Preview of the default header (used when no photo is chosen)</span>
            </div>
          </div>

          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitEvent} disabled={eventBusy}>
            <i className="fa-solid fa-check" /> {eventBusy ? "Saving…" : eventEditId ? "Save Changes" : "Publish Event"}
          </button>
        </div>
      </div>

      {/* ── Sub-tabs: News & Event / Upcoming Event ── */}
      <div className="sub-tabs">
        <button className={`sub-tab ${tab === "news" ? "active" : ""}`} onClick={() => setTab("news")}>
          <i className="fa-solid fa-newspaper" /> News &amp; Event
          <span className="count">{newsItems.length}</span>
        </button>
        <button className={`sub-tab ${tab === "events" ? "active" : ""}`} onClick={() => setTab("events")}>
          <i className="fa-solid fa-calendar-days" /> Upcoming Event
          <span className="count">{eventItems.length}</span>
        </button>
      </div>

      {/* ════════════════ NEWS TAB ════════════════ */}
      {tab === "news" && (
        <>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button className="a-add-btn" onClick={openAddNews}>
              <i className="fa-solid fa-plus" /> Add News
            </button>
          </div>

          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {newsItems.length === 0 ? (
                  <tr><td colSpan={5} className="a-empty">No news items yet. Use "Add News" above to publish one.</td></tr>
                ) : (
                  newsItems.map((n) => (
                    <tr key={n.id}>
                      <td><div className="nev-thumb" style={{ backgroundImage: n.image ? `url('${n.image}')` : undefined }} /></td>
                      <td><b>{n.title}</b></td>
                      <td>{n.category}</td>
                      <td>{formatNewsDate(n.date)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="a-approve-btn" onClick={() => openEditNews(n)}>
                          <i className="fa-solid fa-pen" /> Edit
                        </button>
                        <button className="a-del-btn" style={{ marginLeft: "6px" }} onClick={() => removeNews(n)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ════════════════ EVENTS TAB ════════════════ */}
      {tab === "events" && (
        <>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button className="a-add-btn" onClick={openAddEvent}>
              <i className="fa-solid fa-plus" /> Add Upcoming Event
            </button>
          </div>

          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {eventItems.length === 0 ? (
                  <tr><td colSpan={7} className="a-empty">No upcoming events yet. Use "Add Upcoming Event" above to publish one.</td></tr>
                ) : (
                  eventItems.map((ev) => {
                    const { month, day, year } = formatEventDateParts(ev.date);
                    const swatch = COLORS.find((c) => c.key === ev.colorKey)?.swatch || "var(--navy)";
                    return (
                      <tr key={ev.id}>
                        <td>
                          <div
                            className="nev-thumb"
                            style={ev.image ? { backgroundImage: `url('${ev.image}')` } : { background: swatch }}
                          >
                            {!ev.image && <i className={`fa-solid ${ev.icon}`} />}
                          </div>
                        </td>
                        <td><b>{ev.title}</b></td>
                        <td>{ev.category}</td>
                        <td>{month} {day}, {year}</td>
                        <td>{ev.time}</td>
                        <td>{ev.location}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button className="a-approve-btn" onClick={() => openEditEvent(ev)}>
                            <i className="fa-solid fa-pen" /> Edit
                          </button>
                          <button className="a-del-btn" style={{ marginLeft: "6px" }} onClick={() => removeEvent(ev)}>
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
