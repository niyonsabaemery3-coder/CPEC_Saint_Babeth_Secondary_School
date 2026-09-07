import { useEffect, useRef } from "react";

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

/**
 * Reveals characters one at a time inside `ref`, e.g. for a hero title.
 *
 * `mainText`   — rendered in normal ink color (no extra class).
 * `accentText` — rendered with the `accent` class so the CSS rule
 *                `h1.hero-title .accent { color: var(--gold) }` can apply.
 *
 * A double-fire guard (`lastAnimatedRef`) prevents the animation from
 * replaying when the parent component re-renders with the same text values
 * (e.g. after an async AppContext update that keeps heroMain/heroAccent
 * identical).
 */
export function useStaggerText(
  ref: React.RefObject<HTMLElement | null>,
  mainText: string,
  accentText = "",
  className = ""
) {
  const lastAnimatedRef = useRef<string>("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const main = mainText.trim();
    const accent = accentText.trim();
    const fullText = main + (accent ? " " + accent : "");

    // Guard: skip re-running when text content is unchanged and spans already exist.
    if (fullText === lastAnimatedRef.current && el.children.length > 0) return;

    el.innerHTML = "";

    // Helper that creates a single character span.
    const makeSpan = (char: string, spanClass: string): HTMLSpanElement => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      span.style.display = "inline-block";
      if (REDUCED_MOTION) {
        // Skip animation — show final state immediately so CSS coloring still works.
        span.style.opacity = "1";
        span.style.transform = "none";
      } else {
        span.style.opacity = "0";
      }
      if (spanClass) span.className = spanClass;
      return span;
    };

    const allSpans: HTMLSpanElement[] = [];

    // Pass 1 — main text (no accent class).
    for (const char of main.split("")) {
      const span = makeSpan(char, className);
      el.appendChild(span);
      allSpans.push(span);
    }

    // Space between the two segments.
    if (main && accent) {
      const spaceSpan = makeSpan(" ", className);
      el.appendChild(spaceSpan);
      allSpans.push(spaceSpan);
    }

    // Pass 2 — accent text (always includes "accent" class).
    const accentClass = [className, "accent"].filter(Boolean).join(" ");
    for (const char of accent.split("")) {
      const span = makeSpan(char, accentClass);
      el.appendChild(span);
      allSpans.push(span);
    }

    // Animate (skipped for REDUCED_MOTION — spans already have their final state).
    if (!REDUCED_MOTION) {
      allSpans.forEach((span, i) => {
        span.animate(
          [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 400, delay: 100 + i * 12, easing: EASE, fill: "forwards" }
        );
      });
    }

    lastAnimatedRef.current = fullText;
  }, [ref, mainText, accentText, className]);
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

/** Counts a numeric value from 0 to its final target when the element enters view. */
export function useCountUp(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root || REDUCED_MOTION) return;

    const elements = root.querySelectorAll<HTMLElement>(".feature-value");
    if (!elements.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target as HTMLElement;
          const finalValue = Number(el.dataset.count ?? el.textContent ?? "0");
          if (!Number.isFinite(finalValue)) return;

          const isCompact = el.dataset.format === "compact";
          const formatValue = (value: number) => {
            if (!isCompact || value < 1000) return String(value);
            const compact = value / 1000;
            return compact >= 100 ? `${Math.round(compact)}K` : `${compact.toFixed(1).replace(/\.0$/, "")}K`;
          };

          const startValue = 0;
          const duration = 1200;
          const startTime = performance.now();

          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - (1 - progress) ** 3;
            const current = Math.round(startValue + (finalValue - startValue) * eased);
            el.textContent = formatValue(current);

            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              el.textContent = formatValue(finalValue);
            }
          };

          requestAnimationFrame(tick);
          io.unobserve(el);
        });
      },
      { threshold: 0.35 }
    );

    elements.forEach((el) => {
      const finalValue = Number(el.dataset.count ?? el.textContent ?? "0");
      if (!Number.isFinite(finalValue)) return;
      el.textContent = "0";
      el.setAttribute("data-count", String(finalValue));
      io.observe(el);
    });

    return () => io.disconnect();
  }, [ref]);
}
