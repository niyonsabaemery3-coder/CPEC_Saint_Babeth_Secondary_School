import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import FieldError from "../common/FieldError";
import ClassOptions from "../common/ClassOptions";
import { validateEmail, validateMinLength, validatePassword, validateConfirmPassword, required, isValid } from "../../utils/validation";

interface StudentAuthProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: "login" | "register";
}

export default function StudentAuth({ open, onClose, onSuccess, initialMode = "login" }: StudentAuthProps) {
  const { studentLogin, studentSelfRegister, site } = useApp();
  const canRegister = site.registrationSettings.allowStudentRegister;

  const [mode, setMode] = useState<"login" | "register">(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const [notice, setNotice] = useState<{ kind: "info" | "warn" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // --- login fields ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- register fields ---
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regClass, setRegClass] = useState("S1");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const resetAll = () => {
    setEmail("");
    setPassword("");
    setErrors({});
    setRegName("");
    setRegEmail("");
    setRegClass("S1");
    setRegPassword("");
    setRegConfirm("");
    setRegErrors({});
    setNotice(null);
    setMode("login");
  };

  const close = () => {
    resetAll();
    onClose();
  };

  const switchMode = (m: "login" | "register") => {
    setNotice(null);
    setMode(m);
  };

  const handleLogin = async () => {
    const nextErrors = {
      email: validateEmail(email),
      password: password ? "" : "Password is required.",
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setBusy(true);
    const res = await studentLogin(email, password);
    setBusy(false);
    if (res.ok) {
      resetAll();
      onSuccess();
    } else {
      setNotice({ kind: "warn", text: res.message });
    }
  };

  const handleRegister = async () => {
    const nextErrors = {
      name: validateMinLength(regName, 3, "Full name"),
      class: required(regClass, "Class"),
      email: validateEmail(regEmail),
      password: validatePassword(regPassword, 6),
      confirm: validateConfirmPassword(regPassword, regConfirm),
    };
    setRegErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setBusy(true);
    const res = await studentSelfRegister({
      fullName: regName,
      email: regEmail,
      password: regPassword,
      schoolClass: regClass,
    });
    setBusy(false);
    if (res.ok) {
      setNotice({ kind: "info", text: res.message });
      setRegName("");
      setRegEmail("");
      setRegClass("S1");
      setRegPassword("");
      setRegConfirm("");
      setRegErrors({});
      setMode("login");
    } else {
      setNotice({ kind: "err", text: res.message });
    }
  };

  return (
    <div className={`admin-overlay ${open ? "open" : ""}`}>
      <div className="admin-login-card teacher-auth-card">
        <button
          className="a-close-btn"
          style={{ position: "static", float: "right", marginTop: "-10px", marginRight: "-10px" }}
          onClick={close}
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <div className="lock-icon">
          <i className="fa-solid fa-graduation-cap" />
        </div>
        <h3>{mode === "login" ? "Student Login" : "Student Registration"}</h3>
        <p>
          {mode === "login"
            ? "Log in to preview and download notes, presentations & past papers."
            : "Create your account — depending on the school's settings it may be activated right away, or reviewed by an admin first."}
        </p>

        {canRegister && (
          <div className="ta-tabs">
            <button type="button" className={`ta-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>
              Log In
            </button>
            <button type="button" className={`ta-tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>
              Register
            </button>
          </div>
        )}

        {notice && <div className={`ta-notice ${notice.kind}`}>{notice.text}</div>}

        {mode === "login" ? (
          <>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "field-invalid" : ""}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <FieldError message={errors.email} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "field-invalid" : ""}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <FieldError message={errors.password} />
            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleLogin}
              disabled={busy}
            >
              {busy ? "Logging in…" : "Log In"}
            </button>
            <div className="admin-hint">
              Contact the admin if you need an account or have trouble logging in.
            </div>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Full name"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className={regErrors.name ? "field-invalid" : ""}
            />
            <FieldError message={regErrors.name} />
            <select value={regClass} onChange={(e) => setRegClass(e.target.value)}>
              <ClassOptions />
            </select>
            <FieldError message={regErrors.class} />
            <input
              type="email"
              placeholder="Email address"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className={regErrors.email ? "field-invalid" : ""}
            />
            <FieldError message={regErrors.email} />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className={regErrors.password ? "field-invalid" : ""}
            />
            <FieldError message={regErrors.password} />
            <input
              type="password"
              placeholder="Confirm password"
              value={regConfirm}
              onChange={(e) => setRegConfirm(e.target.value)}
              className={regErrors.confirm ? "field-invalid" : ""}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
            <FieldError message={regErrors.confirm} />
            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleRegister}
              disabled={busy}
            >
              <i className="fa-solid fa-user-plus" /> {busy ? "Submitting…" : "Create Account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
