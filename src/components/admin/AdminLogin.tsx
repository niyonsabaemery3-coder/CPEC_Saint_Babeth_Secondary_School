import { useState } from "react";
import { useApp } from "../../context/AppContext";
import FieldError from "../common/FieldError";
import { required } from "../../utils/validation";

interface AdminLoginProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminLogin({ open, onClose, onSuccess }: AdminLoginProps) {
  const { login } = useApp();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const tryLogin = async () => {
    const nextErrors = {
      user: required(user, "Username"),
      pass: required(pass, "Password"),
    };
    setErrors(nextErrors);
    if (nextErrors.user || nextErrors.pass) return;

    setBusy(true);
    const ok = await login(user.trim(), pass.trim());
    setBusy(false);
    if (ok) {
      setUser("");
      setPass("");
      setError(false);
      setErrors({});
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className={`admin-overlay ${open ? "open" : ""}`}>
      <div className="admin-login-card">
        <button
          className="a-close-btn"
          style={{ position: "static", float: "right", marginTop: "-10px", marginRight: "-10px" }}
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <div className="lock-icon">
          <i className="fa-solid fa-lock" />
        </div>
        <h3>Admin Login</h3>
        <p>Staff access only. Manage applications &amp; teachers.</p>
        <div className={`admin-error ${error ? "show" : ""}`}>Incorrect username or password.</div>
        <input
          type="text"
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className={errors.user ? "field-invalid" : ""}
          onKeyDown={(e) => e.key === "Enter" && tryLogin()}
        />
        <FieldError message={errors.user} />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className={errors.pass ? "field-invalid" : ""}
          onKeyDown={(e) => e.key === "Enter" && tryLogin()}
        />
        <FieldError message={errors.pass} />
        <button
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={tryLogin}
          disabled={busy}
        >
          {busy ? "Logging in…" : "Log In"}
        </button>
        <div className="admin-hint">
          Demo credentials — username: <b>admin</b> · password: <b>admin123</b>
        </div>
      </div>
    </div>
  );
}
