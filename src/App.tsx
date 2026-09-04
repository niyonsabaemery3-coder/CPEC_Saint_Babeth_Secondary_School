import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/layout/Layout";
import ScrollToTop from "./components/layout/ScrollToTop";
import HomePage from "./pages/HomePage";

// Route-level code-splitting: everything except the homepage (the page every
// visitor loads first) is fetched on demand. This keeps the initial JS
// bundle small — faster first paint / better Core Web Vitals — while each
// other page still loads instantly on click since Vite prefetches the chunk.
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AcademicsPage = lazy(() => import("./pages/AcademicsPage"));
const AdmissionsPage = lazy(() => import("./pages/AdmissionsPage"));
const TeachersPage = lazy(() => import("./pages/TeachersPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventsNewsPage = lazy(() => import("./pages/EventsNewsPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="academics" element={<AcademicsPage />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events-news" element={<EventsNewsPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
