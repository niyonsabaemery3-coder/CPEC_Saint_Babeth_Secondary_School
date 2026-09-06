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

  useSEO({ title: "Track Application", description: "Check the status of your CPEC Saint Babeth TSS application.", path: "/track-application" });

  const track = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try { setResult(await trackApplication(lookup.trim())); }
    catch (e) { setError(e instanceof Error ? e.message : "Application not found."); }
    finally { setLoading(false); }
  };

  return <section className="card track-application-page">
    <div className="section-head"><div className="eyebrow"><span className="bar" /> Admissions</div><h2>Track your application</h2><p>Enter your Application ID, parent phone number, or email address.</p></div>
    <form className="track-form" onSubmit={track}>
      <div className="ffield always-float"><input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder=" " required /><label>Application ID, phone or email</label></div>
      <button className="btn-primary" disabled={loading}>{loading ? "Checking..." : "Check status"}</button>
    </form>
    {error && <div className="track-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
    {result && <div className={`track-result track-${result.status}`}>
      <div className="track-result-head"><div><span>Application #{result.id}</span><h3>{result.name}</h3></div><strong>{result.status}</strong></div>
      <p>{result.feedback || (result.status === "pending" ? "Your application is being reviewed by the admissions office." : result.status === "approved" ? "Your application has been approved. Please contact the school using the numbers below." : "Your application was not approved. Please read the feedback below.")}</p>
      {result.status === "approved" && <div className="track-contact"><i className="fa-solid fa-phone" /> School admissions: <a href="tel:0788451698">0788 451 698</a></div>}
      {result.feedbackFile && <a className="a-dl-btn" href={result.feedbackFile} target="_blank" rel="noreferrer"><i className="fa-solid fa-paperclip" /> {result.feedbackFileName || "Open attachment"}</a>}
    </div>}
  </section>;
}