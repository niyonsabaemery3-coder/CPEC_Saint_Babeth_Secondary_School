import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";

interface NewsItem {
  date: string;
  category: string;
  title: string;
  excerpt: string;
}

const NEWS: NewsItem[] = [
  {
    date: "August 18, 2026",
    category: "Academics",
    title: "Term 3 timetable and exam schedule released",
    excerpt:
      "The Term 3 class timetable and end-of-term exam schedule are now available to students and parents. Please check the Resources page for your class's copy.",
  },
  {
    date: "August 5, 2026",
    category: "Achievement",
    title: "Software Development class wins district ICT competition",
    excerpt:
      "Our Level 3 Software Development students took first place at the district ICT innovation competition, presenting a mobile app built to help local farmers track produce prices.",
  },
  {
    date: "July 22, 2026",
    category: "Admissions",
    title: "2027 admissions open for Senior 1 and Senior 4",
    excerpt:
      "Applications for the next academic year are now open. Parents and prospective students can apply online through the Admissions page or visit the school office in Byumba.",
  },
  {
    date: "July 10, 2026",
    category: "Community",
    title: "Parents' day: strong turnout for Term 2 report discussions",
    excerpt:
      "Parents and guardians met with class teachers to review Term 2 progress reports and discuss support plans ahead of Term 3.",
  },
];

export default function NewsPage() {
  useSEO({
    title: "News & Announcements",
    description:
      "Read the latest news, announcements and achievements from CPEC Saint Babeth TSS in Byumba, Rwanda.",
    path: "/news",
  });

  return (
    <>
      <PageHeader
        eyebrow="News"
        title="News & Announcements"
        subtitle="Stay up to date with what's happening at CPEC Saint Babeth TSS."
      />
      <section className="card">
        <div className="prog-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {NEWS.map((item, i) => (
            <article className="prog-card" key={i}>
              <span className="tag">{item.category}</span>
              <h3>{item.title}</h3>
              <p style={{ marginBottom: 10 }}>{item.excerpt}</p>
              <time style={{ fontSize: 13, color: "var(--ink-faint, #888)" }}>{item.date}</time>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
