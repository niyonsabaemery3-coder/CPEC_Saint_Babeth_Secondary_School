import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "../../admin/settings/FField";
import SettingsMsg from "../../admin/settings/SettingsMsg";

export default function StudentProfileView() {
  const { currentStudent, updateStudentPassword } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" | null }>({ text: "", type: null });

  if (!currentStudent) return null;

  const save = async () => {
    if (!current || !next) {
      setMsg({ text: "Please fill in your current and new password.", type: "err" });
      return;
    }
    if (next !== confirm) {
      setMsg({ text: "New passwords do not match.", type: "err" });
      return;
    }
    setSaving(true);
    const res = await updateStudentPassword(current, next);
    setSaving(false);
    if (res.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
    setMsg({ text: res.message, type: res.ok ? "ok" : "err" });
  };

  return (
    <div className="admin-panel-view active">
      <div className="settings-panel">
        <h3>Account Details</h3>
        <p className="sp-sub">Your student account information.</p>
        <div className="sp-block">
          <h5>PROFILE</h5>
          <div className="a-form-grid">
            <div>
              <div style={{ fontSize: "12px", color: "var(--ink-faint)", marginBottom: "4px" }}>Full name</div>
              <div style={{ fontWeight: 700 }}>{currentStudent.fullName}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--ink-faint)", marginBottom: "4px" }}>Class</div>
              <div style={{ fontWeight: 700 }}>{currentStudent.schoolClass}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--ink-faint)", marginBottom: "4px" }}>Email</div>
              <div style={{ fontWeight: 700 }}>{currentStudent.email}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--ink-faint)", marginBottom: "4px" }}>Account status</div>
              <span className={`status-badge ${currentStudent.status}`}>{currentStudent.status}</span>
            </div>
          </div>
        </div>

        <h3>Change Password</h3>
        <p className="sp-sub">Update the password you use to log in to the Student Portal.</p>
        <div className="sp-block">
          <FField label="Current password" value={current} onChange={setCurrent} type="password" />
          <FField label="New password" value={next} onChange={setNext} type="password" />
          <FField label="Confirm new password" value={confirm} onChange={setConfirm} type="password" />
          <SettingsMsg text={msg.text} type={msg.type} />
        </div>
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={save} disabled={saving}>
            <i className="fa-solid fa-key" /> {saving ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
