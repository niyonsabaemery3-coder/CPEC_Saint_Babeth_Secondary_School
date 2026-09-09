import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useSEO } from "../hooks/useSEO";
import type { StudentApplication } from "../types";

export default function TrackApplicationPage() {
  const { trackApplication } = useApp();
  const [lookup, setLookup] = useState("");
  const [result, setResult] = useState<StudentApplication | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useSEO({ title: "Track Admission Request", description: "Check the status of your CPEC Saint Babeth TSS admission request.", path: "/track-application" });

  const track = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try { setResult(await trackApplication(lookup.trim())); }
    catch (e) { setError(e instanceof Error ? e.message : "Application not found."); }
    finally { setLoading(false); }
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pending — Awaiting Review",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Not Approved",
    info_required: "More Information Required",
  };

  return <section className="card track-application-page">
    <div className="section-head"><div className="eyebrow"><span className="bar" /> Admissions</div><h2>Track your admission request</h2><p>Enter your reference number, parent phone number, or email address to check the status of your admission request.</p></div>
    <form className="track-form" onSubmit={track}>
      <div className="ffield always-float"><input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder=" " required /><label>Reference number, phone or email</label></div>
      <button className="btn-primary" disabled={loading}>{loading ? "Checking..." : "Check status"}</button>
    </form>
    {error && <div className="track-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
    {result && <div className={`track-result track-${result.status}`}>
      <div className="track-result-head"><div><span>Request #{result.id}</span><h3>{result.name}</h3></div>
        {(() => {
          return <strong className={`application-status application-status-${result.status}`}>{STATUS_LABELS[result.status] ?? result.status}</strong>;
        })()}
      </div>
      <p>{result.feedback || (
        result.status === "pending"       ? "Your admission request has been received and is waiting for review by the admissions office." :
        result.status === "under_review"  ? "The school is currently reviewing your admission request." :
        result.status === "approved"      ? "Your admission request has been approved. Please contact the school for instructions on completing the official admission process." :
        result.status === "info_required" ? "The school needs additional information before making a decision. Please contact the admissions office." :
        "Your admission request was not approved at this time. Please read any feedback below or contact the school for more information."
      )}</p>
      {result.status === "approved" && <div className="track-contact"><i className="fa-solid fa-phone" /> School admissions: <a href="tel:0788451698">0788 451 698</a></div>}
      {result.feedbackFile && <a className="a-dl-btn" href={result.feedbackFile} target="_blank" rel="noreferrer"><i className="fa-solid fa-paperclip" /> {result.feedbackFileName || "Open attachment"}</a>}
    </div>}
  </section>;
}
