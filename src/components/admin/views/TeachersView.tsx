import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FieldError from "../../common/FieldError";
import { validateMinLength, validateEmail, validatePassword, isValid } from "../../../utils/validation";
import type { TeachAdminTab } from "../../../types";

const TYPE_LABEL: Record<string, string> = {
  notes:        "Notes",
  presentation: "Presentation",
  pastpaper:    "Past Paper",
};

export default function TeachersView() {
  const {
    teacherAccounts, createTeacherAccount, activateTeacherAccount, deactivateTeacherAccount, deleteTeacherAccount,
    resources, deleteResource,
  } = useApp();

  const [tab, setTab] = useState<TeachAdminTab>("accounts");

  // ── Create account overlay ──────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [acFullName, setAcFullName] = useState("");
  const [acEmail,    setAcEmail]    = useState("");
  const [acSubject,  setAcSubject]  = useState("");
  const [acPassword, setAcPassword] = useState("");
  const [acNotice,   setAcNotice]   = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [acBusy,     setAcBusy]     = useState(false);
  const [acErrors,   setAcErrors]   = useState<Record<string, string>>({});

  const resetForm = () => {
    setAcFullName(""); setAcEmail(""); setAcSubject("");
    setAcPassword(""); setAcErrors({}); setAcNotice(null);
  };
  const closeOverlay = () => { setCreateOpen(false); resetForm(); };

  const handleCreate = async () => {
    const nextErrors = {
      fullName: validateMinLength(acFullName, 3, "Full name"),
      subject:  validateMinLength(acSubject,  2, "Subject"),
      email:    validateEmail(acEmail),
      password: validatePassword(acPassword, 6),
    };
    setAcErrors(nextErrors);
    if (!isValid(nextErrors)) return;
    setAcBusy(true);
    const res = await createTeacherAccount({
      fullName: acFullName.trim(),
      email:    acEmail.trim(),
      subject:  acSubject.trim(),
      password: acPassword,
    });
    setAcBusy(false);
    if (res.ok) closeOverlay();
    else setAcNotice({ kind: "err", text: res.message });
  };

  return (
    <div className="admin-panel-view active">

      {/* ── Create Teacher Account overlay ── */}
      <div className={`admin-overlay ${createOpen ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && closeOverlay()}>
        <div className="admin-login-card teacher-auth-card">
          <button className="a-close-btn" style={{ position: "static", float: "right", marginTop: "-10px", marginRight: "-10px" }} onClick={closeOverlay}>
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="lock-icon"><i className="fa-solid fa-chalkboard-user" /></div>
          <h3>New Teacher Account</h3>
          <p>The account will be active immediately — share the credentials with the teacher.</p>
          {acNotice && <div className={`ta-notice ${acNotice.kind === "ok" ? "info" : "err"}`}>{acNotice.text}</div>}
          <input type="text"     placeholder="Full name"               value={acFullName} onChange={(e) => setAcFullName(e.target.value)} className={acErrors.fullName ? "field-invalid" : ""} />
          <FieldError message={acErrors.fullName} />
          <input type="text"     placeholder="Subject taught"          value={acSubject}  onChange={(e) => setAcSubject(e.target.value)}  className={acErrors.subject  ? "field-invalid" : ""} />
          <FieldError message={acErrors.subject} />
          <input type="email"    placeholder="Email address"           value={acEmail}    onChange={(e) => setAcEmail(e.target.value)}    className={acErrors.email    ? "field-invalid" : ""} />
          <FieldError message={acErrors.email} />
          <input type="password" placeholder="Password (min. 6 chars)" value={acPassword} onChange={(e) => setAcPassword(e.target.value)} className={acErrors.password ? "field-invalid" : ""} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          <FieldError message={acErrors.password} />
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleCreate} disabled={acBusy}>
            <i className="fa-solid fa-user-plus" /> {acBusy ? "Creating…" : "Create Account"}
          </button>
        </div>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="sub-tabs">
        <button className={`sub-tab ${tab === "accounts" ? "active" : ""}`} onClick={() => setTab("accounts")}>
          <i className="fa-solid fa-user-lock" /> Teacher Accounts
          <span className="count">{teacherAccounts.length}</span>
        </button>
        <button className={`sub-tab ${tab === "resources" ? "active" : ""}`} onClick={() => setTab("resources")}>
          <i className="fa-solid fa-folder-open" /> Resources
          <span className="count">{resources.length}</span>
        </button>
      </div>

      {/* ════════════════ ACCOUNTS TAB ════════════════ */}
      {tab === "accounts" && (
        <>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button className="a-add-btn" onClick={() => setCreateOpen(true)}>
              <i className="fa-solid fa-plus" /> Create Account
            </button>
          </div>

          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teacherAccounts.length === 0 ? (
                  <tr><td colSpan={6} className="a-empty">No teacher accounts yet. Use the button above to create one.</td></tr>
                ) : (
                  teacherAccounts.map((t) => (
                    <tr key={t.id}>
                      <td><b>{t.fullName}</b></td>
                      <td>{t.email}</td>
                      <td>{t.subject}</td>
                      <td>{t.createdAt}</td>
                      <td><span className={`status-badge ${t.status}`}>{t.status}</span></td>
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
                        <button className="a-del-btn" style={{ marginLeft: "6px" }}
                          onClick={() => { if (confirm(`Delete ${t.fullName}'s account? This cannot be undone.`)) deleteTeacherAccount(t.id); }}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ════════════════ RESOURCES TAB ════════════════ */}
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
                <tr><td colSpan={7} className="a-empty">No resources uploaded yet.</td></tr>
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
                      <button
                        className="a-del-btn"
                        onClick={() => {
                          if (confirm(`Delete "${r.title}"? This cannot be undone.`)) deleteResource(r.id);
                        }}
                      >
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
