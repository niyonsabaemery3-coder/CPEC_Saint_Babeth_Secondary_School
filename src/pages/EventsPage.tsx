import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";

interface EventItem {
  date: string;
  title: string;
  location: string;
  description: string;
}

const EVENTS: EventItem[] = [
  {
    date: "Sep 1, 2026",
    title: "Term 3 begins",
    location: "Main campus, Byumba",
    description: "Students report back for the start of Term 3. Timetables are posted on the notice board and Resources page.",
  },
  {
    date: "Sep 12, 2026",
    title: "Open day for prospective families",
    location: "Main campus, Byumba",
    description: "Tour the classrooms and workshops, meet teachers, and learn about our Software Development, ICT and Multimedia programs.",
  },
  {
    date: "Oct 3, 2026",
    title: "Inter-class football tournament",
    location: "School sports field",
    description: "Annual friendly competition between classes, organised by the Student Life committee.",
  },
  {
    date: "Oct 24, 2026",
    title: "Career guidance day",
    location: "School hall",
    description: "Guest speakers from local tech companies and vocational institutes share career paths for TSS graduates.",
  },
  {
    date: "Nov 14, 2026",
    title: "Parents' day — Term 3 progress reports",
    location: "Main campus, Byumba",
    description: "Parents and guardians meet class teachers to review student progress ahead of end-of-year exams.",
  },
];

export default function EventsPage() {
  useSEO({
    title: "Upcoming Events",
    description: "See upcoming events, tournaments and open days at CPEC Saint Babeth TSS in Byumba, Rwanda.",
    path: "/events",
  });

  return (
    <>
      <PageHeader eyebrow="Events" title="Upcoming Events" subtitle="What's coming up at CPEC Saint Babeth TSS this term." />
      <section className="card">
        <div style={{ display: "grid", gap: 16 }}>
          {EVENTS.map((ev, i) => (
            <article key={i} className="info-card" style={{ alignItems: "flex-start", gridTemplateColumns: "auto 1fr" }}>
              <div className="icon">
                <i className="fa-solid fa-calendar-days" />
              </div>
              <div>
                <h4>
                  {ev.title} <span style={{ fontWeight: 600, color: "var(--gold-dark)" }}>· {ev.date}</span>
                </h4>
                <p style={{ marginBottom: 4 }}>{ev.description}</p>
                <p style={{ fontSize: 13 }}>
                  <i className="fa-solid fa-location-dot" /> {ev.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
