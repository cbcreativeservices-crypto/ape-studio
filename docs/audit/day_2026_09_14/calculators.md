# Calculator Suite — bug hunt (2026-09-14)

Scope: `src/screens/lab/calc/**` + calc helpers under `src/features/**`.
Method: full read of engine/state/UI + workflow/chain code; math hand-checks in
a scratchpad node harness (never in the repo); template-resolution check;
reviewed the existing `test/calcDegenerate.test.ts` and `test/calcUsage.test.ts`.

Verdict: **no correctness bugs found.** The suite is unusually well-guarded.
One comment-only honesty fix applied (stale cap value). Details below.

---

## FIXED (in scope)

1. **Stale weekly-cap value in code comments** — `CalcWorkspaceScreen.tsx`.
   Two comments described the free/lapsed cap as "10" (`get 10 calculation
   OUTPUTS per rolling week` and `the "# / 10" counter`). The real cap is 5
   (`calcUsage.CALC_WEEKLY_LIMIT = 5`, owner 2026-09-01, server-enforced). Code
   was already correct (it reads `usage.limit` / the constant, never a literal
   10); only the comments misstated the cap. Corrected to 5 / "N". No runtime,
   type, or test impact (comment-only).

No behavioral/logic fixes were needed.

---

## ATTACKED AND CLEAN

### 1. Calc engine / state (calcPanel, calcUnits, workspaces)
- `buildValues` returns `null` until every input parses (empty list, blank,
  `"abc"`, `1e400`→Inf all → hold, never compute garbage). `runCompute` is
  try/caught. `formatOutput` routes every numeric through `fmt` (`—` for
  non-finite). Unit cycling is modulo the unit count. All verified against the
  degenerate sweep contract, which passes.
- **Formulas hand-verified numerically (12), all correct:**
  wave/wavelength (3.43 m @100 Hz/20 °C), level/dbuToV (+4 dBu→1.228 V),
  level/ampToDb (×2→6.02 dB), level/powToDb (×2→3.01 dB),
  spldist/point (100 dB 2→16 m → 81.94), distdelay/distToDelay (30 m→87.4 ms),
  micgain/micout (2 mV/Pa @94 → −51.77 dBu), ohmspower/vFromPZ (100 W/8 Ω→28.28 V),
  qbw/geoCenter (100,400→200), phase/phaseFromTime (1 kHz/0.5 ms→180°),
  dose/allowNiosh (97 dBA→30 min), spladd/identical (95 dB ×4→101.02).
- **Formulas verified by inspection (constants + solve direction), all correct:**
  timePhase (comb nulls (2k+1)/(2Δt), peaks k/Δt, align f₁₈₀=1/2Δt), FFT
  (Δf=sr/N, Δf·T=1), latency (round-trip = in+out+proc), full level dB family
  (20·log amplitude / 10·log power, dBu↔dBV offset −2.218), ohms/power triangle
  (RMS↔peak ÷√2, P=V²/Z etc.), splSafety (energy sum 10·log Σ10^(L/10), NIOSH
  480/2^((L−85)/3), OSHA 90/5, Leq, dose), limiter (V=√(P·Z), thr = spkdBu −
  ampGain − margin), speakers (SPL=sens+10·logP−20·logd), roommodes (n·c/2L),
  Sabine (0.161·V/A), bpm (60000/BPM, dotted ×1.5, triplet ×2/3), crossover 1st
  (1/2π) & 2nd Butterworth (0.1125 / 0.2251), vdrop (ρ·2L/A, ρ_Cu 1.724e-8).
- The `allowMin` → `value: T*60` with `unit:'min'` pattern is correct: base unit
  for `time` is seconds, so minutes must be ×60 to display right. Not a bug.

### 2. Weekly-cap UI honesty (the fail-open concern)
- Model layer (`calcUsage.ts`) flags `unavailable:true` on RPC error / missing
  RPC / network throw / empty rows, all with `allowed:true` (fail-open by
  design). `calcUsage.test.ts` pins BOTH the happy path (server says no → client
  blocks) and every fail-open case — so a dead cap is no longer indistinguishable
  from a working one (the glossary-memory failure class is covered).
- **The gate never mis-blocks an under-cap member:** blocking happens only on an
  explicit server `allowed:false`; `unavailable` and `allowed:true` both reveal.
- On `unavailable`, the screen reveals the answer and hides the "# / N" counter
  (shows no fake count). It does not print an explicit "usage not counted" line —
  but this is **consistent with the app-wide pattern**: the glossary gate
  (`GlossaryScreen.gateDefinitionOpen`) does the same (silently allows on
  `u.unavailable`, no user notice). Matching the established pattern, so not
  flagged as a bug. (If the owner wants a visible "cap temporarily unavailable"
  micro-notice, that would be a product decision to apply to BOTH gates.)
- Halfway nudge scales with allowance (`ceil(limit/2)`=3 at limit 5) and cannot
  collide with the last-one dialog; synchronous `consumingRef` guard prevents a
  double-spend on same-tick double taps; `consumedSig===inputSig` prevents
  re-spending on an unchanged re-tap. All correct.

### 3. Workflow editor / list (reorder, remove, persist, empty state)
- Edit screen `move(i,dir)` swaps adjacent, bounds-checked; `removeStep` filters
  by index; ▲ disabled at 0, ▼ at last. `CalcWorkflowsScreen` reorder mirrors it
  and disables at bounds. Empty-state copy distinguishes "Academy feature"
  (savedWorkflows 0) from "nothing saved yet". No off-by-one.
- `workflowStore.moveWorkflow` swaps neighbours and persists; `saveWorkflow`
  upserts newest-first; loads are damage-quarantined (`:damaged` key) and never
  crash. Save is Academy-gated with defense-in-depth in `onSave` (routes to
  Paywall, never a silent no-op — uses `notify`/`confirmDialog`, not `Alert`).
- `workflowLimitsFor(entitlement, resolved)` holds the academy row until the
  entitlement read resolves — correctly avoids stranding a paying member on the
  'anonymous' boot row (no SAVE key / discarded draft).
- **All 28 built-in templates resolve** (scratchpad check via `resolveStep` /
  `validateWorkflow`: 0 broken refs, 0 dropped steps).

### 4. Workflow runner value passing (CalcWorkflowRunScreen)
- Live prior-step imports resolve against the incrementally-built `computed`
  array (upstream index always < current), converted through the field's unit;
  quantity must match AND `chainable !== false` is honoured (so e.g. TRAVEL PER
  MILLISECOND cannot feed a DISTANCE input). Override/restore, project imports,
  dependents recount, resume-draft, and the results/summary path all check out.
  `idx = min(stepIndex, n)`; `idx===n` → results. No off-by-one in step nav.

### 5. Formula-key popup (the purple π)
- Opens the CURRENTLY-selected function's popup (`fn={keyOpen ? fn : null}`);
  elements derived from `fn.inputs` (not a shared list), symbols from
  `symbolsInFormula(fn.formula, fn.keySymbols)`. The `keySymbols` resolver
  prefers an exact `symbol` match then falls back to whitespace-split glyph
  membership (so 'T' picks the period, '/' finds '÷ /', 'x²' finds 'x² x³'). A
  keySymbol with no key entry is filtered out (fewer symbols, never a crash).
  Every one of the 163 formulas gets a useful popup from the auto-derivation.
  No index/id mismatch.

### 6. State-after-error / empty distinctness
- Workspace screen: `mustSignIn` (needs `resolved`) vs `!values` (fill inputs)
  vs `capped && !unlocked` (CALCULATE) vs `computeError` (bad values) vs answer —
  all distinct branches. Save-result gating routes locked users to Auth/Paywall
  with the right copy.
- Runner loading state carries its own header + ‹ Back (no dead-end), and
  `notify`/`confirmDialog` are used instead of RN-web-noop `Alert` throughout.

---

## OUT OF SCOPE (noted, not changed)

- **Repair-vs-display order drift (minor, `CalcWorkflowsScreen`):** when a saved
  workflow has unresolvable steps, `reload()` re-saves the repaired copy
  (`saveWorkflow` upserts it to the FRONT of storage) but `setMine(repaired)`
  keeps the original display order. Until the next reload the displayed order can
  differ from stored order, so a ▲/▼ reorder acts on the stored order. Only
  triggers when a step references a deleted/renamed calculator (rare; no such
  drops exist today since all templates/registry resolve). Cosmetic edge case,
  left as-is.

## DEVICE-ONLY (not verifiable here)
- Keyboard-pinning scroll behaviour on focus (native keyboard controller),
  Share sheet, and image-capture fallback are runtime/native concerns.

## Tests
- `test/calcDegenerate.test.ts` + `test/calcUsage.test.ts`: 58/58 pass (baseline,
  and unchanged by the comment-only edit).
