import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { ResourceType, SchoolClass } from "../../../types";
import Pagination from "../../common/Pagination";
import ClassOptions from "../../common/ClassOptions";

const TYPE_LABEL: Record<ResourceType, string> = {
  notes: "Notes",
  presentation: "Presentation",
  pastpaper: "Past Paper",
};

const TYPE_ICON: Record<ResourceType, string> = {
  notes: "fa-note-sticky",
  presentation: "fa-display",
  pastpaper: "fa-file-lines",
};

const PAGE_SIZE = 9;

export default function StudentResourcesView() {
  const { resources, currentStudent } = useApp();
  const [cls, setCls] = useState<SchoolClass | "all">(currentStudent?.schoolClass ?? "all");
  const [type, setType] = useState<ResourceType | "all">("all");
  const [subject, setSubject] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const subjects = useMemo(() => {
    const set = new Set(resources.map((r) => r.subject));
    return Array.from(set).sort();
  }, [resources]);

  const query = search.trim().toLowerCase();
  const filtered = resources.filter(
    (r) =>
      (cls === "all" || r.schoolClass === cls) &&
      (type === "all" || r.type === type) &&
      (subject === "all" || r.subject === subject) &&
      (!query ||
        r.title.toLowerCase().includes(query) ||
        r.subject.toLowerCase().includes(query) ||
        r.uploaderName.toLowerCase().includes(query))
  );

  useEffect(() => {
    setPage(1);
  }, [cls, type, subject, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="admin-panel-view active">
      <div className="rc-filters">
        <div className="rc-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject or teacher…"
            aria-label="Search resources"
          />
        </div>

        <select value={cls} onChange={(e) => setCls(e.target.value as SchoolClass | "all")}>
          <ClassOptions includeAll />
        </select>

        <select value={type} onChange={(e) => setType(e.target.value as ResourceType | "all")}>
          <option value="all">All Resource Types</option>
          <option value="notes">Notes</option>
          <option value="presentation">Presentations</option>
          <option value="pastpaper">Past Papers</option>
        </select>

        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setCls("all");
            setType("all");
            setSubject("all");
            setSearch("");
          }}
        >
          <i className="fa-solid fa-rotate-left" /> Reset
        </button>
      </div>

      <div className="resources-grid">
        {filtered.length === 0 ? (
          <div className="resources-empty">
            <i className="fa-solid fa-folder-open" />
            No resources match those filters yet. Try a different class, type, subject or search term.
          </div>
        ) : (
          visible.map((r) => (
            <div key={r.id} className={`resource-card type-${r.type}`}>
              <div className="rc-type-icon">
                <i className={`fa-solid ${TYPE_ICON[r.type]}`} />
              </div>
              <div className="rc-title">{r.title}</div>
              <div className="rc-meta">
                <span className="rc-chip">{r.schoolClass}</span>
                <span className="rc-chip">{r.subject}</span>
                <span className="rc-chip">{TYPE_LABEL[r.type]}</span>
              </div>
              <div className="rc-uploader">
                <i className="fa-solid fa-chalkboard-user" /> {r.uploaderName}
              </div>
              <div className="rc-actions">
                {r.fileData ? (
                  <>
                    <a className="btn-outline" href={r.fileData} target="_blank" rel="noreferrer">
                      <i className="fa-solid fa-eye" /> Preview
                    </a>
                    <a className="btn-primary" href={r.fileData} download={r.fileName || r.title}>
                      <i className="fa-solid fa-download" /> Download
                    </a>
                  </>
                ) : r.link ? (
                  <a className="btn-primary" href={r.link} target="_blank" rel="noreferrer">
                    <i className="fa-solid fa-arrow-up-right-from-square" /> Open Link
                  </a>
                ) : (
                  <span className="rc-chip">No file attached</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onChange={setPage}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
