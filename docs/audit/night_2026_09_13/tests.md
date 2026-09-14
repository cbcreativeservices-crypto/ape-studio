# Test-writing pass — night of 2026-09-13

Suite: `npm test` (node:test). **Before: 1106 passing. After: 1147 passing, 0 fail, 0 skip** (+41 across 4 new files). No src changes.

## New files and what each pins down

### `test/helpContent.test.ts` (10 tests)
- **filterHelp behavior**: empty/whitespace query returns the whole hub; matching is case-insensitive across question AND answer text; the query is trimmed but internal whitespace is a phrase; a no-match returns `[]` (not the unfiltered hub); categories with zero matching entries drop out entirely; filtering never mutates `HELP_CATEGORIES`.
- **Content integrity**: every entry id unique across categories; every q/a non-empty.
- **jump.route contract**: every `jump.route` is parsed against the actual `RootStackParamList` member names in `src/navigation/types.ts` (brace-depth text parser, comment-aware, with parser sanity checks on known routes) — because the navigate call site casts, a typo'd route would type-check and then fail on the user's first tap.
- **HelpKey pre-fill terms**: the test scans `src/**/*.tsx` for `<HelpKey search="…">` at runtime (found the expected 5: study, tool, meter, lab, enroll) and asserts every term surfaces ≥1 FAQ entry — new HelpKey placements are covered automatically without editing the test.

### `test/enrollReorderStep.test.ts` (11 tests)
Fixture-based spec of the drag-reorder step math (neighbor-height stepping): steps sized by the NEIGHBOR being passed, not the lifted card or a constant; exact threshold semantics (strict `<` — travel equal to the neighbor height commits); unmeasured rows fall back to `DRAG_ROW_H` (84); list ends commit nothing in that direction; multi-step in one move event, each step at its own height (incl. an order-dependence case that the pre-2026-09-13 lifted-card-height math would fail); direction reversal mid-drag un-commits swaps symmetrically; the 24-iteration loop guard caps one event and the next event finishes; each new lift starts from zero accumulated travel; the `dragY` residual (`g.dy − dragAccum`) at every stage.

**⚠ EXTRACTION REFACTOR ITEM**: the algorithm lives inline in the PanResponder of `C:\Users\profe\dev\ape-studio\src\screens\enrollment\EnrollmentScreen.tsx` (`onPanResponderMove`, ~lines 368–401) and cannot be imported. The test contains a line-for-line replica (`stepDrag`/`moveEvent`) serving as the executable spec of the intended behavior. Extracting the loop into a pure function (inputs: order array, heights map, lifted id, accum, dy) would let this file test the shipping code directly instead of a replica.

### `test/coachMark.test.ts` (14 tests)
Real lifecycle tests of `useCoachMark` (`C:\Users\profe\dev\ape-studio\src\lib\coachMark.ts`), driven by a micro React-hook runtime (useState/useRef/useEffect/useCallback with re-render-on-setState) injected via `node:module` registerHooks, plus in-memory AsyncStorage and controllable stubs for devBypass/suppression/sampling:
- shows on a never-seen key; merely showing writes nothing;
- actions below `dismissAfter` neither hide nor count; the `dismissAfter`-th action hides AND records exactly one qualifying open — extra completions in the same session never double-count;
- leaving early makes no progress (counter untouched, hint returns next open);
- retires permanently after `MAX_OPENS` (=5) qualifying opens; a counter past 5 still reads retired; actions on a retired hint change nothing;
- corrupt counter value degrades to 0 (shows again); unreadable storage treats the hint as retired rather than nagging;
- **dev bypass** shows on every entry but NEVER advances the persisted counter (retired key stays at 5; fresh key stays absent) — a dev device pass cannot retire hints for the owner;
- suppression (dev kill-switch, first-run sampler) keeps it invisible, counts nothing, and wins over the always-show bypass;
- `resetCoachMarks` clears exactly the `COACH_KEYS` values and no neighbor namespace.

### `test/screenIntros.test.ts` (6 tests)
- Every registry entry has non-empty title/body.
- Every `placeholder:false` entry carries NO "PLACEHOLDER" text in title/body/button (governance: ratified copy or the flag is lying), and its body is substantial (≥80 chars).
- Every draft entry (`placeholder` absent or true — default is true) still says PLACEHOLDER in its body, matching the overlay badge. Currently the only draft is `firstUserWelcome`.
- `resetScreenIntros` clears exactly the `ape:intro:` namespace — coach-mark counters and unrelated keys survive; no-op on empty storage.

## Real bugs surfaced
**None.** All four targets behaved exactly as specified; no test needed a SKIPPED-PENDING-FIX. Observations (not bugs):
- `filterHelp` on a corrupt-ish query is safe; the parser sanity checks would catch a future reshaping of `RootStackParamList` that breaks the text parse (the test fails loudly rather than passing vacuously).
- coachMark's `Number(raw) || 0` means a corrupt counter restarts retirement from zero — pinned as intended behavior (degrade toward showing, never toward a permanent nag or ghost).
