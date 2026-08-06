import { useState } from "react";
import { useApp } from "../../context/AppContext";

interface TeacherAuthProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeacherAuth({ open, onClose, onSuccess }: TeacherAuthProps) {
  const { teacherLogin, registerTeacherAccount } = useApp();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [notice, setNotice] = useState<{ kind: "info" | "warn" | "err"; text: string } | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [subject, setSubject] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const resetAll = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setSubject("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirm("");
    setNotice(null);
  };

  const close = () => {
    resetAll();
    onClose();
  };

  const handleLogin = async () => {
    const res = await teacherLogin(email, password);
    if (res.ok) {
      resetAll();
      onSuccess();
    } else {
      setNotice({ kind: "warn", text: res.message });
    }
  };

  const handleRegister = async () => {
    if (regPassword !== regConfirm) {
      setNotice({ kind: "err", text: "Passwords do not match." });
      return;
    }
    const res = await registerTeacherAccount({ fullName, email: regEmail, password: regPassword, subject });
    if (res.ok) {
      setNotice({ kind: "info", text: res.message });
      setFullName("");
      setSubject("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirm("");
      setTab("login");
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
          <i className="fa-solid fa-chalkboard-user" />
        </div>
        <h3>Teacher Portal</h3>
        <p>Log in to manage your class resources, or register a new teacher account.</p>

        <div className="ta-tabs">
          <button
            type="button"
            className={`ta-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => {
              setTab("login");
              setNotice(null);
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`ta-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => {
              setTab("register");
              setNotice(null);
            }}
          >
            Register
          </button>
        </div>

        {notice && <div className={`ta-notice ${notice.kind}`}>{notice.text}</div>}

        {tab === "login" ? (
          <>
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleLogin}>
              Log In
            </button>
            <div className="admin-hint">
              Demo account — email: <b>mugisha.eric@stbabeth.rw</b> · password: <b>teach123</b>
            </div>
          </>
        ) : (
          <>
            <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input type="text" placeholder="Subject you teach" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <input type="email" placeholder="Email address" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
            <input
              type="password"
              placeholder="Confirm password"
              value={regConfirm}
              onChange={(e) => setRegConfirm(e.target.value)}
            />
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleRegister}>
              Create Account
            </button>
            <div className="admin-hint">Your account will need admin approval before you can log in.</div>
          </>
        )}
      </div>
    </div>
  );
}
