import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { api } from "../../../lib/api";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";

// Per-image save state shape
type ImgRowState = { saving: boolean; saved: boolean; error: string | null };
const freshRowState = (): ImgRowState => ({ saving: false, saved: false, error: null });

export default function HomePanel() {
  const { site, saveSiteSection, setSite } = useApp();
  const [draft, setDraft] = useState(site);

  // Hero text save state
  const [heroTextSaving, setHeroTextSaving] = useState(false);
  const [heroTextSaved, setHeroTextSaved] = useState(false);
  const [heroTextError, setHeroTextError] = useState<string | null>(null);

  // Highlight cards save state
  const [highlightSaving, setHighlightSaving] = useState(false);
  const [highlightSaved, setHighlightSaved] = useState(false);
  const [highlightError, setHighlightError] = useState<string | null>(null);

  // Per-image row save state — one entry per slot in heroImages
  const [rowStates, setRowStates] = useState<ImgRowState[]>([]);

  // Keep draft and rowStates in sync when server data arrives
  useEffect(() => {
    setDraft(site);
    const images = site.heroImages?.length ? site.heroImages : [site.heroImg];
    setRowStates(images.map(() => freshRowState()));
  }, [site]);

  // ---------------------------------------------------------------- helpers
  const heroImages = draft.heroImages?.length ? draft.heroImages : [draft.heroImg];

  const setHeroImages = (images: string[]) => {
    setDraft((d) => ({ ...d, heroImages: images, heroImg: images[0] || d.heroImg }));
    // Grow / shrink rowStates to match
    setRowStates((prev) => {
      const next = [...prev];
      while (next.length < images.length) next.push(freshRowState());
      return next.slice(0, images.length);
    });
  };

  const setRowState = (index: number, patch: Partial<ImgRowState>) =>
    setRowStates((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addHeroImage = () => setHeroImages([...heroImages, ""]);

  const removeHeroImage = (index: number) => {
    if (heroImages.length <= 1) return;
    setHeroImages(heroImages.filter((_, i) => i !== index));
  };

  const moveHeroImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= heroImages.length) return;
    const nextImgs = [...heroImages];
    [nextImgs[index], nextImgs[target]] = [nextImgs[target], nextImgs[index]];
    setHeroImages(nextImgs);
  };

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // ------------------------------------------- save ONE image row --------
  // Sends the FULL current heroImages array to the server so that ordering
  // and removals are always reflected. The base64 of a newly picked image
  // is only present in draft, so only that slot triggers a real upload.
  const saveImageRow = async (index: number) => {
    const images = draft.heroImages?.length ? draft.heroImages : [draft.heroImg];
    // Guard: must have an image selected in this slot
    if (!images[index]?.trim()) {
      setRowState(index, { error: "Pick an image first.", saving: false, saved: false });
      return;
    }
    setRowState(index, { saving: true, saved: false, error: null });
    try {
      const saved = await api.put<typeof site>("/api/site/home/hero-images", { heroImages: images }, "admin");
      // Merge server response back into global context so the live site
      // immediately reflects the new images.
      setSite((prev) => ({ ...prev, ...saved }));
      // Update local draft with the resolved URLs the server returned
      setDraft((d) => ({ ...d, heroImages: saved.heroImages, heroImg: saved.heroImg }));
      setRowState(index, { saving: false, saved: true, error: null });
    } catch {
      setRowState(index, { saving: false, saved: false, error: "Failed to save. Try again." });
    }
  };

  // ------------------------------------------- save hero text ------------
  const saveHeroText = async () => {
    setHeroTextSaving(true);
    setHeroTextError(null);
    setHeroTextSaved(false);
    try {
      await saveSiteSection("home", {
        heroMain: draft.heroMain.trim(),
        heroAccent: draft.heroAccent.trim(),
        heroSub: draft.heroSub,
      });
      setHeroTextSaved(true);
    } catch {
      setHeroTextError("Failed to save. Please try again.");
    } finally {
      setHeroTextSaving(false);
    }
  };

  // ------------------------------------------- save highlight cards ------
  const saveHighlights = async () => {
    setHighlightSaving(true);
    setHighlightError(null);
    setHighlightSaved(false);
    try {
      await saveSiteSection("home", {
        feat1Title: draft.feat1Title,
        feat1Desc: draft.feat1Desc,
        feat2Title: draft.feat2Title,
        feat2Desc: draft.feat2Desc,
        feat3Title: draft.feat3Title,
        feat3Desc: draft.feat3Desc,
      });
      setHighlightSaved(true);
    } catch {
      setHighlightError("Failed to save. Please try again.");
    } finally {
      setHighlightSaving(false);
    }
  };

  // ---------------------------------------------------------------- render
  return (
    <>
      <h3>Home</h3>
      <p className="sp-sub">Edit the homepage hero, image and highlight cards.</p>

      <div className="sp-block">
        <div className="home-hero-images-head">
          <div>
            <h5>Hero slideshow images</h5>
            <p>Images change automatically every 3 seconds on the homepage. Save each image individually.</p>
          </div>
          <button type="button" className="a-add-btn" onClick={addHeroImage}>
            <i className="fa-solid fa-plus" /> Add image
          </button>
        </div>

        <div className="home-hero-images-list">
          {heroImages.map((image, index) => {
            const rs = rowStates[index] ?? freshRowState();
            return (
              <div className="home-hero-image-row" key={index}>
                <div className="home-hero-image-number">{index + 1}</div>

                <ImgTile
                  src={image}
                  onChange={(value) => {
                    const next = [...heroImages];
                    next[index] = value;
                    setHeroImages(next);
                    // Clear stale feedback when a new image is picked
                    setRowState(index, freshRowState());
                  }}
                />

                <div className="home-hero-image-actions">
                  {/* Per-image Save button */}
                  <button
                    type="button"
                    className="a-add-btn"
                    onClick={() => saveImageRow(index)}
                    disabled={rs.saving}
                    title="Save this image"
                    style={{ fontSize: "11px", padding: "6px 10px" }}
                  >
                    {rs.saving ? (
                      <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
                    ) : rs.saved ? (
                      <><i className="fa-solid fa-check" /> Saved</>
                    ) : (
                      <><i className="fa-solid fa-floppy-disk" /> Save</>
                    )}
                  </button>

                  {rs.error && (
                    <span style={{ fontSize: "10px", color: "var(--red, #c0392b)", textAlign: "center", lineHeight: 1.3 }}>
                      {rs.error}
                    </span>
                  )}

                  <button
                    type="button"
                    className="a-del-btn"
                    onClick={() => removeHeroImage(index)}
                    disabled={heroImages.length <= 1}
                    title="Remove image"
                  >
                    <i className="fa-solid fa-trash" />
                  </button>

                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => moveHeroImage(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <i className="fa-solid fa-arrow-up" />
                  </button>

                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => moveHeroImage(index, 1)}
                    disabled={index === heroImages.length - 1}
                    title="Move down"
                  >
                    <i className="fa-solid fa-arrow-down" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sp-block">
        <h5>Hero text</h5>
        <FField label="Title (main)" value={draft.heroMain} onChange={(v) => set("heroMain", v)} />
        <FField label="Title (highlighted part)" value={draft.heroAccent} onChange={(v) => set("heroAccent", v)} />
        <FField label="Subtitle" value={draft.heroSub} onChange={(v) => set("heroSub", v)} multiline />
        <SettingsMsg
          text={heroTextError || "Saved — changes are live on the homepage."}
          type={heroTextError ? "err" : heroTextSaved ? "ok" : null}
        />
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={saveHeroText} disabled={heroTextSaving}>
            <i className="fa-solid fa-floppy-disk" /> {heroTextSaving ? "Saving…" : "Save hero text"}
          </button>
        </div>
      </div>

      <div className="sp-block">
        <h5>Highlight cards</h5>
        <FField label="Card 1 title" value={draft.feat1Title} onChange={(v) => set("feat1Title", v)} />
        <FField label="Card 1 description" value={draft.feat1Desc} onChange={(v) => set("feat1Desc", v)} multiline />
        <FField label="Card 2 title" value={draft.feat2Title} onChange={(v) => set("feat2Title", v)} />
        <FField label="Card 2 description" value={draft.feat2Desc} onChange={(v) => set("feat2Desc", v)} multiline />
        <FField label="Card 3 title" value={draft.feat3Title} onChange={(v) => set("feat3Title", v)} />
        <FField label="Card 3 description" value={draft.feat3Desc} onChange={(v) => set("feat3Desc", v)} multiline />
        <SettingsMsg
          text={highlightError || "Saved — changes are live on the homepage."}
          type={highlightError ? "err" : highlightSaved ? "ok" : null}
        />
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={saveHighlights} disabled={highlightSaving}>
            <i className="fa-solid fa-floppy-disk" /> {highlightSaving ? "Saving…" : "Save highlight cards"}
          </button>
        </div>
      </div>
    </>
  );
}
