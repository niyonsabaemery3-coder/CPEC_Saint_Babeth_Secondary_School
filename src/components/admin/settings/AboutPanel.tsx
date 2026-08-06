import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";

export default function AboutPanel() {
  const { site, setSite } = useApp();
  const [draft, setDraft] = useState(site);
  const [saved, setSaved] = useState(false);

  const setLi = (index: number, value: string) => {
    const next = [...draft.aboutLi] as typeof draft.aboutLi;
    next[index] = value;
    setDraft((d) => ({ ...d, aboutLi: next }));
  };

  const save = () => {
    setSite((s) => ({ ...s, ...draft }));
    setSaved(true);
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

      <SettingsMsg text="About section updated — exit to the website to see it live." type={saved ? "ok" : null} />
      <div className="sp-save-row">
        <button className="a-add-btn" onClick={save}>
          <i className="fa-solid fa-check" /> Save changes
        </button>
      </div>
    </>
  );
}
