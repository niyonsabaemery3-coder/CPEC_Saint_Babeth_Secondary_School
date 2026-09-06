import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "../settings/FField";
import SettingsMsg from "../settings/SettingsMsg";

export default function AdminProfileView() {
  const { adminUser, setAdminCredentials } = useApp();

  const [userField, setUserField] = useState(adminUser);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" | null }>({ text: "", type: null });

  const save = async () => {
    if (!oldPass) {
      setMsg({ text: "Please enter your current password.", type: "err" });
      return;
    }
    if (newPass && newPass !== confirmPass) {
      setMsg({ text: "New password and confirmation do not match.", type: "err" });
      return;
    }
    setSaving(true);
    const res = await setAdminCredentials(oldPass, userField.trim(), newPass);
    setSaving(false);
    if (res.ok) {
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    }
    setMsg({ text: res.message, type: res.ok ? "ok" : "err" });
  };

  // Initials avatar helper
  const ini = adminUser
    ? adminUser.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div className="admin-panel-view active">
      <div className="settings-panel">

        {/* ── Avatar card ─────────────────────────────── */}
        <div className="profile-card-hero">
          <div className="profile-card-avatar">{ini}</div>
          <div>
            <div className="profile-card-name">{adminUser || "Admin"}</div>
            <span className="status-badge active">Administrator</span>
          </div>
        </div>

        {/* ── Account details ─────────────────────────── */}
        <h3>Account Details</h3>
        <p className="sp-sub">Your admin account information.</p>
        <div className="sp-block">
          <div className="a-form-grid">
            <div>
              <div style={{ fontSize: "12px", color: "var(--ink-faint)", marginBottom: "4px" }}>Username</div>
              <div style={{ fontWeight: 700 }}>{adminUser || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--ink-faint)", marginBottom: "4px" }}>Role</div>
              <div style={{ fontWeight: 700 }}>Administrator</div>
            </div>
          </div>
        </div>

        {/* ── Change credentials ──────────────────────── */}
        <h3>Change Credentials</h3>
        <p className="sp-sub">Update your admin username and/or password.</p>
        <div className="sp-block">
          <FField label="Username" value={userField} onChange={setUserField} />
          <FField label="Current password" value={oldPass} onChange={setOldPass} type="password" />
          <FField label="New password (optional)" value={newPass} onChange={setNewPass} type="password" />
          <FField label="Confirm new password" value={confirmPass} onChange={setConfirmPass} type="password" />
          <SettingsMsg text={msg.text} type={msg.type} />
        </div>
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={save} disabled={saving}>
            <i className="fa-solid fa-check" /> {saving ? "Updating…" : "Save changes"}
          </button>
        </div>

      </div>
    </div>
  );
}
