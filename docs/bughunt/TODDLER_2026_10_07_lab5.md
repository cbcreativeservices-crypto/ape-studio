# Toddler hunt — Miking Lab 5 (Voice & Ensemble, E01–E16), 2026-10-07

Scope: `lessons/shared/ensemble` (EnsembleStage, ensemblePages) and `lessons/shared/voice` (VoicePages), branch `hunt-lab5` off `final-lab` b40a75f3.
Method: I read the source and traced the toddler paths: rapid SETUP and SECTION fader flicks, switching ARRAY or START mid-drag, changing SEATING while away from a page, and resting the array and then picking a START. **The web preview was not run in this pass**, so there is no measured ms table below. See "Timing".

affects other side: none. EnsembleStage and ensemblePages are Lab 5 only, so no Labs 1–4 engine files and no Mixing Guides files were touched.
needs: a #labpreview timing run at 412×915 on E09/E14 (setup flick, MOVE drag, full screen) to put real numbers on the before/after.

## Round 1

| id | where | how to reproduce | severity | fix | test |
|---|---|---|---|---|---|
| L5-R1-01 | EnsembleStage | Any stage that leaves out `rigs`/`singles`/`rings`/`extraLabels`/`zones`/`spill` (MEET "The sections", "What it is"). Tap sections fast. | Medium (perf) | Each render made a fresh `[]` default, which broke every memo. The box, label layout and detail-corner search (4 corners × 187 hit tests) all re-ran on every parent render. Replaced with a frozen module constant `NONE`. | lab5ToddlerPass L5-R1-01 |
| L5-R1-02 | EnsembleMeet "Where the sound leaves" | Toggle FAMILY or MAIN PAIR quickly. | Low (perf) | `radiate` and `rigM` were rebuilt on every render. Now memoised. | L5-R1-02/03 |
| L5-R1-03 | EnsembleSetups | Flick SETUP end to end. Each step rendered twice (the LOOKED AT update), and both renders rebuilt `stageOf`, the plot readout, the spill paths and the ring. | Medium (perf) | `st`, `plot`, `spillPaths`, `eq` and `eqRings` are now memoised per setup. | L5-R1-02/03 |
| L5-R1-04 | EnsemblePlacement | MOVE and let go once, then pick a START whose array sits in a blue zone. | High (false credit) | A zone visit was credited even though the learner never rested the array there, breaking the rule that a start a setup gives earns nothing. `pickStart` now resets `moved`. | L5-R1-04 |
| L5-R1-05 | EnsemblePlacement | Set SPACING on A–B, then switch ARRAY to another spaced or angled array. | Medium (wrong readout) | The old array's spacing carried over. It could fall outside the new array's range, which pushed the fader thumb past its ends. Switching ARRAY now takes that array's own setup geometry, and `gv` is clamped. | L5-R1-05 |
| L5-R1-06 | EnsemblePlacement | Change SEATING on MEET or SETUPS while Placement stays mounted. | Medium (wrong state) | The array, its position and its START came from the old seating. A variant change now re-seats Placement on that seating's own start. | L5-R1-06 |
| L5-R1-07 | EnsemblePlacement MOVE drag | Every move rebuilt `place`, `mount` and `rigNow`. | Low (perf) | Memoised, so a drag now only recomputes when the centre actually moves. | L5-R1-02/03 |

## Round 2 (re-audit including the Round 1 fixes)

- `pickPreset` falls back to `{}` (the array's defaults) when no setup on this seating uses that array. Checked: no crash.
- The variant effect skips the first mount (`seenVariant` ref), so on first open the learner's `startFrom` is still honoured.
- `useStepper` clamps `shown ≥ 1`, so `S.stages[shown-1]` in VoiceSound is never undefined. Not a bug.
- I found no new defects. Noted but left alone (low): on MEET, tapping the conductor leaves the SECTION fader thumb on the first section.

## Round 3

I re-checked the memo dependencies against their callers. `nf.near` is a seat object (a stable reference), and `start` changes only with START or SEATING. I found no new defects.

## Timing

| measure | before | after |
|---|---|---|
| page / step navigation, setup switch, MOVE drag, full screen, lesson and hub open | not measured (preview not run) | not measured |

Expected effect, not measured: L5-R1-01, 03 and 07 remove the repeated stage-geometry and corner-search work from each re-render. That work is the main per-render cost on E09/E14.

## Verify
- tsc: clean.
- Full suite: 9077 pass, 0 fail (final-lab had 9072; this adds 5).
