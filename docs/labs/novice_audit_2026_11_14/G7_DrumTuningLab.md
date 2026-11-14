# G7 · DrumTuningLab (Drum Tuning Lab, 7 chapters / 36 steps) — beginner orientation audit

Walked 2026-11-14 at 390 x 844 (the pane width changed several times mid-walk and cleared the phone size; I reset it each time and relied on page text where a screenshot came out at desktop width), sound OFF. Preview: `http://localhost:8142/#labpreview/DrumTuningLab`.
Structure (source `DrumTuningLabScreen.tsx`, `modules/index.ts`): 7 chapters, each a run of steps LEARN → HEAR → ADJUST → PRACTICE → REVIEW; step counts 7 / 6 / 4 / 5 / 6 / 4 / 4 = 36 steps.
**Coverage:** the first pass walked Chapter 1 in full and the first step of Chapters 2–7; a SECOND PASS (after the verdict, below) walked every remaining step on screen, so all 36 steps + WHAT'S LEFT are covered. No STRIKE/TAP was heard (sound off).
On open: term card "Drum Tuning" (plain, good) → intro card. No Sound Safety popup on open. Each step has its own intro popup.

## Frame findings for this lab (D1–D4)
- **D1 (M) Four names for one place, and two "STEP" counters.** The stepper says "MODULE 1 · STEP 3 / 7" (source comment intends "CHAPTER 3 · STEP 2 / 4"); the page says "CHAPTER 1 · Learn the parts…"; the header title says "HOW A DRUM MAKES SOUND"; the intro says "LEARN · THE DRUM AS A SYSTEM"; the screen reader label says "Module 2 of 7, step 1 of 6". Chapter 1 has 7 steps and the lab has 7 chapters, so "STEP 3 / 7" is easily read as "chapter 3 of 7". In Chapter 3 the display ALSO has its own "STEP 1 / 7" readout (the 7 steps of the tuning method) while the stepper says "STEP 1 / 4" — two different "steps" on one screen. Suggest: stepper "Chapter 1 · Learn" with the step as dots (● ○ ○ ○), and rename the method's readout "METHOD 1 of 7" or "STAGE".
- **D2 (keep, adopt elsewhere)** "YOU ARE LOOKING AT: …" under every display ("a tom cut in half, side on — batter head on top, resonant head below"; "the drum from above; the coloured wedges are each rod's pitch (blue low, yellow even, red high)"). This is the best picture-caption device in my whole group — it tells a beginner how to read the picture before anything else. Every lab with a rack display should have it (SHARED suggestion).
- **D3 (keep)** The REVIEW step: YOUR RUN (what you did / didn't do: "You have not turned a rod yet — the ADJUST step is worth a visit"), SAY IT BEFORE YOU READ IT recall cards, KEY IDEAS, KEY TERMS (plain definitions), TAKEAWAY, and "TO EARN CREDIT · Reach the right answer on each of the four PRACTICE decisions." This solves exactly the "what counts as done?" problem I found in TuningLab.
- **D4 (S)** Every one of the 36 steps opens with an intro popup — about 36 GOT IT taps for a full run. After Chapter 1, put WHERE TO START inline (the "Ride PART…" line already does this) and skip the popup.

## Ch 1 · How a drum makes sound (7 steps, all walked)
| Step | First look / what happens | Overwhelm | Words they would not know | Notes and suggestions |
|---|---|---|---|---|
| 1 LEARN · parts | A cut-away tom with labels (batter head, resonant head, lug, rod, hoop, bearing edge, shell, enclosed air); riding PART lights each part and shows its card. | 2 | lug, rod, hoop, bearing edge, resonant head | Excellent first page: one control, one picture, one card. Keep. |
| 2 LEARN · tension and pitch | Bars on a log Hz axis labelled (0,1), (1,1), (1,2); readouts TENSION / PITCH 233 Hz / NOTE A♯3 −4¢ / 1ST OVERTONE. | 3 | (0,1) mode labels, overtone, square root, N/m (fader shows "3000 N/m"), harmonic series | "YOU ARE LOOKING AT: the notes one head makes, lowest on the left; the tall bar is the pitch you hear." saves it. (S) Hide mode labels (0,1)/(1,1) and N/m for beginners. The idea "tuning to an exact note is OPTIONAL" is liberating — keep it prominent. |
| 3 LEARN · shell and bearing edge | Cross-section of the shell top with the head draped over; EDGE 45° DOUBLE, CONTACT SMALL. | 2 | bearing edge, profile, seating, inboard | Says "Chapter 2 looks for it" while the stepper calls chapters "MODULE" (D1). |
| 4 HEAR · four qualities | A loudness-over-time strip with "T60 ≈ 1.72 s"; readouts PITCH / SUSTAIN / BEND +35 ¢ / OVERTONES 2 %. Badge: "SYNTHESIZED · additive membrane model computed before playback, envelope measured and T60 estimated from that sound, uncalibrated output". | 3 | T60, dB, 60 dB fall, bend, cents, additive membrane model | The badge is the hardest sentence on the page (SHARED F5). (S) "SUSTAIN = how long it rings" is in the text; put it on the readout. Sound off: this whole step is about listening. |
| 5 ADJUST · turn one rod | The drum from above with six coloured wedges; ROD 1/6, TURN, LUG PITCH, SPREAD, BEAT. | 3 | spread, beat/beating, warble, tap point | Strong, game-like. "beat as a slow warble" explained in words. (S) "BEAT none" would read better as "WARBLE: none". |
| 6 PRACTICE · four decision cards | "You tighten one tension rod a quarter turn. What changes?" | 2 | — | Message clash: "Your FIRST answer on each card is the one remembered" and "a retry is… never penalized" in one sentence. A beginner hears "my first answer is recorded against me". (S) Say "We keep your first answer to show you how you did; keep trying until you find the right one — it still counts." |
| 7 REVIEW | YOUR RUN, recall cards, KEY IDEAS, KEY TERMS, TAKEAWAY, TO EARN CREDIT, NEXT: PREPARE BEFORE TUNING ›. | 2 | — | Model end-of-chapter page (D3). "0 of 4 decisions right" is an N-of-total counter (owner rule). |

## Ch 2 · Prepare before tuning (step 1 of 6 walked)
| Field | Finding |
|---|---|
| First look | The drum drawn to size from above with six numbered lugs; DRUM RACK · SIZE 12" × 8" · LUGS 6 · RESPONDS 130–260 Hz. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: "Before a rod turns, know what you are tuning and for what." |
| Knows what to do first? | Yes: "Ride DRUM." Steps SNARE / RACK / FLOOR / KICK resize the drawing. |
| Words they would not know | RESPONDS (band), two-ply, damping, batter. |
| What works | "Decide first; the method is the same." — a reason to care and a plan. |
| Suggestions | (S) RESPONDS → "SOUNDS GOOD AROUND 130–260 Hz". |

## Ch 3 · The basic tuning method (step 1 of 4 walked)
| Field | Finding |
|---|---|
| First look | A floor tom from above with 8 lugs, "STEP 1 · SEAT THE HEAD AND HOOP EVENLY", readouts STEP 1 / 7 · DO SEAT · HEAD BATTER. |
| Overwhelm | 3 — mainly from the two STEP counters (D1). |
| Knows what it is learning? | Yes: "Tune a head until it's even". |
| Knows what to do first? | Yes ("Ride STEP"). |
| Words they would not know | cross-threaded, collar, lug insert. |
| What works | The CAUTION card in plain words ("Use a drum key and your fingers, not a wrench or pliers… if the pitch stops rising as you turn, stop") — practical safety for real gear. |
| Suggestions | (M) D1 rename. |

## Ch 4 · Tuning the whole drum (step 1 of 5 walked)
| Field | Finding |
|---|---|
| First look | No display; a long text page "TWO HEADS, ONE INSTRUMENT" with three relationships (resonant higher / equal / batter higher) and "None of these is the correct one". |
| Overwhelm | 3 — about 350 words of reading with one figure. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Partly ("Tap THE AIR figure to see it full screen… guess which one will ring longest"). |
| Words they would not know | mode, pitch bend, resonant head, focused/open/growl (described — good). |
| Suggestions | (M) Turn the three relationships into a three-chip picker with a small picture of each (two heads, arrows showing which is higher) and one line each; move "None of these is the correct one" to a one-line footer. The next step (HEAR) lets them compare — say so at the top. |

## Ch 5 · Tuning each drum type (step 1 of 6 walked: snare)
| Field | Finding |
|---|---|
| First look | Snare side view with wires and strainer, "S +400 ¢ vs B"; readouts BATTER 230 Hz · SNARE SIDE 290 Hz · STRAINER 50 % · SUSTAIN. |
| Overwhelm | 3 — four faders (STRAINER, BOTTOM, BATTER, STROKE). |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes ("Ride STRAINER and strike softly, then hard"). |
| Words they would not know | strainer, butt plate, snare-side head, ghost notes, mil, snare beds, "+400 ¢". |
| Suggestions | (S) Show the bottom head as "higher than the top by about a third/fourth" instead of "+400 ¢" for beginners. |

## Ch 6 · Tuning a kit (step 1 of 4 walked)
| Field | Finding |
|---|---|
| First look | Text cards TUNING AS A SET (range, separation, context, recheck, write it down). |
| Overwhelm | 2. |
| Knows what to do first? | Partly: intro says "hum two notes a third apart, then two a fifth apart" — a beginner cannot hum "a third" on request. |
| Suggestions | (S) Give a song anchor for a third and a fifth, or a ▶ to play them. |

## Ch 7 · Advanced tuning and troubleshooting (step 1 of 4 walked)
| Field | Finding |
|---|---|
| First look | A SYMPTOM → WHERE TO LOOK table (uneven/warbling, choked, excessive ring, weak snare, won't hold tuning). |
| Overwhelm | 2 — a table is easy to scan. |
| Knows what it is learning? | Yes: "LISTEN → say WHERE you think it is → then FIX, and strike again." |
| What works | Symptom table in a drummer's own words; "Tuning by ear… is the skill everything else supports" — good values. |
| Suggestions | (S) Make each symptom row tappable to jump to the chapter that teaches it. |

## Lab verdict — DrumTuningLab

**Beginner's journey:** This is the most beginner-friendly "real-world skill" lab in my group. Every display is explained by a "YOU ARE LOOKING AT" line, the first page has one control and one picture, and each chapter ends with a REVIEW that says what you did, what to remember and exactly what earns credit. The main stumbling blocks are navigational, not conceptual: the stepper says MODULE where the page says CHAPTER, "STEP 3 / 7" looks like "chapter 3 of 7", and Chapter 3 shows two different step counters at once. Some steps (Ch 4's head relationships) are long reading with little to touch, and the HEAR steps need sound.

**3 biggest orientation problems**
1. Naming and counting in the stepper (MODULE vs CHAPTER; two STEP counters).
2. An intro popup on every one of 36 steps.
3. Text-heavy steps (Ch 4 step 1) and jargon badges (the "SYNTHESIZED · additive membrane model…" line).

**3 best things**
1. "YOU ARE LOOKING AT:" captions.
2. REVIEW pages with YOUR RUN and an explicit TO EARN CREDIT line.
3. Practical, safe, plain-language guidance (CAUTION card; "tuning to an exact note is optional").

**First 30 seconds rewrite:** Term card (as now) → page: "Chapter 1 · Learn — How a drum makes sound. YOU ARE LOOKING AT: a tom cut in half. Slide PART to light up each piece." Stepper shows "Chapter 1 of 7 · ● ○ ○ ○ ○ ○ ○" with no popup.

---
# SECOND PASS — every remaining step walked on screen (coordinator: no depth cut for time)

## Ch 2 · Prepare before tuning — steps 2–6
| Step | What a beginner meets / does | Overwhelm | Notes and suggestions |
|---|---|---|---|
| 1 LEARN · identify drum and goal (re-done hands-on) | Riding DRUM to the end redraws the drum as KICK 22" × 16", 8 lugs, RESPONDS 45–90 Hz. | 2 | Clear, immediate. |
| 2 LEARN · inspect the hardware | The cut-away tom again with a "BEFORE TUNING, LOOK — TAP A PART" chip row (RODS, LUGS, HOOPS, HEAD, EDGE); each chip shows one short card ("Each turns freely, none bent…"). | 2 | Good, short cards. The intro popup arrived about a second AFTER the page and swallowed my first chip tap. (S) Show the popup before the page is tappable, or not at all. |
| 3 LEARN · seat and tension a new head | Drum from above with lugs numbered in star order; readouts LUGS 8 · STEP 1/8 · THIS ROD #1 · NEXT #5; ▶ RUN animates the order. | 3 | Second "STEP" counter on screen (stepper says STEP 3/6, display says STEP 1/8) — D1 again. The CAUTION card repeats verbatim from Ch 1/3; fine for safety. (S) Rename the display readout "ROUND 1/8" or "ROD ORDER". |
| 4 HEAR · start from a known condition | Head colour map with numbers; APPROACH EVEN STEPS / RANDOM; STEP 0/8; SPREAD; PITCH. "YOU ARE LOOKING AT" here is 55 words long. | 3 | Riding STEP to 8 worked (the REVIEW later said "you took it to step 8 of 8 on EVEN STEPS; SPREAD reads 0 ¢"). Without sound, the "warble" of RANDOM is only visible as a mottled map — that does work. (S) Cut the caption to one sentence. |
| 5 PRACTICE · preparation checklist | An inspection game: a snare with 1–3 hidden faults; ride INSPECT around 13 spots (HEAD, ROD 1–10, EDGE, MAP), tick faults, then ✓ REVEAL KEY. | 3 | Very good real-world task. Two orientation problems: (a) ✓ REVEAL KEY is available after looking at only 1 of 13 spots; I ticked the one fault I had seen and revealed: "2 of 4 right — no credit yet", with "Needed:" on faults I had never been shown ("A fault is drawn only where you have looked"). A beginner feels tricked. (b) "2 of 4 right" counts correctly UN-ticked lines as "right", so it does not match what they did (1 tick). Suggest: (M) keep REVEAL KEY dimmed until every spot has been walked ("walked 13 of 13"), and phrase the result as "You found 1 of 2 faults; 1 was hiding at a rod you didn't check." |
| 6 REVIEW | YOUR RUN ("Checklist: 1 drum revealed — 2/4 — none perfect yet. Known condition: you took it to step 8 of 8…"), SAY IT cards, KEY IDEAS, KEY TERMS (seating, cross-pattern, known condition), TAKEAWAY ("Most 'tuning problems' are preparation problems"), TO EARN CREDIT. | 2 | Excellent, as in Ch 1. |

## Ch 3 · The basic tuning method — steps 1–4
| Step | What a beginner meets / does | Overwhelm | Notes and suggestions |
|---|---|---|---|
| 1 LEARN · the seven steps (re-done hands-on) | Riding STEP walks "STEP 4 · TAP NEAR EACH LUG" etc.; the stepper meanwhile says STEP 1/4. | 3 | D1 at its worst: "STEP 4/7" inside the display while the nav reads "STEP 1/4". |
| 2 HEAR · tap near each lug | Head with its colour map hidden; LUG 1/8 · TAPPED 0/8 · LUG PITCH "listen" · SPREAD hidden; ▶ TAP, ◉ REVEAL MAP. | 3 | Good design: "Tap every lug first — 0 of 8 so far. The map comes after the ear." (this is exactly the listen-before-answer gate EarTrainingLab lacks). **Sound-off dead end:** ▶ TAP opens the Sound Safety warning; with KEEP SOUND OFF the tap is not counted (TAPPED stays 0/8), so REVEAL MAP never opens and the step cannot be finished without sound. (M) Offer a sound-off path: "Can't listen now? SHOW THE MAP" (no credit), so the picture still teaches. |
| 3 ADJUST · tune the head | Head map, drum key on the chosen rod; readouts LUG · THIS RUN · LUG PITCH 233 Hz · SPREAD 224 ¢ · HEAD BATTER; coaching line "Rod 3 is the highest (+84 ¢): loosen it about ¼ turn. Rod 1 is the lowest (−140 ¢): tighten it about ¼ turn."; ▶ SHOW ME A MOVE (2 left). | 3 | Excellent guided-then-independent design (two shown moves, then you). SHOW ME A MOVE works sound-off: rod 1's wedge changes colour and the text explains "its wedge goes −140 ¢ → −87 ¢ and SPREAD goes 224 → 222 ¢". But the headline number barely moves (224 → 222) after a big improvement, because SPREAD is highest-minus-lowest and the highest rod hasn't moved yet. A beginner reads "almost nothing happened". (S) Add "Worst lug: −140 → −87 ¢" beside SPREAD, or explain "SPREAD drops once BOTH extremes come in". |
| 4 REVIEW | YOUR RUN (Batter 224 → 222 ¢ in 1 move — not yet even; Resonant 145 → 145 ¢; "Tap around the head: the map is still hidden — go back and tap every lug"), SAY IT cards, KEY IDEAS ("The stroke from the seat is the judge; the lug taps are the diagnosis"), KEY TERMS, TO EARN CREDIT (every lug within 10 cents). | 2 | YOUR RUN remembers exactly what I did and what is missing — the best progress feedback in my group. |

## Ch 4 · Tuning the whole drum — steps 2–5
| Step | What a beginner meets / does | Overwhelm | Notes and suggestions |
|---|---|---|---|
| 2 HEAR · compare head relationships | Decay graph ("T60 ≈ 2.25 s", "green = gone"), readouts BATTER · RESO · REL "+0.0 st" · SUSTAIN · LATE SOUND; SET tray with three word buttons (Resonant higher than batter / Both heads equal / Batter higher than resonant). | 3 | Choosing "Resonant higher" with sound off still redraws: RESO 226 Hz, REL +3.0 st, SUSTAIN 2.25 → 1.44 s, LATE SOUND +88 ¢ — so the comparison is visible without sound. But credit needs ▶ STRIKE ("HEARD 0 OF 3 RELATIONSHIPS"), which needs sound. Words: the Credit line says "RESO ↑, EQUAL, BATTER ↑" while the tray buttons use full sentences — two names for the same choices. "st" (semitones) is never spelled out. (S) Use the same labels in both places; gloss "st = semitone (one piano key)". |
| 3 LEARN · why the same tuning sounds different | Four text cards (Size, Construction, Head choice, Playing style). | 2 | No picture; reads like a magazine sidebar. Fine as reading; "die-cast vs triple-flanged hoops", "two-ply" unexplained. |
| 4 PRACTICE · three decisions | "Which batter/resonant relationship is the correct one?" | 2 | A wrong pick gives "✗ 'Both heads equal' is not the best fit here. Choose again; the full explanation appears with the option that fits." — hint first, explanation after the right pick. This is the behaviour I recommended for the LabShell CHECK pages (F8); keep it. |
| 5 REVIEW | YOUR RUN ("No relationship heard yet. Which rang longest: not answered yet."), SAY IT cards, KEY TERMS (coupling, sustain, relationship), TO EARN CREDIT. | 2 | Same strong pattern. |

## Ch 5 · Tuning each drum type — steps 2–6
| Step | What a beginner meets / does | Overwhelm | Notes and suggestions |
|---|---|---|---|
| 2 LEARN · toms | Three text cards (each head even then the relationship; a progression across the kit; don't force a drum out of range). | 2 | No picture. "chokes thin and pingy… the head wrinkles and flaps" — vivid. (S) A tiny 3-tom picture with pitch arrows would help. |
| 3 LEARN · bass drum | Kick side view (pillow, port, batter, front head, beater, pedal); readouts FRONT PORTED · PILLOW 40 % · BATTER 60 Hz · SUSTAIN 0.18 s; 4-key dock + STRIKE. | 3 | Good labelled drawing; "YOU ARE LOOKING AT… pedal on the right". "a beater… felt gives a thump, plastic or wood a click — this model plays the click" — honest. |
| 4 PRACTICE · tune a drum for a sound | Decay graph with a shaded goal zone ("goal: died away by here"); GOAL SHORT · PITCH · SUSTAIN · BEND · MET 0/4; dock BATTER / RESO / DAMPING / GOAL / STRIKE / ✓ CHECK. | 3 | Works fully sound-off: ✓ CHECK before changing anything says "Not yet. You have not changed anything yet. The goal has to be reached, not found — move BATTER, RESO or DAMPING toward it"; raising DAMPING to 100 % and CHECK gives "Goal met. Sustain 0.36 s — short. Upper partials controlled." and MET 1/4. Clear, encouraging feedback. Copy mismatch: intro says "Pick GOAL BEND with the rack tom" while the page opens on GOAL SHORT. |
| 5 PRACTICE · three decisions | "Soft strokes on the snare produce no wire sound. Where do you look first?" | 2 | Practical. |
| 6 REVIEW | YOUR RUN ("Goals met: SHORT. Not yet: OPEN, LOW, BEND (2 checks)"), KEY TERMS (snare-side head, strainer, port, damping), TRY NEXT ("…the resonant head 4 st away" — st again). | 2 | YOUR RUN reflected exactly what I did. |

## Ch 6 · Tuning a kit — steps 2–4
| Step | What a beginner meets / does | Overwhelm | Notes and suggestions |
|---|---|---|---|
| 2 ADJUST · build the tom range | Two tom drawings with pitch tags, a vertical pitch ladder (80–300 Hz) with a bracket "2.3 st"; readouts RACK 140 Hz · FLOOR 160 Hz · INTERVAL −2.3 st · VERDICT UNBALANCED. "The kit starts upside down (floor tom tuned above the rack)." | 3 | A puzzle start — good motivation. Dragging FLOOR down gave INTERVAL 9.3 st and still UNBALANCED (too wide / out of band) — the verdict word does not say WHICH rule failed this time; the "upside down" sentence had explained the first one. (S) Always show the reason next to the verdict ("too wide — over 9 st"). "st" again unexplained. Credit needs ▶ BOTH (sound). |
| 3 PRACTICE · save tuning notes | NAME and NOTE fields, prefilled note ("rack tom 140 Hz (C♯3 +18¢) · floor tom 82 Hz (E2 −9¢)…"), SAVE THIS SETUP. | 2 | A real-world habit (write it down). I did NOT press SAVE (it writes saved data on the device; the brief limits changes to normal taps and this is a form save). |
| 4 REVIEW | YOUR RUN ("Rack 140 / floor 82 Hz — 9.3 st, UNBALANCED, ▶ BOTH not heard yet. Tuning notes on this device: 0."), KEY TERMS (pitch progression, useful range, tuning notes). | 2 | Same strong pattern. |

## Ch 7 · Advanced tuning and troubleshooting — steps 2–4
| Step | What a beginner meets / does | Overwhelm | Notes and suggestions |
|---|---|---|---|
| 2 PRACTICE · diagnose the symptom | A rack tom with a hidden fault; CASE WARBLE; readouts SPREAD 226 ¢ · BEAT 8.4 Hz · SUSTAIN 1.59 s · FAULT STILL; "Step 1 · LISTEN… Tap at least 3 lugs"; "cleared 0 of 5". | 3 | A real diagnostic game (LISTEN → name the area → FIX). **Sound-off dead end:** the first required action is ▶ STRIKE / ▶ TAP, which needs sound (TAP opens the Sound Safety warning and, kept off, does not count), so the diagnosis cannot begin. The readouts (SPREAD, BEAT) are already visible evidence — (M) let a sound-off learner proceed on the readouts alone ("Can't listen? Use the readouts as your evidence"). |
| 3 PRACTICE · two decisions | "A tuning device reads every lug at the same number but the drum still sounds wrong. What now?" | 2 | Good values ("the device measures one thing; the sound is the judgment"). |
| 4 REVIEW → FINISH | YOUR RUN ("Cleared 0 of 5; first hypothesis right on 0 of 0 named"), KEY TERMS (warble, choke, pitch reference), TO EARN CREDIT, FINISH · SEE WHAT'S LEFT ›. | 2 | "first hypothesis right on 0 of 0 named" is awkward for a learner who never started — say "You haven't named a cause yet." |

## WHAT'S LEFT (after FINISH)
Lists all 7 chapters, and UNDER EACH ONE the exact thing still needed ("Bring the practice head to EVEN (every lug within 10 cents) on the TUNE THE HEAD step", "Bring the rack and floor tom to a DISTINCT interval…"). This is the best end page in my group and the direct fix for TuningLab's "14 chapters not done yet" with no reason given. Its intro mentions "REVIEW ▾ to see the chapters marked ✓ DONE" — no chapter was done in my run, so I could not see it.

## Second-pass additions to the lab verdict
- **Sound-off dead ends (new, M):** Ch 3 step 2 (tap each lug before the map) and Ch 7 step 2 (diagnose) cannot be started without sound; Ch 4 step 2 and Ch 6 step 2 can be explored but not credited. Other steps (Ch 2 inspection, Ch 3 SHOW ME A MOVE, Ch 5 goal practice) work fully sound-off — Ch 5's goal practice even lets you meet a goal with CHECK alone. Suggest one consistent rule: every listening step gets a "can't listen now" path that teaches from the picture (credit can still require listening).
- **Best in group, confirmed:** YOUR RUN + TO EARN CREDIT + a WHAT'S LEFT page that names the missing task per chapter.
- **Hint-first practice cards** ("not the best fit here. Choose again; the full explanation appears with the option that fits") — the model for the LabShell CHECK pages (F8).
- **Remaining issues confirmed on every chapter:** the double STEP counter (D1) recurs in Ch 2 step 3 (ROD ORDER "STEP 1/8") and Ch 3 step 1 (METHOD "STEP 4/7"); "st" never spelled out (Ch 4, 5, 6); intro popups on every step (D4), several of which arrive a second late and swallow the first tap.
- Page count for this lab is now: Ch 1 (7) + Ch 2 (6) + Ch 3 (4) + Ch 4 (5) + Ch 5 (6) + Ch 6 (4) + Ch 7 (4) = 36 steps + WHAT'S LEFT = 37 pages, all walked on screen.
