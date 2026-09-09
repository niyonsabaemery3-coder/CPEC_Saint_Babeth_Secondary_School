import { useEffect, useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { ProgramCard } from "../../../types";
import FField from "./FField";
import SettingsMsg from "./SettingsMsg";

// Per-card local state
interface CardState {
  draft: ProgramCard;
  saving: boolean;
  saved: boolean;
  error: string | null;
  imgPreview: string;
}

function freshCard(p: ProgramCard): CardState {
  return { draft: { ...p }, saving: false, saved: false, error: null, imgPreview: p.img || "" };
}

export default function AcademicsPanel() {
  const { site, addProgram, updateProgram, deleteProgram, saveSiteSection } = useApp();

  const [cards, setCards] = useState<CardState[]>([]);
  const [stripTitle, setStripTitle] = useState(site.stripTitle ?? "");
  const [stripDesc, setStripDesc] = useState(site.stripDesc ?? "");
  const [stripSaving, setStripSaving] = useState(false);
  const [stripSaved, setStripSaved] = useState(false);
  const [stripError, setStripError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep cards in sync when server data updates
  useEffect(() => {
    setCards(site.programs.map(freshCard));
    setStripTitle(site.stripTitle ?? "");
    setStripDesc(site.stripDesc ?? "");
  }, [site.programs, site.stripTitle, site.stripDesc]);

  const patchCard = (i: number, patch: Partial<CardState>) =>
    setCards((prev) => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  const patchDraft = (i: number, key: keyof ProgramCard, val: string) =>
    setCards((prev) => prev.map((c, idx) =>
      idx === i ? { ...c, draft: { ...c.draft, [key]: val }, saved: false } : c
    ));

  const handleImg = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCards((prev) => prev.map((c, idx) =>
        idx === i ? { ...c, imgPreview: dataUrl, draft: { ...c.draft, img: dataUrl }, saved: false } : c
      ));
    };
    reader.readAsDataURL(file);
  };

  const saveCard = async (i: number) => {
    const c = cards[i];
    if (!c.draft.title?.trim()) {
      patchCard(i, { error: "Title is required." });
      return;
    }
    patchCard(i, { saving: true, error: null, saved: false });
    try {
      if (c.draft.id) {
        await updateProgram(c.draft.id, {
          section: c.draft.section || "Ordinary Level",
          title: c.draft.title,
          desc: c.draft.desc || "",
          img: c.draft.img || "",
        });
      }
      patchCard(i, { saving: false, saved: true, error: null });
    } catch (e: unknown) {
      patchCard(i, { saving: false, error: e instanceof Error ? e.message : "Failed to save." });
    }
  };

  const handleDelete = async (i: number) => {
    const c = cards[i];
    if (!c.draft.id) return;
    if (!confirm(`Delete "${c.draft.title}"? This cannot be undone.`)) return;
    try {
      await deleteProgram(c.draft.id);
    } catch {
      patchCard(i, { error: "Failed to delete." });
    }
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addProgram({ section: "Ordinary Level", title: "New Program", desc: "Add a description here.", img: "" });
    } finally {
      setAdding(false);
    }
  };

  const saveStrip = async () => {
    setStripSaving(true);
    setStripError(null);
    setStripSaved(false);
    try {
      await saveSiteSection("academics", { stripTitle, stripDesc, programs: site.programs });
      setStripSaved(true);
    } catch {
      setStripError("Failed to save. Please try again.");
    } finally {
      setStripSaving(false);
    }
  };

  return (
    <>
      <h3>Academics</h3>
      <p className="sp-sub">Manage program cards and the technology strip. Each card saves and deletes independently.</p>

      {/* Add new card */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button className="a-add-btn" onClick={handleAdd} disabled={adding}>
          <i className="fa-solid fa-plus" /> {adding ? "Adding…" : "Add program card"}
        </button>
      </div>

      {/* Per-card editing */}
      {cards.map((c, i) => (
        <div className="sp-block" key={c.draft.id ?? i}>

          {/* Card header: label + delete */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h5 style={{ margin: 0 }}>Program card {i + 1}</h5>
            <button className="a-del-btn" onClick={() => handleDelete(i)} title="Delete card">
              <i className="fa-solid fa-trash" />
            </button>
          </div>

          {/* Image upload */}
          <input
            ref={(el) => { fileRefs.current[i] = el; }}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleImg(i, e)}
          />
          <div
            className={`img-tile ${c.imgPreview ? "has-file" : ""}`}
            style={{
              backgroundImage: c.imgPreview ? `url('${c.imgPreview}')` : undefined,
              height: "140px",
              marginBottom: "14px",
              cursor: "pointer",
            }}
            onClick={() => fileRefs.current[i]?.click()}
            title="Click to set background image"
          >
            <span className="img-tile-hint">
              <i className={c.imgPreview ? "fa-solid fa-camera" : "fa-solid fa-plus"} />
              {" "}{c.imgPreview ? "Change background image" : "Add background image"}
            </span>
          </div>

          <FField
            label="Section / level"
            value={c.draft.section || "Ordinary Level"}
            onChange={(v) => patchDraft(i, "section", v)}
          />
          <FField
            label="Title"
            value={c.draft.title}
            onChange={(v) => patchDraft(i, "title", v)}
          />
          <FField
            label="Description"
            value={c.draft.desc}
            onChange={(v) => patchDraft(i, "desc", v)}
            multiline
          />

          <SettingsMsg
            text={c.error ?? (c.saved ? "Saved successfully." : "")}
            type={c.error ? "err" : c.saved ? "ok" : null}
          />
          <div className="sp-save-row">
            <button className="a-add-btn" onClick={() => saveCard(i)} disabled={c.saving}>
              <i className="fa-solid fa-floppy-disk" /> {c.saving ? "Saving…" : "Save card"}
            </button>
          </div>
        </div>
      ))}

      {/* Technology strip — separate block */}
      <div className="sp-block">
        <h5>Technology &amp; media track strip</h5>
        <FField label="Title" value={stripTitle} onChange={setStripTitle} />
        <FField label="Description" value={stripDesc} onChange={setStripDesc} multiline />
        <SettingsMsg
          text={stripError ?? (stripSaved ? "Strip saved." : "")}
          type={stripError ? "err" : stripSaved ? "ok" : null}
        />
        <div className="sp-save-row">
          <button className="a-add-btn" onClick={saveStrip} disabled={stripSaving}>
            <i className="fa-solid fa-floppy-disk" /> {stripSaving ? "Saving…" : "Save strip"}
          </button>
        </div>
      </div>
    </>
  );
}
