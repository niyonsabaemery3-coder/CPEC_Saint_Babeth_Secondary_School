import { useEffect, useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import { useNotifications } from "../../../hooks/useNotifications";

// CSS colour tokens for each EventItem colorKey value
const COLOR_MAP: Record<string, string> = {
  navy:   "#1e3a5f",
  green:  "#2d6a3f",
  gold:   "#b8860b",
  purple: "#6b3fa0",
  rust:   "#a0522d",
};

// Only notify about events / resources that are "new" within this window.
// Anything older than 30 days is considered already known.
const NOTIFY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return d; }
}

/** Returns a human label for how far away a date is, or null if it is in the past. */
function daysUntil(dateStr: string): string | null {
  // Parse as local date (noon) so timezone offsets don't flip the day
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d, 12, 0, 0).getTime();
  const todayNoon = new Date();
  todayNoon.setHours(12, 0, 0, 0);
  const diff = Math.round((target - todayNoon.getTime()) / 86_400_000);
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} day${diff !== 1 ? "s" : ""}`;
}

interface TeacherDashboardViewProps {
  onNavigate: (view: "resources" | "add" | "settings") => void;
}

export default function TeacherDashboardView({ onNavigate }: TeacherDashboardViewProps) {
  const { currentTeacher, resources, eventItems } = useApp();

  const storageKey = `notifs-teacher-${currentTeacher?.id ?? "x"}`;
  const {
    visible: notifications,
    unreadCount,
    addIfNew,
    markAllRead,
    dismiss,
    dismissAll,
  } = useNotifications(storageKey);

  // ── Stats — only count the logged-in teacher's own uploads ──────
  const myResources = useMemo(
    () => resources.filter((r) => r.uploaderId === currentTeacher?.id),
    [resources, currentTeacher]
  );

  const typeCount = useMemo(() => {
    const counts = { notes: 0, presentation: 0, pastpaper: 0 };
    myResources.forEach((r) => {
      if (r.type in counts) counts[r.type as keyof typeof counts]++;
    });
    return counts;
  }, [myResources]);

  // ── Upcoming events — only future dates, closest first ──────────
  const upcomingEvents = useMemo(
    () =>
      eventItems
        .filter((e) => daysUntil(e.date) !== null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [eventItems]
  );

  // ── Auto-generate notifications — only for recent data ──────────
  useEffect(() => {
    const now = Date.now();

    // Resources uploaded by OTHER teachers in the same subject, within 30 days
    resources
      .filter(
        (r) =>
          r.uploaderId !== currentTeacher?.id &&
          r.subject === currentTeacher?.subject &&
          now - new Date(r.createdAt).getTime() <= NOTIFY_WINDOW_MS
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3)
      .forEach((r) => {
        addIfNew({
          id: `res-${r.id}`,
          icon: "fa-book",
          title: "New resource in your subject",
          body: `"${r.title}" — ${r.schoolClass} · ${r.subject}`,
          time: r.createdAt,
          read: false,
        });
      });

    // Events happening within the next 7 days
    upcomingEvents
      .filter((e) => {
        const [y, m, d] = e.date.split("-").map(Number);
        const evMs = new Date(y, m - 1, d).getTime();
        return evMs - now <= 7 * 24 * 60 * 60 * 1000;
      })
      .forEach((e) => {
        const label = daysUntil(e.date);
        if (!label) return;
        addIfNew({
          id: `evt-${e.id}`,
          icon: e.icon || "fa-calendar-days",
          title: "Upcoming school event",
          body: `${e.title} — ${label}${e.location ? ` · ${e.location}` : ""}`,
          // Store as a plain date string so the notification time is stable
          time: new Date(e.date + "T12:00:00").toISOString(),
          read: false,
        });
      });
  // Intentionally omits addIfNew from deps — it is stable (useCallback) and
  // including it would create an infinite loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources, upcomingEvents, currentTeacher]);

  // ── Initials for the avatar ──────────────────────────────────────
  const initials = (currentTeacher?.fullName ?? "T")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="dash-view">

      {/* ── Welcome banner ──────────────────────────────────────── */}
      <div className="dash-welcome">
        <div className="dash-welcome-avatar">{initials}</div>
        <div>
          <h2 className="dash-welcome-name">
            Welcome back, {currentTeacher?.fullName?.split(" ")[0] ?? "Teacher"}
          </h2>
          <p className="dash-welcome-role">
            <i className="fa-solid fa-chalkboard-user" />
            {currentTeacher?.subject} · {currentTeacher?.email}
          </p>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="dash-stat-grid">
        <button
          className="dash-stat-card"
          onClick={() => onNavigate("resources")}
          aria-label={`My resources — ${myResources.length} total`}
        >
          <div className="dash-stat-icon" style={{ background: "rgba(230,169,53,.13)", color: "var(--gold-dark)" }}>
            <i className="fa-solid fa-folder-open" />
          </div>
          <div className="dash-stat-num">{myResources.length}</div>
          <div className="dash-stat-lbl">My Resources</div>
        </button>

        <button
          className="dash-stat-card"
          onClick={() => onNavigate("resources")}
          aria-label={`Notes — ${typeCount.notes}`}
        >
          <div className="dash-stat-icon" style={{ background: "rgba(45,106,63,.12)", color: "var(--green)" }}>
            <i className="fa-solid fa-note-sticky" />
          </div>
          <div className="dash-stat-num">{typeCount.notes}</div>
          <div className="dash-stat-lbl">Notes</div>
        </button>

        <button
          className="dash-stat-card"
          onClick={() => onNavigate("resources")}
          aria-label={`Presentations — ${typeCount.presentation}`}
        >
          <div className="dash-stat-icon" style={{ background: "rgba(30,58,95,.12)", color: "var(--navy)" }}>
            <i className="fa-solid fa-display" />
          </div>
          <div className="dash-stat-num">{typeCount.presentation}</div>
          <div className="dash-stat-lbl">Presentations</div>
        </button>

        <button
          className="dash-stat-card"
          onClick={() => onNavigate("resources")}
          aria-label={`Past papers — ${typeCount.pastpaper}`}
        >
          <div className="dash-stat-icon" style={{ background: "rgba(160,82,45,.12)", color: "#a0522d" }}>
            <i className="fa-solid fa-file-lines" />
          </div>
          <div className="dash-stat-num">{typeCount.pastpaper}</div>
          <div className="dash-stat-lbl">Past Papers</div>
        </button>
      </div>

      {/* ── Two-column: events + notifications ──────────────────── */}
      <div className="dash-two-col">

        {/* Upcoming events */}
        <div className="dash-section">
          <div className="dash-section-head">
            <span><i className="fa-solid fa-calendar-days" /> Upcoming Events</span>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="dash-empty">No upcoming events scheduled.</p>
          ) : (
            <div className="dash-events-list">
              {upcomingEvents.map((e) => {
                const badge = daysUntil(e.date);
                return (
                  <div className="dash-event-row" key={e.id}>
                    <div
                      className="dash-event-dot"
                      style={{ background: COLOR_MAP[e.colorKey] ?? COLOR_MAP.navy }}
                      aria-hidden="true"
                    >
                      <i className={`fa-solid ${e.icon}`} />
                    </div>
                    <div className="dash-event-info">
                      <div className="dash-event-title">{e.title}</div>
                      <div className="dash-event-meta">
                        {fmtDate(e.date)}
                        {e.time   ? ` · ${e.time}`     : ""}
                        {e.location ? ` · ${e.location}` : ""}
                      </div>
                    </div>
                    {badge && <span className="dash-event-badge">{badge}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="dash-section">
          <div className="dash-section-head">
            <span>
              <i className="fa-solid fa-bell" /> Notifications
              {unreadCount > 0 && (
                <span className="dash-notif-count">{unreadCount}</span>
              )}
            </span>
            {notifications.length > 0 && (
              <div className="dash-section-actions">
                {unreadCount > 0 && (
                  <button className="dash-action-btn" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
                <button
                  className="dash-action-btn dash-action-btn-del"
                  onClick={dismissAll}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="dash-empty">You're all caught up — no notifications.</p>
          ) : (
            <div className="dash-notif-list">
              {notifications.map((n) => (
                <div key={n.id} className={`dash-notif-row${n.read ? " read" : ""}`}>
                  <div className="dash-notif-icon" aria-hidden="true">
                    <i className={`fa-solid ${n.icon}`} />
                  </div>
                  <div className="dash-notif-body">
                    <div className="dash-notif-title">{n.title}</div>
                    <div className="dash-notif-text">{n.body}</div>
                    <div className="dash-notif-time">
                      {new Date(n.time).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    className="dash-notif-dismiss"
                    onClick={() => dismiss(n.id)}
                    title="Dismiss"
                    aria-label="Dismiss notification"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ───────────────────────────────────────── */}
      <div className="dash-section">
        <div className="dash-section-head">
          <span><i className="fa-solid fa-bolt" /> Quick Actions</span>
        </div>
        <div className="dash-quick-actions">
          <button className="dash-quick-btn" onClick={() => onNavigate("add")}>
            <i className="fa-solid fa-circle-plus" />
            <span>Add Resource</span>
          </button>
          <button className="dash-quick-btn" onClick={() => onNavigate("resources")}>
            <i className="fa-solid fa-folder-open" />
            <span>My Resources</span>
          </button>
          <button className="dash-quick-btn" onClick={() => onNavigate("settings")}>
            <i className="fa-solid fa-gear" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
