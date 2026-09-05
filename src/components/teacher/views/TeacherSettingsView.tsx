import { useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { initials } from "../../../utils/format";
import FieldError from "../../common/FieldError";
import SettingsMsg from "../../admin/settings/SettingsMsg";
import { validateMinLength, isValid } from "../../../utils/validation";

const PALETTE = ["#e6a935", "#3f7d3a", "#8e5a2f", "#c1860f", "#4a5568", "#a8552b", "#2f6b6b"];

/**
 * Teacher-facing Settings view.
 * Contains the Teacher Directory sub-tab (add / edit / remove teachers from
 * the public-facing teachers section) so the admin's TeachersView no longer
 * needs to carry it — keeping the admin panel focused on accounts & resources.
 */
export default function TeacherSettingsView() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useApp();

  // ── Directory form ──────────────────────────────────────
  // editingIndex is null while adding a brand-new teacher, or the index of
  // the teacher currently being edited — the same form and Save button are
  // reused for both, only the submit action and title change.
  const [formOpen, setFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [quote, setQuote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [dirErrors, setDirErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName(""); setSubject(""); setQuote(""); setPhoto(null); setDirErrors({});
    if (fileRef.current) fileRef.current.value = "";
  };

  const closeForm = () => { setFormOpen(false); setEditingIndex(null); resetForm(); };

  const openAddForm = () => {
    resetForm();
    setEditingIndex(null);
    setFormOpen(true);
  };

  const openEditForm = (index: number) => {
    const t = teachers[index];
    if (!t) return;
    setName(t.name);
    setSubject(t.subject);
    setQuote(t.quote);
    setPhoto(t.photo ?? null);
    setDirErrors({});
    setMsg(null);
    setEditingIndex(index);
    setFormOpen(true);
  };

  const previewPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveDir = async () => {
    const trimmedName    = name.trim();
    const trimmedSubject = subject.trim();
    const nextErrors = {
      name:    validateMinLength(trimmedName,    3, "Teacher full name"),
      subject: validateMinLength(trimmedSubject, 2, "Subject"),
    };
    setDirErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setSaving(true);
    setMsg(null);
    try {
      if (editingIndex !== null) {
        const existing = teachers[editingIndex];
        await updateTeacher(editingIndex, {
          name:    trimmedName,
          subject: trimmedSubject,
          quote:   quote.trim() || "Passionate about helping students grow.",
          photo,
          color:   existing.color,
        });
      } else {
        await addTeacher({
          name:    trimmedName,
          subject: trimmedSubject,
          quote:   quote.trim() || "Passionate about helping students grow.",
          photo,
          color:   PALETTE[teachers.length % PALETTE.length],
        });
      }
      closeForm();
    } catch {
      setSaving(false);
      setMsg({ text: "Failed to save. Please try again.", type: "err" });
    }
  };

  const removeTeacher = (index: number) => {
    const t = teachers[index];
    if (!t) return;
    if (!confirm(`Remove ${t.name} from the public Teachers section? This cannot be undone.`)) return;
    deleteTeacher(index);
  };

  return (
    <div className="admin-panel-view active">

      {/* ── Section header ── */}
      <div className="sub-tabs">
        <button className="sub-tab active">
          <i className="fa-solid fa-address-card" /> Teacher Directory
          <span className="count">{teachers.length}</span>
        </button>
      </div>

      {/* ── Add Teacher button + inline form ── */}
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
        <button className="a-add-btn" onClick={openAddForm}>
          <i className="fa-solid fa-plus" /> Add Teacher
        </button>
      </div>

      {formOpen && (
        <div className="teacher-form-card show">
          <h5 style={{ margin: "0 0 10px" }}>{editingIndex !== null ? "Edit Teacher" : "New Teacher"}</h5>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={previewPhoto} />
          <div className="tf-avatar-wrap" onClick={() => fileRef.current?.click()}>
            <div className="tf-avatar" style={photo ? { backgroundImage: `url('${photo}')` } : {}}>
              {!photo && <i className="fa-solid fa-camera" />}
            </div>
            <span className="tf-avatar-hint">Click to upload photo</span>
          </div>
          <input
            type="text"
            className={`tf-name-input ${dirErrors.name ? "field-invalid" : ""}`}
            placeholder="Teacher full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Teacher full name"
          />
          <FieldError message={dirErrors.name} />
          <input
            type="text"
            className={`tf-subject-input ${dirErrors.subject ? "field-invalid" : ""}`}
            placeholder="Subject / class taught"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-label="Subject or class taught"
          />
          <FieldError message={dirErrors.subject} />
          <textarea
            className="tf-quote-input"
            rows={2}
            placeholder="Short quote / what they say about teaching"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            aria-label="Short quote"
          />
          <SettingsMsg text={msg?.text ?? ""} type={msg?.type ?? null} />
          <div className="tf-actions">
            <button className="a-add-btn" onClick={saveDir} disabled={saving}>
              <i className="fa-solid fa-check" /> {saving ? "Saving…" : editingIndex !== null ? "Save Changes" : "Save Teacher"}
            </button>
            <button className="btn-ghost" type="button" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Directory table ── */}
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Subject</th>
              <th>Quote</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="a-empty">
                  No teachers in the directory yet. Use "Add Teacher" to add the first one.
                </td>
              </tr>
            ) : (
              teachers.map((t, i) => (
                <tr key={t.id}>
                  <td>
                    <div
                      className="t-mini-avatar"
                      style={t.photo ? { backgroundImage: `url('${t.photo}')` } : { background: t.color }}
                    >
                      {!t.photo && initials(t.name)}
                    </div>
                  </td>
                  <td><b>{t.name}</b></td>
                  <td>{t.subject}</td>
                  <td style={{ maxWidth: "280px", color: "var(--ink-soft)" }}>"{t.quote}"</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn-ghost" style={{ marginRight: "6px" }} onClick={() => openEditForm(i)} aria-label={`Edit ${t.name}`}>
                      <i className="fa-solid fa-pen" /> Edit
                    </button>
                    <button className="a-del-btn" onClick={() => removeTeacher(i)} aria-label={`Remove ${t.name}`}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
