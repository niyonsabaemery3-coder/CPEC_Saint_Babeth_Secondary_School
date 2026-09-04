import { Link, useOutletContext } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";
import Hero from "../components/sections/Hero";
import HomeEventsTeaser from "../components/sections/HomeEventsTeaser";
import About from "../components/sections/About";
import Academics from "../components/sections/Academics";
import Teachers from "../components/sections/Teachers";
import Resources from "../components/sections/Resources";
import Gallery from "../components/sections/Gallery";
import AdmissionsCTA from "../components/sections/AdmissionsCTA";
import type { LayoutContext } from "../components/layout/Layout";

function ViewFullPage({ to, label }: { to: string; label: string }) {
  return (
    <div className="view-full-row">
      <Link to={to} className="btn-ghost">
        {label} <i className="fa-solid fa-arrow-right" />
      </Link>
    </div>
  );
}

export default function HomePage() {
  const { onOpenLogin } = useOutletContext<LayoutContext>();
  useSEO({
    title: "CPEC Saint Babeth TSS",
    description:
      "CPEC Saint Babeth TSS in Byumba, Rwanda — a technical secondary school offering Software Development, ICT and Multimedia Production programs built on discipline, work and integrity.",
    path: "/",
  });

  return (
    <>
      <Hero />
      <About />
      <ViewFullPage to="/about" label="More About Our School" />
      <Academics />
      <ViewFullPage to="/academics" label="View All Academic Programs" />
      <HomeEventsTeaser />
      <Teachers />
      <ViewFullPage to="/teachers" label="Meet the Full Team" />
      <Resources onRequireLogin={onOpenLogin} teaser />
      <ViewFullPage to="/resources" label="Browse All Resources" />
      <Gallery teaser />
      <ViewFullPage to="/gallery" label="View Full Gallery" />
      <AdmissionsCTA />
    </>
  );
}
