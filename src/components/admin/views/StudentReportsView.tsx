import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { SchoolClass, StudentAccount } from "../../../types";
import Pagination from "../../common/Pagination";
import ClassOptions from "../../common/ClassOptions";
import { classLabel } from "../../../constants/academics";

const PAGE_SIZE = 10;

export default function StudentReportsView() {
  const {
    studentAccounts,
    studentReports,
    fetchStudentReports,
    deleteStudentReport,
    activateStudentAccount,
    deactivateStudentAccount,
  } = useApp();

  useEffect(() => {
    fetchStudentReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [cls, setCls] = useState<SchoolClass | "all">("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  // The upload modal doubles as "Upload" (student has no report yet) and
  // "Update" (replacing an existing one) — same form either way.
  const [uploadFor, setUploadFor] = useState<StudentAccount[] | null>(null);

  const reportByStudent = useMemo(() => {
    const map = new Map<number, (typeof studentReports)[number]>();
    studentReports.forEach((r) => map.set(r.studentId, r));
    return map;
  }, [studentReports]);

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const rows = studentAccounts.filter(
      (s) =>
        (cls === "all" || s.schoolClass === cls) &&
        (!query || s.fullName.toLowerCase().includes(query) || s.email.toLowerCase().includes(query))
    );
    rows.sort((a, b) => (sortDir === "asc" ? a.fullName.localeCompare(b.fullName) : b.fullName.localeCompare(a.fullName)));
    return rows;
  }, [studentAccounts, cls, query, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [cls, query, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.has(s.id));
  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((s) => next.delete(s.id));
      else visible.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const selectedStudents = studentAccounts.filter((s) => selected.has(s.id));

  const handleDelete = async (studentId: number) => {
    if (!window.confirm("Remove this student's report file? This can't be undone.")) return;
    await deleteStudentReport(studentId);
  };

  return (
    <div className="admin-panel-view active">
      <div className="rc-filters students-filters">
        <div className="rc-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name or email…"
            aria-label="Search students"
          />
        </div>

        <select value={cls} onChange={(e) => setCls(e.target.value as SchoolClass | "all")} aria-label="Select class">
          <ClassOptions includeAll />
        </select>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          <i className={`fa-solid ${sortDir === "asc" ? "fa-arrow-down-a-z" : "fa-arrow-down-z-a"}`} /> Name{" "}
          {sortDir === "asc" ? "A–Z" : "Z–A"}
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setCls("all");
            setSearch("");
            setSelected(new Set());
          }}
        >
          <i className="fa-solid fa-rotate-left" /> Reset
        </button>
      </div>

      <div className="report-actions">
        <span className="report-hint">
          {selected.size > 0
            ? `${selected.size} student${selected.size === 1 ? "" : "s"} selected`
            : "Select students below to upload the same report file to several at once"}
        </span>
        <div className="report-actions-btns">
          <button
            type="button"
            className="a-add-btn"
            disabled={selectedStudents.length === 0}
            onClick={() => setUploadFor(selectedStudents)}
          >
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
              <tr>
                <td colSpan={7} className="a-empty">
                  No students match those filters yet.
                </td>
              </tr>
            ) : (
              visible.map((s) => {
                const report = reportByStudent.get(s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} aria-label={`Select ${s.fullName}`} />
                    </td>
                    <td>
                      <b>{s.fullName}</b>
                    </td>
                    <td>{s.email}</td>
                    <td>{classLabel(s.schoolClass)}</td>
                    <td>
                      {report ? (
                        <a
                          href={report.fileData || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="sr-report-link"
                          title={report.title || report.fileName || "View report"}
                        >
                          <i className="fa-solid fa-file-circle-check" /> {report.title || "Report on file"}
                        </a>
                      ) : (
                        <span className="sr-no-report">No report yet</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${s.status}`}>{s.status}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div className="sr-icon-actions">
                        <button
                          type="button"
                          className="sr-icon-btn"
                          title={report ? "Update report" : "Upload report"}
                          aria-label={report ? `Update report for ${s.fullName}` : `Upload report for ${s.fullName}`}
                          onClick={() => setUploadFor([s])}
                        >
                          <i className={`fa-solid ${report ? "fa-pen" : "fa-upload"}`} />
                        </button>
                        {report && (
                          <button
                            type="button"
                            className="sr-icon-btn danger"
                            title="Delete report"
                            aria-label={`Delete report for ${s.fullName}`}
                            onClick={() => handleDelete(s.id)}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="sr-icon-btn"
                          title={s.status === "deactivated" ? "Activate account" : "Deactivate account"}
                          aria-label={s.status === "deactivated" ? `Activate ${s.fullName}` : `Deactivate ${s.fullName}`}
                          onClick={() => (s.status === "deactivated" ? activateStudentAccount(s.id) : deactivateStudentAccount(s.id))}
                        >
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
          onUploaded={() => {
            setUploadFor(null);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}

function UploadReportModal({
  students,
  onClose,
  onUploaded,
}: {
  students: StudentAccount[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { uploadStudentReports } = useApp();
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
    if (!fileData) {
      setError("Please choose a report file to upload.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await uploadStudentReports({
        studentIds: students.map((s) => s.id),
        title: title.trim() || undefined,
        fileData,
        fileName,
      });
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

        <p className="sr-modal-sub">
          {students.length === 1 ? (
            <>
              For <b>{students[0].fullName}</b> ({classLabel(students[0].schoolClass)})
            </>
          ) : (
            <>
              For <b>{students.length} selected students</b> — the same file will be attached to each of them.
            </>
          )}
        </p>

        <div className="a-form-grid">
          <input
            type="text"
            placeholder="Report title (e.g. Term 1 Report Card) — optional"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            <input ref={fileRef} type="file" onChange={onFile} />
            {fileName && <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "6px" }}>{fileName}</div>}
          </div>
        </div>

        {error && <div className="sr-modal-error">{error}</div>}

        <div className="tf-actions" style={{ marginTop: "16px" }}>
          <button className="a-add-btn" onClick={save} disabled={saving}>
            <i className="fa-solid fa-cloud-arrow-up" /> {saving ? "Uploading…" : "Upload"}
          </button>
          <button className="btn-ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
