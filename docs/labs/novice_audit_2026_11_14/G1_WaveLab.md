# G1 · Wave Physics Laboratory (WaveLab) — beginner audit

Auditor G1, 2026-11-14, web preview `http://localhost:8142/?g1=wave#labpreview/WaveLab`, sound OFF (no sound needed in this lab).
Structure: a home list (15 modules + "Room Builder"), then a stepped module screen MODULE n / 16, each with intro card, Rack display, readout strip, long text well, COMMON MISTAKES, CHECK YOURSELF, dock keys. Pages audited: 18 (home, 16 modules, What's left).

**Depth note (real reason, not scope):** from Module 7 on, the shared Browser pane kept changing width (other sessions), which cleared my 390 x 844 phone size and turned screenshots into tiny 800 x 600 thumbnails. I judged Modules 1–6 by screen + text + one or two interactions; Modules 7–16 mainly by the full on-screen text (every word, readout and intro card) plus what the readouts reported, with only Module 10's display partly seen. Picture-level findings for 7–16 are therefore marked "(text-only)".

Shared-frame notes F1–F6 (G1_FoundationsCourse.md) apply. WaveLab-specific frame notes:
- **W-A. Readout abbreviations.** Every module's readout strip uses compressed codes: "LOSS/BNC", "REFL LVL", "α @ 500 Hz", "MIN ƒ", "FRESNEL N", "c @60m 24°", "Δ PATH 0.00 λ", "NOM COV", "EFF @ 2.0k", "LF CTRL", "REQ / SET / OFF BY", "F − R", "Δt/BOX 0 µs", "RT 2K", "1ST ARR". The same values are then repeated in full words in a table in the text well ("REFLECTION LOSS 0.1 dB / bounce"). The words version is the one a beginner can read, but it is below the fold. (SHARED pattern with readout strip)
- **W-B. Mystery labels on the drawing.** "RING GAP > λ" appears on most room plans with no explanation; "OPENING" is printed on walls that are not there (a beginner reads "a doorway"); the dock key LAYERS shows codes "P·R·A", "P·W", "H".
- **W-C. Every module is an expert page.** Each text well has 2–3 headed essays, a numbers table, a footnote in capitals naming the model (SABINE, ISO 354, MAEKAWA KNIFE-EDGE, MASS-LAW TL ≈ 20·log10(m·f) − 47 dB), four COMMON MISTAKES and a CHECK YOURSELF. The intro card is the only beginner-sized text on each page.
- **W-D. "1 / 16" vs "THE 15 MODULES".** The home says 15 modules + Room Builder; inside it is 16. Minor, but a beginner counting progress notices.

---

## Page 0 · Lab home (WAVE PHYSICS LABORATORY)
| Field | What |
|---|---|
| Page | WaveLab · home · `#labpreview/WaveLab` |
| First look | "Acoustics" word card (plain and good), then intro card, then a long dark list "THE 15 MODULES" of names ending mostly in "Laboratory", then PUT IT ALL TOGETHER · Room Builder. Thinks: "a course with 15 chapters". |
| Overwhelm | 3. A list of 15 technical names (Refraction, Diffraction, Comb Filtering, Cardioid Subwoofer, Beam Steering…) with no pictures, no time estimate, no grouping. |
| Knows what it is learning? | Partly. The intro card says it plainly ("how sound bounces, is absorbed, scatters, bends and adds up, and why one loudspeaker sounds different at every seat"). The list itself doesn't. |
| Knows what to do first? | Yes. The intro says "Tap Reflection Visualizer to read its one-line description, then tap OPEN." Opening needs two taps (expand row, then OPEN). |
| Words they would not know | Most module names (refraction, diffraction, comb filtering, standing wave, line array, cardioid subwoofer, beam steering), and the first description ("Law of reflection, first reflections, path lengths, the image-source idea"). |
| Follows / continues? | Yes. |
| What works | One shared room model behind every module ("Every module below is a ready-made setup of the same Room Builder") is a great mental anchor. |
| Suggestions | 1. Group the 15 into 3–4 bands with a plain heading each: "How sound meets a wall (1–3)", "How sound bends and adds (4–8)", "Loudspeakers in a room (9–13)", "Echo and reverb (14–15)". (M) 2. Add a plain subtitle to every row (e.g. "Comb Filtering — why a mic near a wall sounds hollow"). Write it for the person, not the physicist. (S) 3. One tap to open (or show OPEN without expanding). (S) |
| Hobbyist | Will jump straight to Comb Filtering and Standing Waves (their real problems). Grouping by problem would help them too. |

## Module 1 · REFLECTION VISUALIZER
| Field | What |
|---|---|
| Page | WaveLab · 1/16 |
| First look | A top-down room plan with grey concrete walls labelled CONCRETE, many blue rays, a yellow arrow, two small round icons (source and listener, not labelled), a floating table of five arrivals ("10.9 ms direct / 19.9 ms −5 dB / …"), and "RING GAP > λ" in a corner. |
| Overwhelm | 4. |
| Knows what it is learning? | Partly: "sound bounces and arrives later and quieter" (from the intro). The image-source idea and "angle from the normal" are beyond a first visit. |
| Knows what to do first? | Partly. "Drag the listener toward a wall" — which icon is the listener is not labelled; a beginner drags the wrong one or nothing. |
| Words they would not know | normal, incidence, α, image source, construct, path difference, comb filters (forward reference), "re-solve", LOSS/BNC, REFL LVL, ms, dB, MAT, CONC, LAYERS P·R·A. |
| Follows / continues? | Many would read the intro, glance at the rays and tap NEXT. |
| What works | The arrivals table is a real-world readout; "angle in equals angle out" is a sentence everyone can hold. |
| Suggestions | 1. Label the two icons on the plan ("SPEAKER", "YOU") and add a "drag me" hint on the listener. (S, SHARED with every WaveLab module) 2. Show only the direct ray and the first reflection by default; "all reflections" as a layer. (M) 3. Expand readout codes (W-A). (S) |
| Hobbyist | Likes the arrivals list; image-source is new to them. |

## Module 2 · ABSORPTION LABORATORY
| Field | What |
|---|---|
| Page | WaveLab · 2/16 |
| First look | Room plan with DRYWALL walls; readouts "α @ 500 Hz 0.05 · 1 BOUNCE 95 % · α 125 Hz 0.29 · α 4 kHz 0.09". |
| Overwhelm | 4. Greek letter as the main readout. |
| Knows what it is learning? | Partly: "materials absorb some sound; soft panels don't stop bass". The opening default contradicts the heading: the page heading is "WHY BASS SURVIVES", but the default wall (drywall) shows bass absorbed MORE (α 125 Hz 0.29) than mids (0.05). A beginner sees the opposite of the lesson until they change MAT. |
| Knows what to do first? | Yes: MAT → ACOUSTIC FOAM, compare α 125 with α 4 kHz. |
| Words they would not know | α (absorption coefficient; defined only as "α, 0 to 1"), porous, quarter wavelength, RT60 (used before it is defined in Module 15), Helmholtz, membrane trap, Sabine, ISO 354, isolation, flanking. |
| Follows / continues? | Yes; the check (60 Hz boom + foam) is a classic and well written. |
| What works | "ABSORPTION ≠ SOUNDPROOFING" box: clears up the most common home-studio myth. "ENERGY AFTER 1 BOUNCE 95 %" is the readout a beginner can understand. |
| Suggestions | 1. Open on ACOUSTIC FOAM (the case the heading talks about), or explain in one line why drywall is different (it flexes at low notes). (S) 2. Lead the readouts with "ENERGY KEPT PER BOUNCE" and put α second. (S) 3. Define RT60 in plain words at first use ("how long a sound takes to die away"). (S) |
| Hobbyist | High value (the foam-and-bass myth). |

## Module 3 · DIFFUSION LABORATORY
| Field | What |
|---|---|
| Page | WaveLab · 3/16 |
| First look | Room plan; the top wall is a diffuser (comb-like wells) with a fan of blue rays; arrivals table (its "15.5 ms" wraps and overlaps the word "scattered"). |
| Overwhelm | 4. |
| Knows what it is learning? | Yes, from "SCATTER ≠ REMOVE" and the fan of rays: a diffuser spreads sound instead of eating it. |
| Knows what to do first? | Yes: DIFFUSER on/off, then DEPTH. |
| Words they would not know | specular, wells, c / (2 × depth), MIN ƒ, "slap", "discrete". |
| Follows / continues? | Yes. |
| What works | The visual fan from one ray; "ENERGY RETURNED 98 % — SAME ON OR OFF" proves the point with one number. |
| Suggestions | 1. Fix the arrivals table wrap (S). 2. "MIN ƒ" → "WORKS ABOVE". (S) 3. A caption says "THE DRAWING SHOWS THE SPECULAR (MIRROR) RAY", which reads as if the fan is NOT drawn, while the intro says to watch the fan; reconcile the wording. (S) |
| Hobbyist | Good. |

## Module 4 · REFRACTION LABORATORY
| Field | What |
|---|---|
| Page | WaveLab · 4/16 |
| First look | Side view outdoors (WARM AIR / COOL AIR bands, "HEIGHT ×20", 150 m), an amber ray curving. |
| Overwhelm | 3. |
| Knows what it is learning? | Yes. The hook "why sound carries at night and over water" is excellent and the check (a concert across a lake) matches it. |
| Knows what to do first? | Yes: push GRAD to INVERSION, then LAPSE. |
| Words they would not know | gradient, lapse, inversion (explained in the text), wind shear, "c" (speed of sound; the readout "c @60m 24°" uses ° for temperature while elsewhere ° is an angle). |
| Follows / continues? | Yes. |
| What works | Real-life story + one slider + a readout that says DOWN — SOUND CARRIES. |
| Suggestions | 1. Readouts: "SPEED AT GROUND", "SPEED AT 60 m (24 °C)", "RAY BENDS: DOWN". (S) 2. Explain "×20 height" on the drawing ("height stretched 20× so you can see the bend"). (S) |
| Hobbyist | Interesting for outdoor gigs. |

## Module 5 · DIFFRACTION LABORATORY
| Field | What |
|---|---|
| Page | WaveLab · 5/16 |
| First look | (Seen briefly) a barrier with a SHADOW ZONE label; readouts λ, BARRIER, FRESNEL N, LOSS @ 1 kHz. |
| Overwhelm | 4 (FRESNEL N and Maekawa numbers). |
| Knows what it is learning? | Yes from "LOWS WRAP, HIGHS SHADOW" and the highway-barrier check. |
| Knows what to do first? | Yes: slide FREQ, watch LOSS @ climb. |
| Words they would not know | diffract, Fresnel number, Maekawa, knife-edge, attenuates, δ. |
| Follows / continues? | Yes. |
| What works | "A SHADOW ZONE IS NOT SILENCE … you keep the rumble and lose the sparkle"; the pillar-in-front-of-the-PA example. |
| Suggestions | 1. Replace FRESNEL N in the strip with "LOSS @ 80 Hz / LOSS @ 8 kHz" side by side (the comparison is the lesson). (S) |
| Hobbyist | Good. |

## Module 6 · INTERFERENCE LABORATORY
| Field | What |
|---|---|
| Page | WaveLab · 6/16 |
| First look | A heat map with two speakers and a listener, curved bands of yellow/green/orange, OPENING printed on all four sides. |
| Overwhelm | 3. |
| Knows what it is learning? | Yes after the first action: POL Ø S2 on → "vs 1 SPKR" reads NULL. |
| Knows what to do first? | Yes (POL Ø S2). The intro then says "drag the listener through the red and blue bands", but at 500 Hz the bands I saw were yellow/green/orange, not red and blue. |
| Words they would not know | POL Ø (polarity), Δ PATH, λ, constructive/destructive, free field, "system techs". |
| Follows / continues? | Yes; check (step half a metre and the null moves) is clear. |
| What works | "NULLS ARE APPOINTMENTS — A PLACE AND A FREQUENCY" — a memorable headline. NULL as a word readout. |
| Suggestions | 1. Label speakers "1" and "2" on the map, and the listener "YOU". (S) 2. Match the intro's colour words to the heat-map colours actually shown. (S) 3. "OPENING" → no label (or "open side") so walls that aren't there don't read as doors. (S, W-B) 4. "POL Ø S2" → "FLIP SPEAKER 2". (S) |
| Hobbyist | Very useful (two-speaker setups at home). |

## Module 7 · COMB FILTERING LABORATORY (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 7/16 |
| First look | (text-only) Room plan with one concrete wall, a frequency axis 50 · 200 · 1k · 5k · 20k, readouts Δt / 1ST NULL / SPACING / MIC→WALL, and a "RESPONSE AT THE MIC" graph. |
| Overwhelm | 4. |
| Knows what it is learning? | Yes from "you cannot EQ a comb away, but you can MOVE it away" — the best single sentence in the lab. |
| Knows what to do first? | Yes: press MIC → once, then ← MIC. Discrete nudge buttons (6 in / 0.15 m per press) are beginner-friendly. |
| Words they would not know | Δt, notch, 1/(2Δt), EQ, 3:1 rule, delay-plus-sum, resonance, "phasey". |
| Follows / continues? | Yes. |
| What works | The "WHERE YOU WILL MEET IT" list (music stand, podium, two open mics) gives a reason to care. |
| Suggestions | 1. Readouts: "ECHO DELAY", "FIRST DIP AT", "DIPS EVERY". (S) 2. Gloss EQ once ("tone controls"). (S) |
| Hobbyist | Highest-value module for them. |

## Module 8 · STANDING WAVE LABORATORY (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 8/16 |
| First look | (text-only) Concrete room with a modal pressure map; readouts MODE (1,0) 34 Hz · TYPE AXIAL · PRESSURE 0 % · VERDICT NODE. |
| Overwhelm | 4. "(1,0)" mode notation and "AXIAL" without explanation. |
| Knows what it is learning? | Yes: some low notes pile up in spots and vanish in others; the room size sets them. VERDICT in words (NODE / MAXIMUM / QUIET) helps. |
| Knows what to do first? | Yes: drag the listener to a wall, then slide WIDTH. |
| Words they would not know | mode, (1,0), axial, node, antinode, Schroeder frequency, damped, statistical reverberant field. |
| Follows / continues? | Yes; the kick-drum room-mic check is practical. |
| What works | "modes are made of DIMENSIONS, not materials"; "Bass traps do not delete a mode … DAMPED, never eliminated." |
| Suggestions | 1. Hide "(1,0)" notation behind plain names ("1st side-to-side mode"). (S) 2. Move the Schroeder paragraph into a "for the curious" fold. (S) |
| Hobbyist | Very high value (home studio bass problems). |

## Module 9 · LOUDSPEAKER COVERAGE (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 9/16 |
| First look | (text-only) A speaker, a listener, dashed −6 dB edge lines; readouts NOM COV 90° · EFF @ 2.0k 94° · λ · vs ON-AXIS. |
| Overwhelm | 3. |
| Knows what it is learning? | Yes: highs beam, lows spread. |
| Knows what to do first? | Yes: drag the listener aside, sweep FREQ. |
| Words they would not know | nominal, effective coverage, −6 dB points, directivity, HF, on-axis/off-axis, "box", balcony. |
| Follows / continues? | Yes. |
| What works | "Aim the HF pattern, not the cabinet." |
| Suggestions | 1. "HF" → "the highs". (S) 2. This module overlaps strongly with Speaker Placement & Coverage (SpeakerLab); link to it. (S) |
| Hobbyist | Good. |

## Module 10 · LINE ARRAY LABORATORY (text-only, display partly seen)
| Field | What |
|---|---|
| Page | WaveLab · 10/16 |
| First look | Section view (side view of a venue), a REAL HARDWARE photo with ⤢, readouts BOXES · LEN · λ · LF CTRL YES. The text helpfully explains the axes: "x is distance into the venue, y is height". |
| Overwhelm | 4. |
| Knows what it is learning? | Partly: "longer array controls lower notes". Splay is not explained. |
| Knows what to do first? | Yes: slide FREQ down until LF CTRL flips to NO; ARRAY → 8 boxes. |
| Words they would not know | line array, splay, LF/HF, coupling, beaming, lobes, DSP. |
| Follows / continues? | Yes; the check (2 m array ≈ 170 Hz) needs λ from Foundations. |
| What works | The section-view sentence explaining axes; the real-hardware photo. |
| Suggestions | 1. Define splay ("the angle between boxes") at first use. (S) 2. "LF CTRL YES" → "CONTROLS THE LOWS: YES". (S) |
| Hobbyist | Interesting; not their gear. |

## Module 11 · DELAY ALIGNMENT (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 11/16 |
| First look | (text-only) Sub + main + listener; readouts REQ 6.96 ms · SET 0.00 ms · OFF BY −6.96 ms · SUM −4.4 dB. |
| Overwhelm | 4. This module has no explanatory essay at all, only numbers, COMMON MISTAKES and the check. |
| Knows what to do first? | Yes: ALIGN → AUTO-ALIGN; watch OFF BY go to 0. |
| Knows what it is learning? | Partly: "the two speakers must arrive together". The check's answer (processing latency in the DSP) is not taught on the page. |
| Words they would not know | sub, main, crossover (XOVER key), DSP, latency, polarity, REQ/SET. |
| Follows / continues? | Yes. |
| What works | REQ / SET / OFF BY is a clear three-step logic once decoded; AUTO-ALIGN gives an instant win. |
| Suggestions | 1. Add the one-paragraph "why" every other module has (arrive together → add; late → cancel at the crossover). (S) 2. Teach "processing delay" in one line before the check asks about it. (S) 3. Readouts: "NEEDED / SET / STILL OFF BY". (S) |
| Hobbyist | Useful if they have a sub. |

## Module 12 · CARDIOID SUBWOOFER (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 12/16 |
| First look | (text-only) Two subs (FRONT SUB, REAR SUB · 0.0 ms), REAR MIC, "AUDIENCE ↓", a REAL HARDWARE photo; readouts DELAY · FRONT · REAR · F − R. |
| Overwhelm | 4. |
| Knows what it is learning? | Partly: "two subs can send bass forward and cancel it behind". The word "cardioid" was met in the Mic lab; nothing links them. |
| Knows what to do first? | Yes: MODE → CARDIOID, then WRONG WAY. A "WRONG WAY" preset is an excellent teaching move. |
| Words they would not know | cardioid, polarity, all-pass filter, probe, band-limited. |
| Follows / continues? | Yes. |
| What works | The WRONG WAY preset showing the null landing on the audience. |
| Suggestions | 1. One line: "Cardioid = the heart-shaped pattern you met in Microphone Principles: loud in front, quiet behind." (S) 2. "F − R" → "FRONT LOUDER BY". (S) |
| Hobbyist | Niche (live sound). |

## Module 13 · BEAM STEERING (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 13/16 |
| First look | (text-only) A row of subs; readouts STEER 0° · Δt/BOX 0 µs · GRATING NONE · vs STRAIGHT; a formula footnote "Δt = d·sin θ / c". |
| Overwhelm | 5. µs, sin θ, grating lobes. |
| Knows what it is learning? | Partly: "delays can aim sound without moving the boxes". The staircase of amber delay bars (per the intro) is the right picture. |
| Knows what to do first? | Yes: STEER to 20°. |
| Words they would not know | µs, grating lobe, sin θ, linear delay gradient, high-shelf EQ (check distractor). |
| Follows / continues? | Probably skims. |
| What works | "THE CABINETS NEVER MOVE". |
| Suggestions | 1. Move the formula footnote into WHAT'S HAPPENING; on screen say "each box waits a little longer than the one before". (S) 2. "GRATING" → "EXTRA BEAMS". (S) |
| Hobbyist | Niche. |

## Module 14 · ECHO LABORATORY (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 14/16 |
| First look | (text-only) Large room (CANYON preset, 60 × 30 m, ROCK walls), an echo timeline with stems (amber fuse <50 ms, red = echo); readouts DIRECT · GAP · 1ST REFL ECHO · FAR WALL. |
| Overwhelm | 3. |
| Knows what it is learning? | Yes: under about 50 ms a reflection blends; later and loud enough, it is an echo. Plainly written. |
| Knows what to do first? | Yes: ROOM → GYM, then CANYON. Room presets are a perfect beginner control. |
| Words they would not know | discrete, Haas, precedence (appears only in the check), integration threshold. |
| Follows / continues? | Yes. |
| What works | Named room presets (GYM, CANYON); the timeline's colour key explained in words. |
| Suggestions | 1. Name "precedence (Haas)" in the text before the check uses it, or use plain words in the check. (S) |
| Hobbyist | Good. |

## Module 15 · REVERBERATION LABORATORY (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 15/16 |
| First look | (text-only) Room plan with one fiberglass wall, a decay graph (0 to −60, 1 s, 2 s, "RT60 0.89 s"), a buildup timeline; readouts RT 125 · RT 500 · RT 2K · GAP. |
| Overwhelm | 3. |
| Knows what it is learning? | Partly. RT60 has been used since Module 2 and is still not defined in plain words here ("time for a sound to fade by 60 dB, about to silence"). |
| Knows what to do first? | Yes: ABSORB 0/4 → 4/4. |
| Words they would not know | RT60, Sabine, early reflections, diffuse field, tail. |
| Follows / continues? | Yes; the check (same RT60, different sound) is thoughtful. |
| What works | ABSORB as "how many walls are fiberglass" (1/4 … 4/4) is a concrete, beginner-sized control. |
| Suggestions | 1. Define RT60 at the top of this module (and link back from Module 2). (S) |
| Hobbyist | Good. |

## Module 16 · ROOM BUILDER (text-only)
| Field | What |
|---|---|
| Page | WaveLab · 16/16 (top button becomes FINISH ›) |
| First look | (text-only) A 12 × 8 m drywall room with "THROUGH −33 dB" on each wall (what leaks outside), readouts ROOM · LVL @ 500 Hz · 1ST ARR · RT60, five dock keys (FREQ, ROOM, LAYERS, WALLS, SRC). |
| Overwhelm | 5 for a beginner, 3 for someone who did the 15 modules. |
| Knows what it is learning? | Yes: "trace a problem at a seat back to its cause". |
| Knows what to do first? | Yes: the intro and WHAT TO TRY give three concrete recipes (build a cardioid, find a comb, meet your room modes). |
| Words they would not know | mass law, TL, flanking, plus everything above. |
| Follows / continues? | Yes. |
| What works | **The three CAPSTONE checks** ("one seat booms at 63 Hz only — which mechanism?") are the best assessment design in my seven labs: they test diagnosis, not recall. The full COMMON MISTAKES recap. |
| Suggestions | 1. Put the capstones on their own short "Diagnose it" page after Room Builder so they are not buried under the sandbox. (M) 2. Hide the mass-law formula footnote. (S) |
| Hobbyist | The page they would return to. |

## What's left
| Field | What |
|---|---|
| Page | WaveLab · FINISH › → WHAT'S LEFT |
| First look | "LAB COMPLETE · Every module is credited · ✓ 16 CREDITED". |
| Overwhelm | 1. |
| Knows what to do first? | Yes. |
| Words they would not know | "credited". |
| Follows / continues? | Yes. |
| What works | Same as other labs. |
| Suggestions | 1. Credit for visiting: I answered no CHECK YOURSELF here and still got 16 credited (same pattern as Foundations and Mic). (M, SHARED) 2. Suggest Room Design & Monitoring next. (S, SHARED) |
| Hobbyist | Fine. |

---

## Lab verdict — Wave Physics Laboratory

**Beginner's journey.** The home page is a calm list, but its 15 titles are physics terms with no grouping. Each module then opens a good one-paragraph intro card, followed by a page written for an acoustics student: a room plan with unlabelled source and listener icons, a readout strip of abbreviations (α, MIN ƒ, FRESNEL N, Δt/BOX), two or three essays, a numbers table, a model footnote in capitals and four common mistakes. The beginner can usually do the one requested action and see a readout change (NULL, VERDICT NODE, DOWN — SOUND CARRIES, ECHO), and the headlines are memorable ("you cannot EQ a comb away, but you can MOVE it away"). But by Module 5 they are reading only the intro cards. The capstone diagnosis questions at the end are excellent, though a beginner arriving there has not really built the vocabulary.

**3 biggest orientation problems**
1. Every module is expert-depth text with abbreviation readouts (W-A, W-C); the beginner-sized content is only the intro card.
2. The drawing does not say which icon is the source and which is the listener (every module asks you to drag one), and carries unexplained labels ("RING GAP > λ", "OPENING", LAYERS codes).
3. Defaults or terms that contradict the page's lesson or arrive before being defined: drywall default in "WHY BASS SURVIVES"; RT60 used from Module 2 but explained in 15; "precedence (Haas)" and "DSP latency" tested without being taught on the page.

**3 best things**
1. One room model behind every module, ending in a Room Builder with three concrete recipes.
2. Word verdicts in the readouts (NULL, NODE, ECHO, DOWN — SOUND CARRIES) and named presets (GYM, CANYON, WRONG WAY).
3. Real-world hooks and the capstone diagnosis checks.

**First 30 seconds rewrite.** Home: "Sound in rooms, in 4 parts: walls (1–3), bending and adding (4–8), speakers (9–13), echo and reverb (14–15). Each module = one room, one thing to try, about 3 minutes." Module 1 opens with only SPEAKER, YOU (labelled, "drag me") and two rays (direct + one bounce), readouts in words ("ARRIVES DIRECT 10.9 ms · BOUNCE ARRIVES 19.9 ms, 5 dB quieter"). The essays, tables and model notes sit behind a "Go deeper" fold.
