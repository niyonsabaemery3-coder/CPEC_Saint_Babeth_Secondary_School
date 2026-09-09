import { useEffect, useState, useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import type { ContactMessage } from "../../../types";

type Filter = "all" | "unread" | "read";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MessagesView() {
  const {
    contactMessages,
    unreadMessageCount,
    fetchContactMessages,
    markMessageRead,
    markAllMessagesRead,
    deleteMessage,
    deleteAllMessages,
  } = useApp();

  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  useEffect(() => {
    fetchContactMessages().finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    let list = contactMessages;
    if (filter === "unread") list = list.filter((m) => !m.isRead);
    if (filter === "read") list = list.filter((m) => m.isRead);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.contact.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contactMessages, filter, search]);

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.isRead) {
      await markMessageRead(msg.id);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMessage(id);
    if (selected?.id === id) setSelected(null);
  };

  const handleClearAll = async () => {
    await deleteAllMessages();
    setSelected(null);
    setConfirmClearAll(false);
  };

  return (
    <div className="admin-panel-view active">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="msg-topbar">
        <div className="msg-topbar-left">
          <div className="msg-search-wrap">
            <i className="fa-solid fa-magnifying-glass msg-search-icon" />
            <input
              className="msg-search"
              placeholder="Search messages…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="msg-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
          <div className="msg-filter-tabs">
            {(["all", "unread", "read"] as Filter[]).map((f) => (
              <button
                key={f}
                className={`msg-filter-tab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "unread" ? "Unread" : "Read"}
                {f === "unread" && unreadMessageCount > 0 && (
                  <span className="msg-badge">{unreadMessageCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="msg-topbar-right">
          {unreadMessageCount > 0 && (
            <button className="a-add-btn" onClick={markAllMessagesRead}>
              <i className="fa-solid fa-check-double" /> Mark all read
            </button>
          )}
          {contactMessages.length > 0 && !confirmClearAll && (
            <button className="a-del-btn" onClick={() => setConfirmClearAll(true)}>
              <i className="fa-solid fa-trash" /> Clear all
            </button>
          )}
          {confirmClearAll && (
            <div className="msg-confirm-row">
              <span>Delete all messages?</span>
              <button className="a-del-btn" onClick={handleClearAll}>
                <i className="fa-solid fa-trash" /> Yes, delete
              </button>
              <button className="a-add-btn" onClick={() => setConfirmClearAll(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main layout: list + detail ───────────────────────────── */}
      <div className="msg-layout">
        {/* ── Left: message list ───────────────────────────────── */}
        <div className={`msg-list ${selected ? "msg-list-hidden-mobile" : ""}`}>
          {loading ? (
            <div className="msg-empty">
              <i className="fa-solid fa-spinner fa-spin" />
              <p>Loading messages…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="msg-empty">
              <i className="fa-regular fa-envelope-open" />
              <p>
                {search
                  ? "No messages match your search."
                  : filter === "unread"
                  ? "No unread messages."
                  : "No messages yet."}
              </p>
            </div>
          ) : (
            visible.map((msg) => (
              <button
                key={msg.id}
                className={`msg-item ${!msg.isRead ? "msg-item-unread" : ""} ${selected?.id === msg.id ? "msg-item-active" : ""}`}
                onClick={() => openMessage(msg)}
              >
                <div className="msg-item-avatar">
                  {msg.name.charAt(0).toUpperCase()}
                </div>
                <div className="msg-item-body">
                  <div className="msg-item-row1">
                    <span className="msg-item-name">
                      {!msg.isRead && <span className="msg-unread-dot" />}
                      {msg.name}
                    </span>
                    <span className="msg-item-time">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <div className="msg-item-contact">{msg.contact}</div>
                  <div className="msg-item-preview">{msg.message}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* ── Right: message detail ────────────────────────────── */}
        <div className={`msg-detail ${selected ? "msg-detail-open" : ""}`}>
          {!selected ? (
            <div className="msg-detail-empty">
              <i className="fa-regular fa-envelope" />
              <p>Select a message to read it</p>
            </div>
          ) : (
            <div className="msg-detail-inner">
              {/* back button — mobile only */}
              <button className="msg-back-btn" onClick={() => setSelected(null)}>
                <i className="fa-solid fa-arrow-left" /> Back to messages
              </button>

              <div className="msg-detail-header">
                <div className="msg-detail-avatar">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div className="msg-detail-meta">
                  <h3 className="msg-detail-name">{selected.name}</h3>
                  <a
                    className="msg-detail-contact"
                    href={
                      selected.contact.includes("@")
                        ? `mailto:${selected.contact}`
                        : `tel:${selected.contact}`
                    }
                  >
                    <i
                      className={`fa-solid ${
                        selected.contact.includes("@") ? "fa-envelope" : "fa-phone"
                      }`}
                    />{" "}
                    {selected.contact}
                  </a>
                  <span className="msg-detail-time">
                    <i className="fa-regular fa-clock" />{" "}
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  className="a-del-btn msg-detail-del"
                  onClick={() => handleDelete(selected.id)}
                  title="Delete message"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>

              <div className="msg-detail-divider" />

              <div className="msg-detail-body">
                <p className="msg-detail-text">{selected.message}</p>
              </div>

              <div className="msg-detail-actions">
                {selected.contact.includes("@") ? (
                  <a
                    className="a-add-btn"
                    href={`mailto:${selected.contact}?subject=Re: Your message to CPEC Saint Babeth TSS`}
                  >
                    <i className="fa-solid fa-reply" /> Reply by email
                  </a>
                ) : (
                  <a className="a-add-btn" href={`tel:${selected.contact}`}>
                    <i className="fa-solid fa-phone" /> Call back
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
