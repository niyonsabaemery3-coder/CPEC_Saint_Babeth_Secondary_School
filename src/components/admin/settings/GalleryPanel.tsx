import { useEffect, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { GalleryItem } from "../../../types";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";

const BLANK_PHOTO: GalleryItem = { img: "", cap: "" };

interface RowStatus {
  saving: boolean;
  saved: boolean;
  error: string | null;
}

export default function GalleryPanel() {
  const { site, addGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto } = useApp();
  const [draft, setDraft] = useState<GalleryItem[]>(site.gallery);
  // Save/error state per row, keyed by its position in the list — each
  // photo's Save button only ever affects that one row's status.
  const [statuses, setStatuses] = useState<Record<number, RowStatus>>({});

  useEffect(() => setDraft(site.gallery), [site.gallery]);

  const setItem = (index: number, key: "img" | "cap", value: string) => {
    setDraft((d) => d.map((g, i) => (i === index ? { ...g, [key]: value } : g)));
    setStatuses((s) => ({ ...s, [index]: { saving: false, saved: false, error: null } }));
  };

  const setRowStatus = (index: number, patch: Partial<RowStatus>) => {
    setStatuses((s) => ({ ...s, [index]: { ...s[index], ...patch } }));
  };

  const addPhoto = () => {
    setDraft((d) => [...d, { ...BLANK_PHOTO }]);
  };

  // Saves ONLY this one photo — POST if it's new (no id yet), PUT if it
  // already exists. Every other photo on screen, saved or not, is left
  // completely untouched by this call.
  const savePhoto = async (index: number) => {
    const photo = draft[index];
    if (!photo.img) {
      setRowStatus(index, { error: "Add a photo before saving.", saved: false });
      return;
    }
    setRowStatus(index, { saving: true, error: null, saved: false });
    try {
      if (photo.id) {
        await updateGalleryPhoto(photo.id, { img: photo.img, cap: photo.cap });
      } else {
        await addGalleryPhoto({ img: photo.img, cap: photo.cap });
      }
      setRowStatus(index, { saving: false, saved: true });
    } catch {
      setRowStatus(index, { saving: false, error: "Failed to save. Please try again." });
    }
  };

  // Removes ONLY this one photo. If it was already saved, this deletes just
  // that row on the server (DELETE /api/site/gallery/:id) — no other photo
  // is affected. If it was never saved yet, it's simply dropped locally.
  const removePhoto = async (index: number) => {
    if (draft.length <= 1) return; // always keep at least one photo
    const photo = draft[index];
    if (photo.id) {
      setRowStatus(index, { saving: true, error: null });
      try {
        await deleteGalleryPhoto(photo.id);
      } catch {
        setRowStatus(index, { saving: false, error: "Failed to remove. Please try again." });
      }
    } else {
      setDraft((d) => d.filter((_, i) => i !== index));
    }
  };

  return (
    <>
      <h3>Gallery</h3>
      <p className="sp-sub">
        Each photo has its own Save button — add or update one photo at a time without affecting the others. If you
        add a new photo slot and forget to choose an image, only that photo's save will be blocked; everything else
        stays exactly as it was. Once you have more than 5 photos, visitors will see left/right arrows on the public
        site to page through them.
      </p>

      {draft.map((g, i) => {
        const st = statuses[i];
        return (
          <div className="sp-block" key={g.id ?? `new-${i}`}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h5 style={{ margin: 0 }}>Photo {i + 1}</h5>
              <button
                type="button"
                className="a-del-btn"
                onClick={() => removePhoto(i)}
                disabled={draft.length <= 1 || st?.saving}
                title="Remove this photo"
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
            <ImgTile src={g.img} onChange={(v) => setItem(i, "img", v)} />
            <FField label="Caption" value={g.cap} onChange={(v) => setItem(i, "cap", v)} />

            <SettingsMsg text={st?.error || "Photo saved."} type={st?.error ? "err" : st?.saved ? "ok" : null} />
            <div className="sp-save-row">
              <button className="a-add-btn" onClick={() => savePhoto(i)} disabled={st?.saving}>
                <i className="fa-solid fa-check" /> {st?.saving ? "Saving..." : "Save photo"}
              </button>
            </div>
          </div>
        );
      })}

      <button type="button" className="btn-ghost" style={{ marginBottom: "18px" }} onClick={addPhoto}>
        <i className="fa-solid fa-plus" /> Add Photo
      </button>
    </>
  );
}
