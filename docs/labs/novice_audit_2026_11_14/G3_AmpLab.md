# G3 · AmpLab (Amplifier Principles Lab): beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound off, tab-7, `http://localhost:8142/#labpreview/AmpLab` (home), then START · MODULE 1 › into `AmpModule` 1-8. Rack Unit layout on every module: a pinned live display with readouts, ▴ HIDE DISPLAY / ⤢ FULL SCREEN, a text well, faders and ▸ pickers in the dock. Modules 2, 3, 5, 7 and 8 have STEPS (the strip then reads "MODULE 3 · STEP 1 / 3"). Nothing in this lab needs sound.

Depth note (honest): the Browser pane was hidden for most of this lab, so screenshots failed and I judged layout from the page text and the accessibility tree; I moved faders and pickers only where named below. Every module and every step was opened and read.

Shared things:
- Header shows "Module 1 of 8" under the title AND the strip shows "MODULE 1 / 8", with two ⓘ icons side by side in the header. Duplicate cues; a beginner does not know which ⓘ to press.
- With the screen-guide card open, the first tap on the strip's NEXT › only closes the card; a second tap moves on (same as the other labs: SHARED).
- Every module ends with CHECK YOURSELF (3 questions), TAKEAWAY, MARK COMPLETE ›, and the reassurance "a wrong pick is fine; the explanation is the point. NEXT below still moves on". Excellent, consistent end-of-page pattern.
- The glossary card "Amplifier" on first open agrees with the lab (energy comes from the power supply). Good. But module 1 then says "An amplifier does not enlarge the input signal", while the card says it "boosts it" and the guide says it "builds a bigger copy". Three phrasings of the same idea on the first minute.

---

## Page 0 · Lab home · `#labpreview/AmpLab`
| Field | Finding |
|---|---|
| First look | Title, one paragraph ("One question runs through every module: what is the amplifier doing, what load does it see, and where does the extra output energy come from?"), "0 modules complete", a green START · MODULE 1 ›, a MODULE MAP of 8, then **the lab's final CHECK YOUR UNDERSTANDING with five questions**, a ⚠ safety note and RESET LAB PROGRESS. |
| Overwhelm | 3. The home is calm until the eye meets the final quiz ("+3 dB / +6 dB", "crossover distortion", "CLIP light stays dark") on the first screen of a lab they have not started. |
| Knows what it is learning? | Yes, the one-question frame is good. |
| Knows what to do first? | Yes: START · MODULE 1 › (the guide agrees). |
| Words they would not know | load, (in the quiz) dB, rails, crossover distortion, push-pull, zero crossing, 8 Ω. |
| Follows / continues? | Yes. |
| What works | The one-question frame; a clear START button; the module map. |
| Suggestions | 1. (M) Hide the five-question check on the home until at least one module is done (or collapse it under "Final check — after the modules"). Meeting the exam first says "you will fail this". 2. (S) Give each map row a one-line plain promise ("1 · Where the power really comes from"). |
| Hobbyist | Would happily try the quiz first to see what they know; a collapsed "Test yourself first" option would serve them. |

## Page 1 · Module 1 "What an amplifier actually does"
| Field | Finding |
|---|---|
| First look | A display with INPUT (signal) and OUTPUT (to load) waves, dashed "rail limit" lines, and five readouts: OUTPUT CLEAN · SUPPLY 57% · HEAT warm · EFFIC. 33% · LOAD 60%. |
| Overwhelm | 4. Five readouts, a functional-path diagram, a "Three kinds of gain" box with formulas (Av = Vout / Vin, 20·log10(ratio)), an APPLIED COMPARISON with P = 14.1² ÷ 8 = 25 W, and three checks. For an adult with no maths in years, formulas on page one are the "wants to leave" moment. |
| Knows what it is learning? | Yes: "The input signal steers; the power supply pays" (a great sentence). |
| Knows what to do first? | Yes: PREDICT, THEN TRY (Output keeps growing / Peaks flatten at the rails / Input gets quieter), then ride LEVEL. Predict-first is excellent learning design. I picked "Peaks flatten at the rails"; no words on the page confirmed the pick was recorded (the highlight could not be checked with screenshots off). |
| Words they would not know | rails, load, efficiency, drive, voltage / current / power gain, log10, resistive, reactive, Vpeak. |
| Follows / continues? | Yes, via the fader and the checks. |
| What works | Predict-then-try; the steer/pay sentence; "Line out → speaker" vs "Line out → power amp → speaker" comparison. |
| Suggestions | 1. (M) Move "Three kinds of gain" and the 25 W arithmetic into ▸ LEARN MORE; module 1 needs one idea (supply pays, input steers) and one experiment (push LEVEL until the peaks flatten). 2. (S) Show only OUTPUT and SUPPLY readouts in module 1; add HEAT / EFFIC. / LOAD in the modules that teach them. 3. (S) After the prediction, say "You predicted X. Now push LEVEL past 67% and see." 4. (S) Define "rail" at first sight: "rail = the highest voltage the power supply can give". |
| Hobbyist | Likes the clip demo; skips the formulas. |

## Page 2 · Module 2 "Transistors, tubes, and transformers" (2 steps)
| Field | Finding |
|---|---|
| First look | Step 1: a three-part control model (SUPPLY → ACTIVE DEVICE → LOAD, CONTROL INPUT 50%), readouts REGION CONTROL · CURRENT 50% · DEVICE GENERIC. Step 2: a transformer with PRIMARY Np 400 / SECONDARY Ns 200, readouts KIND STEP-DOWN · RATIO 2.00:1 · Vs 60.0 V · Is 2.00 A. |
| Overwhelm | 3 (step 1), 4 (step 2: Vp/Vs = Np/Ns, Ip × Vp = Is × Vs, impedance transformation, 70 V / 100 V systems). |
| Knows what it is learning? | Yes: "why a transistor or a tube can add power, and a transformer can't." Clear contrast. |
| Knows what to do first? | Yes: CONTROL fader (step 1), Np / Ns faders (step 2). |
| Words they would not know | active device, BJT / MOSFET, primary / secondary, turns, ratio, core, isolation, ground loops, switch-mode supply, 70 V / 100 V distributed audio. |
| Follows / continues? | Yes. "Pin 120 W · Pout 120 W ✓ never exceeds input" is a strong live proof. |
| What works | The live "Pout never exceeds Pin" line; the MYTH card "A transformer creates additional power"; REGION in words (OFF / CONTROL / FULL). |
| Suggestions | 1. (S) In step 2, lead with the plain sentence, formulas in a fold: "More turns on the output side = more volts but less current. Power stays the same." 2. (S) Explain "active device" with an everyday analogy once (a tap controlling a big pipe). |
| Hobbyist | The transformer myth is a good one. |

## Page 3 · Module 3 "Bias, conduction, and push-pull" (3 steps)
| Field | Finding |
|---|---|
| First look | Step 1 BIAS: input, gold device current, output; readouts REGION LINEAR · IDLE 50% · SUPPLY 55% · HEAT hot. Step 2 CONDUCTION ANGLE: ANGLE 360° · CLASS A. Step 3 PUSH-PULL: two device currents (gold solid, purple dashed), a ZERO-CROSSING ZOOM ×3.2 and "CROSSOVER NOTCH PRESENT · idle 1.0%". |
| Overwhelm | 3. One concept per step, which helps. |
| Knows what it is learning? | Yes. "YOUR TASK: raise the bias until the notch is gone — but stop before the excessive-heat region (idle current ≤ 8% relative)" in step 3 is the clearest task statement in the lab. |
| Knows what to do first? | Yes. |
| Words they would not know | bias, operating point, conduction angle, degrees of a cycle, Class A/B/C (used here before module 4 teaches them: "this is the trade Class A makes on purpose"), complementary devices, crossover distortion, dissipation. |
| Follows / continues? | Yes. |
| What works | The zoomed zero-crossing view (makes a tiny defect visible); "the region around zero belongs to nobody"; one task with a clear stop condition. |
| Suggestions | 1. (S) Avoid naming classes in step 1-2 before module 4, or add "(you'll meet Class A in module 4)". 2. (S) Step 2: show 360° as a pie or a clock sweep next to the wave, so "degrees of a cycle" is a picture. 3. (S) Cross-link TubeLab's bias module ("same idea in a tube ›"). |
| Hobbyist | Finally understands why amp makers talk about bias. |

## Page 4 · Module 4 "Amplifier class explorer"
| Field | Finding |
|---|---|
| First look | Display plus five readouts (CONDUCT. 360° · IDLE 100% · EFFIC. 16% · HEAT hot · DISTORT. CLEAN), a CLASS ▸ picker and LEVEL fader. Below: a SIDE BY SIDE table of five classes × up to eight rows ("Theoretical max 25% (series-fed) / 50% (transformer-coupled)…"). |
| Overwhelm | 4. The explorer is good; the table is a spec sheet, and Class G/H sits behind a further fold. |
| Knows what it is learning? | Yes: "each class is an operating arrangement… not a quality ranking". |
| Knows what to do first? | Yes: switch CLASS and compare EFFIC. and DISTORT. |
| Words they would not know | conduction, idle power, efficiency tendency, series-fed, transformer-coupled, tuned service, broadband, switching losses. |
| Follows / continues? | Yes. |
| What works | Same input, same load, only the class changes ("watch only the things that actually change"): a well-controlled comparison. The MYTH "Class A always sounds best". |
| Suggestions | 1. (M) Reduce SIDE BY SIDE to three plain rows per class (When is it on? · How hot? · Where used?) with the full eight behind "all eight" (it already has that; make three the default and drop the percentages from the default). 2. (S) A one-line memory hook per class: "A = always on, hot. B = takes turns, notch. AB = takes turns with overlap, the workhorse. D = switches, cool." |
| Hobbyist | The hook line would be what they remember. |

## Page 5 · Module 5 "Inside Class D" (2 steps)
| Field | Finding |
|---|---|
| First look | Step 1: a "SWITCHING WAVEFORM (comparator result) — two states only" with a triangle carrier; readouts AT TROUGH 15% · AT PEAK 85% · EFFIC. 83% · HEAT cool. Step 2: a half-bridge drawing (+RAIL, −RAIL, HIGH SIDE, LOW SIDE, L, C, LOAD) and a loss breakdown (supply 5.1%, Rds-on 4.3%…). |
| Overwhelm | 5. The most technical module: comparator, carrier, duty, PWM, dead time, Rds-on, gate drive, half-bridge, output filter. The paragraph on "Averaged over a whole audio cycle the duty is 50% at any level… the short-term average, swinging with the widths, is the audio" is hard even for hobbyists. |
| Knows what it is learning? | Partly: "Class D is not a bigger Class C, and it is not digital" lands; the mechanism does not. |
| Knows what to do first? | Yes: drop LEVEL from 70% to 10% and watch AT PEAK / AT TROUGH close in. |
| Words they would not know | PWM, comparator, carrier, duty, kilohertz, half-bridge, dead time, on-resistance, gate charge, topology. |
| Follows / continues? | Step 2 is titled "2 · THE SWITCHING STAGE" but also holds "3 · WHERE THE ENERGY GOES" while the strip says STEP 2 / 2: section and step numbers disagree. |
| What works | The MYTH "Class D means digital" with "The D is just the next letter"; the loss breakdown that moves with level ("at low output the fixed losses are most of what the supply pays for"). |
| Suggestions | 1. (M) Open with an analogy before the waveform: "Flick a light switch on and off very fast: how long it is on each time sets the average brightness. Class D does that with your music." 2. (S) Cut the 50%-duty paragraph to the fold. 3. (S) Align section numbers with step numbers. |
| Hobbyist | Owns Class D gear; wants the "is it digital?" answer and the heat point, not the half-bridge. |

## Page 6 · Module 6 "Power supplies, limits, and clipping"
| Field | Finding |
|---|---|
| First look | Readouts STATE CLEAN · RAILS ±38 V · OUTPUT 17.7 V · CURRENT 2.2 A · POWER 39 W, a chain diagram (AC IN → TRANSFORMER → RECTIFIER → RESERVOIR → DC RAILS), and a dock with LEVEL, RAIL, LOAD ▸, SUPPLY ▸. |
| Overwhelm | 4. Real units arrive all at once (V, A, W, Ω, Vrms), plus three formulas. |
| Knows what it is learning? | Yes: "the rails set the limit". |
| Knows what to do first? | Yes: "Try it in this order: raise the input at 8 Ω until the peaks flatten; switch to 2 Ω…" (an ordered experiment). |
| Words they would not know | rails, sag, rectifier, reservoir, Vrms, √2, current limiting, protection, unregulated. |
| Follows / continues? | Yes. STATE in words (CLEAN, V-CLIP, I-LIMIT per the guide) makes outcomes readable. |
| What works | Numbered experiment order; different limits look different on the waveform; ⚠ BEFORE THE REAL-WORLD MODULE box. |
| Suggestions | 1. (S) Define Ω once ("ohms: how hard the speaker is to drive; fewer ohms = more current"). 2. (S) Put the three formulas in a fold. |
| Hobbyist | Useful for choosing an amp for 4 Ω speakers. |

## Page 7 · Module 7 "Real-world amplifier operation" (2 steps)
| Field | Finding |
|---|---|
| First look | Step 1: a gain chain SOURCE → MIXER / DSP → AMP INPUT → AMP OUTPUT (rails) → SPEAKER with "% of clip" per stage; readouts VERDICT HEALTHY · SOURCE 50% · MIXER 50% · AMP IN 50%. But before the task: a **12-bullet ⚠ SAFETY list**. |
| Overwhelm | 4 for step 1 (safety list first), 5 for step 2, which holds six sections in one step: speaker-load builder, power and current, bridged operation, watts and loudness, clipping and loudspeaker risk, a 7-rack inspection. |
| Knows what it is learning? | Yes: "who clips first?" and "AMP IN sets sensitivity, not watts". |
| Knows what to do first? | Yes (three faders, VERDICT). |
| Words they would not know | gain structure, headroom, sensitivity, attenuation, parallel / series, nominal impedance, bridge mode, power compression, sensitivity (speaker). |
| Follows / continues? | Step 1 yes. **Two percentages for one stage**: the display says "SOURCE 80% of clip" while the readout and fader say "SOURCE 50%"; a beginner cannot tell which number to trust. Step 2: likely quit point (very long). |
| What works | "Distortion happens at the FIRST stage that hits it, and nothing downstream can undo it." The speaker-load builder (+16 Ω / +8 Ω / +4 Ω, live total, "✓ Within the 4 Ω per-channel minimum"). The MYTH cards are well chosen (2× power ≠ 2× loudness). |
| Suggestions | 1. (S) Label the fader readout "fader 50%" and the display "level 80% of clip", or show one number. 2. (M) Split step 2 into three steps (LOAD · POWER & LOUDNESS · INSPECT); six sections in one step is a page of its own. 3. (S) Move the 12-bullet safety list to a ⚠ fold at the top with the three bullets that matter for this module (reduce levels before changing connections; never short outputs; protect hearing) visible. |
| Hobbyist | The gain-structure chain is the most useful page in the lab for them. |

## Page 8 · Module 8 "Diagnose and apply" (4 steps)
| Field | Finding |
|---|---|
| First look | Step 1: "OUTPUT — what is this amplifier doing?" with PICTURE 1 / 8 · SCORE 0 / 0 and eight answer chips (Clean output, Voltage clipping, Crossover distortion, Current limiting, Supply sag, Class D switching, Normal filtered Class D, Protection / mute). Step 2: choose a class for a job ("Battery-powered portable speaker…") and a MYTH REVIEW. Step 3: a misconfigured rig with ⚠ LOAD BELOW RATED MINIMUM and SCORE THIS CONFIGURATION. Step 4: a 12-item FINAL ASSESSMENT and a COMPLETION SUMMARY. |
| Overwhelm | 3-4. Eight answer chips for a waveform is a lot, but each was taught. |
| Knows what it is learning? | Yes: "Everything so far was practice. Now use it." |
| Knows what to do first? | Yes. The system challenge says exactly where the controls are ("SOURCE, MIXER and AMP IN are the faders below the display; mode, supply, load and ventilation are under SETUP"). |
| Words they would not know | damping factor and input sensitivity (final items 6-7; damping factor is taught only inside a fold in module 7, per `mod7RealWorld.tsx`). |
| Follows / continues? | Yes. "Score it as often as you like — every failing dimension tells you what to change" is a kind, clear loop. |
| What works | Diagnosis from pictures; job-based class choice (the right question for a beginner: "what does the brief need?"); a fault rig that explains itself; retake draws a new set. |
| Suggestions | 1. (S) In waveform diagnosis, offer the eight answers in two groups (CLEAN / CLIPPING-TYPE / OTHER) to cut scanning. 2. (S) Make sure every final-assessment term is visible outside folds earlier (damping factor). |
| Hobbyist | Good capstone. |

---

## AmpLab: overall verdict
The lab has a strong spine: one question ("where does the energy come from?"), predict-then-try, live displays with word readouts (CLEAN, V-CLIP, NOTCH, HEALTHY), and the same calm end to every module (three checks, a takeaway, "a wrong pick is fine"). A beginner who sticks with module 1's fader and module 3's notch task will genuinely understand clipping and bias. But it is written at a technician's level: formulas and real units appear from the first module, five readouts sit on the display before the learner knows what three of them mean, the home screen shows the final exam first, and modules 5 and 7 (step 2) are very long. A beginner likely finishes modules 1 and 3 with pleasure, struggles through 4-6, and stops in Class D.

**3 biggest orientation problems**
1. Maths and units too early: formulas on module 1, Vrms/√2/Ω/A on module 6, PWM duty on module 5, with no plain-language bridge before each.
2. Too many readouts and sections at once: five readouts on modules 1 and 4; module 7 step 2 with six sections; the five-class spec table.
3. First-impression ordering: the final quiz on the home screen; a 12-bullet safety list before module 7's task; class names used before module 4.

**3 best things**
1. "The input signal steers; the power supply pays" and predict-then-try on module 1.
2. Clear task statements with stop conditions (module 3: "raise the bias until the notch is gone — but stop before…") and word readouts that report the result.
3. The consistent, forgiving end-of-module pattern and the score-as-often-as-you-like system challenge.

**First 30 seconds, rewritten**
Home: one line, "An amplifier doesn't make your signal bigger by magic: the power supply pays, your signal steers. In 8 short modules you'll see it, push it, break it and fix it." A single START button; the module map below; the final check hidden until module 1 is done. Module 1 opens with one readout (OUTPUT CLEAN) and one prompt: "Guess first: what happens if you push the input past the supply's limit?" Formulas wait in LEARN MORE.

Source check (after the walk): `ampScreenGuides.ts` and the module files match what was on screen; `mod7RealWorld.tsx` holds the "Damping factor (simplified)" fold that the final assessment draws on.
