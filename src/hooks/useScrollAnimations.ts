import { useEffect } from "react";

// Lightweight, dependency-free replacement for the previous GSAP + ScrollTrigger
// powered animations. Same visual result (a short fade/translate reveal on
// scroll, and a per-character stagger-in for the hero title) using only the
// native IntersectionObserver and Web Animations APIs already built into
// every modern browser — this removes ~6MB of gsap from node_modules and a
// meaningful chunk of parsed/executed JS from the homepage's critical path.
//
// Both hooks respect prefers-reduced-motion by skipping the animation
// entirely and showing the final state immediately.

const REDUCED_MOTION =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const EASE = "cubic-bezier(0.16, 0.84, 0.44, 1)"; // close match for gsap's "power2.out"

/** Reveals `text` one character at a time inside `ref`, e.g. for a hero title. */
export function useStaggerText(ref: React.RefObject<HTMLElement | null>, text: string, className = "") {
  useEffect(() => {
    if (!ref.current || REDUCED_MOTION) return;
    const el = ref.current;
    el.innerHTML = "";
    const chars = text.split("");
    const spans: HTMLSpanElement[] = [];
    chars.forEach((char) => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      span.style.display = "inline-block";
      span.style.opacity = "0";
      if (className) span.className = className;
      el.appendChild(span);
      spans.push(span);
    });
    spans.forEach((span, i) => {
      span.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 400, delay: 100 + i * 12, easing: EASE, fill: "forwards" }
      );
    });
  }, [ref, text, className]);
}

/** Fades + translates `ref`'s element up into place the first time it scrolls into view. */
export function useFadeUp(ref: React.RefObject<HTMLElement | null>, startY = 24) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (REDUCED_MOTION) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    el.style.opacity = "0";
    el.style.transform = `translateY(${startY}px)`;
    el.style.transition = `opacity 0.55s ${EASE}, transform 0.55s ${EASE}`;

    // "top 88%" in the old ScrollTrigger config roughly means "already ~12%
    // into the viewport", hence the negative bottom rootMargin below.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        io.disconnect();
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, startY]);
}
