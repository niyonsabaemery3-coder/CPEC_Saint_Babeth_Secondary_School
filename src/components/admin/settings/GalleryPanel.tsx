import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";

export default function GalleryPanel() {
  const { site, setSite } = useApp();
  const [draft, setDraft] = useState(site);
  const [saved, setSaved] = useState(false);

  const setItem = (index: number, key: "img" | "cap", value: string) => {
    const next = [...draft.gallery] as typeof draft.gallery;
    next[index] = { ...next[index], [key]: value };
    setDraft((d) => ({ ...d, gallery: next }));
  };

  const save = () => {
    setSite((s) => ({ ...s, ...draft }));
    setSaved(true);
  };

  return (
    <>
      <h3>Gallery</h3>
      <p className="sp-sub">Swap photos and edit their captions.</p>

      {draft.gallery.map((g, i) => (
        <div className="sp-block" key={i}>
          <h5>Photo {i + 1}</h5>
          <ImgTile src={g.img} onChange={(v) => setItem(i, "img", v)} />
          <FField label="Caption" value={g.cap} onChange={(v) => setItem(i, "cap", v)} />
        </div>
      ))}

      <SettingsMsg text="Gallery captions updated — exit to the website to see it live." type={saved ? "ok" : null} />
      <div className="sp-save-row">
        <button className="a-add-btn" onClick={save}>
          <i className="fa-solid fa-check" /> Save changes
        </button>
      </div>
    </>
  );
}
