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
      "Apply to CPEC Saint Babeth TSS in Byumba, Rwanda. Start your application online in a few simple steps.",
    path: "/admissions",
  });

  return (
    <>
      <PageHeader eyebrow={banner.eyebrow} title={banner.title} subtitle={banner.subtitle} bgImage={banner.bgImage} />
      <Apply />
    </>
  );
}
