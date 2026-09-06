import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";
import { pick } from "../../../utils/pick";

const OWNED_KEYS = [
  "aboutImg",
  "aboutTitle",
  "aboutPara1",
  "aboutPara2",
  "aboutHistory",
  "mission",
  "vision",
  "coreValues",
  "aboutLi",
] as const;

export default function AboutPanel() {
  const { site, saveSiteSection } = useApp();
  const [draft, setDraft] = useState(site);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(site), [site]);

  const setLi = (index: number, value: string) => {
    const next = [...draft.aboutLi] as typeof draft.aboutLi;
    next[index] = value;
    setDraft((d) => ({ ...d, aboutLi: next }));
  };

  const setCoreValue = (index: number, value: string) => {
    const next = [...draft.coreValues];
    next[index] = value;
    setDraft((d) => ({ ...d, coreValues: next }));
  };

  const addCoreValue = () =>
    setDraft((d) => ({ ...d, coreValues: [...d.coreValues, "New core value"] }));

  const removeCoreValue = (index: number) =>
    setDraft((d) => ({ ...d, coreValues: d.coreValues.filter((_, i) => i !== index) }));

  const addHighlight = () =>
    setDraft((d) => ({ ...d, aboutLi: [...d.aboutLi, "New school highlight"] as typeof d.aboutLi }));

  const removeHighlight = (index: number) =>
    setDraft((d) => ({ ...d, aboutLi: d.aboutLi.filter((_, i) => i !== index) as typeof d.aboutLi }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveSiteSection("about", pick(draft, OWNED_KEYS));
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h3>About</h3>
      <p className="sp-sub">Edit the About Our School section.</p>

      {/* ── Image ───────────────────────────────────────────── */}
      <div className="sp-block">
        <h5>About image</h5>
        <p className="sp-sub" style={{ marginTop: 0 }}>
          This image is displayed with a fixed decorative frame on both the homepage teaser and the full About page.
        </p>
        <ImgTile src={draft.aboutImg} onChange={(v) => setDraft((d) => ({ ...d, aboutImg: v }))} />
      </div>

      {/* ── Who We Are ──────────────────────────────────────── */}
      <div className="sp-block">
        <h5>Who We Are</h5>
        <p className="sp-sub" style={{ marginTop: 0 }}>
          Shown on both the homepage teaser and the "Who We Are" tab on the full About page.
        </p>
        <FField label="Heading" value={draft.aboutTitle} onChange={(v) => setDraft((d) => ({ ...d, aboutTitle: v }))} />
        <FField label="Paragraph 1 (shown on homepage)" value={draft.aboutPara1} onChange={(v) => setDraft((d) => ({ ...d, aboutPara1: v }))} multiline />
        <FField label="Paragraph 2 (full page only)" value={draft.aboutPara2} onChange={(v) => setDraft((d) => ({ ...d, aboutPara2: v }))} multiline />
        <FField label="Mission" value={draft.mission} onChange={(v) => setDraft((d) => ({ ...d, mission: v }))} multiline />
        <FField label="Vision" value={draft.vision} onChange={(v) => setDraft((d) => ({ ...d, vision: v }))} multiline />

        <div className="about-admin-values">
          <div className="about-admin-values-head">
            <strong>Core values</strong>
            <button className="a-add-btn" onClick={addCoreValue} type="button">
              <i className="fa-solid fa-plus" /> Add value
            </button>
          </div>
          {draft.coreValues.map((item, i) => (
            <div key={i} className="about-admin-value-row">
              <FField label={`Core value ${i + 1}`} value={item} onChange={(v) => setCoreValue(i, v)} />
              <button className="a-remove-btn" title="Remove" onClick={() => removeCoreValue(i)} type="button">
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>

        <div className="about-admin-values">
          <div className="about-admin-values-head">
            <strong>School highlights</strong>
            <button className="a-add-btn" onClick={addHighlight} type="button">
              <i className="fa-solid fa-plus" /> Add highlight
            </button>
          </div>
          {draft.aboutLi.map((item, i) => (
            <div key={i} className="about-admin-value-row">
              <FField label={`Highlight ${i + 1}`} value={item} onChange={(v) => setLi(i, v)} />
              <button className="a-remove-btn" title="Remove" onClick={() => removeHighlight(i)} type="button">
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Our History ─────────────────────────────────────── */}
      <div className="sp-block">
        <h5>Our History</h5>
        <p className="sp-sub" style={{ marginTop: 0 }}>
          Shown on the "Our History" tab of the full About page. Separate paragraphs with a blank line between them.
        </p>
        <FField
          label="Our History text"
          value={draft.aboutHistory}
          onChange={(v) => setDraft((d) => ({ ...d, aboutHistory: v }))}
          multiline
        />
      </div>

      <SettingsMsg
        text={error || "About section updated — exit to the website to see it live."}
        type={error ? "err" : saved ? "ok" : null}
      />
      <div className="sp-save-row">
        <button className="a-add-btn" onClick={save} disabled={saving}>
          <i className="fa-solid fa-check" /> {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </>
  );
}
