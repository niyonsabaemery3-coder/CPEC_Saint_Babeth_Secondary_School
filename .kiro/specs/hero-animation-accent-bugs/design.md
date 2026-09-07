# Hero Animation & Accent Bugs — Bugfix Design

## Overview

Two bugs affect `useStaggerText` in `src/hooks/useScrollAnimations.ts` and its call site in
`src/components/sections/Hero.tsx`:

1. **Animation double-fire**: After initial mount the stagger animation plays correctly, but when
   the async API response resolves and calls `setSiteState`, the parent component re-renders and
   produces a new string reference for `${site.heroMain} ${site.heroAccent}`. React sees the
   `text` dependency change and re-runs the effect from scratch — wiping `innerHTML` and replaying
   the animation even when the actual text content is identical.

2. **Accent text not gold**: `useStaggerText` currently accepts a single flat `text` string and
   wraps every character in a plain `<span>`. It has no awareness of which characters belong to the
   accent segment, so the existing CSS rule `h1.hero-title .accent { color: var(--gold) }` never
   matches any element and the accent word(s) render in the default ink color.

The fix is targeted to these two issues only; all other hero and animation behaviors are preserved.

---

## Glossary

- **Bug_Condition (C)**: The set of inputs that trigger either defect — a re-render where the
  composed text string is character-equal to the previous render, OR a render where `accentText`
  characters are placed inside plain `<span>` elements.
- **Property (P)**: The desired correct behavior — the effect does NOT re-fire when text content is
  unchanged; accent characters carry the `accent` CSS class.
- **Preservation**: All behaviors not related to the two bugs above must remain identical to the
  original code.
- **`useStaggerText`**: The hook in `src/hooks/useScrollAnimations.ts` that animates an element's
  text character-by-character via the Web Animations API.
- **`heroMain`**: The non-gold portion of the hero title (e.g. "CPEC Saint Babeth").
- **`heroAccent`**: The gold-colored portion of the hero title (e.g. "TSS").
- **`REDUCED_MOTION`**: Module-level flag that reads `prefers-reduced-motion` at import time; when
  true the hook skips all animation and shows final state immediately.
- **`isBugCondition`**: Pseudocode predicate that identifies inputs triggering either bug.

---

## Bug Details

### Bug Condition

The double-fire bug manifests on any re-render where `${site.heroMain} ${site.heroAccent}` produces
a string that is character-equal to the string used on the previous render. The accent-color bug
manifests on every single render because the hook signature accepts only a flat string with no way
to mark the accent boundary.

**Formal Specification:**

```
FUNCTION isBugCondition(mainText, accentText, prevComposedText, currentSpans)
  INPUT:
    mainText       : string   -- heroMain from AppContext
    accentText     : string   -- heroAccent from AppContext
    prevComposedText: string  -- the text string used on the previous effect run
    currentSpans   : NodeList -- <span> elements currently in the h1
  OUTPUT: boolean

  composedText := mainText + " " + accentText

  doubleFireBug   := composedText === prevComposedText
                     AND effectWouldRerun(composedText, prevComposedText)

  accentColorBug  := accentText.length > 0
                     AND NOT ANY span IN currentSpans HAS className "accent"

  RETURN doubleFireBug OR accentColorBug
END FUNCTION
```

### Examples

- **Double-fire**: Default `site` has `heroMain = "CPEC Saint Babeth"`, `heroAccent = "TSS"`.
  The API response also returns the same values. The composed string is `"CPEC Saint Babeth TSS"`
  both times. Current behavior: animation replays. Expected: animation does NOT replay.

- **Accent color**: `heroAccent = "TSS"`. Characters `T`, `S`, `S` are wrapped in plain `<span>`s
  with no class. CSS rule `.hero-title .accent` matches zero elements. Current: accent text is ink
  color. Expected: accent text is `var(--gold)` (#e6a935).

- **Genuinely new text**: Admin changes `heroAccent` from `"TSS"` to `"Secondary School"`.
  Composed string changes. Expected: animation replays correctly from scratch (not a bug).

- **Empty accent**: `heroAccent = ""`. No accent spans should be created; title shows only
  `heroMain` without trailing space or errors (unchanged behavior).

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mouse interaction with hero stat cards, CTA buttons, and slideshow must continue to work exactly
  as before.
- `useCountUp`, `useFadeUp`, and other hooks in `useScrollAnimations.ts` must be completely
  unaffected.
- On the very first page mount the stagger animation still runs (character-by-character
  fade + translateY).
- When `prefers-reduced-motion: reduce` is set, the hook must continue to skip animation and
  show the final text state immediately.
- The full composed text must remain readable with the correct `aria-label` on the `<h1>`.
- When `heroAccent` is empty the title renders without errors or extra whitespace.

**Scope:**
All inputs that do NOT involve re-rendering with a character-equal composed text string (bug 1)
or the presence of an accent segment (bug 2) are completely unaffected. This includes:
- Hero slideshow cycling via `setInterval`
- Stat card count-up animation
- Any other component that does not call `useStaggerText`
- Re-renders caused by unrelated state changes (e.g., route changes, user authentication)

---

## Hypothesized Root Cause

### Bug 1 — Double-fire

1. **String reference inequality in the dependency array**: `useStaggerText` receives `text` as a
   plain `string`. Every render of `Hero.tsx` evaluates the template literal
   `` `${site.heroMain} ${site.heroAccent}` `` which always produces a new string object. React
   compares dependencies with `Object.is`; two strings are equal by value, so this comparison
   is actually value-equal — **however**, the real issue is that `AppContext` stores the full
   `site` object and each `setSiteState` call replaces the entire object reference even when
   values are the same, which triggers a `Hero` re-render, which evaluates the template literal
   to a new (but value-equal) string. React's `useEffect` does compare string values correctly
   (`Object.is("a","a") === true`), so the root cause is subtler:

2. **`useStaggerText` always re-runs because `ref` changes on mount**: The `ref` object itself
   is stable, but `ref.current` is null on the first render pass and populated after commit —
   meaning the effect fires after the first commit (correct), and then fires again when the API
   response causes another commit with an identical `text` value. The `text` string IS
   value-equal, so React should skip the effect. If double-firing is observed it is most likely
   because the `text` argument is not a primitive but a template expression that React correctly
   detects as the same value… unless `site` changes reference and Hero re-renders before
   `site.heroMain` / `site.heroAccent` are defined, producing `"undefined undefined"` on the
   first run and then the real value on the second. This is the most probable cause.

3. **`setSiteState` called with partial defaults before data is fetched**: If `AppContext`
   initialises `heroMain`/`heroAccent` to empty strings or `undefined` and then fills them in
   after the API resolves, the composed string changes from `" "` (or `"undefined undefined"`) to
   the real value, legitimately triggering a re-run. The fix should guard against this by only
   running the animation once the text is non-empty, or by adding a "has animated" ref-based
   guard.

### Bug 2 — Accent color

4. **`useStaggerText` accepts a single flat string**: The function signature is
   `useStaggerText(ref, text, className?)`. When `Hero.tsx` passes
   `` `${site.heroMain} ${site.heroAccent}` `` the hook has no way to know where `heroMain` ends
   and `heroAccent` begins. All characters receive the same optional `className` (which Hero
   currently passes as `""`), so no span ever gets `className="accent"`.

---

## Correctness Properties

Property 1: Bug Condition — Animation Does Not Replay for Identical Text

_For any_ re-render where `isBugCondition` returns true due to the double-fire condition (i.e.,
the composed text string is character-equal to the string used in the immediately preceding
successful animation run AND the animation has already completed), the fixed `useStaggerText`
SHALL leave the existing character spans intact and NOT wipe `innerHTML` or replay the stagger
animation.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Non-Buggy Renders Are Unaffected

_For any_ render where `isBugCondition` returns false (i.e., first mount with any non-empty text,
or a genuinely changed text string), the fixed `useStaggerText` SHALL produce exactly the same
DOM output and animation behavior as the original `useStaggerText`, preserving the character-by-
character stagger-in effect, `prefers-reduced-motion` handling, and ARIA semantics.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Property 3: Bug Condition — Accent Characters Carry `.accent` Class

_For any_ call to the fixed hook where `accentText` is a non-empty string, each `<span>` wrapping
a character from `accentText` SHALL have `className` that includes `"accent"`, making it
selectable by the CSS rule `h1.hero-title .accent { color: var(--gold) }`.

**Validates: Requirements 2.3, 2.4**

---

## Fix Implementation

### Changes Required

**File**: `src/hooks/useScrollAnimations.ts`

**Function**: `useStaggerText`

**Specific Changes**:

1. **Update the signature to accept separate `mainText` and `accentText`**:
   - Change `useStaggerText(ref, text, className?)` to
     `useStaggerText(ref, mainText, accentText?, className?)`.
   - This separates the two segments so character spans can be classified.

2. **Build spans in two passes with distinct class names**:
   - First pass: iterate characters of `mainText`, create plain `<span>` elements (no extra class
     beyond the optional `className`).
   - Insert a space span between `mainText` and `accentText` when both are non-empty.
   - Second pass: iterate characters of `accentText`, create `<span>` elements with
     `className = [className, "accent"].filter(Boolean).join(" ")`.

3. **Guard against replaying when text is unchanged**:
   - Add a `useRef<string>` named `lastAnimatedRef` inside the hook, initialised to `""`.
   - At the top of the effect, compose `fullText = mainText + (accentText ? " " + accentText : "")`.
   - If `fullText === lastAnimatedRef.current` (and `ref.current` already has children) return
     early without re-running.
   - After successfully building and starting all span animations, set
     `lastAnimatedRef.current = fullText`.

4. **Update the dependency array**:
   - Use `[ref, mainText, accentText ?? "", className ?? ""]` so React still re-runs the effect
     when text genuinely changes, but the `lastAnimatedRef` guard prevents replay for value-equal
     re-renders triggered by reference changes in `AppContext`.

5. **Handle edge cases**:
   - If `mainText` is empty and `accentText` is non-empty, render only the accent spans.
   - If both are empty, clear `innerHTML` and return early (existing behavior for empty text).
   - If `REDUCED_MOTION` is true, still build the spans (so CSS coloring works) but skip the
     `.animate()` calls and instead set final opacity/transform directly.

**File**: `src/components/sections/Hero.tsx`

**Function**: `Hero` component — `useStaggerText` call site

**Specific Changes**:

6. **Update the call site**:
   - Change `useStaggerText(titleRef, \`${site.heroMain} ${site.heroAccent}\`)` to
     `useStaggerText(titleRef, site.heroMain, site.heroAccent)`.
   - Remove the manual string composition; the hook now owns the composition.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate
each bug on the unfixed code to confirm root cause analysis, then verify the fix works correctly
and preserves all existing behavior.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs BEFORE implementing the fix. Confirm
or refute the root cause analysis. If refuted, re-hypothesize.

**Test Plan**: Mount `<Hero />` (or a minimal wrapper around `useStaggerText`) in a test
environment, simulate an AppContext update that changes the `site` object reference while keeping
`heroMain`/`heroAccent` values identical, and assert that `innerHTML` was wiped or the animation
was replayed. Separately, inspect the generated spans to confirm no `.accent` class is present.

**Test Cases**:

1. **Double-fire test**: Mount the hook with `text = "CPEC TSS"`. Simulate a re-render with the
   same string value but a new reference (object spread). Assert that `innerHTML` is wiped and
   animation replays. *(Will fail with current code if string value is equal, confirming or
   disproving this is the cause.)*

2. **AppContext-driven double-fire test**: Mount `<Hero />` with an AppContext that first returns
   default values and then updates with the same string values. Assert that the stagger animation
   fires twice. *(Expected to fail on unfixed code, confirming the bug.)*

3. **Accent span class test**: Mount the hook with `text = "CPEC TSS"`. Inspect all `<span>`
   elements in the `<h1>`. Assert that at least one span has `className` containing `"accent"`.
   *(Will fail on unfixed code — no spans have the accent class.)*

4. **CSS color test**: After mounting, check that spans wrapping `"TSS"` characters have computed
   `color` equal to `rgb(230, 169, 53)` (i.e., `#e6a935`). *(Will fail on unfixed code.)*

**Expected Counterexamples**:
- `innerHTML` is cleared and all spans are recreated on second render even with value-equal text.
- Zero spans carry `className="accent"` regardless of how `heroAccent` is set.
- Possible causes: template literal always produces new string reference triggering AppContext
  re-render chain, hook signature has no accent boundary parameter.

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the
expected behavior.

**Pseudocode:**

```
FOR ALL (mainText, accentText) WHERE isBugCondition(mainText, accentText, ...) DO
  result := useStaggerText_fixed(ref, mainText, accentText)
  ASSERT secondRenderWithSameValues(result).innerHTMLUnchanged
  ASSERT spansForAccentChars(result).all(s => s.className.includes("accent"))
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (genuinely changed text,
first mount, reduced-motion, empty accent), the fixed hook produces the same DOM output and
animation behavior as the original.

**Pseudocode:**

```
FOR ALL (mainText, accentText) WHERE NOT isBugCondition(mainText, accentText, ...) DO
  original := useStaggerText_original(ref, mainText + " " + accentText)
  fixed    := useStaggerText_fixed(ref, mainText, accentText)
  ASSERT spanCount(fixed) === spanCount(original)
  ASSERT textContent(fixed) === textContent(original)
  ASSERT animationTimings(fixed) ≈ animationTimings(original)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many `mainText`/`accentText` string combinations automatically.
- It catches edge cases (empty strings, single characters, Unicode, very long strings) that manual
  tests miss.
- It provides strong guarantees that total span count and text content are preserved across the
  entire input domain.

**Test Plan**: Record behavior of the unfixed hook for a representative set of non-buggy inputs
(first mount, genuinely changed text, `prefers-reduced-motion`), then write property-based tests
asserting the fixed hook matches.

**Test Cases**:

1. **First-mount preservation**: Mount hook with a fresh ref (no previous animation). Assert span
   count equals `mainText.length + (accentText ? 1 + accentText.length : 0)` and animation starts.
2. **Reduced-motion preservation**: Set `REDUCED_MOTION = true`. Assert that all character spans
   are rendered with final opacity/transform and no `.animate()` is called.
3. **Genuinely changed text replays**: Mount with `"CPEC TSS"`, then update to `"CPEC Secondary"`.
   Assert animation replays from scratch.
4. **Empty accent**: Mount with `mainText = "CPEC Saint Babeth"`, `accentText = ""`. Assert no
   `accent`-classed spans are created and title text matches `mainText` exactly.

---

### Unit Tests

- Test `useStaggerText` in isolation for double-fire guard: same text → no wipe, different text →
  wipe and replay.
- Test span class assignment: accent characters get `"accent"` class, main characters do not.
- Test edge cases: empty `mainText`, empty `accentText`, both empty, single-character strings.
- Test `Hero.tsx` renders with updated `useStaggerText` call signature (no template literal
  composition at the call site).

### Property-Based Tests

- Generate random `(mainText, accentText)` pairs; verify total span count equals
  `mainText.length + (accentText.length > 0 ? 1 + accentText.length : 0)`.
- Generate random pairs and verify that every span whose source is `accentText` has `"accent"` in
  its `className`.
- Generate random pairs and verify that `textContent` of the container equals
  `mainText + (accentText ? " " + accentText : "")`.
- For any input where text is value-equal to the previous run, verify `innerHTML` is not wiped
  (ref.current.children.length unchanged after second render).

### Integration Tests

- Full `<Hero />` render with a mock `AppContext` that updates `site` object reference (same
  values) after 100 ms; assert animation fires exactly once.
- Full `<Hero />` render where `heroAccent = "TSS"`; assert computed color of accent spans is
  `#e6a935`.
- Verify `aria-label` on `<h1>` still equals the full composed string after fix.
- Verify hero slideshow, stat cards, and count-up animation are unaffected by the hook change.
