import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { Resource, ResourceType, SchoolClass } from "../../../types";
import ClassOptions from "../../common/ClassOptions";
import Pagination from "../../common/Pagination";
import FieldError from "../../common/FieldError";
import SettingsMsg from "../../admin/settings/SettingsMsg";
import { validateMinLength, validateMaxFileSizeMB } from "../../../utils/validation";

const TYPE_LABEL: Record<ResourceType, string> = {
  notes: "Notes",
  presentation: "Presentation",
  pastpaper: "Past Paper",
};

const PAGE_SIZE = 10;

export default function MyResourcesView() {
  const { resources, updateResource, deleteResource, currentTeacher } = useApp();

  const [cls, setCls] = useState<SchoolClass | "all">("all");
  const [type, setType] = useState<ResourceType | "all">("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // ── Edit form (metadata + optional file replacement) ──────────────────
  const [editing, setEditing] = useState<Resource | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [schoolClass, setSchoolClass] = useState<SchoolClass>("S1");
  const [rType, setRType] = useState<ResourceType>("notes");
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; subject?: string; attachment?: string; file?: string }>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mineAll = useMemo(
    () => resources.filter((r) => r.uploaderId === currentTeacher?.id),
    [resources, currentTeacher]
  );

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const rows = mineAll.filter(
      (r) =>
        (cls === "all" || r.schoolClass === cls) &&
        (type === "all" || r.type === type) &&
        (!query || r.title.toLowerCase().includes(query) || r.subject.toLowerCase().includes(query))
    );
    rows.sort((a, b) => (sortDir === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
    return rows;
  }, [mineAll, cls, type, query, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [cls, type, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const closeEdit = () => {
    setEditing(null);
    setTitle(""); setSubject(""); setSchoolClass("S1"); setRType("notes");
    setLink(""); setFileName(null); setFileData(null); setErrors({}); setMsg(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openEdit = (r: Resource) => {
    setEditing(r);
    setTitle(r.title);
    setSubject(r.subject);
    setSchoolClass(r.schoolClass);
    setRType(r.type);
    setLink(r.link || "");
    setFileName(null); // no new file chosen yet — existing file is kept unless replaced
    setFileData(null);
    setErrors({});
    setMsg(null);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeErr = validateMaxFileSizeMB(file, 20, "Resource file");
    if (sizeErr) {
      setErrors((er) => ({ ...er, file: sizeErr }));
      setFileName(null);
      setFileData(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setErrors((er) => ({ ...er, file: "", attachment: "" }));
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileData(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const trimmedTitle = title.trim();
    const trimmedSubject = subject.trim();
    const nextErrors: typeof errors = {
      title: validateMinLength(trimmedTitle, 3, "Title"),
      subject: validateMinLength(trimmedSubject, 2, "Subject"),
      attachment: !fileData && !editing.fileName && !editing.link && !link.trim()
        ? "Attach a file or paste a link for students to access."
        : "",
    };
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.subject || nextErrors.attachment) return;

    setSaving(true);
    setMsg(null);
    try {
      await updateResource(editing.id, {
        title: trimmedTitle,
        subject: trimmedSubject,
        schoolClass,
        type: rType,
        fileName,
        fileData,
        link: link.trim() || null,
      });
      closeEdit();
    } catch {
      setSaving(false);
      setMsg({ text: "Failed to save. Please try again.", type: "err" });
    }
  };

  const removeResource = (r: Resource) => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    deleteResource(r.id);
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
            placeholder="Search your resources by title or subject…"
            aria-label="Search my resources"
          />
        </div>

        <select value={cls} onChange={(e) => setCls(e.target.value as SchoolClass | "all")} aria-label="Filter by class">
          <ClassOptions includeAll />
        </select>

        <select value={type} onChange={(e) => setType(e.target.value as ResourceType | "all")} aria-label="Filter by type">
          <option value="all">All Types</option>
          <option value="notes">Notes</option>
          <option value="presentation">Presentation</option>
          <option value="pastpaper">Past Paper</option>
        </select>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          <i className={`fa-solid ${sortDir === "asc" ? "fa-arrow-down-a-z" : "fa-arrow-down-z-a"}`} /> Title{" "}
          {sortDir === "asc" ? "A–Z" : "Z–A"}
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setCls("all");
            setType("all");
            setSearch("");
          }}
        >
          <i className="fa-solid fa-rotate-left" /> Reset
        </button>
      </div>

      {editing && (
        <div className="teacher-form-card show" style={{ marginBottom: 16 }}>
          <h5 style={{ margin: "0 0 10px" }}>Edit Resource</h5>
          <div className="a-form-grid">
            <div>
              <input
                type="text"
                placeholder="Resource title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? "field-invalid" : ""}
                aria-label="Resource title"
              />
              <FieldError message={errors.title} />
            </div>
            <div>
              <input
                type="text"
                placeholder="Subject (e.g. ICT, Mathematics)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={errors.subject ? "field-invalid" : ""}
                aria-label="Subject"
              />
              <FieldError message={errors.subject} />
            </div>
            <select value={schoolClass} onChange={(e) => setSchoolClass(e.target.value as SchoolClass)} aria-label="Class">
              <ClassOptions />
            </select>
            <select value={rType} onChange={(e) => setRType(e.target.value as ResourceType)} aria-label="Resource type">
              <option value="notes">Notes</option>
              <option value="presentation">Presentation</option>
              <option value="pastpaper">Past Paper</option>
            </select>
            <input
              type="text"
              placeholder="Optional link (Google Drive, YouTube, etc.)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              aria-label="Optional link"
            />
            <div>
              <input ref={fileRef} type="file" onChange={onFile} aria-label="Replace attached file" />
              <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "6px" }}>
                {fileName ? fileName : editing.fileName ? `Current file: ${editing.fileName} (choose a new file to replace it)` : "No file attached — leave blank to keep the link only"}
              </div>
              <FieldError message={errors.file} />
            </div>
          </div>
          <FieldError message={errors.attachment} />
          <SettingsMsg text={msg?.text ?? ""} type={msg?.type ?? null} />
          <div className="tf-actions" style={{ marginTop: "18px" }}>
            <button className="a-add-btn" onClick={saveEdit} disabled={saving}>
              <i className="fa-solid fa-check" /> {saving ? "Saving…" : "Save Changes"}
            </button>
            <button className="btn-ghost" type="button" onClick={closeEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="a-empty">
                  {mineAll.length === 0
                    ? 'You haven\'t uploaded any resources yet. Use "Add Resource" to get started.'
                    : "No resources match those filters yet."}
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.title}</b></td>
                  <td>{r.schoolClass}</td>
                  <td>{r.subject}</td>
                  <td>{TYPE_LABEL[r.type]}</td>
                  <td>{r.createdAt}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn-ghost" style={{ marginRight: "6px" }} onClick={() => openEdit(r)} aria-label={`Edit ${r.title}`}>
                      <i className="fa-solid fa-pen" /> Edit
                    </button>
                    <button className="a-del-btn" onClick={() => removeResource(r)} aria-label={`Delete ${r.title}`}>
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
    </div>
  );
}
