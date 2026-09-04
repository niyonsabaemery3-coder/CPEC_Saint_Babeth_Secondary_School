import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useFadeUp } from "../../hooks/useGsapAnimations";

// One page = 1 large "featured" tile + 4 regular tiles, matching the bento
// grid's 4-column x 2-row layout. Once there are more photos than this, the
// left/right arrows appear so visitors can page through the rest.
const PAGE_SIZE = 5;

interface GalleryProps {
  // When true, shows only the first page of photos with no prev/next paging
  // or page dots — used as the homepage teaser. The lightbox (click to
  // enlarge) still works. The full paginated gallery only renders on
  // GalleryPage (no prop passed there).
  teaser?: boolean;
}

export default function Gallery({ teaser = false }: GalleryProps) {
  const { site } = useApp();
  const fullGallery = site.gallery;
  const gallery = teaser ? fullGallery.slice(0, PAGE_SIZE) : fullGallery;
  const totalPages = teaser ? 1 : Math.max(1, Math.ceil(gallery.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);
  useFadeUp(ref);

  // Keep the current page valid if the gallery shrinks (e.g. admin removes photos).
  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [totalPages, page]);

  const start = page * PAGE_SIZE;
  const visible = gallery.slice(start, start + PAGE_SIZE);
  const hasPages = totalPages > 1;
  // How many tiles are on THIS page — the grid layout adapts to this number
  // (1, 2, 3, 4 or 5) so a partial last page never leaves an empty gap.
  const count = visible.length;

  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage((p) => (p + 1) % totalPages);

  const openLightbox = (i: number) => setLightboxIndex(start + i);
  const closeLightbox = () => setLightboxIndex(null);
  const showPrevPhoto = () =>
    setLightboxIndex((idx) => (idx === null ? null : (idx - 1 + gallery.length) % gallery.length));
  const showNextPhoto = () =>
    setLightboxIndex((idx) => (idx === null ? null : (idx + 1) % gallery.length));

  // Keyboard support while the lightbox is open: Esc closes, arrows navigate.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrevPhoto();
      if (e.key === "ArrowRight") showNextPhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, gallery.length]);

  const activePhoto = lightboxIndex !== null ? gallery[lightboxIndex] : null;

  return (
    <section id="gallery" className="card" ref={ref}>
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Gallery
        </div>
        <h2>Life at CPEC Saint Babeth</h2>
        <p>A glimpse into our classrooms, labs and school community.</p>
      </div>

      <div className="gal-wrap">
        {hasPages && (
          <button type="button" className="gal-nav-btn prev" onClick={goPrev} aria-label="Previous photos">
            <i className="fa-solid fa-chevron-left" />
          </button>
        )}

        <div className={`gal-grid count-${count}`}>
          {visible.map((g, i) => (
            <div
              className={`gal-item ${count === PAGE_SIZE && i === 0 ? "g1" : ""}`}
              key={`${page}-${i}`}
              onClick={() => openLightbox(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openLightbox(i);
              }}
            >
              <img src={g.img} alt={g.cap} />
              <div className="cap">{g.cap}</div>
            </div>
          ))}
        </div>

        {hasPages && (
          <button type="button" className="gal-nav-btn next" onClick={goNext} aria-label="Next photos">
            <i className="fa-solid fa-chevron-right" />
          </button>
        )}
      </div>

      {hasPages && (
        <div className="gal-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`gal-dot ${i === page ? "active" : ""}`}
              onClick={() => setPage(i)}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}

      {activePhoto && (
        <div className="gal-lightbox" onClick={closeLightbox}>
          <button type="button" className="gal-lb-close" onClick={closeLightbox} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>

          <button
            type="button"
            className="gal-lb-nav prev"
            onClick={(e) => {
              e.stopPropagation();
              showPrevPhoto();
            }}
            aria-label="Previous photo"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>

          <div className="gal-lb-content" onClick={(e) => e.stopPropagation()}>
            <img src={activePhoto.img} alt={activePhoto.cap} />
            <div className="gal-lb-meta">
              <span className="gal-lb-cap">{activePhoto.cap}</span>
              <span className="gal-lb-count">
                {(lightboxIndex ?? 0) + 1} / {gallery.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="gal-lb-nav next"
            onClick={(e) => {
              e.stopPropagation();
              showNextPhoto();
            }}
            aria-label="Next photo"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      )}
    </section>
  );
}
