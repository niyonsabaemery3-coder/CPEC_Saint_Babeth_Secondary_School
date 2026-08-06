import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import type { ResourceType, SchoolClass } from "../../types";

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

export default function Resources() {
  const { resources } = useApp();
  const [cls, setCls] = useState<SchoolClass | "all">("all");
  const [type, setType] = useState<ResourceType | "all">("all");
  const [subject, setSubject] = useState<string>("all");

  const subjects = useMemo(() => {
    const set = new Set(resources.map((r) => r.subject));
    return Array.from(set).sort();
  }, [resources]);

  const filtered = resources.filter(
    (r) =>
      (cls === "all" || r.schoolClass === cls) &&
      (type === "all" || r.type === type) &&
      (subject === "all" || r.subject === subject)
  );

  return (
    <section className="card" id="resources">
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Learning Resources
        </div>
        <h2>Notes, Presentations &amp; Past Papers</h2>
        <p>
          Pick your class, the type of material and the subject — teachers keep this list updated with
          exactly what you need to study.
        </p>
      </div>

      <div className="rc-filters">
        <select value={cls} onChange={(e) => setCls(e.target.value as SchoolClass | "all")}>
          <option value="all">All Classes</option>
          <option value="S1">Senior 1 (S1)</option>
          <option value="S2">Senior 2 (S2)</option>
          <option value="S3">Senior 3 (S3)</option>
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
          }}
        >
          <i className="fa-solid fa-rotate-left" /> Reset
        </button>
      </div>

      <div className="resources-grid">
        {filtered.length === 0 ? (
          <div className="resources-empty">
            <i className="fa-solid fa-folder-open" />
            No resources match those filters yet. Try a different class, type or subject.
          </div>
        ) : (
          filtered.map((r) => (
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
    </section>
  );
}
