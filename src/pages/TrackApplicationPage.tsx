import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useSEO } from "../hooks/useSEO";
import type { StudentApplication } from "../types";

const STATUS_LABELS: Record<string, string> = {
  pending:        "Pending — Awaiting Review",
  under_review:   "Under Review",
  approved:       "Approved",
  rejected:       "Not Approved",
  info_required:  "More Information Required",
};

const STATUS_ICONS: Record<string, string> = {
  pending:        "fa-clock",
  under_review:   "fa-magnifying-glass",
  approved:       "fa-circle-check",
  rejected:       "fa-circle-xmark",
  info_required:  "fa-circle-info",
};

const STATUS_DEFAULT_MSG: Record<string, string> = {
  pending:        "Your admission request has been received and is waiting for review by the admissions office.",
  under_review:   "The school is currently reviewing your admission request. We will be in touch shortly.",
  approved:       "Congratulations! Your admission request has been approved. Please contact the school for instructions on completing the official admission process.",
  rejected:       "Your admission request was not approved at this time. Please contact the school for more information.",
  info_required:  "The school needs additional information before making a decision. Please contact the admissions office.",
};

function ResultCard({ result }: { result: StudentApplication }) {
  const feedbackMsg = result.feedback || STATUS_DEFAULT_MSG[result.status] || "";
  const icon = STATUS_ICONS[result.status] ?? "fa-file-lines";
  const isApproved = result.status === "approved";

  return (
    <div className={`track-result track-${result.status}`}>
      {/* ── Status banner ── */}
      <div className="track-status-banner">
        <div className={`track-status-icon track-status-icon-${result.status}`}>
          <i className={`fa-solid ${icon}`} />
        </div>
        <div className="track-status-text">
          <span className={`application-status application-status-${result.status}`}>
            {STATUS_LABELS[result.status] ?? result.status}
          </span>
          <div className="track-result-meta">
            <span className="track-ref">Request <strong>#{result.id}</strong></span>
            <span className="track-name">{result.name}</span>
          </div>
        </div>
      </div>

      {/* ── Feedback message ── */}
      <div className="track-feedback-box">
        <div className="track-feedback-label">
          <i className="fa-solid fa-comment-dots" /> Message from the admissions office
        </div>
        <p className="track-feedback-msg">{feedbackMsg}</p>
      </div>

      {/* ── Approved: contact prompt ── */}
      {isApproved && (
        <div className="track-approved-banner">
          <i className="fa-solid fa-graduation-cap" />
          <div>
            <strong>Next step:</strong> Contact the school to complete your official admission.
          </div>
          <a href="tel:0788451698" className="btn-primary track-call-btn">
            <i className="fa-solid fa-phone" /> Call admissions
          </a>
        </div>
      )}

      {/* ── Feedback file attachment ── */}
      {result.feedbackFile && (
        <a className="a-dl-btn" href={result.feedbackFile} target="_blank" rel="noreferrer">
          <i className="fa-solid fa-paperclip" /> {result.feedbackFileName || "Open attachment"}
        </a>
      )}
    </div>
  );
}

export default function TrackApplicationPage() {
  const { trackApplication } = useApp();
  const [lookup, setLookup] = useState("");
  const [result, setResult] = useState<StudentApplication | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useSEO({
    title: "Track Admission Request",
    description: "Check the status of your CPEC Saint Babeth TSS admission request.",
    path: "/track-application",
  });

  const track = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try { setResult(await trackApplication(lookup.trim())); }
    catch (e) { setError(e instanceof Error ? e.message : "Application not found."); }
    finally { setLoading(false); }
  };

  return (
    <section className="card track-application-page">
      <div className="section-head">
        <div className="eyebrow"><span className="bar" /> Admissions</div>
        <h2>Track your admission request</h2>
        <p>Enter your reference number, parent phone number, or email address to check the status of your admission request.</p>
      </div>

      <form className="track-form" onSubmit={track}>
        <div className="ffield always-float">
          <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder=" " required />
          <label>Reference number, phone or email</label>
        </div>
        <button className="btn-primary" disabled={loading}>
          {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Checking…</> : <><i className="fa-solid fa-magnifying-glass" /> Check status</>}
        </button>
      </form>

      {error && (
        <div className="track-error">
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      {result && <ResultCard result={result} />}
    </section>
  );
}
