# Cymatics Lab — design & cognitive-learning review (2026-09-17)

**Scope:** `src/screens/lab/cymatics/**` (home, 8 modules, Plate / Liquid / Membrane studios, Gallery + Art Studio, exports), `src/features/cymatics/{presets,figure,svgExport,patternField}.ts`, `src/features/lab/guidedLessons/content.ts` (the `cymatics` lesson), `src/features/tools/levelColor.ts`, and the shared rack kit (`src/screens/lab/rack/**`). Design intent read from `docs/APE_CYMATICS_LAB_SPEC_2026_09_16.md` and `docs/APE_CYMATICS_PHASE4_DESIGN_2026_09_17.md`.

**Not a bug hunt.** No runtime, no device. Everything below is grounded in a file I read; nothing was edited.

**Headline judgement.** This is the best-taught lab in the app. It has a real thesis, it names its own approximations line by line, it has a genuine retrieval quiz, and its guided-lesson content (`content.ts:1195–1260`) is the strongest writing in the codebase. The problems are not gaps in rigour — they are *placement* problems: the payoff is told before it is earned, the prediction gate is applied unevenly, nothing the learner does is remembered, and the one artefact that leaves the app is the one artefact with no honesty label on it.

---

## What is strong

- **The thesis is real and it is the spine.** "Does 440 Hz have a shape?" is the first prose on the home (`CymaticsHomeScreen.tsx:88–93`), it is the lesson tagline (`content.ts:1200`), and it has a dedicated instrument (`modChange.tsx`) built to falsify it. Most labs have a topic; this one has an argument.
- **The Intro starts OFF resonance.** `modIntro.tsx:22–23` deliberately parks the plate at `f1 × 0.78` so the learner's first sight is a plate doing *nothing*. The contrast is the lesson. That is a real instructional decision, not decoration.
- **`modMyth.tsx` is the only true retrieval practice in the lab, and it is well built.** Commit to EVIDENCE / DEPENDS / MYTH before the explanation unlocks (`:314–332`), then a score (`:334`) that names the misses as the re-read list. Six claims, each one a misconception a learner actually arrives with.
- **Change One Thing is an argument rendered as an instrument.** One locked tone derived from plate A and never following B (`modChange.tsx:81–85`), the prediction question carried as the VARY tray's own blurb so it is read with both plates in view (`:100–108`), and the *exception* called out explicitly — damping blurs the resonance instead of moving it, steel lands near aluminum (`:172`). Naming the exceptions is what separates teaching from asserting.
- **Honesty discipline inside the app is exemplary.** Per-shape badges that distinguish CALCULATED · VALIDATED from CALCULATED from APPROXIMATED (`PlateStudioScreen.tsx:487–492`), a four-line "what is exact / calculated / approximated / and what a real plate also depends on" block in every studio (`PlateStudioScreen.tsx:632–636`, `LiquidStudioScreen.tsx:587–590`, `MembraneStudioScreen.tsx:549–552`), and the note that the solved shapes' edge condition is part of the solution and therefore *not* a control (`PlateStudioScreen.tsx:325`).
- **The heat map is scaled by response strength, on purpose.** `vizPlate.tsx:322–330` — a full-red map at every frequency would have taught "there is a pattern at every frequency", the lab's own target misconception. The comment says exactly that. This is the single best anti-misconception decision in the file set.
- **The frequency readout already does what a frequency control should.** Hz + nearest note + cents on the lane (`PlateStudioScreen.tsx:276`, `modNodes.tsx:65`), plus a JUMP TO A MODE chooser and a live "lowest excitable modes / ratios to the first — not 1 : 2 : 3 : 4" block (`PlateStudioScreen.tsx:625–630`). No note-name or scale-legibility complaint applies here.
- **The dwell sweep.** `PlateStudioScreen.tsx:206–235`: a plain log sweep crossed a Q-in-the-hundreds resonance in ~20 ms and never read AT, so it glides 1.5 s and holds 3 s per mode. Someone watched a learner fail and fixed the pedagogy, not the code.
- **The guided lesson is a genuine glossary of the subject.** Every `helpKey` referenced anywhere in the lab resolves to a written entry, and every written entry is referenced — I cross-checked all 52. No dead long-presses, no orphan content.
- **Rack accessibility is done properly.** `ParamLane.tsx:139–150` gives faders `adjustable` + `accessibilityValue` + increment/decrement actions; `BezelReadouts.tsx:34–35` labels every cell.

---

## The five highest-value improvements

### 1. The sequence tells the punchline in module 1 and asks the learner to discover it in module 6

**What to change.** Two edits. (a) Reorder `CYMATICS_MODULES` in `modules/registry.ts:8–17` so Change One Thing sits at position 3: `intro → nodes → change → harmonics → systems → harmony → myth → experiments`. (b) Replace the closing card of the Intro — `modIntro.tsx:81–88`, "THE ONE THING TO CARRY WITH YOU… Sound does not have one universal shape. The figure you see also depends on the object's geometry, dimensions, material…" — with the *question* and a button into Change One Thing.

**Why it improves learning.** The spec's own §0 says the learner should "*discover* this (Change-One-Thing) rather than read it" (`APE_CYMATICS_LAB_SPEC_2026_09_16.md:13`). As built, module 1 hands over the conclusion in full prose, complete with the list of variables, and module 6 then asks the learner to find it. A conclusion already read cannot be discovered; it can only be confirmed, and confirmation produces none of the retention that a violated prediction does. The current order also buries the payoff behind two tangents — Harmonics vs Plate Modes (#3) and Harmony in Motion (#4) are both *contrast* material that only lands once the central claim is owned. Right now the learner meets Lissajous figures before they have ever seen the same tone fail on a different plate.

**The one big idea each module should land, and whether it does:**

| # | Module | The one idea | Lands? |
|---|---|---|---|
| 1 | What Is Cymatics? | A stable figure appears only at a resonance, not at every frequency | **Yes** — the off-resonance default (`modIntro.tsx:22`) plus the response strip earns it |
| 2 | Nodes, Antinodes & Modes | Every figure you will ever see is *one normal mode*; nodal lines are hinges | **Yes** — riding FREQ between modes makes it kinesthetic (`modNodes.tsx:158`) |
| 3 | Harmonics vs Plate Modes | Plate modes are inharmonic, so a figure is not a picture of a chord | **Yes**, but as a document, not an instrument (see #14) |
| 4 | Harmony in Motion | Harmony is a *ratio*, not a frequency | **Yes** — riding BASE while the figure holds is the proof (`modHarmony.tsx:322`) |
| 5 | Other Cymatic Systems | The pattern always marks the nodes of *that system's own* modes | **Partly** — 3 of 6 systems have no drawing (see #6) |
| 6 | Change One Thing | The frequency did not change; the object did | **Yes** — best-built module in the lab, wrong position |
| 7 | Evidence vs Myth | Which claims survive evidence | **Yes** — the only retrieval in the lab, and it is placed 7th of 8 |
| 8 | Guided Experiments | — (a menu, correctly) | n/a |

**Work: small.** One array reorder and one card rewrite. The `num` badge on the home derives from index (`CymaticsHomeScreen.tsx:114`), and `CymaticsModuleScreen` PREV/NEXT is index-driven (`:164–169`), so nothing else needs touching.

---

### 2. The prediction gate is applied to 10 of 17 experiments, and REVEAL is never earned

**What to change.** In `src/features/cymatics/presets.ts`, add a `predict` to the seven experiments that lack one — #1 `first-resonance` (`:63–77`), #2 `predict` (`:78–91`), #3 `nodes-antinodes` (`:92–105`), #8 (`:171–184`), #9 `liquid-first-pattern` (`:185–198`), #10 `liquid-threshold` (`:199–212`), #12 `liquid-depth` (`:229–242`). Then, in `ExperimentWell.tsx`, gate `REVEAL LOOK FOR` (`:314–317`) on at least one step being ticked, and put a two- or three-way commit control in the PREDICT card (`:293–298`) rather than a paragraph to read.

**Why it improves learning.** A prediction only works if it is *committed* before the answer is reachable. Today the learner can open an experiment and press REVEAL LOOK FOR as the very first action — the answer is one tap from arrival, with no cost to taking it. And the gate is inconsistent in the worst possible place: **experiment #2 is literally titled "Predict where the particles will gather" and has no `predict` field** (`presets.ts:80–90`); its prediction is demoted to step 2, "Say out loud where the sand will end up", which nothing enforces and nothing records. `modChange.tsx` already proves the pattern works — its PREDICT card (`:163–166`) sits above a REVEAL that stays folded (`:180–182`) — but even there the reveal is available before A and B have been compared once. The asymmetry between a prediction-error you *felt* and an explanation you *read* is the whole retention mechanism; right now the lab offers both and lets the learner take the cheap one.

**Work: medium.** Seven copy additions (small), plus a commit control and an `unlocked` condition in `ExperimentWell` (medium — it is the same component for all three studios, so it lands once).

---

### 3. Nothing the learner does is remembered — no ticks, no progress, no closing moment

**What to change.** Three things, in order of value:

- Pass `done` to `ModuleAccordionRow` on the home. `CymaticsHomeScreen.tsx:114` omits it; the component supports it (`ModuleAccordionRow.tsx:20, 57`) and **every other lab uses it** — `digital:72`, `gain:70`, `meter:52`, `wave:64,77`, `amp:103`, `eartraining:73`. Cymatics is the outlier. `useLabClearedUnits` / `markLabUnit` already exist (`features/lab/labCompletion.ts:238, 301`); the rack pass listed "`markLabUnit` for cymatics" as deliberately *not applied* (`APE_CYMATICS_LAB_SPEC_2026_09_16.md:94`), so this is a known deferral, not an oversight — but it is now the only lab without it.
- Persist the experiment tick-offs. `ExperimentWell.tsx:262` holds `done` in local `useState`, and `go()` clears it on every PREV/NEXT (`:274`). Running the 17-experiment series across two sittings loses everything; even within one sitting, stepping forward and back wipes the ticks.
- Give the series an ending. At experiment 17 NEXT is simply disabled and greyed (`ExperimentWell.tsx:334–343`). There is no completion, no synthesis, no "here is what you now know", and no hand-off back to the Evidence vs Myth quiz — which is the natural closing check and currently sits at position 7 of 8 where most learners will never reach it.

**Why it improves learning.** Seventeen experiments with no memory is not a course, it is a pile. The learner cannot answer "where was I?", which is the question that decides whether they come back. And the lab's only retrieval instrument (`modMyth`) is stranded at the far end of the module list instead of being the thing the series *delivers you to* — retrieval placed after the experience is worth several times retrieval placed before it.

**Work: medium.** The `markLabUnit` wiring is small and copy-paste from `wave`; persisting ticks is a small AsyncStorage key; the closing card is small. The judgement call about *which* actions count as "cleared" is the only real design work.

---

### 4. Every exported artefact loses the Simulation label at exactly the moment it leaves the app

**What to change.** Four places, all small:

- `ExportPanel.tsx:167` — the badge line renders only when `sheet === 'lab'`. With ART PRINT selected, the shared/saved PNG is brand name + title + figure + footer, **no badge, no frequency, no object**.
- `ExportPanel.tsx:152–159, 195` — `transparent` strips the brand, the title, the footer *and* the badge. The transparent PNG leaves the app as a bare figure with zero provenance.
- `svgExport.ts:79–84` — `sheetHtml` builds the `.badge` div only for `kind === 'lab'`. The ART print and ART PDF carry nothing.
- `svgExport.ts:105–128` — `compareHtml` has no badge at all, for either kind. Same for the compare card in-app (`ExportPanel.tsx:167` requires `subject.kind === 'pattern'`).

Minimum fix: a single small line — `SIMULATION — <badge>` — on the art sheet, the compare sheet and the transparent PNG's metadata, in the footer where it does not fight the artwork.

**Why it improves learning — and why it is not merely a compliance box.** The lab's own charter says "every pattern in this lab is labelled Simulation" (`APE_CYMATICS_LAB_SPEC_2026_09_16.md:15`) and `modMyth.tsx:290` teaches, as a MYTH, the claim *"Patterns generated by an app are measurements"* — with the justification "Every pattern in this lab is labelled Simulation". As built, the lab teaches that rule and then breaks it on the way out the door. Worse, the artefact that escapes is a beautifully coloured symmetric mandala on warm paper (`PatternFigure.tsx:307–314`, `GalleryArt.tsx:36` symmetry fill) — which is *precisely* the visual genre of the sacred-geometry cymatics mythology this lab exists to correct. An unlabelled art print from this app is indistinguishable from the thing it argues against, and it will be screenshotted and reposted as "the shape of 528 Hz". The label costs 8.5pt of footer.

**Work: small.** Four one-line additions. Do not add data to the art sheet — ART PRINT hiding the settings block is the right call; it just needs provenance, not a table.

---

### 5. Two colour systems collide on the same glass, and the phase view spends the house "silence" blue on full amplitude

**What to change.**

- **The bezel conflict.** `PlateStudioScreen.tsx:475` prints RESPONSE tinted by `levelColor(strength)` — at resonance that is **red** (`levelColor.ts:31`, full scale). The cell immediately to its right, `:478`, prints RES tinted by `RES_TINT` (`:105`), where `at: '#37e05f'` — **green**. Two adjacent cells, the same physical fact, opposite ends of the same hue vocabulary. The same pairing repeats in `modNodes.tsx:34,124` and `modChange.tsx:56,130–131`. Fix: move the categorical RES states off ramp hues entirely — a filled/hollow indicator, or a neutral-to-white brightness scale — and let the ramp mean amplitude and only amplitude.
- **The phase view.** `vizPlate.tsx:52–54`: `PHASE_UP = '#ffc64d'` (amber), `PHASE_DOWN = MIDLINE_BLUE` — the comment even says "the house MIDI-0 blue (colour standard) — one blue app-wide". But `MIDLINE_BLUE` means *zero amplitude* everywhere else in this app (`levelColor.ts:17–18`), and here it is painted on a lobe at **maximum downward displacement** (`:344`, mixed toward black only as amplitude falls). A learner who has just been trained on the heat map — "black = still, blue = a little, red = the most" (`content.ts` `display` entry) — will read a blue phase lobe as a quiet region. It is the exact inverse of the truth: that lobe is moving as hard as the amber one. Fix: keep the ± distinction but drop it out of the amplitude vocabulary — two hues that are not on the ramp (e.g. violet / teal), or amber / white with the sign carried by a hatch or an arrow rather than by a ramp colour.

**Why it improves learning.** Colour is doing load-bearing teaching in this lab — the heat map *is* the prediction that the sand then confirms (`presets.ts:88`, experiment #2). The moment the same hue means "zero" in one view and "maximum, downward" in the next, that teaching channel stops being free and starts needing a legend. The standing rule is explicit that categorical states must not borrow the level ramp; sign is categorical.

**Work: small** for the bezel (a tint table and three call sites); **small-to-medium** for the phase view (two constants in `vizPlate.tsx`, the matching ones in `vizMembrane.tsx`, plus the copy that says "amber rises while blue falls" in `modIntro.tsx:71`, `modNodes.tsx:29`, `presets.ts:100`, `content.ts` `display` and `membrane_display`).

---

## Everything else, ranked

6. **Three of six "Other Cymatic Systems" have no drawing on the glass.** `modSystems.tsx:246–254`: water, speaker and bells render a centred paragraph and a button where the illustration should be. The module's whole promise is "what is actually vibrating in each" (`registry.ts:13`) and for half the list the answer is a link. It also breaks the visual standard directly — the stage is the one place the lab may not put a text card. Compounding it, `initialParam: 'harmonic'` (`:198`) binds a lane that does not exist for those four systems, so the dock has nothing to operate. Cheapest honest fix: a small static cutaway for each (a dish in section, a cone with grains, a bell with its meridians) even if the live sim stays in the studio. *Medium.*

7. **A tappable bezel cell looks identical to a static one.** `BezelReadouts.tsx:27–43` — same border, same padding, same type, no chevron, no underline. The RES cell's tap-to-land is the primary escape from "I turned the knob and nothing is happening" (`PlateStudioScreen.tsx:478`, `modNodes.tsx:127`), and it is invisible. The only hint is a sentence in the well (`PlateStudioScreen.tsx:582`) that appears only in the `between` state and sits below the experiment card and the colour key — a scroll away from the control it describes. Give interactive cells a visible affordance in the shared kit. *Small, and it benefits every lab.*

8. **`vizMembrane.tsx` has no accessibility label.** Root `<View>` at `:444` carries none, while `vizPlate.tsx:561–565` and `vizLiquid.tsx:607–609` both announce the view mode and the current state. The drum and loudspeaker stage is silent to a screen reader. `GalleryCompare.tsx` has zero labels in the file; `modHarmony.tsx` and `modNodes.tsx` likewise have none on their stages. *Small.*

9. **Two rungs in the Harmonics ladder cannot be tapped apart.** `modHarmonics.tsx:231–236`: rung x = `(log r / log 6.5) × (width − 50) + 12`, rung width 14 px. The circular-membrane row includes ratios 2.136 and 2.296 (`:205`) — on a 390 pt device that is ≈ 11.9 px between centres for 14 px targets, i.e. they overlap; on a 360 pt device, ≈ 10.7 px. Both have `hitSlop: 8`. Add a minimum-separation nudge, or stack collided rungs on two rows. *Small.*

10. **The home hero runs a 2 200-particle physics simulation whether or not the screen is in front.** `CymaticsHomeScreen.tsx:51` passes `running` as a literal, and the file never imports `useIsFocused` — unlike every module (`CymaticsModuleScreen.tsx:153` → `focused`). Navigate into a studio and the home keeps simulating behind it. Also the closest thing the lab has to a Low-Light concern: it is the one surface that starts moving before the learner asks for anything. *Small.*

11. **The home offers thirteen entry points and no recommended path.** Four studio buttons (`:95–110`) sit *above* the eight learn modules (`:112–115`), so the default gesture is "open an instrument" before any framing. There is no "START HERE" and no pointer to START THE SERIES, which is the lab's actual designed path and is buried inside module 8 (`modExperiments.tsx:385–388`). One primary row — "New here? Start with What Is Cymatics, then run the 17 experiments" — would cost nothing and would orient the 80 %. *Small.*

12. **The Gallery is pedagogically inert on arrival.** After SAVE, the studio offers "Open the gallery ›" (`PlateStudioScreen.tsx:602`) and the gallery then offers browse / colour / compare — but never says *why you would compare*. The COMPARE verdict line (`GalleryCompare.tsx:67–75`) is genuinely good and states the lab's thesis in data form; it should be advertised at save time ("saved — now save the same tone on a different plate and compare the two"), not discovered. The `compare` lesson entry (`content.ts`) already says it is "the lab's central discovery, made side by side"; nothing in the UI routes a learner there. *Small.*

13. **The PLATE tray presents eleven shape chips as one undifferentiated wrap.** `PlateStudioScreen.tsx:56–61` concatenates 3 analytic shapes with 8 FEM library shapes into a single `chips` row (`:298–303`). The distinction is real and load-bearing — the solved shapes have a fixed edge condition (`:321–325`) and wood loses its grain behaviour on them (`:345–352`) — but it is discoverable only by selecting one and reading the blurb. A `SOLVED SHAPES` sub-head would do it. *Small.*

14. **Harmonics vs Plate Modes is a document while its three siblings are racks.** `CymaticsModuleScreen.tsx:136` lists `nodes, harmony, systems, change` as rack modules; `harmonics` stays a scroller. It is arguably the most important comparison in the lab (it is the direct refutation of "a chord has a cymatic symbol", `modMyth.tsx:291`), and the rack pass consciously kept it as a document (`APE_CYMATICS_LAB_SPEC_2026_09_16.md:92`). Worth revisiting: four ladders on one pinned glass with a LADDER tray would let a learner A/B string-against-plate without scrolling, which is exactly the gesture the lesson needs. *Medium.*

15. **Sub-44 pt tap targets.** The fine-nudge buttons are `minHeight: 32` (`PlateStudioScreen.tsx:657`) and the Myth verdict buttons `minHeight: 36` (`modMyth.tsx:347`). Both have padding that partly compensates and the nudges have `hitSlop: 8`, so neither is severe — but they are the two smallest in the lab and the nudges are a precision control used one-handed. *Small.* (Font floor is clean: I found no `fontSize` below 12 anywhere in `cymatics/`.)

16. **The Myth verdict tints borrow the ramp's hue vocabulary.** `modMyth.tsx:294` — `EVIDENCE '#37e05f'` / `DEPENDS '#ffc64d'` / `MYTH '#ff6b5e'` — near-neighbours of the ramp's green / yellow / red. Lower severity than #5 because the verdict word is always printed beside the colour, so colour is never the only channel, and traffic-light semantics are conventional here. Worth a note in whatever pass fixes #5. *Small.*

17. **`modChange`'s REVEAL is available before any comparison has been made.** `modChange.tsx:180–182` — the "READ IT" explanation unlocks on arrival. Gate it on B having been moved at least once; the module's entire value is the moment B goes dark unexpectedly, and the explanation currently gets there first. *Small.* (Same class as #2.)

18. **`ART_N = 96` region analysis runs per pattern with an 80-entry cache keyed on the full state JSON** (`GalleryScreen.tsx:50–60`). Design, not bug: the first render of a full grid does 96×96 marching squares per card. If the grid ever feels slow on a mid-range Android, thumbnail-resolution geometry for the browse grid is the lever. *Medium, and only if the device pass shows it.*

19. **Nothing in the lab ever asks the learner to name a mode from its figure.** The lab has a perfect instrument for it — `modNodes` already computes `res.dominant.label` and `nodalLines` — but every interaction is recognition (tap a chip, ride a lane, read a bezel) rather than recall. A ten-second "which mode is this?" check at the end of Nodes, or a hidden-heat-map identification in the experiment series (the spec floats exactly that at `:124`, "hidden-heat-map node ID and match-pattern-to-mode", and it never shipped), would convert a demonstration into a test. *Medium.*

20. **The lab has no closing synthesis.** Eight modules, three studios, seventeen experiments, and no screen anywhere says "here is the answer to the question the home asked you". The Intro's closing card currently plays that role (`modIntro.tsx:81–88`) — at the *start*. If #1 is taken, that card is freed up and becomes the natural ending: put it after experiment 17, with the Evidence vs Myth quiz as the check. *Small, once #1 and #3 land.*

---

## One thing to preserve through any refactor

The honesty layer is not decoration and it is not cheap to rebuild. The per-shape validation notes (`PlateStudioScreen.tsx:487–492, 634`), the strength-scaled heat map and its comment (`vizPlate.tsx:322–330`), the "for a solved shape the edge condition is part of the solution, not a control" blurb (`:325`), the "no pattern in this rig's range" refusal instead of an invented pattern (`APE_CYMATICS_LAB_SPEC_2026_09_16.md:50`), and the disabled-with-a-reason export buttons (`ExportPanel.tsx:203–217`) are the reason this lab can make the claims it makes. Anything that simplifies them is a downgrade, whatever it does to the pixel count.
