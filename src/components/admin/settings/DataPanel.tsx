import { useEffect, useState } from "react";
import { api, API_URL, getAdminToken } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StorageInfo {
  provider: string;
  totalFiles: number;
  maxFileSizeMb: number;
  allowedImages: string[];
  allowedDocs: string[];
}

interface DbStats {
  counts: Record<string, number>;
  dbSizeMb: number;
  tableCount: number;
  storage: StorageInfo;
  recordedAt: string;
}

type Tab = "database" | "storage" | "management";

type ExportKey = "applications" | "students" | "teachers" | "resources" | "all";

// ─── Sub-navigation tabs ──────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "database",   label: "Database",        icon: "fa-database" },
  { key: "storage",    label: "Storage",          icon: "fa-hard-drive" },
  { key: "management", label: "Data Management",  icon: "fa-sliders" },
];

// ─── Table descriptions ───────────────────────────────────────────────────────

const TABLE_META: [string, string][] = [
  ["applications",    "Admission requests"],
  ["student_accounts","Student accounts"],
  ["teacher_accounts","Teacher accounts"],
  ["resources",       "Learning resources"],
  ["gallery_items",   "Gallery photos"],
  ["programs",        "Academic programs"],
  ["news_items",      "News articles"],
  ["upcoming_events", "Upcoming events"],
  ["faqs",            "Chat FAQs"],
  ["teachers",        "Teacher profiles"],
  ["student_reports", "Student reports"],
  ["audit_logs",      "Audit log entries"],
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function DataPanel() {
  const [tab, setTab] = useState<Tab>("database");

  // Stats state
  const [stats, setStats] = useState<DbStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Export state — per-type
  const [exportState, setExportState] = useState<Record<ExportKey, "idle" | "loading" | "done" | "error">>({
    applications: "idle", students: "idle", teachers: "idle", resources: "idle", all: "idle",
  });

  const loadStats = async () => {
    try {
      const data = await api.get<DbStats>("/api/site/stats", "admin");
      setStats(data);
      setStatsError(false);
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const refresh = () => {
    setRefreshing(true);
    setStatsLoading(true);
    loadStats();
  };

  const doExport = async (key: ExportKey) => {
    setExportState((s) => ({ ...s, [key]: "loading" }));
    try {
      const token = getAdminToken();
      const url = `${API_URL}/api/site/export${key !== "all" ? `?type=${key}` : ""}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `cpec-${key}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      setExportState((s) => ({ ...s, [key]: "done" }));
      setTimeout(() => setExportState((s) => ({ ...s, [key]: "idle" })), 3000);
    } catch {
      setExportState((s) => ({ ...s, [key]: "error" }));
      setTimeout(() => setExportState((s) => ({ ...s, [key]: "idle" })), 4000);
    }
  };

  const totalRecords = stats
    ? Object.values(stats.counts).reduce((a, b) => a + b, 0)
    : 0;

  const fmt = (n: number) => n.toLocaleString();

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <h3>Data &amp; Storage</h3>
      <p className="sp-sub">Monitor your database, manage storage, and export data.</p>

      {/* ── Sub-navigation ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "22px",
          background: "var(--surface-2)",
          borderRadius: "var(--r-pill)",
          padding: "4px",
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              flex: "1 1 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "9px 16px",
              borderRadius: "var(--r-pill)",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              transition: "background .2s, color .2s, box-shadow .2s",
              background: tab === t.key ? "var(--paper)" : "transparent",
              color: tab === t.key ? "var(--ink)" : "var(--ink-soft)",
              boxShadow: tab === t.key ? "var(--shadow-sm)" : "none",
            }}
          >
            <i className={`fa-solid ${t.icon}`} style={{ fontSize: "12px", color: tab === t.key ? "var(--gold-dark)" : "inherit" }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DATABASE TAB ───────────────────────────────────── */}
      {tab === "database" && (
        <div>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "11px", fontWeight: 800, padding: "3px 10px",
                  borderRadius: "var(--r-pill)",
                  background: stats ? "var(--green-soft)" : statsError ? "rgba(192,57,43,.10)" : "var(--surface-2)",
                  color: stats ? "var(--green)" : statsError ? "#c0392b" : "var(--ink-faint)",
                }}
              >
                <i className={`fa-solid ${stats ? "fa-circle-check" : statsError ? "fa-circle-xmark" : "fa-spinner fa-spin"}`} />
                {stats ? "Connected" : statsError ? "Unavailable" : "Loading…"}
              </span>
            </div>
            <button
              className="btn-ghost"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              onClick={refresh}
              disabled={refreshing || statsLoading}
            >
              <i className={`fa-solid fa-rotate${refreshing ? " fa-spin" : ""}`} />
              {" "}{refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {/* Loading */}
          {statsLoading && !stats && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--ink-faint)" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "22px", marginBottom: "10px", display: "block" }} />
              Loading statistics…
            </div>
          )}

          {/* Error */}
          {statsError && !statsLoading && (
            <div className="sp-block" style={{ textAlign: "center", color: "var(--ink-soft)", padding: "28px" }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "20px", color: "var(--gold-dark)", marginBottom: "8px", display: "block" }} />
              Unable to load database statistics. Check your connection and try again.
            </div>
          )}

          {stats && (
            <>
              {/* Summary grid — 4 compact cards */}
              <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: "18px" }}>
                {[
                  { icon: "fa-database",    label: "DB Size",      value: `${stats.dbSizeMb} MB`,       sub: "MySQL · InnoDB" },
                  { icon: "fa-table",       label: "Tables",       value: String(stats.tableCount),      sub: "Schema tables" },
                  { icon: "fa-layer-group", label: "Total Records", value: fmt(totalRecords),             sub: "Across all tables" },
                  { icon: "fa-clock",       label: "Last Checked", value: new Date(stats.recordedAt).toLocaleTimeString(), sub: new Date(stats.recordedAt).toLocaleDateString() },
                ].map((c) => (
                  <div className="stat-card" key={c.label} style={{ minHeight: "auto", padding: "16px 14px" }}>
                    <div className="stat-card-icon"><i className={`fa-solid ${c.icon}`} /></div>
                    <div className="num" style={{ fontSize: "20px", lineHeight: 1.1 }}>{c.value}</div>
                    <div className="lbl">{c.label}</div>
                    <div style={{ fontSize: "10.5px", color: "var(--ink-faint)", marginTop: "2px" }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Table breakdown */}
              <div className="sp-block" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--line-soft)" }}>
                  <h5 style={{ margin: 0 }}>Table breakdown</h5>
                </div>
                <div className="a-table-wrap" style={{ boxShadow: "none", border: "none", borderRadius: 0 }}>
                  <table className="a-table">
                    <thead>
                      <tr>
                        <th>Table</th>
                        <th style={{ width: "80px" }}>Records</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TABLE_META.map(([table, desc]) => (
                        <tr key={table}>
                          <td style={{ fontWeight: 700, fontSize: "13px" }}>{table}</td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                background: "var(--surface-2)",
                                borderRadius: "var(--r-pill)",
                                padding: "2px 10px",
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "var(--ink)",
                              }}
                            >
                              {fmt(stats.counts[table] ?? 0)}
                            </span>
                          </td>
                          <td style={{ color: "var(--ink-soft)", fontSize: "12.5px" }}>{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STORAGE TAB ────────────────────────────────────── */}
      {tab === "storage" && (
        <div>
          <div className="sp-block">
            {/* Provider header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "16px", borderBottom: "1px solid var(--line-soft)" }}>
              <div style={{ width: "38px", height: "38px", flexShrink: 0, borderRadius: "var(--r-sm)", background: "linear-gradient(150deg,#fdf1d6,#f7dfa0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "var(--gold-dark)" }}>
                <i className="fa-solid fa-cloud" />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".4px", color: "var(--ink-faint)", marginBottom: "2px" }}>Storage Provider</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
                  {statsLoading
                    ? <span style={{ color: "var(--ink-faint)" }}>Loading…</span>
                    : stats?.storage.provider ?? "—"}
                </div>
              </div>
            </div>

            {/* Usage rows — real data from stats API */}
            {[
              { label: "Total Files",   value: statsLoading ? "—" : stats ? fmt(stats.storage.totalFiles) : "—" },
              { label: "Max File Size", value: statsLoading ? "—" : stats ? `${stats.storage.maxFileSizeMb} MB` : "—" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>{row.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>{row.value}</span>
              </div>
            ))}

            {/* Supported file types */}
            <div style={{ marginTop: "18px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".4px", color: "var(--gold-dark)", marginBottom: "12px" }}>Supported File Types</div>
              <div style={{ padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "13px", color: "var(--ink-soft)", flexShrink: 0 }}>Images</span>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {(stats?.storage.allowedImages ?? ["JPG", "PNG", "WebP", "GIF"]).map((ext) => (
                      <span key={ext} style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "var(--r-pill)", background: "var(--surface-2)", color: "var(--ink)" }}>{ext}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ padding: "10px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "13px", color: "var(--ink-soft)", flexShrink: 0 }}>Documents</span>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {(stats?.storage.allowedDocs ?? ["PDF", "DOC", "DOCX", "PPT"]).map((ext) => (
                      <span key={ext} style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "var(--r-pill)", background: "var(--surface-2)", color: "var(--ink)" }}>{ext}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DATA MANAGEMENT TAB ────────────────────────────── */}
      {tab === "management" && (
        <div>
          <div className="sp-block">
            <h5>Export Data</h5>
            <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "16px", lineHeight: 1.6 }}>
              Download a copy of your school data as a JSON file. Each export contains the latest records at the time of download.
            </p>

            {/* Export rows */}
            {(
              [
                { key: "applications" as ExportKey, icon: "fa-file-pen",         label: "Admission Requests",    desc: "All submitted admission requests and their statuses." },
                { key: "students"     as ExportKey, icon: "fa-user-graduate",     label: "Student Accounts",      desc: "All registered student accounts." },
                { key: "teachers"     as ExportKey, icon: "fa-chalkboard-user",   label: "Teacher Accounts",      desc: "All registered teacher accounts." },
                { key: "resources"    as ExportKey, icon: "fa-book-open",         label: "Learning Resources",    desc: "All uploaded notes, presentations, and past papers." },
                { key: "all"          as ExportKey, icon: "fa-download",          label: "All Data",              desc: "Export everything in a single file." },
              ] as { key: ExportKey; icon: string; label: string; desc: string }[]
            ).map((item, idx, arr) => {
              const st = exportState[item.key];
              return (
                <div
                  key={item.key}
                  className="reg-toggle-row"
                  style={{ cursor: "default", borderBottom: idx < arr.length - 1 ? undefined : "none" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "11px", flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: "34px", height: "34px", flexShrink: 0, borderRadius: "10px",
                        background: "linear-gradient(150deg, #fdf1d6, #f7dfa0)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "14px", color: "var(--gold-dark)",
                      }}
                    >
                      <i className={`fa-solid ${item.icon}`} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <b style={{ display: "block", fontSize: "13.5px" }}>{item.label}</b>
                      <small style={{ color: "var(--ink-soft)" }}>{item.desc}</small>
                      {st === "done" && (
                        <small style={{ color: "var(--green)", fontWeight: 700, display: "block", marginTop: "2px" }}>
                          <i className="fa-solid fa-circle-check" /> Exported successfully.
                        </small>
                      )}
                      {st === "error" && (
                        <small style={{ color: "#c0392b", fontWeight: 700, display: "block", marginTop: "2px" }}>
                          <i className="fa-solid fa-triangle-exclamation" /> Unable to export. Please try again.
                        </small>
                      )}
                    </div>
                  </div>
                  <button
                    className="a-add-btn"
                    onClick={() => doExport(item.key)}
                    disabled={st === "loading"}
                    style={{ flexShrink: 0, marginLeft: "12px" }}
                  >
                    {st === "loading"
                      ? <><i className="fa-solid fa-spinner fa-spin" /> Exporting…</>
                      : <><i className="fa-solid fa-download" /> Export</>
                    }
                  </button>
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="sp-block" style={{ borderColor: "rgba(63,125,58,.2)" }}>
            <h5 style={{ color: "var(--green)" }}>About your data</h5>
            <ul className="data-info-list">
              <li>All school data is stored in a MySQL database shared in real time across every device.</li>
              <li>Exported files contain a snapshot of your data at the time of export — they are not live backups.</li>
              <li>For a full database backup, use your hosting provider's database backup feature.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
