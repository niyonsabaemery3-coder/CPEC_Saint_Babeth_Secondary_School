import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description: string;
  path?: string; // e.g. "/about" — used for canonical + OG url
  image?: string; // absolute URL; falls back to the site-wide logo
  noindex?: boolean; // e.g. the 404 page — never index a soft-404 SPA route
}

const SITE_NAME = "CPEC Saint Babeth TSS";
const SITE_URL = "https://cpecstbabeth.rw"; // TODO: replace with the real production domain once deployed
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(attr: "name" | "property", key: string) {
  document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)?.remove();
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
 * Sets document title + meta description + canonical + Open Graph + Twitter
 * Card tags for the current route. Vite/CRA-style SPAs have no built-in
 * per-route SEO API (unlike Next.js metadata), so this hook fills that gap
 * without pulling in react-helmet or any other dependency.
 */
export function useSEO({ title, description, path = "", image, noindex = false }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE_NAME);

    const resolvedImage = image ?? DEFAULT_IMAGE;
    setMeta("property", "og:image", resolvedImage);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", resolvedImage);

    const url = `${SITE_URL}${path}`;
    setMeta("property", "og:url", url);
    setCanonical(url);

    // A client-rendered 404 can only ever be served with an HTTP 200 by a
    // static SPA host, so a noindex meta tag is the standard way to tell
    // crawlers not to index it (a "soft 404").
    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      removeMeta("name", "robots");
    }
  }, [title, description, path, image, noindex]);
}
