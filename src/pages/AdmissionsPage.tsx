import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";
import Apply from "../components/sections/Apply";
import { useApp } from "../context/AppContext";

export default function AdmissionsPage() {
  const { pageBanners } = useApp();
  const banner = pageBanners.admissions;

  useSEO({
    title: "Admissions",
    description:
      "Submit an admission request to CPEC Saint Babeth TSS in Byumba, Rwanda. All requests are reviewed by the school.",
    path: "/admissions",
  });

  return (
    <>
      <PageHeader eyebrow={banner.eyebrow} title={banner.title} subtitle={banner.subtitle} bgImage={banner.bgImage} />
      <Apply />
    </>
  );
}
