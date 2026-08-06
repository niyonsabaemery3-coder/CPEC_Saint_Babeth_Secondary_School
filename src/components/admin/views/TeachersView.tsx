import { useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { initials } from "../../../utils/format";

const PALETTE = ["#e6a935", "#3f7d3a", "#8e5a2f", "#c1860f", "#4a5568", "#a8552b", "#2f6b6b"];

type Tab = "directory" | "accounts" | "resources";

const TYPE_LABEL: Record<string, string> = {
  notes: "Notes",
  presentation: "Presentation",
  pastpaper: "Past Paper",
};

export default function TeachersView() {
  const { teachers, addTeacher, deleteTeacher, teacherAccounts, activateTeacherAccount, deactivateTeacherAccount, resources, deleteResource } = useApp();
  const [tab, setTab] = useState<Tab>("directory");
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [quote, setQuote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pendingCount = teacherAccounts.filter((t) => t.status === "pending").length;

  const resetForm = () => {
    setName("");
    setSubject("");
    setQuote("");
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const previewPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const save = () => {
    const trimmedName = name.trim();
    const trimmedSubject = subject.trim();
    if (!trimmedName || !trimmedSubject) {
      alert("Please enter at least a name and subject.");
      return;
    }
    addTeacher({
      name: trimmedName,
      subject: trimmedSubject,
      quote: quote.trim() || "Passionate about helping students grow.",
      photo,
      color: PALETTE[teachers.length % PALETTE.length],
    });
    closeForm();
  };

  return (
    <div className="admin-panel-view active">
      <div className="sub-tabs">
        <button className={`sub-tab ${tab === "directory" ? "active" : ""}`} onClick={() => setTab("directory")}>
          <i className="fa-solid fa-address-card" /> Directory
        </button>
        <button className={`sub-tab ${tab === "accounts" ? "active" : ""}`} onClick={() => setTab("accounts")}>
          <i className="fa-solid fa-user-lock" /> Teacher Accounts
          {pendingCount > 0 && <span className="count">{pendingCount} pending</span>}
        </button>
        <button className={`sub-tab ${tab === "resources" ? "active" : ""}`} onClick={() => setTab("resources")}>
          <i className="fa-solid fa-folder-open" /> Resources <span className="count">{resources.length}</span>
        </button>
      </div>

      {tab === "directory" && (
        <>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button className="a-add-btn" onClick={() => setFormOpen(true)}>
              <i className="fa-solid fa-plus" /> Add Teacher
            </button>
          </div>

          {formOpen && (
            <div className="teacher-form-card show">
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={previewPhoto} />
              <div className="tf-avatar-wrap" onClick={() => fileRef.current?.click()}>
                <div className="tf-avatar" style={photo ? { backgroundImage: `url('${photo}')` } : {}}>
                  {!photo && <i className="fa-solid fa-camera" />}
                </div>
                <span className="tf-avatar-hint">Click to upload photo</span>
              </div>
              <input
                type="text"
                className="tf-name-input"
                placeholder="Teacher full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                className="tf-subject-input"
                placeholder="Subject / class taught"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <textarea
                className="tf-quote-input"
                rows={2}
                placeholder="Short quote / what they say about teaching"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
              />
              <div className="tf-actions">
                <button className="a-add-btn" onClick={save}>
                  <i className="fa-solid fa-check" /> Save Teacher
                </button>
                <button className="btn-ghost" type="button" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </div>
          )}

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
                {teachers.map((t, i) => (
                  <tr key={i}>
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
                    <td>
                      <button className="a-del-btn" onClick={() => deleteTeacher(i)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "accounts" && (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Registered</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teacherAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="a-empty">No teacher accounts have registered yet.</td>
                </tr>
              ) : (
                teacherAccounts.map((t) => (
                  <tr key={t.id}>
                    <td><b>{t.fullName}</b></td>
                    <td>{t.email}</td>
                    <td>{t.subject}</td>
                    <td>{t.createdAt}</td>
                    <td>
                      <span className={`status-badge ${t.status}`}>{t.status}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {t.status !== "active" && (
                        <button className="a-approve-btn" onClick={() => activateTeacherAccount(t.id)}>
                          <i className="fa-solid fa-check" /> Activate
                        </button>
                      )}
                      {t.status !== "deactivated" && (
                        <button className="a-deactivate-btn" onClick={() => deactivateTeacherAccount(t.id)}>
                          <i className="fa-solid fa-ban" /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "resources" && (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="a-empty">No resources uploaded yet.</td>
                </tr>
              ) : (
                resources.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.title}</b></td>
                    <td>{r.schoolClass}</td>
                    <td>{r.subject}</td>
                    <td>{TYPE_LABEL[r.type]}</td>
                    <td>{r.uploaderName}</td>
                    <td>{r.createdAt}</td>
                    <td>
                      <button className="a-del-btn" onClick={() => deleteResource(r.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
