import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { StudentApplication } from "../../../types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  info_required: "More Info Required",
};

export default function ApplicationsView() {
  const { applications, fetchApplications, reviewApplication, deleteApplication, applicationTemplates, fetchApplicationTemplates, saveApplicationTemplates } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<"all" | StudentApplication["status"]>("all");
  const [selected, setSelected] = useState<StudentApplication | null>(null);
  const [feedback, setFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<StudentApplication["status"]>("pending");
  const [attachment, setAttachment] = useState<{ name: string; data: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templates, setTemplates] = useState<{pending: string; approved: string; rejected: string; under_review: string; info_required: string}>(
    { ...applicationTemplates, under_review: applicationTemplates.under_review ?? "", info_required: applicationTemplates.info_required ?? "" }
  );
  const [templatesSaved, setTemplatesSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchApplications().catch(() => {}); }, []);
  useEffect(() => { fetchApplicationTemplates().catch(() => {}); }, []);
  useEffect(() => setTemplates({ ...applicationTemplates, under_review: applicationTemplates.under_review ?? "", info_required: applicationTemplates.info_required ?? "" }), [applicationTemplates]);

  const visible = useMemo(() => status === "all" ? applications : applications.filter((application) => application.status === status), [applications, status]);

  const filter = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchApplications({ from, to });
  };

  const openReview = (application: StudentApplication) => {
    setSelected(application);
    setReviewStatus(application.status);
    setFeedback(application.feedback || (applicationTemplates as Record<string, string>)[application.status] || "");
    setAttachment(null);
  };

  const saveTemplates = async () => {
    await saveApplicationTemplates(templates);
    setTemplatesSaved(true);
    window.setTimeout(() => setTemplatesSaved(false), 2500);
  };

  const chooseAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachment({ name: file.name, data: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const saveReview = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await reviewApplication(selected.id, { status: reviewStatus, feedback, feedbackFileData: attachment?.data || null, feedbackFileName: attachment?.name || null });
      setSelected(null);
    } finally { setSaving(false); }
  };

  return <div className="admin-panel-view active">
    <div className="application-templates-panel">
      <button type="button" className="application-templates-toggle" onClick={() => setTemplatesOpen((open) => !open)}>
        <span><i className="fa-solid fa-message" /> Feedback message templates</span><i className={`fa-solid fa-chevron-${templatesOpen ? "up" : "down"}`} />
      </button>
      {templatesOpen && <div className="application-templates-body">
        <p>Write the reusable message first. It will automatically appear when you select the matching status during review.</p>
        {(["pending", "under_review", "approved", "rejected", "info_required"] as const).map((key) => <div className="ffield always-float" key={key}><textarea value={templates[key]} onChange={(event) => setTemplates((current) => ({ ...current, [key]: event.target.value }))} placeholder=" " /><label>{STATUS_LABELS[key]} message</label></div>)}
        <div className="sp-save-row"><span className="application-muted">{templatesSaved ? "Templates saved." : ""}</span><button type="button" className="a-add-btn" onClick={saveTemplates}><i className="fa-solid fa-check" /> Save templates</button></div>
      </div>}
    </div>
    <form className="application-filters" onSubmit={filter}>
      <div className="ffield always-float"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder=" " /><label>From date</label></div>
      <div className="ffield always-float"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder=" " /><label>To date</label></div>
      <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="under_review">Under Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="info_required">More Information Required</option>
      </select>
      <button className="a-add-btn" type="submit"><i className="fa-solid fa-filter" /> Filter</button>
    </form>

    <div className="a-table-wrap"><table className="a-table"><thead><tr><th>Applicant</th><th>Admission</th><th>Track / Date</th><th>Parent / Phones</th><th>Status</th><th>Report</th><th>Actions</th></tr></thead><tbody>
      {visible.length === 0 ? <tr><td colSpan={7} className="a-empty">No applications found for this filter.</td></tr> : visible.map((application) => <tr key={application.id}>
        <td><b>{application.name}</b><br /><span className="application-muted">#{application.id} · {application.gender || "—"}</span></td>
        <td>{application.admissionType ? application.admissionType.replace("_", " ") : "—"}<br /><span className="application-muted">{application.trackyear || "—"}</span></td>
        <td>{application.trackyear || "—"}<br /><span className="application-muted">{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "—"}</span></td>
        <td>{application.parent || "—"}<br /><span className="application-muted">{application.phone1}{application.phone2 ? ` · ${application.phone2}` : ""}</span></td>
        <td><span className={`application-status application-status-${application.status}`}>{
          application.status === "under_review" ? "Under Review" :
          application.status === "info_required" ? "More Info Required" :
          application.status
        }</span></td>
        <td>{application.report && application.reportData ? <a className="a-dl-btn" href={application.reportData} download={application.report}><i className="fa-solid fa-download" /> Report</a> : "—"}</td>
        <td className="application-actions"><button className="a-add-btn" onClick={() => openReview(application)}><i className="fa-solid fa-pen-to-square" /> Review</button><button className="a-del-btn" onClick={() => { if (confirm(`Delete ${application.name}'s application? This cannot be undone.`)) deleteApplication(application.id); }}><i className="fa-solid fa-trash" /></button></td>
      </tr>)}
    </tbody></table></div>

    {selected && <div className="application-review-overlay" role="dialog" aria-modal="true"><div className="application-review-modal">
      <button className="application-review-close" onClick={() => setSelected(null)} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
      <span className="gallery-admin-kicker">Application #{selected.id}</span><h3>Review {selected.name}</h3><p className="application-muted">{selected.trackyear} · {selected.parent} · {selected.phone1}</p>
      <label className="review-label">Decision</label><div className="review-status-buttons">{(["pending", "under_review", "approved", "rejected", "info_required"] as const).map((option) => <button type="button" key={option} className={reviewStatus === option ? `active ${option}` : ""} onClick={() => { setReviewStatus(option); setFeedback((applicationTemplates as Record<string, string>)[option] || ""); }}>{STATUS_LABELS[option] ?? option}</button>)}</div>
      <label className="review-label">Feedback for applicant</label><textarea className="review-feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Write a clear message for the applicant..." />
      <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" hidden onChange={chooseAttachment} />
      <button type="button" className="review-attachment" onClick={() => fileRef.current?.click()}><i className="fa-solid fa-plus" /> {attachment ? attachment.name : "Attach feedback file or image"}</button>
      <div className="sp-save-row"><button className="a-add-btn" onClick={saveReview} disabled={saving}><i className="fa-solid fa-check" /> {saving ? "Saving..." : "Save review"}</button></div>
    </div></div>}
  </div>;
}
