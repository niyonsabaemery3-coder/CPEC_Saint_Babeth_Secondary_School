import { useEffect, useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import { useNotifications } from "../../../hooks/useNotifications";

const COLOR_MAP: Record<string, string> = {
  navy: "#1e3a5f", green: "#2d6a3f", gold: "#b8860b", purple: "#6b3fa0", rust: "#a0522d",
};

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  const d = Math.round(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d < 0) return null;
  return `In ${d} day${d !== 1 ? "s" : ""}`;
}

interface StudentDashboardViewProps {
  onNavigate: (view: "resources" | "reports") => void;
}

export default function StudentDashboardView({ onNavigate }: StudentDashboardViewProps) {
  const { currentStudent, resources, eventItems, myReport, fetchMyReport } = useApp();

  const storageKey = `notifs-student-${currentStudent?.id ?? "x"}`;
  const { visible: notifications, unreadCount, addIfNew, markAllRead, dismiss, dismissAll } = useNotifications(storageKey);

  // Fetch report once on mount
  useEffect(() => { fetchMyReport(); /* eslint-disable-next-line */ }, []);

  // ── Derive stats ────────────────────────────────────────────────
  const myClassResources = useMemo(
    () => resources.filter((r) => r.schoolClass === currentStudent?.schoolClass),
    [resources, currentStudent]
  );

  const upcomingEvents = useMemo(
    () =>
      eventItems
        .filter((e) => daysUntil(e.date) !== null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [eventItems]
  );

  const resourcesByType = useMemo(() => {
    const counts = { notes: 0, presentation: 0, pastpaper: 0 };
    myClassResources.forEach((r) => { if (r.type in counts) counts[r.type]++; });
    return counts;
  }, [myClassResources]);

  // ── Auto-generate notifications ─────────────────────────────────
  useEffect(() => {
    // New report uploaded
    if (myReport) {
      addIfNew({
        id: `report-${myReport.updatedAt}`,
        icon: "fa-file-medical",
        title: "Your report has been uploaded",
        body: myReport.title ? `"${myReport.title}" is now available to view and download.` : "Your report is now available to view and download.",
        time: myReport.updatedAt,
        read: false,
      });
    }

    // New resources for this class
    const latest = myClassResources
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3);

    latest.forEach((r) => {
      addIfNew({
        id: `res-${r.id}`,
        icon: "fa-book",
        title: "New resource for your class",
        body: `"${r.title}" · ${r.subject} — uploaded by ${r.uploaderName}`,
        time: r.createdAt,
        read: false,
      });
    });

    // Upcoming events in next 7 days
    upcomingEvents.slice(0, 2).forEach((e) => {
      const d = daysUntil(e.date);
      if (!d) return;
      addIfNew({
        id: `evt-${e.id}`,
        icon: e.icon || "fa-calendar-days",
        title: "Upcoming school event",
        body: `${e.title} — ${d}${e.location ? ` · ${e.location}` : ""}`,
        time: new Date(e.date).toISOString(),
        read: false,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReport, myClassResources, upcomingEvents]);

  const initials = (currentStudent?.fullName ?? "S")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="dash-view">

      {/* ── Welcome banner ──────────────────────────────────────── */}
      <div className="dash-welcome">
        <div className="dash-welcome-avatar">{initials}</div>
        <div>
          <h2 className="dash-welcome-name">
            Welcome back, {currentStudent?.fullName?.split(" ")[0] ?? "Student"}
          </h2>
          <p className="dash-welcome-role">
            <i className="fa-solid fa-user-graduate" /> {currentStudent?.schoolClass} · {currentStudent?.email}
          </p>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="dash-stat-grid">
        <div className="dash-stat-card" onClick={() => onNavigate("reports")} role="button" tabIndex={0}>
          <div className="dash-stat-icon"
            style={myReport
              ? { background: "rgba(45,106,63,.12)", color: "var(--green)" }
              : { background: "rgba(200,78,78,.1)", color: "#c0392b" }}>
            <i className={`fa-solid ${myReport ? "fa-file-circle-check" : "fa-file-circle-xmark"}`} />
          </div>
          <div className="dash-stat-num" style={!myReport ? { fontSize: "15px" } : {}}>
            {myReport ? "Ready" : "Pending"}
          </div>
          <div className="dash-stat-lbl">My Report</div>
        </div>
        <div className="dash-stat-card" onClick={() => onNavigate("resources")} role="button" tabIndex={0}>
          <div className="dash-stat-icon" style={{ background: "rgba(230,169,53,.13)", color: "var(--gold-dark)" }}>
            <i className="fa-solid fa-folder-open" />
          </div>
          <div className="dash-stat-num">{myClassResources.length}</div>
          <div className="dash-stat-lbl">Resources for {currentStudent?.schoolClass}</div>
        </div>
        <div className="dash-stat-card" onClick={() => onNavigate("resources")} role="button" tabIndex={0}>
          <div className="dash-stat-icon" style={{ background: "rgba(30,58,95,.12)", color: "var(--navy)" }}>
            <i className="fa-solid fa-note-sticky" />
          </div>
          <div className="dash-stat-num">{resourcesByType.notes}</div>
          <div className="dash-stat-lbl">Notes</div>
        </div>
        <div className="dash-stat-card" onClick={() => onNavigate("resources")} role="button" tabIndex={0}>
          <div className="dash-stat-icon" style={{ background: "rgba(107,63,160,.12)", color: "#6b3fa0" }}>
            <i className="fa-solid fa-file-lines" />
          </div>
          <div className="dash-stat-num">{resourcesByType.pastpaper}</div>
          <div className="dash-stat-lbl">Past Papers</div>
        </div>
      </div>

      <div className="dash-two-col">
        {/* ── Upcoming events ───────────────────────────────────── */}
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
                    <div className="dash-event-dot" style={{ background: COLOR_MAP[e.colorKey] ?? COLOR_MAP.navy }}>
                      <i className={`fa-solid ${e.icon || "fa-calendar-days"}`} />
                    </div>
                    <div className="dash-event-info">
                      <div className="dash-event-title">{e.title}</div>
                      <div className="dash-event-meta">
                        {fmtDate(e.date)}{e.time ? ` · ${e.time}` : ""}{e.location ? ` · ${e.location}` : ""}
                      </div>
                    </div>
                    {badge && <span className="dash-event-badge">{badge}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Notifications ─────────────────────────────────────── */}
        <div className="dash-section">
          <div className="dash-section-head">
            <span>
              <i className="fa-solid fa-bell" /> Notifications
              {unreadCount > 0 && <span className="dash-notif-count">{unreadCount}</span>}
            </span>
            {notifications.length > 0 && (
              <div className="dash-section-actions">
                {unreadCount > 0 && (
                  <button className="dash-action-btn" onClick={markAllRead}>Mark all read</button>
                )}
                <button className="dash-action-btn dash-action-btn-del" onClick={dismissAll}>
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
                  <div className="dash-notif-icon">
                    <i className={`fa-solid ${n.icon}`} />
                  </div>
                  <div className="dash-notif-body">
                    <div className="dash-notif-title">{n.title}</div>
                    <div className="dash-notif-text">{n.body}</div>
                    <div className="dash-notif-time">
                      {new Date(n.time).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="dash-section">
        <div className="dash-section-head">
          <span><i className="fa-solid fa-bolt" /> Quick Actions</span>
        </div>
        <div className="dash-quick-actions">
          <button className="dash-quick-btn" onClick={() => onNavigate("resources")}>
            <i className="fa-solid fa-folder-open" />
            <span>Browse Resources</span>
          </button>
          <button className="dash-quick-btn" onClick={() => onNavigate("reports")}>
            <i className="fa-solid fa-file-medical" />
            <span>My Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
