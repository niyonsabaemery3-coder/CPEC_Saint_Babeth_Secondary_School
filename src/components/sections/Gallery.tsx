import { useApp } from "../../context/AppContext";

export default function Gallery() {
  const { site } = useApp();

  return (
    <section id="gallery" className="card">
      <div className="section-head">
        <div className="eyebrow">
          <span className="bar" /> Gallery
        </div>
        <h2>Life at CPEC Saint Babeth</h2>
        <p>A glimpse into our classrooms, labs and school community.</p>
      </div>
      <div className="gal-grid">
        {site.gallery.map((g, i) => (
          <div className={`gal-item ${i === 0 ? "g1" : ""}`} key={i}>
            <img src={g.img} alt={g.cap} />
            <div className="cap">{g.cap}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
