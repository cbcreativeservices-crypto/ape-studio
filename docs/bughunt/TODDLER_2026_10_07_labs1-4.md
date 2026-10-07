# Chaos-toddler hunt — Miking Labs 1–4 (2026-10-07)

Scope: Membranophones, Idiophones, Aerophones, Chordophones (lessons M*, I*, A*, C*, SPK), the journey in its new order (MEET IT, STARTING SETUPS, MICROPHONES, PLACEMENT start-from, context, twoMic, troubleshoot, practice, what's left, quick check), the rack dock faders, full screen and zoom, view toggles, family tiles and lesson menus, and credit/progress. Branch `hunt-labs1-4`, from `final-lab` b40a75f3.

How it was hunted: the web preview (`#labpreview/MikingLesson/<id>`, own Expo server, 412×915, in its own browser window so the page stayed visible and its timers and frames were not throttled), plus code reading of the host, the pages and the progress store. Each round ran:

- a seeded random-tap storm of 150 taps per lesson on M01, I01a, A01 and C01. It tapped every visible button and fader, sometimes pressed Escape, and mixed fast and slow gaps;
- a NEXT walk through all 8 pages;
- fader drags from end to end and back on STARTING SETUPS, PLACEMENT (POSITION) and the worked example (STEP);
- a legibility sweep of every page and step on M01, I01a, A01, C01 and M11: any text under 9 pt, any value cut short with "…", any crash text.

Round 3 added a storm limited to the setups page on lessons with more than one variant (A06, C11, I02).

Lab 5 (E*) and the Mixing Guides were left to the other hunters. No lesson files were edited, and no shared engine file was changed (see "Shared files" below).

## Round 1

| id | where | how to reproduce | severity | fix | test added |
|---|---|---|---|---|---|
| T1-01 | STARTING SETUPS · SETUP fader (every lesson) | Drag SETUP from one end to the other. Each setup it crossed remounted the stage: a scene compile, the clear-pose search, and the whole DualView with two new WebGL surfaces. It also wrote START FROM into the lesson host, which redrew the whole page. Before the fix, p90 was 660–713 ms per move and the worst move took 1044 ms. A flick also counted every setup it crossed as LOOKED AT, so the activity credit could be earned without looking at anything. | High (performance), Medium (credit) | `pages/PSetups.tsx`: the stage draws the setup the fader has SETTLED on (90 ms; held while the finger rides, but with a 600 ms fallback so a lost release can never leave the stage stuck). The fader is now a preview lane (`onCommit`), so its words follow the finger. LOOKED AT, START FROM and the drawing's own label follow the setup that is actually drawn. The best view is picked in the same render the stage mounts in, so a new setup is not drawn a second time in another view. | `mikingToddler20261007.test.ts` T1-01 (5 pins) |
| T1-02 | Lesson host · START OVER (PRACTICE) | On slow or unreadable storage, START OVER (and its confirm) seemed to do nothing until the device write finished. The screen waited on `clearMikingPracticeRun().then(...)`. | Medium | `MikingLessonScreen.tsx`: the reset happens on screen at once, and the write happens in the background (credit is untouched either way). | T1-02/03 pin |
| T1-03 | What's left · PRACTISE AGAIN FROM THE START | Finish a lesson and tap PRACTISE AGAIN. Page 1 came back with every check still answered and every activity still marked done, so the "fresh practice run" (owner rule: repeat = fresh practice, credit only grows) had nothing left to practise. | Medium | `onPracticeAgain={doReset}`: the same fresh run as START OVER, with credit kept. | T1-02/03 pin |
| T1-04 | Miking hub · `MikingHub { lab }` | Open the hub with a lab id that is unknown or retired, for example an old link. The menu was empty: just the note, no lessons, a dead end. | Low | `MikingHubScreen.tsx`: an id that matches nothing shows every family. | T1-04 pin |

Checked and found working in Round 1:

- The NEXT walk through all 8 pages on M01 never jammed.
- The 400 ms nav lock swallows triple taps.
- ‹ PREV from step 1 rolls back to the previous page's last step (an over-count is clamped once the step titles arrive).
- The what's-left screen keeps the page mounted underneath it.
- The random storms (600 taps) produced no page errors.
- No text is under 9 pt on any page or step that was swept.

## Round 2 (re-hunt, including regressions from Round 1)

| id | where | how to reproduce | severity | fix | test added |
|---|---|---|---|---|---|
| T2-01 | STARTING SETUPS · variant switch (a regression from T1-01) | On a lesson with more than one variant, sit on setup 4, then pick another variant. The settled index stayed at 4 for 90 ms, so the stage drew the new variant's setup 4. That cost an extra remount, and it was counted as LOOKED AT, before the stage jumped to setup 1. | Medium | `useSettledIndex(..., resetKey = variant)`: a new variant takes its first setup at once. | T2-01 pin |

Also re-checked in Round 2:

- Taps on the SETUPS chooser: the card answers at once and the stage follows after 90 ms.
- A drag ended without a release, for example BACK pressed mid-drag: the 600 ms fallback settles the stage.
- START OVER followed straight away by NEXT: the reset is now synchronous, so NEXT lands on page 1, step 2.
- PRACTISE AGAIN keeps the learner's path (NEW / EXPERIENCED) and clears the quick check, as START OVER always did.
- PLACEMENT START FROM after a variant change: it shows "CHOOSE" and never a stale setup. Not a bug.

## Round 3

| id | where | how to reproduce | severity | fix | test added |
|---|---|---|---|---|---|
| — | Setups-page storm on A06, C11 and I02 (variants, the chooser, view keys, the inset swap), then the full storm again on M01, I01a, A01 and C01 | 240 + 600 random taps | — | none needed: no page errors and no stuck states | — |

Found but not fixed (recorded for the owner):

- **Web only: view keys, the inset swap and opening full screen take 150–900 ms on desktop dev.** The cause is CanvasKit on the web. It builds a new WebGL surface, with a shader compile, every time a Skia canvas is resized or mounted. Swapping views changes the inset's height (each view has its own aspect), and full screen mounts new canvases. Native Skia does not recompile per resize, so this is not what a phone sees. The only fix here would be a fixed-size inset in the shared `DualView`. That changes the drawing Lab 5 also uses, so it is left for an owner decision.
- **Web only: some dock button values are cut short with "…"** ("IN ZONE", "SMALL COND", "POSITION ▸") and some long bezel keys too ("OUT FROM 12TH FRET"). On the web, a one-line `Text` ends in "…". On a device the same text goes through `fitValue` and shrinks instead (D36: a cropped readout drops its label, never its number). No numbers were cut short.

## Timing (desktop dev, web preview, 412×915, page visible)

| action | before | after | note |
|---|---|---|---|
| STARTING SETUPS · SETUP fader, per move (M01 / A01 / C01) | median 11, **p90 660–713, max 872–1044 ms** | median 11, **p90 58–78, max 108–170 ms** | T1-01 |
| WebGL surfaces created during one end-to-end flick of SETUP | 28 | 0 (one remount after release) | T1-01 |
| PLACEMENT · POSITION fader, per move | median 12, p90 19, max 45 ms | unchanged | already within the ~16 ms feed / < 60 ms target |
| PLACEMENT worked example · STEP fader, per move | median 11, p90 53, max 101 ms | unchanged | |
| NEXT (step or page) on M01, all 26 taps | 11–71 ms | unchanged | every tap < 100 ms |
| NEXT into a rack step (mounts a canvas), from the storm | 184–553 ms | unchanged | web only, CanvasKit surface creation (see above) |
| View key / inset swap | 150–939 ms | unchanged | web only (see above) |
| Open full screen | 107–470 ms | unchanged | web only (see above) |
| Lesson cold open (full reload, bundle cached) | 3256 ms | — | the page reload dominates; in-app open is a NEXT-class mount |
| Hub cold open (full reload) | 4328 ms | — | as above |

The "before" figures for the SETUP fader were measured on the original bundle. The "after" figures were measured on a fresh bundle that contains the fix (checked by looking for `useSettledIndex` in the served bundle).

## Shared files

Only Labs 1–4 host and page files were changed: `MikingLessonScreen.tsx`, `MikingHubScreen.tsx` and `pages/PSetups.tsx`. `PSetups.tsx` is the shared STARTING SETUPS page, so Lab 5 lessons that use it get the T1-01 / T2-01 behaviour too. No engine, rack or Lab 5 / Mixing files were touched.
