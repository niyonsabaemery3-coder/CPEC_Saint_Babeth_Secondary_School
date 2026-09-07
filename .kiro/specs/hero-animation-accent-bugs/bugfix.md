# Bugfix Requirements Document

## Introduction

Two related bugs affect the hero section (`<section id="home">`) on the homepage:

1. **Animation double-fire**: The `useStaggerText` hook re-runs the character-by-character title animation every time the parent component re-renders — even when the displayed text has not changed. This produces a visible flash and replay of the animation after the initial API response populates `AppContext`, because the dependency array sees a new string reference on every render cycle.

2. **Accent text not gold**: The `<h1 class="hero-title">` is intended to render `heroMain` in the default ink color and `heroAccent` in gold via the existing CSS rule `h1.hero-title .accent { color: var(--gold) }`. However, `useStaggerText` currently spreads every character into plain `<span>` elements without attaching an `.accent` class to the accent segment, so the CSS rule has no target and the gold color never appears.

Both bugs originate in `src/hooks/useScrollAnimations.ts` and its call site in `src/components/sections/Hero.tsx`.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the page loads AND the async API call resolves and calls `setSiteState` THEN the system re-runs `useStaggerText` from scratch — wiping `innerHTML` and replaying the stagger animation — even though `heroMain` and `heroAccent` have the same string values as the defaults.

1.2 WHEN `useStaggerText` receives a new string reference that is string-equal to the previous value (i.e., same characters, different object identity) THEN the system treats it as a dependency change and fires the effect again, causing a visible text flash.

1.3 WHEN the hero title renders THEN the system places every character (both `heroMain` and `heroAccent` segments) inside plain `<span>` elements with no class, so no span carries the `.accent` class that the CSS targets.

1.4 WHEN the CSS rule `h1.hero-title .accent { color: var(--gold) }` is evaluated THEN the system finds zero matching descendants, so `heroAccent` text is rendered in the default ink color instead of gold.

### Expected Behavior (Correct)

2.1 WHEN `useStaggerText` is called with a string that is strictly equal (same characters) to the value used in the previous render THEN the system SHALL skip re-running the animation effect, leaving the already-rendered characters in place.

2.2 WHEN `useStaggerText` is called with a genuinely different string (different characters or length) THEN the system SHALL replay the stagger animation from scratch for the new text.

2.3 WHEN `useStaggerText` renders characters belonging to the `heroAccent` segment THEN the system SHALL attach the class `accent` to each of those character spans.

2.4 WHEN the hero title is rendered with an `heroAccent` value THEN the system SHALL display those characters in the color defined by `var(--gold)` (`#e6a935`) via the existing CSS rule `h1.hero-title .accent`.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `useStaggerText` is called for the very first time on initial page mount THEN the system SHALL CONTINUE TO animate characters one-by-one with the stagger-in (fade + translateY) effect.

3.2 WHEN the user has `prefers-reduced-motion: reduce` set THEN the system SHALL CONTINUE TO skip the animation and show the final text state immediately.

3.3 WHEN the hero title is visible on the page THEN the system SHALL CONTINUE TO render the full concatenated text (`heroMain` + space + `heroAccent`) as readable content with correct `aria-label`.

3.4 WHEN `heroAccent` is an empty string THEN the system SHALL CONTINUE TO render the title with only the `heroMain` text without errors or extra whitespace.

3.5 WHEN the hero slideshow, stat cards, and other hero sub-components re-render due to unrelated state changes THEN the system SHALL CONTINUE TO leave the already-completed title animation untouched.
