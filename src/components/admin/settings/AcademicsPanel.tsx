import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import SettingsMsg from "./SettingsMsg";

export default function AcademicsPanel() {
  const { site, setSite } = useApp();
  const [draft, setDraft] = useState(site);
  const [saved, setSaved] = useState(false);

  const setProgram = (index: number, key: "title" | "desc", value: string) => {
    const next = [...draft.programs] as typeof draft.programs;
    next[index] = { ...next[index], [key]: value };
    setDraft((d) => ({ ...d, programs: next }));
  };

  const save = () => {
    setSite((s) => ({ ...s, ...draft }));
    setSaved(true);
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

      <SettingsMsg text="Academics section updated — exit to the website to see it live." type={saved ? "ok" : null} />
      <div className="sp-save-row">
        <button className="a-add-btn" onClick={save}>
          <i className="fa-solid fa-check" /> Save changes
        </button>
      </div>
    </>
  );
}
