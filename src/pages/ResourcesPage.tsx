import { useOutletContext } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";
import PageHeader from "../components/layout/PageHeader";
import Resources from "../components/sections/Resources";
import type { LayoutContext } from "../components/layout/Layout";

export default function ResourcesPage() {
  const { onOpenLogin } = useOutletContext<LayoutContext>();

  useSEO({
    title: "Student Resources",
    description:
      "Access notes, presentations and past papers by class and subject at CPEC Saint Babeth TSS. Sign in as a student for the full library.",
    path: "/resources",
  });

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Student Resources"
        subtitle="Notes, presentations and past papers, organised by class and subject."
      />
      <Resources onRequireLogin={onOpenLogin} />
    </>
  );
}
