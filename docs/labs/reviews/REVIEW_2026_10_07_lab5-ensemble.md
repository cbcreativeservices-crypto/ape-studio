# Review 2026-10-07 — Miking Lab 5 ENSEMBLE lessons (E08–E16)

Two experts reviewed the lessons, then fixed what they found:
- **AE**: a senior audio engineer (studio and live);
- **CL**: a cognitive-learning and instructional-design expert.

Branch `review-lab5-ensemble`, from `final-lab` 456064b1.

**Scope**: the lesson data and copy of these lessons:
- E08 Acoustic small group;
- E09 Complete band;
- E10 Horn section;
- E11 String quartet;
- E12 Percussion ensemble;
- E13 Mixed classical;
- E14 Full orchestra;
- E15 Jazz combo;
- E16 Big band.

It also covers the shared toolkit in `lessons/shared/ensemble/`: the stereo-array model, the stage-plot readouts and the shared checks.

**Method**:
- Read LESSON_JOURNEY, BUILDER_BRIEF and the visual charter.
- Read every lesson in scope: pages, checks, quick checks, symptoms, briefs, the setting, the worked words and the unknowns.
- Checked the stereo-array geometry in `stereoArray.ts` against the register.
- Looked at STARTING SETUPS in the web preview at 412×915:
  - E08: plan, side and front views;
  - E09: the stage plot;
  - E10: the line, from the side;
  - E13: the chamber group in plan;
  - E14: A/B from the side, then the tree plus outriggers in plan and from the side;
  - E16: the rows from the side.

**Owner-review items already in CORRECTIONS_LOG.md were left as they are.** These are G3-OR-*, G4-OR-*, G5-OR-1…13 and the E15 main-pair trial G4-OR-6.

## Findings

| id | lesson / page | expert | severity | finding | fix applied / owner decision |
|---|---|---|---|---|---|
| R1 | E09 MEET IT check `bd.meet.2`, quick check `bd.q.2`, how-it-sounds stage 3, the vocal part's `radiates` text (`bandStage.ts`), the vocal setup line (`geometry.ts`) | AE | major | The lesson taught that "the vocal mic is the closest mic on a band stage". That is false. The lesson's own close mics sit nearer their sources: the kick 4 cm, the snare 5 cm, the guitar amp 5 cm and the bass 6 cm, against the vocal's "within 10 cm". The real point is different: the voice is the quietest source, so its mic goes right at the lips. | **Fixed.** The prompt now reads "Why does the vocal mic sit right at the singer's lips?". Every "closest" claim now says "right at the lips"; the why-text notes that the drum and amp mics are just as close to their own, louder sources. Pinned by `test/mikingLab5EnsembleReview.test.ts`. |
| R2 | E16 orient "HOW IT IS SEATED", MEET IT note, check `bb.rec.2` | AE | major | The lesson stated as the common layout that the trumpets stand on a short riser, and asked "Why do the trumpets stand on a riser?". In most big bands the trumpets sit on the highest riser and stand only for some passages. The drawing of standing trumpets is owner item G5-OR-4. | **Fixed (words only).** The text now says "on the highest riser (seated in many bands, standing in some — drawn here standing)". The check now asks "Why are the trumpets up on the highest riser?". **The drawing stays**: it is G5-OR-4, the owner's decision. Pinned. |
| R3 | E16 placement takeaway, `bb.meet.1` explain, `bb.place.1` explain | CL | minor | One idea had two opposite-sounding wordings: "a higher, more forward view" next to "raise the pair and move it back a little". "Forward" can mean toward the band or away from it. | **Fixed**: "a higher view, a little farther out in front". Pinned. |
| R4 | E12 quick check, `None, ever, for percussion` | CL | minor | A distractor gave itself away with an absolute word (LESSON_JOURNEY §5). | **Fixed**: "None: one main pickup is enough", with its why kept. Pinned (no ever / always / never in any E08–E16 distractor). |
| R5 | E13 quick check, `None ever, a pair is enough` | CL | minor | The same absolute-word giveaway. | **Fixed**: "None: a pair is enough". Pinned. |
| R6 | E15 `jz.meet.3`, `Nothing a microphone could ever hear` | CL | minor | The same absolute-word giveaway. | **Fixed**: "Nothing a nearby microphone would notice". Pinned. |
| R7 | E08 `ac.meet.1` | CL | minor | The prompt asked "Where does a mic … tend to **sound**?". It asks *how* it sounds. | **Fixed**: "How does …". |
| R8 | E10 `hs.set.2` explain | AE | minor | It said "The slide moves … through about half a metre". Seventh position takes a tenor slide more than 60 cm out, so "about" under-states the space to keep clear. | **Fixed**: "more than half a metre". |
| R9 | Stage-plot bezel (E08, E09, E15), shared `ensemblePages.tsx` | CL | minor | The readout label "NOM COST" is an unexplained acronym on the display. | **Fixed**: the label is now "MARGIN LOST". The OPEN MICS card says "… dB less margin before feedback than one (MARGIN LOST)". Pinned. |
| R10 | E14 quick check: "Which main array keeps every pair of its mics at least 1.5 m apart?" | CL | minor | This checks recall of a number more than reasoning. It is acceptable because it tests the tree's defining geometry, which the setups page draws and labels. | Not changed. Listed for the owner. |
| R11 | Stereo arrays (`stereoArray.ts`) | AE | — (verified) | Checked against the register: X/Y 90°, try up to 135°, capsules stacked, the left capsule aimed left; ORTF 170 mm / 110° with a 95° recording angle, locked; NOS 30 cm / 90° and DIN 20 cm / 90°, with width words consistent with their recording angles; M/S with the Side figure-8 positive lobe to the left (L = M + S); A/B 40–60 cm, with the hole from about 1 m given as a tendency; the tree with L–R 2 m, the centre 1.5 m ahead, every pair ≥ 1.5 m and the centre 4–5 dB down into both sides; outriggers about 6.1 m apart as practice; 3:1 only between separate mics, never inside one array. | No change. |
| R12 | Stage plot and 3:1 (`stagePlot.ts`, E08/E09/E15 checks) | AE | — (verified) | Spill uses free-field inverse square plus the ideal pattern, with equal source levels stated in ⓘ. NOM is 10·log10(n), 3 dB per doubling. 3:1 is mic-to-mic ≥ 3 × the larger mic-to-source distance, and the 30 cm → 90 cm example is right. Arrival times use 343 m/s, 2.9 ms per metre: E08 1.3 m ≈ 4 ms, E09 3 m ≈ 9 ms, E10 1 m ≈ 3 ms, E15 4 m ≈ 12 ms, the shared 5 m ≈ 15 ms. | No change. |
| R13 | Seating realism (E09, E10, E13, E14, E16 in preview) | AE | — (verified) | The layouts are realistic: drums upstage centre with amps behind their players; a horn line; a chamber group with the grand across the back and its lid opening to the hall; the American orchestral seating (violins left, cellos right, basses behind) and the antiphonal variant; big-band rows on risers. Every array has its stand: a tall boom from the audience side, the tree on a stand behind the podium, the outriggers on their own stands, nothing flown. In side view the stands stand on the floor. That last point is also pinned by `test/mikingLab5Arrays.test.ts` ("nothing floating"). | No change. |
| R14 | Side views, E08/E14/E10 (shared `EnsembleStage`) | CL | minor | Some labels collide in side views: "1.3 m UP" with MANDOLIN; "3.2 m UP" with 1ST VIOLINS; CLARINET with VIOLA in plan. Everything stays readable at ≥ 9 pt, and the plan view separates them. | **Owner decision** (a label-placement pass on the shared stage, which several reviewers share). Not changed here. |
| R15 | E10 side view of the horn line | CL | minor | The four standing players overlap exactly in side view, so the side view of ONE MIC PER PLAYER shows one figure with four stands. The plan and front views are clear. | **Owner decision** (a default view for that setup). Not changed. |
| R16 | Journey and cognitive load (all nine) | CL | — (verified) | Every lesson follows the eight-page journey: a goal, a worked example before free practice, PREDICT FIRST, one FROM EARLIER per page, six quick-check items with a critical safety item, briefs that pass several setups and grade the reasons, and a "what's left" ending. The new ideas per step stay ≤ 4. Every wrong option has its own why. The standard starting-points line is present. There are no brand names or citations; `mikingLearnerText` passes. | No change. |

## Counts

| Severity | Found | Fixed | Owner decision or left |
|---|---|---|---|
| Critical | 0 | — | — |
| Major | 2 | 2 (R1, R2) | — |
| Minor | 10 | 7 (R3–R9) | 3 (R10 left as it is; R14 and R15 are owner decisions) |

## Shared files touched

Other reviewers run in parallel, so these are listed on their own:
- `src/screens/lab/miking/lessons/shared/ensemble/ensemblePages.tsx`: the bezel label "NOM COST" became "MARGIN LOST", and the OPEN MICS card has one extra clause. Only the E08, E09 and E15 stage plots use them.
- `src/screens/lab/miking/lessons/shared/ensemble/bandStage.ts`: the vocal part's `radiates` text, "its mic is the closest one" → "its mic goes right at the lips". Only E09 and E15 draw a band stage.

No engine file was touched.

## Tests

- New: `test/mikingLab5EnsembleReview.test.ts`, with 4 tests.
- Full suite: 8848 pass, 0 fail (8844 before, plus 4).
- tsc: clean.
