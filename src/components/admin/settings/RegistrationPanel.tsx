import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import SettingsMsg from "./SettingsMsg";

export default function RegistrationPanel() {
  const { site, updateRegistrationSettings } = useApp();
  const rs = site.registrationSettings;
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" | null }>({ text: "", type: null });

  const toggle = async (payload: Partial<typeof rs>) => {
    const key = Object.keys(payload)[0];
    setSaving(key);
    setMsg({ text: "", type: null });
    try {
      await updateRegistrationSettings(payload);
      setMsg({ text: "Saved.", type: "ok" });
    } catch {
      setMsg({ text: "Could not save that change. Please try again.", type: "err" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <h3>Self-Registration</h3>
      <p className="sp-sub">
        Control whether visitors can create their own Student or Teacher account instead of an admin
        creating it for them. New self-registered accounts always start <b>deactivated</b> so an admin
        can review them — unless you turn on auto-activation for that role below, in which case they can
        log in immediately.
      </p>

      <div className="sp-block">
        <label className="reg-toggle-row">
          <div>
            <b>Allow student self-registration</b>
            <small>Shows a "Register as Student" link on the login popup.</small>
          </div>
          <input
            type="checkbox"
            checked={rs.allowStudentRegister}
            disabled={saving === "allowStudentRegister"}
            onChange={(e) => toggle({ allowStudentRegister: e.target.checked })}
          />
        </label>

        <label className="reg-toggle-row">
          <div>
            <b>Auto-activate student accounts</b>
            <small>New student self-registrations start active (no admin review needed).</small>
          </div>
          <input
            type="checkbox"
            checked={rs.autoActivateStudentRegister}
            disabled={saving === "autoActivateStudentRegister" || !rs.allowStudentRegister}
            onChange={(e) => toggle({ autoActivateStudentRegister: e.target.checked })}
          />
        </label>

        <label className="reg-toggle-row">
          <div>
            <b>Allow teacher self-registration</b>
            <small>Shows a "Register as Teacher" link on the login popup.</small>
          </div>
          <input
            type="checkbox"
            checked={rs.allowTeacherRegister}
            disabled={saving === "allowTeacherRegister"}
            onChange={(e) => toggle({ allowTeacherRegister: e.target.checked })}
          />
        </label>

        <label className="reg-toggle-row">
          <div>
            <b>Auto-activate teacher accounts</b>
            <small>New teacher self-registrations start active (no admin review needed).</small>
          </div>
          <input
            type="checkbox"
            checked={rs.autoActivateTeacherRegister}
            disabled={saving === "autoActivateTeacherRegister" || !rs.allowTeacherRegister}
            onChange={(e) => toggle({ autoActivateTeacherRegister: e.target.checked })}
          />
        </label>

        <SettingsMsg text={msg.text} type={msg.type} />
      </div>
    </>
  );
}
