import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description: string;
  path?: string; // e.g. "/about" — used for canonical + OG url
}

const SITE_NAME = "CPEC Saint Babeth TSS";
const SITE_URL = "https://cpecstbabeth.rw"; // TODO: replace with the real production domain once deployed

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets document title + meta description + canonical + Open Graph tags for
 * the current route. Vite/CRA-style SPAs have no built-in per-route SEO API
 * (unlike Next.js metadata), so this hook fills that gap without pulling in
 * react-helmet or any other dependency.
 */
export function useSEO({ title, description, path = "" }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE_NAME);

    const url = `${SITE_URL}${path}`;
    setMeta("property", "og:url", url);
    setCanonical(url);
  }, [title, description, path]);
}
