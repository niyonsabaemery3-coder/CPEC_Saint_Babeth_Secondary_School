import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import SettingsMsg from "./SettingsMsg";
import { pick } from "../../../utils/pick";

const OWNED_KEYS = ["programs", "stripTitle", "stripDesc"] as const;

export default function AcademicsPanel() {
  const { site, saveSiteSection } = useApp();
  const [draft, setDraft] = useState(site);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(site), [site]);

  const setProgram = (index: number, key: "title" | "desc", value: string) => {
    const next = [...draft.programs] as typeof draft.programs;
    next[index] = { ...next[index], [key]: value };
    setDraft((d) => ({ ...d, programs: next }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Only Academics's own fields are sent — PUT /api/site/academics, which
      // on the backend can only ever write strip_* columns + programs table.
      await saveSiteSection("academics", pick(draft, OWNED_KEYS));
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h3>Academics</h3>
      <p className="sp-sub">Edit the program cards and the technology track strip.</p>

      <div className="sp-block">
        <h5>Programs</h5>
        {draft.programs.map((p, i) => (
          <div key={i}>
            <FField label={`Program ${i + 1} title`} value={p.title} onChange={(v) => setProgram(i, "title", v)} />
            <FField label={`Program ${i + 1} description`} value={p.desc} onChange={(v) => setProgram(i, "desc", v)} multiline />
          </div>
        ))}
      </div>

      <div className="sp-block">
        <h5>Technology &amp; media track</h5>
        <FField label="Title" value={draft.stripTitle} onChange={(v) => setDraft((d) => ({ ...d, stripTitle: v }))} />
        <FField label="Description" value={draft.stripDesc} onChange={(v) => setDraft((d) => ({ ...d, stripDesc: v }))} multiline />
      </div>

      <SettingsMsg
        text={error || "Academics section updated — exit to the website to see it live."}
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
