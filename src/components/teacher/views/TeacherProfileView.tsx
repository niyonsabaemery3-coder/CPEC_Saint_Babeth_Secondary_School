import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "../../admin/settings/FField";
import SettingsMsg from "../../admin/settings/SettingsMsg";

export default function TeacherProfileView() {
  const { currentTeacher, updateTeacherProfile, updateTeacherPassword } = useApp();

  const [fullName, setFullName] = useState(currentTeacher?.fullName ?? "");
  const [email, setEmail] = useState(currentTeacher?.email ?? "");
  const [subject, setSubject] = useState(currentTeacher?.subject ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: "ok" | "err" | null }>({ text: "", type: null });

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ text: string; type: "ok" | "err" | null }>({ text: "", type: null });

  if (!currentTeacher) return null;

  const saveProfile = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileMsg({ text: "Full name must be at least 2 characters.", type: "err" });
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileMsg({ text: "Enter a valid email address.", type: "err" });
      return;
    }
    if (!subject.trim()) {
      setProfileMsg({ text: "Subject cannot be empty.", type: "err" });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ text: "", type: null });
    const res = await updateTeacherProfile({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
    });
    setProfileSaving(false);
    setProfileMsg({ text: res.message, type: res.ok ? "ok" : "err" });
  };

  const savePassword = async () => {
    if (!current || !next) {
      setPassMsg({ text: "Please fill in your current and new password.", type: "err" });
      return;
    }
    if (next.length < 6) {
      setPassMsg({ text: "New password must be at least 6 characters.", type: "err" });
      return;
    }
    if (next !== confirm) {
      setPassMsg({ text: "New passwords do not match.", type: "err" });
      return;
    }
    setPassSaving(true);
    const res = await updateTeacherPassword(current, next);
    setPassSaving(false);
    if (res.ok) { setCurrent(""); setNext(""); setConfirm(""); }
    setPassMsg({ text: res.message, type: res.ok ? "ok" : "err" });
  };

  const initials = currentTeacher.fullName
    ? currentTeacher.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "TC";

  return (
    <div className="admin-panel-view active">
      <div className="settings-panel">

        <div className="profile-card-hero">
          <div className="profile-card-avatar">{initials}</div>
          <div>
            <div className="profile-card-name">{currentTeacher.fullName}</div>
            <span className="status-badge active">{currentTeacher.subject} · Teacher</span>
          </div>
        </div>

        <h3>Edit Profile</h3>
        <p className="sp-sub">Update your name, email address, or subject. Your email is also your login identifier.</p>
        <div className="sp-block">
          <FField label="Full name" value={fullName} onChange={setFullName} />
          <FField label="Email address (used to log in)" value={email} onChange={setEmail} />
          <FField label="Subject" value={subject} onChange={setSubject} />
          <SettingsMsg text={profileMsg.text} type={profileMsg.type} />
        </div>
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={saveProfile} disabled={profileSaving}>
            <i className="fa-solid fa-floppy-disk" /> {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </div>

        <h3 style={{ marginTop: "28px" }}>Change Password</h3>
        <p className="sp-sub">Update the password you use to sign in to the Teacher Portal.</p>
        <div className="sp-block">
          <FField label="Current password" value={current} onChange={setCurrent} type="password" />
          <FField label="New password (min. 6 characters)" value={next} onChange={setNext} type="password" />
          <FField label="Confirm new password" value={confirm} onChange={setConfirm} type="password" />
          <SettingsMsg text={passMsg.text} type={passMsg.type} />
        </div>
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={savePassword} disabled={passSaving}>
            <i className="fa-solid fa-key" /> {passSaving ? "Updating…" : "Update password"}
          </button>
        </div>

      </div>
    </div>
  );
}
