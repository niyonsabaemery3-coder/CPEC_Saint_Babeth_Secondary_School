import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { PageBanner, PageBannerKey } from "../../../types";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";

const PAGES: { key: PageBannerKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "academics", label: "Academics" },
  { key: "admissions", label: "Admissions" },
  { key: "teachers", label: "Teachers" },
  { key: "gallery", label: "Gallery" },
  { key: "contact", label: "Contact" },
];

export default function PageBannerPanel() {
  const { pageBanners, savePageBanner } = useApp();
  const [activeKey, setActiveKey] = useState<PageBannerKey>("about");
  const [draft, setDraft] = useState<PageBanner>(pageBanners[activeKey]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Whenever the selected page changes (or fresh data arrives from the
  // API), reset the draft to that page's own banner. Every other page's
  // data is never touched here.
  useEffect(() => {
    setDraft(pageBanners[activeKey]);
    setSaved(false);
    setError(null);
  }, [activeKey, pageBanners]);

  const selectPage = (key: PageBannerKey) => {
    if (key === activeKey) return;
    setActiveKey(key);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Only writes to /api/page-banners/:pageKey — i.e. only this one
      // page's row. Switching tabs never sends another page's data.
      await savePageBanner(activeKey, draft);
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h3>Page Banner</h3>
      <p className="sp-sub">
        Edit the title banner (the "card page-banner" at the top) shown on each inner page — its text and its own
        background photo. Pick a page below; each page's banner is saved separately from the others.
      </p>

      <div className="sp-block">
        <h5>Page</h5>
        <div className="pbp-tabs">
          {PAGES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`pbp-tab${p.key === activeKey ? " active" : ""}`}
              onClick={() => selectPage(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sp-block">
        <h5>Background image</h5>
        <ImgTile src={draft.bgImage} onChange={(v) => setDraft((d) => ({ ...d, bgImage: v }))} />
        {draft.bgImage && (
          <button type="button" className="btn-ghost" style={{ marginTop: 8 }} onClick={() => setDraft((d) => ({ ...d, bgImage: "" }))}>
            <i className="fa-solid fa-xmark" /> Remove background photo
          </button>
        )}
      </div>

      <div className="sp-block">
        <h5>Text</h5>
        <FField label="Eyebrow (small label above the title)" value={draft.eyebrow} onChange={(v) => setDraft((d) => ({ ...d, eyebrow: v }))} />
        <FField label="Title" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
        <FField label="Subtitle" value={draft.subtitle} onChange={(v) => setDraft((d) => ({ ...d, subtitle: v }))} multiline />
      </div>

      <SettingsMsg
        text={error || `${PAGES.find((p) => p.key === activeKey)?.label} banner updated — exit to the website to see it live.`}
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
