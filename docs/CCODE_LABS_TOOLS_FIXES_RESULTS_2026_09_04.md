# CCODE → Computer A — Labs & Tools accuracy fixes: RESULTS (2026-09-04)

**Re:** `CCODE_LABS_TOOLS_ACCURACY_FIXES_2026_09_04.md` (29 findings).
**Status: ALL 29 APPLIED.** `npx tsc --noEmit` clean · `npm test` 228/228 · web
bundle boots clean (Metro HMR rebuilt every touched file, no resolve/runtime
errors). **No item needed a DB change** — none touched Supabase/SQL/RLS, per your
DO-NOT manifest. Pushed to `origin/audio-tools-engine` in 5 area-grouped commits.

## Commits
- `74d73eb` — lab screens + guided lessons (F01,F02,F03,F04,F06,F07,F09,F10,F11,F12,F13,F14,F20,F21,F22,F23)
- `503ac69` — calc workspaces (F05,F15,F16)
- `067a725` — digital modules (F17,F18,F19)
- `89b0116` — tool demos (F08,F24,F25,F26,F27)
- `ba77822` — tools/learn copy (F28,F29)

## Files changed (23)
- `src/features/lab/guidedLessons/content.ts` (F01, F09, F10)
- `src/screens/lab/BinauralLabScreen.tsx` (F02)
- `src/screens/lab/FmLabScreen.tsx` (F03, F11)
- `src/screens/lab/fxLabConfigs.tsx` (F04)
- `src/screens/lab/meter/meterEngine.ts` (F06)
- `src/screens/lab/wave/modules/modWaveB.tsx` (F07)
- `src/screens/lab/wave/modules/modWaveA.tsx` (F23)
- `src/screens/lab/HarmonicCard.tsx` (F12)
- `src/screens/lab/HarmonicsView.tsx` (F13)
- `src/screens/lab/amp/modules/mod4Classes.tsx` (F14)
- `src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx` (F20)
- `src/screens/lab/speech/speechPagesA.tsx` (F21)
- `src/screens/lab/tuning/TuningLabScreen.tsx` (F22)
- `src/screens/lab/calc/workspaces/speakers.ts` (F05)
- `src/screens/lab/calc/workspaces/powerElec.ts` (F15)
- `src/screens/lab/calc/workspaces/roomsAdvanced.ts` (F16)
- `src/screens/lab/digital/modules/modDac.tsx` (F17, F18)
- `src/screens/lab/digital/modules/modQuant.tsx` (F19, + F17 ENOB alignment)
- `src/components/tooldemos/HzCounterDemo.tsx` (F08)
- `src/components/tooldemos/RtaDemo.tsx` (F24)
- `src/components/tooldemos/WaveformDemo.tsx` (F25, F26, F27)
- `src/features/tools/learn/hzcounter.ts` (F28)
- `src/features/tools/learn/spl.ts` (F29)

## Where your fix offered options, here's the branch I took
- **F04** — rewrote the check to **DRIVE vs MIX** (parallel level); did NOT add an OUTPUT param. Question/options/reveal/wrongHint all now reference only controls the distortion lab exposes.
- **F05** — cable dissipation now `(1 − frac)`; kept the "WATTS HEATING THE CABLE" / "spent heating copper" labels (now correct at ~9% for the default). Fixed in all three spots: result row, recgauge "Power lost" column, and the steps text (`1 − frac`, dropped the `²`).
- **F08** — drove the Hz readout from cents (`440·2^(cents/1200)`); did not freeze the needle. Reads ~443.1 Hz at +12¢.
- **F16** — switched the **result row** to `(sabine−eyring)/sabine` to match the steps + the "≈15% shorter" example (label kept "SABINE OVER-ESTIMATE").
- **F17** — aligned BOTH modules to **~120 dB**: edited modQuant's ENOB block ("~20 effective bits (~120 dB)") in addition to modDac Module 8, per your note to make both consistent.
- **F18** — "~146 dB is the theoretical ceiling (6.02·24 + 1.76); 144 dB is the 6 dB/bit rounding."
- **F19** — kept the familiar 48/96/144 figures but tagged each "(6 dB/bit rule of thumb)"; the 24-bit blurb also cites "6.02·24 + 1.76 ≈ 146 dB" so it can't read as contradicting the bezel.
- **F20** — changed the **label** to "NULL ≤−26 dB" (kept the 0.05 linear-gain threshold); no behavior/tint change.
- **F22** — header now "CHAPTER {chapter+1} OF {CHAPTER_COUNT}" → "CHAPTER 1 OF 14"; both header and dots use 14.
- **F24** — relabeled the axis to the true 15-third-octave span (`['31 Hz','100','315','800']`); kept BAR_COUNT 15.
- **F25** — scaled `sineMix` by 0.8 (clean peak ~0.72 < 0.8 ceiling); kept CLIP_LIMIT 0.8, so the HOT/clipping visual is unchanged. Updated the CLEAN_MAX comment.
- **F26** — relabeled the button "+6 dB — TOO HOT" to match DRIVE_GAIN 2.1×; did not change the drive amount.
- **F27** — raised the pad envelope base 0.55 → 0.87 so its peak (~0.92) matches the transient, making "similar peaks, different energy" visible.

## One caveat on verification
The gate is fully green and every calculation/formula change was hand-verified.
I did NOT individually eyeball each **visual** [LOGIC] item on a running screen
(the owner was away and they sit several screens deep): specifically the tool
demos (Waveform ceiling/peaks, RTA axis, HzCounter Hz readout) and the calc
readouts (speaker-loss %, Eyring %, VDROP). They're deterministic changes; a
quick look on the next device/preview pass is the final confirm. Everything else
(copy edits, the FM caption/label logic, the mic null label, the Tuning counter)
is confirmed by tsc + render.

Nothing else was touched; the owner's `connect` WIP and unrelated docs were left
alone.
