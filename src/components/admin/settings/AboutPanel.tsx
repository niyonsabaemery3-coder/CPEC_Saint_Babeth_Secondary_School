import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";
import { pick } from "../../../utils/pick";

const OWNED_KEYS = ["aboutImg", "aboutTitle", "aboutPara1", "aboutPara2", "aboutLi"] as const;

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

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Only About's own fields are sent — PUT /api/site/about, which on the
      // backend can only ever write about_* columns + the about_points table.
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

      <div className="sp-block">
        <h5>About image</h5>
        <ImgTile src={draft.aboutImg} onChange={(v) => setDraft((d) => ({ ...d, aboutImg: v }))} />
      </div>

      <div className="sp-block">
        <h5>Text</h5>
        <FField label="Heading" value={draft.aboutTitle} onChange={(v) => setDraft((d) => ({ ...d, aboutTitle: v }))} />
        <FField label="Paragraph 1" value={draft.aboutPara1} onChange={(v) => setDraft((d) => ({ ...d, aboutPara1: v }))} multiline />
        <FField label="Paragraph 2" value={draft.aboutPara2} onChange={(v) => setDraft((d) => ({ ...d, aboutPara2: v }))} multiline />
        {draft.aboutLi.map((item, i) => (
          <FField key={i} label={`List item ${i + 1}`} value={item} onChange={(v) => setLi(i, v)} />
        ))}
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
