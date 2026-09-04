import { useEffect, useState } from "react";
import { GALLERY_PAGE_SIZE } from "./galleryConfig";

type GalleryPhoto = { img: string; cap: string };

type LightboxProps = {
  gallery: GalleryPhoto[];
  initialIndex: number;
  onClose: () => void;
};

// Fullscreen photo viewer. Opens on the same "slide" (group of up to
// GALLERY_PAGE_SIZE photos) the clicked thumbnail belongs to on the page.
// Whichever photo is active becomes the big hero image; every other photo in
// that slide becomes a thumbnail below it, sized with flex:1 so 1, 2, 3, 4 or
// 5 photos always divide the row evenly with no leftover space — clicking a
// thumbnail swaps it into the hero spot. The left/right arrows move between
// slides, exactly like the arrows on the page itself.
export default function Lightbox({ gallery, initialIndex, onClose }: LightboxProps) {
  const totalPages = Math.max(1, Math.ceil(gallery.length / GALLERY_PAGE_SIZE));
  const [page, setPage] = useState(Math.floor(initialIndex / GALLERY_PAGE_SIZE));
  const [activeInPage, setActiveInPage] = useState(initialIndex % GALLERY_PAGE_SIZE);

  const start = page * GALLERY_PAGE_SIZE;
  const group = gallery.slice(start, start + GALLERY_PAGE_SIZE);
  const hero = group[activeInPage] ?? group[0];
  const hasPages = totalPages > 1;

  const goPrevPage = () => {
    setPage((p) => (p - 1 + totalPages) % totalPages);
    setActiveInPage(0);
  };
  const goNextPage = () => {
    setPage((p) => (p + 1) % totalPages);
    setActiveInPage(0);
  };

  // Keyboard controls + lock background scroll while the lightbox is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPages) goPrevPage();
      if (e.key === "ArrowRight" && hasPages) goNextPage();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, hasPages]);

  if (!hero) return null;

  return (
    <div className="lb-overlay" onClick={onClose}>
      <button type="button" className="lb-close" onClick={onClose} aria-label="Close">
        <i className="fa-solid fa-xmark" />
      </button>

      <div className="lb-stage" onClick={(e) => e.stopPropagation()}>
        {hasPages && (
          <button type="button" className="lb-nav-btn prev" onClick={goPrevPage} aria-label="Previous photos">
            <i className="fa-solid fa-chevron-left" />
          </button>
        )}

        <div className="lb-content">
          <div className="lb-hero">
            <img src={hero.img} alt={hero.cap} />
          </div>
          <div className="lb-cap">{hero.cap}</div>

          {group.length > 1 && (
            <div className="lb-thumbs">
              {group.map((g, i) =>
                i === activeInPage ? null : (
                  <button
                    type="button"
                    key={`${start}-${i}`}
                    className="lb-thumb"
                    onClick={() => setActiveInPage(i)}
                  >
                    <img src={g.img} alt={g.cap} />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {hasPages && (
          <button type="button" className="lb-nav-btn next" onClick={goNextPage} aria-label="Next photos">
            <i className="fa-solid fa-chevron-right" />
          </button>
        )}
      </div>

      {hasPages && (
        <div className="lb-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`lb-dot ${i === page ? "active" : ""}`}
              onClick={() => {
                setPage(i);
                setActiveInPage(0);
              }}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
