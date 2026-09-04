import { useSEO } from "../hooks/useSEO";
import { useApp } from "../context/AppContext";
import PageHeader from "../components/layout/PageHeader";
import About from "../components/sections/About";

export default function AboutPage() {
  const { pageBanners } = useApp();
  const banner = pageBanners.about;

  useSEO({
    title: "About Our School",
    description:
      "Learn about CPEC Saint Babeth TSS's history, values and mission in Byumba, Rwanda — building discipline, work ethic and integrity in every student.",
    path: "/about",
  });

  return (
    <>
      <PageHeader eyebrow={banner.eyebrow} title={banner.title} subtitle={banner.subtitle} bgImage={banner.bgImage} />
      <About />
    </>
  );
}
