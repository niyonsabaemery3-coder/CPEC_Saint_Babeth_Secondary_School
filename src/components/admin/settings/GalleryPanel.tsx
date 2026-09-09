import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";
import type { GalleryItem } from "../../../types";
import FField from "./FField";
import ImgTile from "./ImgTile";
import SettingsMsg from "./SettingsMsg";

const BLANK_PHOTO: GalleryItem = { img: "", cap: "", category: "General" };

interface PhotoStatus {
  saving: boolean;
  saved: boolean;
  error: string | null;
}

export default function GalleryPanel() {
  const { site, addGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto } = useApp();
  const [draft, setDraft] = useState<GalleryItem[]>(site.gallery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [statuses, setStatuses] = useState<Record<string, PhotoStatus>>({});

  useEffect(() => {
    setDraft(site.gallery.map((photo) => ({ ...photo, category: photo.category || "General" })));
  }, [site.gallery]);

  const groups = useMemo(() => {
    const grouped = new Map<string, GalleryItem[]>();
    draft.forEach((photo) => {
      const category = photo.category.trim() || "General";
      grouped.set(category, [...(grouped.get(category) || []), photo]);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [draft]);

  const activePhotos = selectedCategory
    ? draft.filter((photo) => (photo.category.trim() || "General") === selectedCategory)
    : [];
  const activePhoto = activePhotos[photoIndex];
  const activeKey = activePhoto ? String(activePhoto.id ?? `${selectedCategory}-${photoIndex}`) : "";
  const activeStatus = statuses[activeKey];

  useEffect(() => {
    setCategoryDraft(activePhoto?.category || selectedCategory || "General");
  }, [activePhoto?.id, selectedCategory, photoIndex]);

  const setStatus = (key: string, patch: Partial<PhotoStatus>) => {
    setStatuses((current) => ({
      ...current,
      [key]: { ...{ saving: false, saved: false, error: null }, ...current[key], ...patch },
    }));
  };

  const setPhoto = (photo: GalleryItem, updates: Partial<GalleryItem>) => {
    if (updates.category !== undefined) return;
    setDraft((current) => current.map((item) => (item === photo ? { ...item, ...updates } : item)));
    setStatus(String(photo.id ?? `${selectedCategory}-${photoIndex}`), { saved: false, error: null });
  };

  const openCategory = (category: string) => {
    setSelectedCategory(category);
    setPhotoIndex(0);
  };

  const addPhoto = () => {
    const category = selectedCategory || "General";
    const existingCount = draft.filter((photo) => (photo.category || "General") === category).length;
    setDraft((current) => [...current, { ...BLANK_PHOTO, category }]);
    setSelectedCategory(category);
    setPhotoIndex(existingCount);
  };

  const savePhoto = async () => {
    if (!activePhoto) return;
    const key = activeKey;
    if (!activePhoto.img) {
      setStatus(key, { error: "Choose a photo before saving." });
      return;
    }
    const category = categoryDraft.trim() || "General";
    setStatus(key, { saving: true, error: null, saved: false });
    try {
      if (activePhoto.id) {
        await updateGalleryPhoto(activePhoto.id, { img: activePhoto.img, cap: activePhoto.cap, category });
      } else {
        await addGalleryPhoto({ img: activePhoto.img, cap: activePhoto.cap, category });
      }
      setDraft((current) => current.map((item) => (item === activePhoto ? { ...item, category } : item)));
      setSelectedCategory(category);
      setPhotoIndex(0);
      setStatus(key, { saving: false, saved: true, error: null });
    } catch {
      setStatus(key, { saving: false, error: "Failed to save this photo. Please try again." });
    }
  };

  const removePhoto = async () => {
    if (!activePhoto || !confirm("Remove this photo? This cannot be undone.")) return;
    const key = activeKey;
    setStatus(key, { saving: true, error: null });
    try {
      if (activePhoto.id) await deleteGalleryPhoto(activePhoto.id);
      setDraft((current) => current.filter((item) => item !== activePhoto));
      setPhotoIndex((current) => Math.max(0, Math.min(current, activePhotos.length - 2)));
    } catch {
      setStatus(key, { saving: false, error: "Failed to delete this photo. Please try again." });
    }
  };

  return (
    <>
      <div className="gallery-admin-heading">
        <div>
          <h3>Gallery</h3>
          <p className="sp-sub">Organise large photo collections by category. Open a category to review, edit, add or delete photos one at a time.</p>
        </div>
        <button type="button" className="a-add-btn" onClick={addPhoto}>
          <i className="fa-solid fa-plus" /> Add photo
        </button>
      </div>

      {!selectedCategory && (
        <>
          <div className="gallery-admin-overview-head">
            <div><strong>{draft.length}</strong> photos in <strong>{groups.length}</strong> categories</div>
            <span>Select a category to manage its collection</span>
          </div>
          <div className="gallery-category-grid">
            {groups.map(([category, photos]) => (
              <button type="button" className="gallery-category-card" key={category} onClick={() => openCategory(category)}>
                <span className="gallery-category-cover" style={{ backgroundImage: `url('${photos[0]?.img || ""}')` }}>
                  <span className="gallery-category-count">{photos.length} {photos.length === 1 ? "photo" : "photos"}</span>
                </span>
                <span className="gallery-category-meta">
                  <strong>{category}</strong>
                  <span>Manage collection <i className="fa-solid fa-arrow-right" /></span>
                </span>
              </button>
            ))}
            {groups.length === 0 && <div className="gallery-empty-state"><i className="fa-regular fa-images" /><strong>No photos yet</strong><span>Add your first photo to create a collection.</span></div>}
          </div>
        </>
      )}

      {selectedCategory && activePhoto && (
        <div className="gallery-admin-editor">
          <div className="gallery-admin-editor-head">
            <button type="button" className="btn-ghost gallery-back-btn" onClick={() => setSelectedCategory(null)}>
              <i className="fa-solid fa-arrow-left" /> All categories
            </button>
            <div>
              <span className="gallery-admin-kicker">Category collection</span>
              <h4>{selectedCategory}</h4>
              <span>{photoIndex + 1} of {activePhotos.length} photos</span>
            </div>
            <button type="button" className="a-del-btn" onClick={removePhoto} disabled={activeStatus?.saving} title="Delete photo">
              <i className="fa-solid fa-trash" /> Delete
            </button>
          </div>

          <div className="gallery-admin-editor-body">
            <div className="gallery-admin-editor-photo">
              <ImgTile src={activePhoto.img} onChange={(img) => setPhoto(activePhoto, { img })} />
              <div className="gallery-admin-stepper">
                <button type="button" onClick={() => setPhotoIndex((current) => (current - 1 + activePhotos.length) % activePhotos.length)} aria-label="Previous photo">
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <span>{photoIndex + 1} / {activePhotos.length}</span>
                <button type="button" onClick={() => setPhotoIndex((current) => (current + 1) % activePhotos.length)} aria-label="Next photo">
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            </div>
            <div className="gallery-admin-editor-fields">
              <div className="gallery-admin-field-title">Photo details</div>
              <FField label="Caption" value={activePhoto.cap} onChange={(cap) => setPhoto(activePhoto, { cap })} />
              <FField label="Category" value={categoryDraft} onChange={(category) => { setCategoryDraft(category); setStatus(activeKey, { saved: false, error: null }); }} />
              <SettingsMsg text={activeStatus?.error || (activeStatus?.saved ? "Photo saved successfully." : "Changes are ready to save.")} type={activeStatus?.error ? "err" : activeStatus?.saved ? "ok" : null} />
              <button type="button" className="a-add-btn gallery-save-btn" onClick={savePhoto} disabled={activeStatus?.saving}>
                <i className="fa-solid fa-check" /> {activeStatus?.saving ? "Saving..." : "Save photo"}
              </button>
            </div>
          </div>

          <div className="gallery-admin-thumbnails" aria-label={`${selectedCategory} photos`}>
            {activePhotos.map((photo, index) => (
              <button type="button" key={photo.id ?? `new-${index}`} className={index === photoIndex ? "active" : ""} onClick={() => setPhotoIndex(index)}>
                <img src={photo.img} alt={photo.cap || `Photo ${index + 1}`} loading="lazy" decoding="async" />
                <span>{index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCategory && !activePhoto && (
        <div className="gallery-empty-state"><i className="fa-regular fa-images" /><strong>This category is empty</strong><span>Add a photo to this collection.</span><button type="button" className="a-add-btn" onClick={addPhoto}><i className="fa-solid fa-plus" /> Add photo</button></div>
      )}
    </>
  );
}
