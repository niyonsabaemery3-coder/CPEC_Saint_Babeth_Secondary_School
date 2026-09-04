import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { SchoolClass, StudentsAdminTab } from "../../../types";
import ClassOptions from "../../common/ClassOptions";
import Pagination from "../../common/Pagination";
import FieldError from "../../common/FieldError";
import { validateMinLength, validateEmail, validatePassword, isValid } from "../../../utils/validation";
import { classLabel } from "../../../constants/academics";

const PAGE_SIZE = 10;

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export default function StudentsView() {
  const {
    studentAccounts,
    createStudentAccount,
    activateStudentAccount,
    deactivateStudentAccount,
    deleteStudentAccount,
    studentReports,
    fetchStudentReports,
    deleteStudentReport,
    uploadStudentReports,
  } = useApp();

  const [tab, setTab] = useState<StudentsAdminTab>("accounts");

  // ── Fetch reports on mount ──────────────────────────────
  useEffect(() => {
    fetchStudentReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Create account form ─────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [acFullName, setAcFullName] = useState("");
  const [acEmail, setAcEmail] = useState("");
  const [acClass, setAcClass] = useState("S1");
  const [acPassword, setAcPassword] = useState("");
  const [acNotice, setAcNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [acBusy, setAcBusy] = useState(false);
  const [acErrors, setAcErrors] = useState<Record<string, string>>({});

  const resetCreateForm = () => {
    setAcFullName(""); setAcEmail(""); setAcClass("S1");
    setAcPassword(""); setAcErrors({}); setAcNotice(null);
  };
  const closeCreateForm = () => { setCreateOpen(false); resetCreateForm(); };

  const handleCreateAccount = async () => {
    const nextErrors = {
      fullName: validateMinLength(acFullName, 3, "Full name"),
      email: validateEmail(acEmail),
      password: validatePassword(acPassword, 6),
    };
    setAcErrors(nextErrors);
    if (!isValid(nextErrors)) return;
    setAcBusy(true);
    const res = await createStudentAccount({
      fullName: acFullName.trim(), email: acEmail.trim(),
      schoolClass: acClass, password: acPassword,
    });
    setAcBusy(false);
    if (res.ok) closeCreateForm();
    else setAcNotice({ kind: "err", text: res.message });
  };

  // ── Shared filter state (reused by both tabs) ───────────
  const [cls, setCls] = useState<SchoolClass | "all">("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const rows = studentAccounts.filter(
      (s) =>
        (cls === "all" || s.schoolClass === cls) &&
        (!query || s.fullName.toLowerCase().includes(query) || s.email.toLowerCase().includes(query))
    );
    rows.sort((a, b) =>
      sortDir === "asc" ? a.fullName.localeCompare(b.fullName) : b.fullName.localeCompare(a.fullName)
    );
    return rows;
  }, [studentAccounts, cls, query, sortDir]);

  useEffect(() => { setPage(1); }, [cls, query, sortDir, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleOne = (id: number) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.has(s.id));
  const toggleAllVisible = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (allVisibleSelected) visible.forEach((s) => n.delete(s.id));
      else visible.forEach((s) => n.add(s.id));
      return n;
    });

  // ── Accounts tab: print/csv ─────────────────────────────
  const reportRows = selected.size > 0 ? filtered.filter((s) => selected.has(s.id)) : filtered;
  const clsLabel = cls === "all" ? "All Classes" : `Senior ${cls.slice(1)} (${cls})`;
  const generatedAt = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const exportCsv = () => {
    const header = ["#", "Full Name", "Email", "Class", "Status", "Registered"];
    const lines = [header.join(",")];
    reportRows.forEach((s, i) =>
      lines.push([i + 1, s.fullName, s.email, s.schoolClass, s.status, s.createdAt].map((v) => csvEscape(String(v))).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${cls === "all" ? "all" : cls}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // ── Reports tab ─────────────────────────────────────────
  const reportByStudent = useMemo(() => {
    const map = new Map<number, (typeof studentReports)[number]>();
    studentReports.forEach((r) => map.set(r.studentId, r));
    return map;
  }, [studentReports]);

  const [uploadFor, setUploadFor] = useState<typeof studentAccounts | null>(null);

  const handleDeleteReport = async (studentId: number) => {
    if (!window.confirm("Remove this student's report file? This can't be undone.")) return;
    await deleteStudentReport(studentId);
  };

  return (
    <div className="admin-panel-view active">

      {/* ── Create Student Account overlay ── */}
      <div className={`admin-overlay ${createOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && closeCreateForm()}>
        <div className="admin-login-card teacher-auth-card">
          <button className="a-close-btn" style={{ position: "static", float: "right", marginTop: "-10px", marginRight: "-10px" }} onClick={closeCreateForm}>
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="lock-icon"><i className="fa-solid fa-graduation-cap" /></div>
          <h3>New Student Account</h3>
          <p>The account will be active immediately — share the credentials with the student.</p>
          {acNotice && <div className={`ta-notice ${acNotice.kind === "ok" ? "info" : "err"}`}>{acNotice.text}</div>}
          <input type="text" placeholder="Full name" value={acFullName} onChange={(e) => setAcFullName(e.target.value)} className={acErrors.fullName ? "field-invalid" : ""} />
          <FieldError message={acErrors.fullName} />
          <select value={acClass} onChange={(e) => setAcClass(e.target.value)}><ClassOptions /></select>
          <input type="email" placeholder="Email address" value={acEmail} onChange={(e) => setAcEmail(e.target.value)} className={acErrors.email ? "field-invalid" : ""} />
          <FieldError message={acErrors.email} />
          <input type="password" placeholder="Password (min. 6 characters)" value={acPassword} onChange={(e) => setAcPassword(e.target.value)} className={acErrors.password ? "field-invalid" : ""} onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()} />
          <FieldError message={acErrors.password} />
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleCreateAccount} disabled={acBusy}>
            <i className="fa-solid fa-user-plus" /> {acBusy ? "Creating…" : "Create Account"}
          </button>
        </div>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="sub-tabs">
        <button className={`sub-tab ${tab === "accounts" ? "active" : ""}`} onClick={() => setTab("accounts")}>
          <i className="fa-solid fa-user-graduate" /> Accounts
          <span className="count">{studentAccounts.length}</span>
        </button>
        <button className={`sub-tab ${tab === "reports" ? "active" : ""}`} onClick={() => setTab("reports")}>
          <i className="fa-solid fa-file-medical" /> Student Reports
          <span className="count">{studentReports.length}</span>
        </button>
      </div>

      {/* ── Filter bar (shared) ── */}
      <div className="rc-filters students-filters">
        <div className="rc-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students by name or email…" aria-label="Search students" />
        </div>
        <select value={cls} onChange={(e) => setCls(e.target.value as SchoolClass | "all")} aria-label="Select class">
          <ClassOptions includeAll />
        </select>
        <button type="button" className="btn-ghost" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
          <i className={`fa-solid ${sortDir === "asc" ? "fa-arrow-down-a-z" : "fa-arrow-down-z-a"}`} /> Name {sortDir === "asc" ? "A–Z" : "Z–A"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => { setCls("all"); setSearch(""); setSelected(new Set()); }}>
          <i className="fa-solid fa-rotate-left" /> Reset
        </button>
      </div>

      {/* ════════════════ ACCOUNTS TAB ════════════════ */}
      {tab === "accounts" && (
        <>
          <div className="report-actions">
            <span className="report-hint">
              {selected.size > 0
                ? `${selected.size} student${selected.size === 1 ? "" : "s"} selected for the report`
                : `Report will include all ${filtered.length} student${filtered.length === 1 ? "" : "s"} matching current filters`}
            </span>
            <div className="report-actions-btns">
              <button type="button" className="btn-outline" onClick={exportCsv} disabled={reportRows.length === 0}>
                <i className="fa-solid fa-file-csv" /> Export CSV
              </button>
              <button type="button" className="a-add-btn" onClick={() => window.print()} disabled={reportRows.length === 0}>
                <i className="fa-solid fa-print" /> Generate Report
              </button>
              <button className="a-add-btn" onClick={() => setCreateOpen(true)}>
                <i className="fa-solid fa-plus" /> Create Account
              </button>
            </div>
          </div>

          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th style={{ width: "36px" }}>
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all on this page" />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr><td colSpan={7} className="a-empty">No students match those filters yet.</td></tr>
                ) : (
                  visible.map((s) => (
                    <tr key={s.id}>
                      <td><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} aria-label={`Select ${s.fullName}`} /></td>
                      <td><b>{s.fullName}</b></td>
                      <td>{s.email}</td>
                      <td>{s.schoolClass}</td>
                      <td>{s.createdAt}</td>
                      <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {s.status !== "active" && (
                          <button className="a-approve-btn" onClick={() => activateStudentAccount(s.id)}>
                            <i className="fa-solid fa-check" /> Activate
                          </button>
                        )}
                        {s.status !== "deactivated" && (
                          <button className="a-deactivate-btn" onClick={() => deactivateStudentAccount(s.id)}>
                            <i className="fa-solid fa-ban" /> Deactivate
                          </button>
                        )}
                        <button className="a-del-btn" style={{ marginLeft: "6px" }}
                          onClick={() => { if (confirm(`Delete ${s.fullName}'s account? This cannot be undone.`)) deleteStudentAccount(s.id); }}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

          {/* Print-only report */}
          <div id="student-report-print" className="report-print">
            <div className="report-print-header">
              <h2>CPEC Saint Babeth TSS — Students Report</h2>
              <p>Class: <b>{clsLabel}</b> · Sorted by Name ({sortDir === "asc" ? "A–Z" : "Z–A"}) · Generated {generatedAt}</p>
            </div>
            <table>
              <thead>
                <tr><th>#</th><th>Full Name</th><th>Email</th><th>Class</th><th>Status</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {reportRows.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td><td>{s.fullName}</td><td>{s.email}</td>
                    <td>{s.schoolClass}</td><td>{s.status}</td><td>{s.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="report-print-footer">Total: {reportRows.length} student{reportRows.length === 1 ? "" : "s"}</p>
          </div>
        </>
      )}

      {/* ════════════════ REPORTS TAB ════════════════ */}
      {tab === "reports" && (
        <>
          <div className="report-actions">
            <span className="report-hint">
              {selected.size > 0
                ? `${selected.size} student${selected.size === 1 ? "" : "s"} selected`
                : "Select students below to upload the same report file to several at once"}
            </span>
            <div className="report-actions-btns">
              <button type="button" className="a-add-btn" disabled={selected.size === 0}
                onClick={() => setUploadFor(studentAccounts.filter((s) => selected.has(s.id)))}>
                <i className="fa-solid fa-cloud-arrow-up" /> Upload Report to Selected
              </button>
            </div>
          </div>

          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th style={{ width: "36px" }}>
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all on this page" />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Report</th>
                  <th>Status</th>
                  <th style={{ width: "1%" }}></th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr><td colSpan={7} className="a-empty">No students match those filters yet.</td></tr>
                ) : (
                  visible.map((s) => {
                    const report = reportByStudent.get(s.id);
                    return (
                      <tr key={s.id}>
                        <td><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} aria-label={`Select ${s.fullName}`} /></td>
                        <td><b>{s.fullName}</b></td>
                        <td>{s.email}</td>
                        <td>{classLabel(s.schoolClass)}</td>
                        <td>
                          {report ? (
                            <a href={report.fileData || "#"} target="_blank" rel="noreferrer" className="sr-report-link" title={report.title || report.fileName || "View report"}>
                              <i className="fa-solid fa-file-circle-check" /> {report.title || "Report on file"}
                            </a>
                          ) : (
                            <span className="sr-no-report">No report yet</span>
                          )}
                        </td>
                        <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div className="sr-icon-actions">
                            <button type="button" className="sr-icon-btn"
                              title={report ? "Update report" : "Upload report"}
                              aria-label={report ? `Update report for ${s.fullName}` : `Upload report for ${s.fullName}`}
                              onClick={() => setUploadFor([s])}>
                              <i className={`fa-solid ${report ? "fa-pen" : "fa-upload"}`} />
                            </button>
                            {report && (
                              <button type="button" className="sr-icon-btn danger"
                                title="Delete report" aria-label={`Delete report for ${s.fullName}`}
                                onClick={() => handleDeleteReport(s.id)}>
                                <i className="fa-solid fa-trash" />
                              </button>
                            )}
                            <button type="button" className="sr-icon-btn"
                              title={s.status === "deactivated" ? "Activate account" : "Deactivate account"}
                              aria-label={s.status === "deactivated" ? `Activate ${s.fullName}` : `Deactivate ${s.fullName}`}
                              onClick={() => s.status === "deactivated" ? activateStudentAccount(s.id) : deactivateStudentAccount(s.id)}>
                              <i className={`fa-solid ${s.status === "deactivated" ? "fa-toggle-off" : "fa-ban"}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

          {uploadFor && (
            <UploadReportModal
              students={uploadFor}
              onClose={() => setUploadFor(null)}
              onUploaded={() => { setUploadFor(null); setSelected(new Set()); }}
              uploadStudentReports={uploadStudentReports}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ── Upload Report Modal ─────────────────────────────────── */
function UploadReportModal({
  students, onClose, onUploaded, uploadStudentReports,
}: {
  students: { id: number; fullName: string }[];
  onClose: () => void;
  onUploaded: () => void;
  uploadStudentReports: (args: { studentIds: number[]; title?: string; fileData: string; fileName: string | null }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileData(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!fileData) { setError("Please choose a report file to upload."); return; }
    setSaving(true); setError("");
    try {
      await uploadStudentReports({ studentIds: students.map((s) => s.id), title: title.trim() || undefined, fileData, fileName });
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sr-modal-backdrop" onClick={onClose}>
      <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sr-modal-header">
          <h3>Upload Report</h3>
          <button type="button" className="sr-modal-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "16px" }}>
          {students.length === 1
            ? `Uploading report for ${students[0].fullName}`
            : `Uploading the same report for ${students.length} selected students`}
        </p>
        {error && <div className="ta-notice err">{error}</div>}
        <input type="text" placeholder="Report title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: "10px" }} />
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={onFile} style={{ marginBottom: "16px" }} />
        {fileName && <p style={{ fontSize: "12px", color: "var(--ink-faint)", marginBottom: "12px" }}><i className="fa-solid fa-paperclip" /> {fileName}</p>}
        <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={save} disabled={saving || !fileData}>
          <i className="fa-solid fa-cloud-arrow-up" /> {saving ? "Uploading…" : "Upload Report"}
        </button>
      </div>
    </div>
  );
}
