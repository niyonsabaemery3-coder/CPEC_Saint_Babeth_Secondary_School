import { useState } from "react";
import { useApp } from "../../context/AppContext";
import FieldError from "../common/FieldError";
import { required } from "../../utils/validation";

interface UnifiedLoginProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenRegister: (role: "student" | "teacher") => void;
}

export default function UnifiedLogin({ open, onClose, onSuccess, onOpenRegister }: UnifiedLoginProps) {
  const { unifiedLogin, site } = useApp();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<{ kind: "warn" | "err"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const resetAll = () => {
    setIdentifier("");
    setPassword("");
    setErrors({});
    setNotice(null);
  };

  const close = () => {
    resetAll();
    onClose();
  };

  const handleLogin = async () => {
    const nextErrors = {
      identifier: required(identifier, "Email or username"),
      password: required(password, "Password"),
    };
    setErrors(nextErrors);
    if (nextErrors.identifier || nextErrors.password) return;

    setBusy(true);
    const res = await unifiedLogin(identifier.trim(), password);
    setBusy(false);
    if (res.ok) {
      resetAll();
      onSuccess();
    } else {
      setNotice({ kind: "warn", text: res.message });
    }
  };

  return (
    <div className={`admin-overlay ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="admin-login-card teacher-auth-card">
        <button
          className="a-close-btn"
          style={{ position: "static", float: "right", marginTop: "-10px", marginRight: "-10px" }}
          onClick={close}
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="lock-icon">
          <i className="fa-solid fa-right-to-bracket" />
        </div>
        <h3>Sign In</h3>
        <p>Enter your credentials — your account type is detected automatically.</p>

        {notice && <div className={`ta-notice ${notice.kind}`}>{notice.text}</div>}

        <input
          type="text"
          placeholder="Email or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className={errors.identifier ? "field-invalid" : ""}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          autoComplete="username"
        />
        <FieldError message={errors.identifier} />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={errors.password ? "field-invalid" : ""}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          autoComplete="current-password"
        />
        <FieldError message={errors.password} />

        <button
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleLogin}
          disabled={busy}
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>

        {(site.registrationSettings.allowStudentRegister || site.registrationSettings.allowTeacherRegister) && (
          <div className="login-register-links">
            <span className="login-register-label">Don't have an account?</span>
            {site.registrationSettings.allowStudentRegister && (
              <button type="button" className="link-btn" onClick={() => onOpenRegister("student")}>
                Register as Student
              </button>
            )}
            {site.registrationSettings.allowTeacherRegister && (
              <button type="button" className="link-btn" onClick={() => onOpenRegister("teacher")}>
                Register as Teacher
              </button>
            )}
          </div>
        )}

        <div className="admin-hint">
          Contact the admin if you need an account or have trouble signing in.
        </div>
      </div>
    </div>
  );
}
