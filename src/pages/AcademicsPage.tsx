import { useSEO } from "../hooks/useSEO";
import { useApp } from "../context/AppContext";
import PageHeader from "../components/layout/PageHeader";
import Academics from "../components/sections/Academics";

export default function AcademicsPage() {
  const { pageBanners } = useApp();
  const banner = pageBanners.academics;

  useSEO({
    title: "Academics",
    description:
      "Explore CPEC Saint Babeth TSS's Ordinary Level curriculum, including Software Development, ICT and Multimedia Production programs.",
    path: "/academics",
  });

  return (
    <>
      <PageHeader eyebrow={banner.eyebrow} title={banner.title} subtitle={banner.subtitle} bgImage={banner.bgImage} />
      <Academics />
    </>
  );
}
