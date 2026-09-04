import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Resets scroll position on every route change, except when navigating
 * to an in-page anchor (e.g. "/#apply") where the browser should scroll
 * to that section instead. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
