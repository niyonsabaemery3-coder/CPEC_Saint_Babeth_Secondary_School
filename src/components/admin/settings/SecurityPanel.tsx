import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import SettingsMsg from "./SettingsMsg";

export default function SecurityPanel() {
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

  return (
    <>
      <h3>Security</h3>
      <p className="sp-sub">Update your admin username and password.</p>
      <div className="sp-block">
        <FField label="Admin username" value={userField} onChange={setUserField} />
        <FField label="Current password" value={oldPass} onChange={setOldPass} type="password" />
        <FField label="New password (optional)" value={newPass} onChange={setNewPass} type="password" />
        <FField label="Confirm new password" value={confirmPass} onChange={setConfirmPass} type="password" />
        <SettingsMsg text={msg.text} type={msg.type} />
      </div>
      <div className="sp-save-row">
        <button className="a-add-btn" onClick={save} disabled={saving}>
          <i className="fa-solid fa-check" /> {saving ? "Updating…" : "Update"}
        </button>
      </div>
    </>
  );
}
