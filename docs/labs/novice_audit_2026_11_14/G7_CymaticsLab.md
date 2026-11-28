# G7 · CymaticsLab (Cymatics Lab: Sound Made Visible) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF.
**What could and could not be opened (real reasons):**
- `#labpreview/CymaticsLab` (the lab's HOME) does NOT open in the preview — the route is not in the preview registry, so the browser shows the app's splash ("PRO AUDIO TRAINING ACADEMY"). I judged the home from its source (`src/screens/lab/cymatics/CymaticsHomeScreen.tsx`) and say so in that row. The first-visit term card for this lab is keyed to the home route, so I could not see it either.
- The 8 learn modules opened via `#labpreview/CymaticsModule/<id>` (intro, nodes, change, harmonics, harmony, systems, myth, experiments) — all 8 walked (text + layout; their drawings render on web).
- Chladni Plate Studio opened (`#labpreview/CymaticsPlateStudio`), but its plate drawing is Skia = native-only (the preview harness says so); I judged dock, words and layout only. Liquid Studio, Membrane & Loudspeaker Studio and Pattern Gallery were not walked in the first pass; the SECOND PASS at the end of this file walked them (their drawings do render on web — only the Plate studio's is native-only).
Frames inside this one lab: home (cards + accordion), module stepper ("MODULE n / 8 ▾", like EnvelopeLab), and the studios use the LabShell (LEARN / EXPLORE / CHECK + `?` + ⓘ + SAVE + 6-key dock). Three different navigation frames in one lab.

## Home (from source — page would not open in the preview)
| Field | Finding |
|---|---|
| First look (expected) | A hero plate picture with badge "SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTER-DRIVEN", then a gold "NEW HERE? START HERE ›" row ("What Is Cymatics first, then Change One Thing — then run the seventeen experiments."). |
| Overwhelm (expected) | 3 — thirteen entry points: four big studio buttons (Plate, Liquid, Membrane & Loudspeaker, Gallery & Art) ABOVE eight learn modules. The source comment itself records this ("the default gesture is 'open an instrument' before any framing"); the START HERE row was added to fix it. |
| Knows what it is learning? | Yes from the body: "Does 440 Hz have a shape? … The answer is the lab's central discovery, and you get to find it yourself." — a great hook. |
| Knows what to do first? | Yes, if they read START HERE before the colourful studio buttons. |
| Suggestions | 1. (M) Put the four studio buttons BELOW the learn modules (or behind "Studios — free play" header), so START HERE and module 1 are the obvious path. 2. (S) Badge "FREE EDGES · CENTER-DRIVEN" means nothing on a first look; "A computer simulation of a metal plate" is enough. 3. (S, preview) Add `CymaticsLab` to the preview registry so the home can be reviewed in the browser. |

## Module 1 · What Is Cymatics?
| Field | Finding |
|---|---|
| First look | A paragraph about pressure and molecules ("a compression, then a rarefaction"), an animated row of air molecules, then a sand plate with two chips "At resonance · 104 Hz" / "Off resonance · 80.9 Hz". |
| Overwhelm | 2–3. |
| Knows what it is learning? | Yes — intro card: "a plate shows its vibration only at a resonance: sand leaves the moving parts and gathers on the still lines". |
| Knows what to do first? | Yes: "Now tap AT RESONANCE — the drive level does not change, only the frequency." Clear A/B. |
| Words they would not know | compression, rarefaction, longitudinal, resonance, node / antinode (defined — good), normal modes, phase view. |
| Follows / continues? | Yes; ends with a teaser question "if you played that exact same tone at a different plate, would you get the same figure? Decide before you look." → OPEN CHANGE ONE THING ›. Excellent narrative hook. |
| What works | Prediction question at the end; A/B chips; node/antinode in one plain sentence each. |
| Suggestions | 1. (S) Lead with the sand plate (the "wow"), then the pressure-wave paragraph — currently the first thing read is molecules and "rarefaction". |
| Hobbyist | Good. |

## Module 2 · Nodes, Antinodes & Modes
| Field | Finding |
|---|---|
| First look | A plate figure with readouts MODE "(2,0)+(0,2)", DRIVE 104 Hz, LINES 2, RES AT. |
| Overwhelm | 3 — badge "SIMULATION · APPROXIMATED — Ritz square-plate modes, center-driven"; mode labels in (m,n) notation. |
| Knows what it is learning? | Yes: "Each stable Chladni figure is one normal mode of the plate." |
| Knows what to do first? | Yes: "Ride FREQ onto a mode and watch the figure snap in… Or open FREQ and tap LAND ON". |
| Words they would not know | Chladni, normal mode, (2,0)+(0,2), Ritz, nodal lines, RES AT/BETWEEN, heat map, phase. |
| What works | "A pattern belongs to a resonance, not to a frequency." — the lab's idea in nine words. |
| Suggestions | 1. (S) Replace MODE "(2,0)+(0,2)" with "Mode 3 · 2 still lines" for beginners; keep (m,n) in the ⓘ. 2. (S) Drop "Ritz" from the badge (SHARED F5). |

## Module 3 · Change One Thing
| Field | Finding |
|---|---|
| First look | Two plates side by side "A · ALUMINUM / B · STEEL", readouts LOCKED 191 Hz, A·Al AT, B·Steel BETWEEN. |
| Overwhelm | 2–3. |
| Knows what it is learning? | Yes — "Two plates, one tone… The one thing that differs between A and B is yours to choose." The lab's central experiment, cleanly framed. |
| Knows what to do first? | Yes: "Pick what VARIES, predict, then flick B across its options while A holds." + "PREDICT FIRST · MATERIAL: Does the figure survive?" |
| Words they would not know | Ritz / Bessel (badge), scaling law, S+H (VIEW key). |
| What works | Prediction-first design; one variable at a time — textbook good learning design. |
| Suggestions | 1. (S) VIEW "S+H" → "Sand + heat". |

## Module 4 · Harmonics vs Plate Modes
| Field | Finding |
|---|---|
| First look | Four ladders (String HARMONIC, Air column HARMONIC, Circular membrane INHARMONIC, Free metal plate INHARMONIC) on one 1f–6f axis. |
| Overwhelm | 3. |
| Knows what it is learning? | Yes: "why Chladni figures are not pictures of chords". |
| Knows what to do first? | Yes (LADDER → String, MODE 2: RATIO 2.00×). |
| Words they would not know | harmonic / inharmonic, air column, Bessel-function modes, 1 : 1.59 : 2.14…, harmonic series. |
| What works | Four ladders side by side make "evenly spaced vs not" visible at a glance. "A drum has a vaguer pitch for exactly this reason." links to DrumTuning. |
| Suggestions | 1. (S) "Bessel-function modes" → "drumhead modes". |

## Module 5 · Harmony in Motion
| Field | Finding |
|---|---|
| First look | Readouts A 220 Hz A3, B 330 Hz E4, INTERVAL P5, BEAT —; a waves view. |
| Overwhelm | 3 — P5, Lissajous, superposes, quasiperiodic superlattice. |
| Knows what it is learning? | Yes: "Musical harmony is about ratios between frequencies, not about any one frequency." |
| Knows what to do first? | Yes (ride BASE, then DETUNE). Sound off: "Update the app to hear the locked ratios played." appears on web. |
| Words they would not know | P5, Lissajous, beats, superpose, quasiperiodic, superlattice. |
| What works | Links out to Plate studio second tone, Liquid studio, Harmonograph lab — good cross-lab bridges. |
| Suggestions | 1. (S) INTERVAL "P5" → "fifth". 2. (S) This module repeats TuningLab Ch 2–5 and HarmonographLab; a one-line "You may have met this in Tuning & Temperament" helps returning learners. |

## Module 6 · Other Cymatic Systems
| Field | Finding |
|---|---|
| First look | A string standing wave with blue node dots; readouts SYSTEM STRNG, MODE 2f, NODES 3, FAMILY HARMONIC. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes ("ride HARMONIC and count NODES"). |
| Words they would not know | transversely, antinodes, STRNG (abbreviated readout), levitation. |
| What works | "a finger touched there lets the harmonic ring on" — real guitar knowledge. |
| Suggestions | 1. (S) Spell readouts out (STRNG → STRING). |

## Module 7 · Evidence vs Myth
| Field | Finding |
|---|---|
| First look | Six claims, each with EVIDENCE / DEPENDS / MYTH buttons. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: "commit to a verdict first — then read what the evidence says." |
| Knows what to do first? | Yes. |
| Words they would not know | Ritz approximation, Bessel shapes, eigenvalues (in HOW THIS LAB STAYS HONEST). |
| What works | Critical-thinking design; tackles online "healing frequencies" claims head-on. |
| Suggestions | 1. (S) HOW THIS LAB STAYS HONEST: first sentence is perfect; fold the Ritz/Bessel/eigenvalue sentence. |

## Module 8 · Guided Experiments
| Field | Finding |
|---|---|
| First look | "Seventeen structured activities…" START THE SERIES ›, then 17 cards each with PREDICT FIRST and SET UP THE PLATE / DISH ›. |
| Overwhelm | 3 — a very long list, but each card is consistent. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes: START THE SERIES ›. |
| Words they would not know | Faraday threshold, glycerin, onset. |
| What works | Predict-first on every card; studio opens pre-set; EXPERIMENT ‹ › inside the studio. The lab's own source says this is "the lab's actual designed path" — yet it is module 8 of 8. |
| Suggestions | 1. (M) Promote START THE SERIES to the home's START HERE row (after Module 1), as the source comment intends. |

## Chladni Plate Studio (dock and words only; drawing native-only)
| Field | Finding |
|---|---|
| First look | LabShell header with `?`, ⓘ, SAVE, ▶; "PRESS ▶ PLAY TO DRIVE THE PLATE"; readouts DRIVE 240.0 Hz · RESPONSE 0% · MODE — · RES BETWEEN; fader + ±0.1% buttons; 6-key dock (FREQ, PLATE, DRIVE, VIEW, LEVEL, SAND). Sound Safety popup arrived here (studio plays tone). |
| Overwhelm | 4 — the most controls in the lab, plus Q ≈ 566 · λ in air 1.4 m, "finite elements, 16 modes", "Ritz form" in LAB NOTES. |
| Knows what to do first? | Yes thanks to the intro: "It opens on 240 Hz, between modes. Open FREQ and tap 191 Hz · (2,2)…". But it OPENS ON A NON-RESONANCE — the first thing a beginner sees is "no figure". |
| Suggestions | 1. (M) Open the studio ON a resonance (e.g. 191 Hz) so the first view is a figure; the "move off it and it dissolves" lesson comes second. 2. (S) Hide Q and λ readings for beginners. |
| Hobbyist | Will enjoy SAND/PLATE options. |

## Lab verdict — CymaticsLab
**Beginner's journey:** The idea is irresistible ("Does 440 Hz have a shape?") and the learn modules are built around prediction (decide first, then look) — the best learning design in my group alongside EnvelopeLab. The path through it is the problem: thirteen entry points on the home with colourful studio buttons first, the designed 17-experiment series buried as module 8, three different navigation frames inside one lab, and maths labels ((2,0)+(0,2), Ritz, Bessel, Q, λ) on readouts and badges. The studio opens on "nothing happening" (between modes). Without a phone, the studio drawings could not be seen at all.

**3 biggest orientation problems**
1. Too many doors on the home, studios first; the designed path is last.
2. Three frames in one lab (home cards, module stepper, LabShell studios).
3. Model/maths names on readouts and badges (mode indices, Ritz/Bessel, Q).

**3 best things**
1. Predict-first everywhere (Module 1's closing question, Change One Thing, Evidence vs Myth, 17 experiments).
2. One-variable comparison (Change One Thing).
3. Honest framing ("A pattern belongs to a resonance, not to a frequency"; myth module).

**First 30 seconds rewrite:** Home shows one big picture of sand on a plate and: "Does a note have a shape? Let's test it. ① Watch sand find the still lines (2 min). ② Change one thing and see what happens. ③ Run the experiments." Studios listed after, as "free play".

---
# SECOND PASS — Liquid, Membrane & Loudspeaker, and Gallery walked on screen (coordinator: no depth cut for time)
Correction to the first pass: the Liquid and Membrane studios DO draw their picture in the web preview (a dot-lattice dish and a drumhead); only the Chladni Plate Studio's plate is native-only. So these two were walkable and are now walked.

## Liquid Cymatics Studio · `#labpreview/CymaticsLiquidStudio`
| Field | Finding |
|---|---|
| First look | A round dish covered in a regular lattice of blue dots ("SIMULATION · APPROXIMATED — Faraday pattern map (squares)"); readouts DRIVE 40.0 Hz · RESP 20.0 Hz f/2 · SHAKE 0.25 g · a/a꜀ 1.59×. Sound Safety popup arrives on open (studio can play a tone), then the intro. |
| Overwhelm | 4 — six dock keys (FREQ, SHAKE, LIQUID, DISH, DRIVE, VIEW), a fader with ‹ −5% / +5% ›, readout "a/a꜀" (a subscripted ratio no beginner can read), LAB NOTES with damping percentages, λ, "subharmonic", "bulk Faraday lattice regime". |
| Knows what it is learning? | Yes from the intro: "a liquid shaken up and down forms standing waves at half the shake frequency, but only once the shake passes a threshold set by damping." |
| Knows what to do first? | Yes: "It opens at 40.0 Hz and 0.25 g with a STABLE STANDING PATTERN… lower SHAKE to about 0.15 g and watch the pattern go." — and, unlike the Plate and Membrane studios, it opens ON a working pattern (good). Pressing ‹ −5% nine times brought SHAKE to 0.16 g; the notes changed to "PATTERN ONSET · STAGE 4 / 10 · Just above threshold: a faint squares pattern emerges…" and "THRESHOLD ≈ 0.16 g · NOW 0.16 g". Clear sound-free feedback. |
| Words they would not know | Faraday waves, f/2, subharmonic, g (as a unit of shake), a/a꜀, threshold, λ, viscosity, meniscus, strobed, pinned rim. |
| What works | Opening on a pattern; THRESHOLD vs NOW in one line; RIG SAFETY ("Never pour liquid into a loudspeaker") — practical and kind. |
| Suggestions | 1. (S) Replace the "a/a꜀ 1.59×" readout with words: "1.6× the shake needed". 2. (S) "g" → "shake (g = the pull of gravity)" on first sight. 3. (S) "STAGE 5 / 10" ladder — give each stage a name only (owner's no-N-of-total rule). |

## Membrane & Loudspeaker Studio · `#labpreview/CymaticsMembraneStudio`
| Field | Finding |
|---|---|
| First look | A pale drumhead drawing in a rim; "MYLAR 10 MIL · Ø 355 mm · 3.0 kN/m"; "PRESS ▶ PLAY TO DRIVE THE DRUM HEAD"; readouts DRIVE 180 Hz · FUNDAMENTAL 200 Hz · MODE — · RESPONSE 9 %. The title is cut off on a 390 phone ("MEMBRANE & LOUDSPEAKER …"). |
| Overwhelm | 4 — six dock keys (FREQ, HEAD "14″M10", STRIKE "Qtr", CONE "200", VIEW, LEVEL); notes with Bessel modes, Q ≈ 52, ka, 1/f² piston law, "breakup". |
| Knows what it is learning? | Yes: "Why a bare drumhead's pitch is vague and a timpani's is clear… and how a loudspeaker cone breaks up." Two subjects (drum and loudspeaker) in one studio. |
| Knows what to do first? | Yes, but it OPENS between modes ("It opens at 180 Hz, just below the first mode") — the same "nothing happening first" start as the Plate studio. HEAD → 6 kN/m raised FUNDAMENTAL 200 → 282 Hz at once — clear feedback. |
| Words they would not know | membrane, Bessel, inharmonic, kN/m, mil, Q, ka, piston, breakup, surround, spider, kettle (explained). Dock codes "14″M10", "Qtr". |
| What works | "Mode ratios… 1.00 : 1.59 : 2.14… — not 1 : 2 : 3 : 4. A bare membrane is inharmonic." directly ties to Harmonics vs Plate Modes and to DrumTuningLab. |
| Suggestions | 1. (M) Open ON the first mode (200 Hz) so the first view shows a moving head. 2. (S) Dock values in words ("14-inch head", "quarter strike"). 3. (S) Consider splitting the loudspeaker part into its own view/tab — two big ideas in one screen. 4. (S) Fix the clipped title at 390 wide (e.g. "DRUMHEAD & SPEAKER"). |

## The studios' LEARN and CHECK tabs (walked in the Liquid studio)
- **LEARN** is the whole Cymatics lesson, not a liquid lesson: it opens "Drive a plate with a tone and the sand dances…", with FREQ ranges for Plate, Liquid and Drum side by side. A learner who came to the Liquid studio reads plate content first. (S) Start the studio's LEARN at its own section, or label it "The whole lab's lesson".
- **CHECK** is "CHECK YOUR UNDERSTANDING · Covers the Whole Cymatics Lab · Answer all 5", reachable from each studio's CHECK tab. The 8 learn modules (the beginner's path) do not lead to it; their last module ends in FINISH. A beginner following START HERE may never find the lab's credit check. (M) Put "Final check ›" at the end of Module 8 and on the home (the home source has a `LabUnderstandingBlock`, which I could not see because the home does not open in the preview).

## Pattern Gallery & Art Studio · `#labpreview/CymaticsGallery`
| Field | Finding |
|---|---|
| First look | Filter chips (All, Plate, Dish, Drum, ★ Favorites, Compare…) and an empty-state card: "NOTHING SAVED YET — Every studio has a SAVE key in its header. Press it while a figure is on the plate… ready to reopen, color, compare and print." with links to the three studios. |
| Overwhelm | 1. |
| Knows what to do first? | Yes — the empty state says exactly what to do. But the intro popup says "Tap a card to open it, or long-press it to make it a favorite. To compare, tap Compare…" while there are no cards — the popup contradicts the screen. (S) Give the empty gallery its own intro, or skip the popup until something is saved. |
| Notes | I did not SAVE a pattern into the gallery (it writes device data); the coloring/compare/print screens therefore were not reachable with an empty gallery. PRINT is also on the brief's do-not-press list. |

Page count for this lab is now: 8 learn modules + Plate studio (EXPLORE, words) + Liquid studio (EXPLORE, LEARN, CHECK) + Membrane studio (EXPLORE) + Gallery (empty state) = 14 screens on screen; home judged from source (does not open in the preview).
