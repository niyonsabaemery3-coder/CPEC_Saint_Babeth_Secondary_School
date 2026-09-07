# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Animation Double-Fire & Missing Accent Class
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist in `useStaggerText`
  - **Scoped PBT Approach**: Scope to the two concrete failing cases for reproducibility
    - Case A (double-fire): render `useStaggerText` with `"CPEC Saint Babeth TSS"`, then re-render with the same string value — assert `innerHTML` was NOT wiped and spans were NOT recreated
    - Case B (accent): render `useStaggerText` with full text where accent segment is `"TSS"` — assert at least one span carries `className` containing `"accent"`
  - Mount the hook with a test ref and `text = "CPEC Saint Babeth TSS"` using the current single-string signature
  - Simulate a re-render with a value-equal string (new reference from template literal) and assert `innerHTML` is NOT cleared
  - Inspect all `<span>` elements and assert that spans wrapping `"T"`, `"S"`, `"S"` characters have `className` including `"accent"`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves both bugs exist)
  - Document counterexamples found:
    - e.g., "`innerHTML` is wiped and all spans are recreated on second render despite value-equal text"
    - e.g., "Zero spans carry `className='accent'` regardless of which portion is the accent segment"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - First-Mount Animation, Reduced-Motion, Empty Accent, Genuine Text Change
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED `useStaggerText` for non-buggy inputs (first mount, changed text, reduced-motion, empty accent)
  - **Observations to record on unfixed code:**
    - Observe: fresh mount with `text = "CPEC Saint Babeth"` → span count equals text length, each span has a character, animation starts
    - Observe: `REDUCED_MOTION = true` → spans are rendered with final opacity/transform, no `.animate()` called
    - Observe: render with `text = "CPEC TSS"` then update to `text = "CPEC Secondary"` → `innerHTML` is wiped and animation replays
    - Observe: render with `text = "CPEC Saint Babeth "` (trailing space, empty accent) → no `accent`-classed spans, text matches input
  - Write property-based tests capturing these observed behaviors:
    - Property: for any non-empty `text` on first mount, span count equals `text.length` and `textContent` equals `text` (spaces as `\u00A0`)
    - Property: for any `text`, when `REDUCED_MOTION` is true, spans are rendered with final state and no animation plays
    - Property: for any `newText !== oldText`, second render wipes `innerHTML` and recreates spans for `newText`
    - Property: for `text` with empty accent segment, zero spans carry `className="accent"`
  - Verify all tests PASS on UNFIXED code before proceeding
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for animation double-fire and missing accent class

  - [ ] 3.1 Update `useStaggerText` signature to accept separate `mainText` and `accentText`
    - Change signature from `useStaggerText(ref, text, className?)` to `useStaggerText(ref, mainText, accentText?, className?)`
    - Add `lastAnimatedRef = useRef<string>("")` inside the hook for the double-fire guard
    - Compose `fullText = mainText + (accentText ? " " + accentText : "")` at the top of the effect
    - If `fullText === lastAnimatedRef.current` AND `ref.current` already has children, return early without replaying
    - After successfully building all spans and starting animations, set `lastAnimatedRef.current = fullText`
    - Update the dependency array to `[ref, mainText, accentText ?? "", className ?? ""]`
    - _Bug_Condition: isBugCondition — re-render with character-equal composed text string (double-fire) OR accentText.length > 0 with no `.accent`-classed spans_
    - _Expected_Behavior: effect does NOT re-fire when fullText === lastAnimatedRef.current; accent characters carry className "accent"_
    - _Preservation: useCountUp, useFadeUp, and all other hooks in useScrollAnimations.ts are completely unaffected_
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Build spans in two passes — main pass and accent pass
    - First pass: iterate characters of `mainText`, create plain `<span>` elements (apply optional `className` only)
    - Insert a space span (`\u00A0`) between `mainText` and `accentText` when both are non-empty
    - Second pass: iterate characters of `accentText`, create `<span>` elements with `className = [className, "accent"].filter(Boolean).join(" ")`
    - Handle edge cases: empty `mainText` with non-empty `accentText` (render only accent spans); both empty (clear `innerHTML` and return); `REDUCED_MOTION` true (build spans but skip `.animate()`, set final opacity/transform directly)
    - _Bug_Condition: accentText.length > 0 AND NOT ANY span HAS className "accent"_
    - _Expected_Behavior: each span wrapping a character from accentText has className including "accent"_
    - _Preservation: total span count equals mainText.length + (accentText.length > 0 ? 1 + accentText.length : 0); textContent equals fullText_
    - _Requirements: 2.3, 2.4, 3.3, 3.4_

  - [ ] 3.3 Update the `useStaggerText` call site in `Hero.tsx`
    - Change `useStaggerText(titleRef, \`${site.heroMain} ${site.heroAccent}\`)` to `useStaggerText(titleRef, site.heroMain, site.heroAccent)`
    - Remove the manual string composition — the hook now owns the composition
    - Verify the `aria-label` on `<h1>` still uses the full composed string `\`${site.heroMain} ${site.heroAccent}\``
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3_

  - [ ] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Animation Double-Fire & Missing Accent Class
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior for both bugs
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms both bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - First-Mount Animation, Reduced-Motion, Empty Accent, Genuine Text Change
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all preservation properties hold after the fix — span counts, text content, animation timing, reduced-motion behavior, empty accent handling

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite and confirm every test passes
  - Manually verify the hero title in the browser: accent word(s) render in gold (`#e6a935`), animation plays only once on initial load even after the AppContext API response arrives
  - Confirm the hero slideshow, stat card count-up, and all other hero sub-components continue to function normally
  - Ask the user if any questions arise
