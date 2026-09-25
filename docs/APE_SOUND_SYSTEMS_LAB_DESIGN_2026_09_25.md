# Sound Systems Lab — design of record (built 2026-09-25, overnight)

Owner brief: `docs/APE_SOUND_SYSTEMS_LAB_BRIEF_2026_09_25.md`. Owner rulings the same
night: **all fourteen chapters, five modes and ten capstones ship at launch**; **link out**
to the existing labs for depth; output configurations are **visual only**; I author all
content and design. GO given on Fable ("design then build the whole lab").

Term of art throughout: **live sound reinforcement**.

## Where it lives

| Thing | Path |
|---|---|
| Catalog row | `src/screens/lab/labCatalog.ts` → training-section category `livesound` "Live Sound Reinforcement" → leaf `SoundSystemsLab` (member-only) |
| Hub (home + WHAT IS LEFT) | `src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx` |
| Five modes (each a `PagedLab`) | `src/screens/lab/soundsystems/modeScreens.tsx` + `pagesLearnA/B/C.tsx`, `pagesBuild.tsx`, `pagesRoute.tsx`, `pagesOperate.tsx`, `pagesTroubleshoot.tsx` |
| Art (pure react-native-svg) | `src/screens/lab/soundsystems/art/` — `gearArt.tsx` (19 illustrated gear kinds + listener), `VenueView.tsx` (the plot), `SystemDiagram.tsx` (the signal thread), `ConsolePanel.tsx`, `ChainMeter.tsx` |
| Engine (pure, node-tested) | `src/features/soundsystems/` — `types` · `gear` · `system` · `console` · `loads` · `faults` · `capstones` · `configs` · `coverage` · `operate` · `check` · `progress` |
| Tests | `test/soundSystemsEngine.test.ts` (49 tests) |
| Routes | `SoundSystemsLab` + `SoundSystemsLearn/Build/Route/Operate/Troubleshoot` — all `MemberGated` in `RootNavigator.tsx`; the five children are in `MEMBER_ONLY_EXTRA_ROUTES` |
| Browser harness | `localhost:8091/#soundsystemspreview` (hub + all five modes, `App.tsx`) |
| Understanding check | `src/features/soundsystems/check.ts`, registered in `src/features/lab/understanding.ts` under `sound-systems-learn` — the credit unit |
| Account wipe | `progress.ts` `resetLocal()` registered in `clearLocalAccountData.ts` |

No deep-link path was added (the website URL contract is untouched).

## Structure

**Hub** — five mode cards (illustrated glyph, blurb, n/total bar) and the WHAT IS LEFT
block: LEARN pages, capstones passed, ROUTE exercises, OPERATE exercises, faults solved,
and the understanding check, each linking to its mode. Never blocks; never congratulates
for work not done. RESET clears the five page stores and the lab store.

**LEARN** (22 pages + the appended check): ch1 complete system (tap-to-inspect thread;
trace-the-signal) · ch2 ten system types on the plot; match eight venues · ch3 thirteen
output configurations on the plot (visual only); choose six · ch4 the six routing tools ·
ch5 sub feeds (crossover/aux/matrix) and placement/arrays · ch6 monitors; splits and
talkback · ch7 levels and "may these connect?" (engine verdicts) · ch8 loads (calculator)
and power/headroom (calculator) · ch9 the 16-step deployment sequence · ch10 gain chain
(interactive) · ch11 coverage/aim and delay/alignment (calculator) · ch12 processing and
tuning · ch13 feedback (gain-before-feedback model) · ch14 the source-forward method ·
wrap.

**BUILD** (11 pages): the empty venue with the whole bin, then ten capstones with live
requirement checklists. Tap a part → tap a slot; tap a device → tap another to connect
(every link validated for level compatibility; speaker level into a line input is refused
as UNSAFE); tap a cable to remove. Capstones 5, 6, 7 and 10 also open the console panel.

**ROUTE** (8): channel anatomy · pre/post proven on buses · which tool (8 cases) · four
monitor mixes · subgroups vs DCAs proven · mute groups, solo/PFL/AFL · matrices · output
patching.

**OPERATE** (5): power-up ordering · line check (three faults to find) · gain structure
(clip inherited, noise accumulates) · soundcheck ring-out (four wedges) · shutdown +
documentation.

**TROUBLESHOOT** (6): how the bench grades, then five groups holding the 22 faults.
Probe stations on the diagram (each reveals that station's reading), name the fault;
graded on the answer AND on a source-forward walk (✓✓).

## Honesty

- Every plot with a coverage field carries **CONCEPTUAL COVERAGE — ILLUSTRATIVE MODEL**;
  the gain chain and the feedback model say "illustrative model" in copy.
- Every number comes from the Audio Calculator Laboratory via `loads.ts`
  (`impedance.parallel`, `speakerpower.predictspl`, `distdelay.distToDelay`,
  `comb.combFromPath`, `spldist.point`); the test asserts equality with the calculator.
- Amplifier matching is stated as the common professional guideline, not a number.
- `AccuracyNote` rides every page (PagedLab) and the hub header.
- Hearing-safety copy on in-ears; electrical distribution named as licensed work.

## Conventions honoured

Navigation never blocks (PagedLab) · WHAT IS LEFT on the hub · no placeholder rows · popups
only via house components (`confirmDialog`) · amplitude drawn on the velocity ramp
(`levelColor`, `LOUDNESS_STOPS`, `heatColor`) · illustrated gear, no primitive stand-ins ·
tap-only interactions with 44 pt targets and announced states · reduced motion honoured
through the Cable Install motion kit · no images added.

## Known limits (for the owner's morning)

- Capstone builds are not persisted between visits (the PASS is). A learner who leaves a
  capstone mid-build starts that plot again.
- The plot's coverage field is a coarse 24 × 12 grid — deliberate for phone performance.
- `react-native-svg` on web logs "Unknown event handler property onResponder…" for every
  SVG `onPress` (the same as Connector Select and Patchbay); harmless, not ours.
