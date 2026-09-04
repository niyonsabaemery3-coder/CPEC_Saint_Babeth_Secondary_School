import { Link, useOutletContext } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";
import type { LayoutContext } from "../components/layout/Layout";

const CLUBS = [
  { title: "Coding & Robotics Club", desc: "Weekly practice building small apps and simple robotics projects, led by the ICT department." },
  { title: "Debate & Leadership Club", desc: "Builds public speaking, critical thinking and student leadership skills." },
  { title: "Sports & Football Team", desc: "Inter-class and inter-school competitions throughout the year." },
  { title: "Music & Drama Society", desc: "Performs at school events, parents' day and community celebrations." },
];

export default function StudentsPage() {
  const { onOpenLogin } = useOutletContext<LayoutContext>();

  useSEO({
    title: "Student Life",
    description:
      "Discover student life at CPEC Saint Babeth TSS — clubs, activities, and the student portal for reports and resources.",
    path: "/students",
  });

  return (
    <>
      <PageHeader
        eyebrow="Student Life"
        title="Life As A Student"
        subtitle="Clubs, activities and support that go beyond the classroom."
      />

      <section className="card">
        <div className="section-head">
          <div className="eyebrow">
            <span className="bar" /> Get Involved
          </div>
          <h2>Clubs & activities</h2>
          <p>Something for every interest — technical, creative and athletic.</p>
        </div>
        <div className="prog-grid">
          {CLUBS.map((c, i) => (
            <div className="prog-card" key={i}>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <div className="eyebrow">
            <span className="bar" /> Student Portal
          </div>
          <h2>Your reports & resources, in one place</h2>
          <p>Sign in to view your report cards and access the full student resource library.</p>
        </div>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <button type="button" className="btn-primary" onClick={onOpenLogin}>
            <i className="fa-solid fa-right-to-bracket" /> Sign In
          </button>
          <Link to="/resources" className="btn-outline">
            Browse Resources
          </Link>
        </div>
      </section>
    </>
  );
}
