import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";
import { pick } from "../../../utils/pick";

// The ONLY fields this panel is allowed to write back — saving here must
// never touch fields owned by other panels (About, Gallery, Contact, …),
// even if this panel's local draft happens to be stale for those keys.
const OWNED_KEYS = [
  "heroImg",
  "heroImages",
  "heroMain",
  "heroAccent",
  "heroSub",
  "feat1Title",
  "feat1Desc",
  "feat2Title",
  "feat2Desc",
  "feat3Title",
  "feat3Desc",
] as const;

export default function HomePanel() {
  const { site, saveSiteSection } = useApp();
  const [draft, setDraft] = useState(site);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-sync once real data arrives from the server (covers opening this
  // panel before the initial /api/site fetch has resolved).
  useEffect(() => setDraft(site), [site]);

  const heroImages = draft.heroImages?.length ? draft.heroImages : [draft.heroImg];

  const setHeroImages = (images: string[]) => {
    setDraft((current) => ({ ...current, heroImages: images, heroImg: images[0] || current.heroImg }));
  };

  const addHeroImage = () => setHeroImages([...heroImages, ""]);

  const removeHeroImage = (index: number) => {
    if (heroImages.length <= 1) return;
    setHeroImages(heroImages.filter((_, imageIndex) => imageIndex !== index));
  };

  const moveHeroImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= heroImages.length) return;
    const next = [...heroImages];
    [next[index], next[target]] = [next[target], next[index]];
    setHeroImages(next);
  };

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Only this panel's own fields are sent — PUT /api/site/home, which on
      // the backend can only ever write hero_*/feat*_ columns.
      await saveSiteSection("home", pick(draft, OWNED_KEYS));
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h3>Home</h3>
      <p className="sp-sub">Edit the homepage hero, image and highlight cards.</p>

      <div className="sp-block">
        <div className="home-hero-images-head">
          <div>
            <h5>Hero slideshow images</h5>
            <p>Images change automatically every 3 seconds on the homepage.</p>
          </div>
          <button type="button" className="a-add-btn" onClick={addHeroImage}>
            <i className="fa-solid fa-plus" /> Add image
          </button>
        </div>
        <div className="home-hero-images-list">
          {heroImages.map((image, index) => (
            <div className="home-hero-image-row" key={index}>
              <div className="home-hero-image-number">{index + 1}</div>
              <ImgTile src={image} onChange={(value) => {
                const next = [...heroImages];
                next[index] = value;
                setHeroImages(next);
              }} />
              <div className="home-hero-image-actions">
                <button type="button" className="a-del-btn" onClick={() => removeHeroImage(index)} disabled={heroImages.length <= 1} title="Remove image">
                  <i className="fa-solid fa-trash" />
                </button>
                <button type="button" className="btn-ghost" onClick={() => moveHeroImage(index, -1)} disabled={index === 0} title="Move image left">
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <button type="button" className="btn-ghost" onClick={() => moveHeroImage(index, 1)} disabled={index === heroImages.length - 1} title="Move image right">
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sp-block">
        <h5>Hero text</h5>
        <FField label="Title (main)" value={draft.heroMain} onChange={(v) => set("heroMain", v)} />
        <FField label="Title (highlighted part)" value={draft.heroAccent} onChange={(v) => set("heroAccent", v)} />
        <FField label="Subtitle" value={draft.heroSub} onChange={(v) => set("heroSub", v)} multiline />
      </div>

      <div className="sp-block">
        <h5>Highlight cards</h5>
        <FField label="Card 1 title" value={draft.feat1Title} onChange={(v) => set("feat1Title", v)} />
        <FField label="Card 1 description" value={draft.feat1Desc} onChange={(v) => set("feat1Desc", v)} multiline />
        <FField label="Card 2 title" value={draft.feat2Title} onChange={(v) => set("feat2Title", v)} />
        <FField label="Card 2 description" value={draft.feat2Desc} onChange={(v) => set("feat2Desc", v)} multiline />
        <FField label="Card 3 title" value={draft.feat3Title} onChange={(v) => set("feat3Title", v)} />
        <FField label="Card 3 description" value={draft.feat3Desc} onChange={(v) => set("feat3Desc", v)} multiline />
      </div>

      <SettingsMsg
        text={error || "Home page updated — exit to the website to see it live."}
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
