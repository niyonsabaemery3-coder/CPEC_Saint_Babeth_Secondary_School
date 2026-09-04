import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";
import Contact from "../components/sections/Contact";
import { useApp } from "../context/AppContext";

export default function ContactPage() {
  const { pageBanners } = useApp();
  const banner = pageBanners.contact;

  useSEO({
    title: "Contact Us",
    description: "Reach CPEC Saint Babeth TSS in Byumba, Rwanda for admissions, partnerships, or general questions.",
    path: "/contact",
  });

  return (
    <>
      <PageHeader eyebrow={banner.eyebrow} title={banner.title} subtitle={banner.subtitle} bgImage={banner.bgImage} />
      <Contact />
    </>
  );
}
