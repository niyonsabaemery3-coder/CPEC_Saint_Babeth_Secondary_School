import { useMemo, useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { ResourceType, SchoolClass } from "../../../types";
import ClassOptions from "../../common/ClassOptions";
import FieldError from "../../common/FieldError";
import { validateMinLength, validateMaxFileSizeMB } from "../../../utils/validation";

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

interface AddResourceViewProps {
  onDone: () => void;
}

export default function AddResourceView({ onDone }: AddResourceViewProps) {
  const { addResource, currentTeacher, teachers, resources } = useApp();
  const [title, setTitle] = useState("");
  const [schoolClass, setSchoolClass] = useState<SchoolClass>("S1");
  const [subject, setSubject] = useState(currentTeacher?.subject || "");
  const [type, setType] = useState<ResourceType>("notes");
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; subject?: string; attachment?: string; file?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const subjectSuggestions = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => set.add(t.subject));
    resources.forEach((r) => set.add(r.subject));
    if (currentTeacher?.subject) set.add(currentTeacher.subject);
    return Array.from(set).sort();
  }, [teachers, resources, currentTeacher]);

  const resetForm = () => {
    setTitle("");
    setSchoolClass("S1");
    setSubject(currentTeacher?.subject || "");
    setType("notes");
    setLink("");
    setFileName(null);
    setFileData(null);
    setErrors({});
    if (fileRef.current) fileRef.current.value = "";
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

  const save = () => {
    if (!currentTeacher) return;
    const trimmedTitle = title.trim();
    const trimmedSubject = subject.trim();
    const nextErrors: typeof errors = {
      title: validateMinLength(trimmedTitle, 3, "Title"),
      subject: validateMinLength(trimmedSubject, 2, "Subject"),
      attachment: !fileData && !link.trim() ? "Attach a file or paste a link for students to access." : "",
    };
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.subject || nextErrors.attachment) return;

    addResource({
      title: trimmedTitle,
      subject: trimmedSubject,
      schoolClass,
      type,
      fileName,
      fileData,
      link: link.trim() || null,
      uploaderId: currentTeacher.id,
      uploaderName: currentTeacher.fullName,
    });
    resetForm();
    onDone();
  };

  return (
    <div className="admin-panel-view active">
      <p style={{ color: "var(--ink-soft)", marginBottom: "20px", fontSize: "13.5px" }}>
        Fill in the details below — the preview shows exactly how students will see this resource on the
        public Resources page.
      </p>

      <div className="rc-preview-label">Live Preview</div>
      <div className="rc-preview-card">
        <div className={`resource-card type-${type}`} style={{ boxShadow: "none", border: "1px dashed var(--line)" }}>
          <div className="rc-type-icon">
            <i className={`fa-solid ${TYPE_ICON[type]}`} />
          </div>
          <div className="rc-title">{title.trim() || "Resource title goes here"}</div>
          <div className="rc-meta">
            <span className="rc-chip">{schoolClass}</span>
            <span className="rc-chip">{subject.trim() || "Subject"}</span>
            <span className="rc-chip">{TYPE_LABEL[type]}</span>
          </div>
          <div className="rc-uploader">
            <i className="fa-solid fa-chalkboard-user" /> {currentTeacher?.fullName}
          </div>
        </div>
      </div>

      <div className="a-form-grid">
        <div>
          <input type="text" placeholder="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} className={errors.title ? "field-invalid" : ""} />
          <FieldError message={errors.title} />
        </div>
        <div>
          <input
            type="text"
            placeholder="Subject (e.g. ICT, Mathematics)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            list="subject-suggestions"
            className={errors.subject ? "field-invalid" : ""}
          />
          <FieldError message={errors.subject} />
        </div>
        <datalist id="subject-suggestions">
          {subjectSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <select value={schoolClass} onChange={(e) => setSchoolClass(e.target.value as SchoolClass)}>
          <ClassOptions />
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
          <option value="notes">Notes</option>
          <option value="presentation">Presentation</option>
          <option value="pastpaper">Past Paper</option>
        </select>
        <input
          type="text"
          placeholder="Optional link (Google Drive, YouTube, etc.)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <div>
          <input ref={fileRef} type="file" onChange={onFile} />
          {fileName && <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "6px" }}>{fileName}</div>}
          <FieldError message={errors.file} />
        </div>
      </div>
      <FieldError message={errors.attachment} />

      <div className="tf-actions" style={{ marginTop: "18px" }}>
        <button className="a-add-btn" onClick={save}>
          <i className="fa-solid fa-check" /> Publish Resource
        </button>
        <button className="btn-ghost" type="button" onClick={resetForm}>
          Reset
        </button>
      </div>
    </div>
  );
}
