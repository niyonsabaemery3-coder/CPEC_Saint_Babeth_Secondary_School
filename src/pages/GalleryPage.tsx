import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";
import Gallery from "../components/sections/Gallery";
import { useApp } from "../context/AppContext";

export default function GalleryPage() {
  const { pageBanners } = useApp();
  const banner = pageBanners.gallery;

  useSEO({
    title: "Gallery",
    description: "Browse photos of student life, facilities and events at CPEC Saint Babeth TSS in Byumba, Rwanda.",
    path: "/gallery",
  });

  return (
    <>
      <PageHeader eyebrow={banner.eyebrow} title={banner.title} subtitle={banner.subtitle} bgImage={banner.bgImage} />
      <Gallery />
    </>
  );
}
