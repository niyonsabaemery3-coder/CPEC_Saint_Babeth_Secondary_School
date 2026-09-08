import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import { SCHOOL_CLASSES } from "../../../constants/academics";
import FField from "../../admin/settings/FField";
import SettingsMsg from "../../admin/settings/SettingsMsg";

export default function StudentProfileView() {
  const { currentStudent, updateStudentProfile, updateStudentPassword } = useApp();

  const [fullName, setFullName] = useState(currentStudent?.fullName ?? "");
  const [email, setEmail] = useState(currentStudent?.email ?? "");
  const [schoolClass, setSchoolClass] = useState(currentStudent?.schoolClass ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: "ok" | "err" | null }>({ text: "", type: null });

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ text: string; type: "ok" | "err" | null }>({ text: "", type: null });

  if (!currentStudent) return null;

  const saveProfile = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileMsg({ text: "Full name must be at least 2 characters.", type: "err" });
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileMsg({ text: "Enter a valid email address.", type: "err" });
      return;
    }
    if (!schoolClass) {
      setProfileMsg({ text: "Please select your class.", type: "err" });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ text: "", type: null });
    const res = await updateStudentProfile({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      schoolClass,
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
    const res = await updateStudentPassword(current, next);
    setPassSaving(false);
    if (res.ok) { setCurrent(""); setNext(""); setConfirm(""); }
    setPassMsg({ text: res.message, type: res.ok ? "ok" : "err" });
  };

  const initials = currentStudent.fullName
    ? currentStudent.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "ST";

  return (
    <div className="admin-panel-view active">
      <div className="settings-panel">

        <div className="profile-card-hero">
          <div className="profile-card-avatar">{initials}</div>
          <div>
            <div className="profile-card-name">{currentStudent.fullName}</div>
            <span className="status-badge active">{currentStudent.schoolClass} · Student</span>
          </div>
        </div>

        <h3>Edit Profile</h3>
        <p className="sp-sub">Update your name, email address, or class. Your email is also your login identifier.</p>
        <div className="sp-block">
          <FField label="Full name" value={fullName} onChange={setFullName} />
          <FField label="Email address (used to log in)" value={email} onChange={setEmail} />
          <div className="ffield always-float">
            <select value={schoolClass} onChange={(e) => setSchoolClass(e.target.value)}>
              <option value="" disabled>Select class</option>
              {SCHOOL_CLASSES.filter((c) => c.value !== "OTHER").map((c) => (
                <option key={c.value} value={c.value}>{c.label} — {c.group}</option>
              ))}
            </select>
            <label>Class</label>
          </div>
          <SettingsMsg text={profileMsg.text} type={profileMsg.type} />
        </div>
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={saveProfile} disabled={profileSaving}>
            <i className="fa-solid fa-floppy-disk" /> {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </div>

        <h3 style={{ marginTop: "28px" }}>Change Password</h3>
        <p className="sp-sub">Update the password you use to sign in to the Student Portal.</p>
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
