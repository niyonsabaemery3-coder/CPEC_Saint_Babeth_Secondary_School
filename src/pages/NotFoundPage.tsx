import { Link } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";

export default function NotFoundPage() {
  useSEO({
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist.",
    path: "/404",
  });

  return (
    <section className="card" style={{ textAlign: "center" }}>
      <div className="section-head" style={{ margin: "0 auto" }}>
        <div className="eyebrow">
          <span className="bar" /> 404
        </div>
        <h1 className="hero-title">Page not found</h1>
        <p>The page you're looking for doesn't exist or may have moved.</p>
      </div>
      <div className="cta-row" style={{ justifyContent: "center" }}>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
