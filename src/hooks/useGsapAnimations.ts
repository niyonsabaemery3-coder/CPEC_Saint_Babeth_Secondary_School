import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useStaggerText(ref: React.RefObject<HTMLElement | null>, text: string, className = "") {
  useEffect(() => {
    if (!ref.current || REDUCED_MOTION) return;
    const el = ref.current;
    el.innerHTML = "";
    const chars = text.split("");
    chars.forEach((char) => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      span.style.display = "inline-block";
      span.className = className;
      el.appendChild(span);
    });
    const spans = el.querySelectorAll("span");
    gsap.fromTo(spans, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.012, ease: "power2.out", delay: 0.1 });
  }, [ref, text, className]);
}

export function useFadeUp(ref: React.RefObject<HTMLElement | null>, startY = 24) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    if (REDUCED_MOTION) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    gsap.set(el, { opacity: 0, y: startY });
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" });
      },
    });
    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [ref, startY]);
}

export function useCardHover(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current || REDUCED_MOTION) return;
    const el = ref.current;
    const onEnter = () => gsap.to(el, { y: -6, duration: 0.3, ease: "power2.out" });
    const onLeave = () => gsap.to(el, { y: 0, duration: 0.3, ease: "power2.out" });
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref]);
}
