import { Link } from "react-router-dom";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  bgImage?: string;
}

export default function PageHeader({ eyebrow, title, subtitle, bgImage }: PageHeaderProps) {
  const hasBg = Boolean(bgImage);

  return (
    <section
      className={`card page-banner${hasBg ? " has-bg" : ""}`}
      style={hasBg ? { backgroundImage: `linear-gradient(rgba(20, 16, 8, 0.5), rgba(20, 16, 8, 0.5)), url('${bgImage}')` } : undefined}
    >
      <div className="section-head" style={{ margin: "0 auto" }}>
        <div className="eyebrow">
          <span className="bar" /> {eyebrow}
        </div>
        <h1 className="hero-title" style={{ fontSize: "clamp(26px, 3.5vw, 38px)" }}>
          {title}
        </h1>
        {subtitle && <p>{subtitle}</p>}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link to="/">Home</Link> <span aria-hidden="true">/</span> <span>{title}</span>
        </nav>
      </div>
    </section>
  );
}
