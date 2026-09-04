import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";
import Teachers from "../components/sections/Teachers";
import { useApp } from "../context/AppContext";

export default function TeachersPage() {
  const { pageBanners } = useApp();
  const banner = pageBanners.teachers;

  useSEO({
    title: "Our Teachers",
    description:
      "Meet the dedicated educators of CPEC Saint Babeth TSS, guiding every student in and beyond the classroom.",
    path: "/teachers",
  });

  return (
    <>
      <PageHeader eyebrow={banner.eyebrow} title={banner.title} subtitle={banner.subtitle} bgImage={banner.bgImage} />
      <Teachers />
    </>
  );
}
