# Overnight lab audit — 2026-09-14 → 15

Owner: run all night, audit EVERY screen of EVERY lab — bugs, animation, images,
text copy, learning cognition. Grade each screen. Suggest corrections. Fix
obvious/critical/safe-without-owner. **Never stop**: write blockers down, skip,
move on. No assumptions — each screen judged on its own. Commit often so a
disconnect loses almost nothing.

## Why this pass exists
The earlier "device pass" was stills-only and missed a real animation defect (the
mic capsule black smear, fixed in bddc99c1 — cross-document SVG gradient →
opaque-black fallback). Stills verify "renders / doesn't crash"; they do NOT
verify animation. This pass uses **frame-burst motion capture** on device.

## Method (two tracks, merged)
- **Track A — device (ground truth for animation/images/layout):** drive the
  Pixel 7 Pro (adb), frame-burst each animating screen across its cycle, judge
  smears / jank / glitches / z-order / image rendering / layout / clipping.
- **Track B — code auditors (breadth, detectable-in-source):** per-lab source
  review for the *classes* device can't exhaustively reach — missing asset
  refs, the SvgXml cross-document paint-server bug + unsupported-SVG→black
  fallbacks, animation cleanup/leaks, copy quality + honesty compliance,
  learning cognition. Report-only; main session fixes the safe ones.

## Grading rubric (per screen)
`A` ship-quality · `B` minor polish · `C` real issue, needs work · `D` broken.
Each finding tagged: [ANIM] [IMG] [COPY] [BUG] [COGNITION] [LAYOUT] and a
severity: critical / major / minor. `FIXED` = corrected + verified this run.

## Rules held all night
- No `eas build`/submit. No DB writes. Tuner files owned elsewhere: report-only
  (CenterLockTuner.tsx, FrequencyCounterScreen.tsx, features/tools/tuner/**).
- Every fix: tsc clean + suite green before commit. Copy changes = DRAFT unless
  trivially-true; never ratify.
- A blocker never stops the run — it's written under "BLOCKERS / SKIPPED" and
  the run continues.

## Progress tracker (updated continuously)
Status: ▶ in progress · ✅ done · ⏭ skipped (see blockers)

| Group | Labs | Track B (code) | Track A (device) |
|---|---|---|---|
| FX-rack | (12 labs) | ✅ A (dup badge FIXED) | ▶ Gate A- |
| Synthesis | (6 labs) | ✅ A (2 safe fixes) | — |
| Mic/Speaker | (3 labs) | ✅ A (capsule FIXED; POLAR collider owner-item) | ✅ capsule g2/g5 |
| Fundamentals-visual | (Amplitude, Foundations x2, Wave, Digital, Meter, SignalChain, Gain) | ✅ A (waterfall MAJOR FIXED) | — |
| Connectors | (4 labs) | ✅ A all four | — |
| Module-shell | (10 labs) | ✅ A (Bass wavelength MAJOR FIXED) | — |
| Calc | Calculator Lab (163) | — | — |

## Findings index (per-lab files)
- Each lab/group writes `docs/audit/night_2026_09_14b/<group>.md`.
- `_FIXES.md` — running log of fixes applied this run (commit + one line each).
- `_BLOCKERS.md` — anything that would have caused a stop; written and skipped.

## Fixes already landed before this pass started
- `bddc99c1` mic capsule black-smear (shipped asset) · `be0f2cc6` generator hardened.
