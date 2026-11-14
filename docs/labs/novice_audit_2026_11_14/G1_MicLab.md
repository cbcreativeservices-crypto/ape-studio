# G1 · Microphone Principles (MicLab) — beginner audit

Auditor G1, 2026-11-14, real app path `http://localhost:8142/` → OPEN LABS → EXPLORE FUNDAMENTALS → Microphone Principles (members lab; preview is a member, no lock). 390 x 844, sound OFF (this lab has no PLAY key).
10 modules, MODULE n / 10, each with its own intro card; first open also shows a "Microphone (Mic)" word card. Pages audited: 11 (10 modules + What's left).

Shared-frame notes F1–F6 from G1_FoundationsCourse.md apply here too (letterbox text well, repeated values, one intro card per module, readouts with long-press lessons nobody can discover). Mic-specific frame notes:
- **M-A. Captions with formulas.** Display captions carry maths a beginner cannot read: "r(θ) = |A + B·cosθ|, × 1/d distance falloff" (Modules 2 and 6), "e = B · l · v" (Module 1). (SHARED pattern with other labs' "ILLUSTRATIVE MODEL" captions)
- **M-B. "ⓘ GUIDED LESSON — every control long-presses for its own entry"** appears on every module. Good that it is said, but "long-press" is hidden-gesture knowledge and the line sits at the very bottom.
- **M-C. Colour meanings collide.** The Amplitude lab taught "red = more". Here red also means "wrong/bad" (FULL CUP, COLLAPSED) and "deaf direction" (PICKUP "NULL ≤ −26 dB" in red text), and blue means "the air blast" in PLOSIVES while a 100 % blast is shown blue. (SHARED: colour language)

---

## Module 1 · INSIDE THE CAPSULE
| Field | What |
|---|---|
| Page | MicLab · 1/10 |
| First look | A dense engineering cutaway with 15 labels (OUTPUT LUGS, REAR PORT + FELT, LEAD WIRES, FRONT SCREEN, COMPLIANT ROLL, DIAPHRAGM, POLE PIECE, MAGNETIC GAP, PHASE-SHIFT PASSAGE, POLE PLATE, HUMBUCKING COIL, VOICE COIL, BACK PLATE, MAGNET, HOUSING), glowing amber bits, and below it an equation "e = B · l · v". Thinks: "this is an engineering manual". |
| Overwhelm | 5. The very first page of a lab titled "Principles" is the most technical drawing in my seven labs. |
| Knows what it is learning? | Partly. The intro card is clear ("air pushes the diaphragm, the diaphragm moves a coil through a magnet, and the moving coil makes a voltage"). The page does not show that chain simply; it shows every part at once. |
| Knows what to do first? | No. "Watch the waves push the diaphragm, then follow one ⊗/⊙ mark as it flips" — the ⊗/⊙ marks are tiny and the sound waves are faint lines at the edge. There is no control; the beginner just scrolls. |
| Words they would not know | capsule, dynamic, voltage, induced current, ⊗/⊙, lugs, compliant roll, pole piece, humbucking, phase-shift passage, cardioid ("In a real cardioid…"), "180° behind the force", "connected load", velocity, e = B·l·v. |
| Follows / continues? | Many would tap NEXT immediately. There is no check on this page. |
| What works | "A dynamic mic is a tiny generator — a speaker run in reverse." is a superb one-line hook. The intro card's three-step chain is exactly right. |
| Suggestions | 1. **Move this module later** (after PICKUP PATTERNS / DISTANCE) or make it optional ("For the curious: inside the capsule"). Start the lab with something the learner can touch. (M) 2. Show 4 labels by default (DIAPHRAGM, VOICE COIL, MAGNET, OUTPUT) and reveal the other 11 with a "show all parts" toggle. (M) 3. Put the intro card's chain as numbered arrows ON the drawing (1 air → 2 diaphragm → 3 coil in magnet → 4 voltage out). (M) 4. Move "e = B·l·v" into WHAT'S HAPPENING; on the page say "faster coil = more voltage". (S) |
| Hobbyist | Interesting; they have never seen inside an SM58-style capsule. The full label set suits them. |

## Module 2 · PICKUP PATTERNS
| Field | What |
|---|---|
| Page | MicLab · 2/10 |
| First look | A coloured heat-map (red at the mic, yellow/green farther, black behind it), a microphone pointing up, a speaker icon with a green line to the mic, and a gold tag "DRAG THE SPEAKER — ANYWHERE". Inviting. |
| Overwhelm | 2. One picture, one obvious action. |
| Knows what it is learning? | Yes, after one drag: "the mic hears the front and is deaf behind". |
| Knows what to do first? | Yes. Dragging the speaker behind the mic turns PICKUP into "NULL ≤ −26 dB" and the speaker sits in the black zone. This is the best "aha" in the lab. |
| Words they would not know | cardioid, figure-8, omni, lobes, null, monitor wedge (used in the check and in the text; never pictured), proximity effect (named before its module), "10–20 dB down", r(θ) formula in the caption. |
| Follows / continues? | Yes. The check (where does the wedge go?) is fair if "monitor wedge" is understood. |
| What works | Direct manipulation of the source, with a live readout that switches to a word (NULL). The black "deaf" zone is unmistakable. |
| Suggestions | 1. Gloss "monitor wedge" the first time (a floor speaker pointing back at the performer) or draw one in the field. (S) 2. Show the NULL readout in a cool colour, not red. (S, M-C) 3. Drop the formula from the caption (M-A). (S) |
| Hobbyist | Knows cardioid; the heat-map is still the clearest picture of it they will have seen. |

## Module 3 · DISTANCE & THE ROOM
| Field | What |
|---|---|
| Page | MicLab · 3/10 |
| First look | A face on the left, a mic on the right, a colour field fading from red (mouth) to blue (room); two bars under the display (DIRECT SOUND / ROOM SOUND). |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: farther away = more room, less voice. The two bars crossing make it obvious. |
| Knows what to do first? | Yes: slide DISTANCE out; at 48 in DIRECT is 6 % and ROOM 94 %. |
| Words they would not know | "dB", "critical distance", "reverberant energy", "gain" (in the check's wrong answer), "in" (inches, while Foundations used metres). |
| Follows / continues? | Yes. Here CHECK YOURSELF comes before WHAT'S HAPPENING (in other modules it comes after). |
| What works | DIRECT vs ROOM as two plain bars; the readout "−21.6 dB vs 4 in" gives a reference point. |
| Suggestions | 1. Keep one unit system across the Fundamentals labs, or show both ("48 in · 1.2 m"). (S, SHARED) 2. Keep the order WHAT'S HAPPENING → CHECK YOURSELF the same on every module. (S) |
| Hobbyist | Useful; "critical distance" is new to many hobbyists. |

## Module 4 · PROXIMITY EFFECT
| Field | What |
|---|---|
| Page | MicLab · 4/10 |
| First look | Face on the left, mic on the right with a "GAP = 12 in · bass +0 dB" ruler, and a frequency graph below (dB up the side, Hz along the bottom). |
| Overwhelm | 3. The graph has two axes with units a beginner cannot read. |
| Knows what it is learning? | Yes after the drag: close mic = more bass (the curve's left end rises to +10 dB and the face glows). |
| Knows what to do first? | Partly. **The DISTANCE slider runs the opposite way to Module 3**: here dragging RIGHT moves the mic IN (12 in → 1 in); in Module 3 dragging RIGHT moved it OUT (17 → 48 in). My first drag (left, as in Module 3) did nothing visible because it was already at 12 in. |
| Words they would not know | low-shelf, high-pass filter, channel strip, "swallows the mic", large-diaphragm, dB, Hz. |
| Follows / continues? | Yes. |
| What works | The curve and the GAP ruler move together; BOOST reads in words ("NONE", "+10 dB"). "Radio-voice warmth IS this effect, used on purpose." gives a reason to care. |
| Suggestions | 1. Make DISTANCE run the same way in Modules 3 and 4 (right = farther, matching the number). (S) 2. Label the graph's axes in words: "bass ← → treble" and "louder ↑". (S, SHARED graph style) 3. Gloss "high-pass filter" (a control that cuts the lowest bass) where first used. It is half-glossed already. (S) |
| Hobbyist | Will try it immediately; knows the effect. |

## Module 5 · OFF-AXIS RESPONSE
| Field | What |
|---|---|
| Page | MicLab · 5/10 |
| First look | Face, an arrow, a mic; a frequency graph whose line is flat at 0. Readouts "@100 Hz 0.0 dB · @8 kHz 0.0 dB". |
| Overwhelm | 3. Readout labels "@100 Hz / @8 kHz" are cryptic. |
| Knows what it is learning? | Yes after PRESET 90°: the line drops, more on the right (−6 dB at 100 Hz, −9 dB at 8 kHz). "Quieter and duller" lands. |
| Knows what to do first? | Yes (PRESET → 90°). The display needs about a second to draw (empty first). |
| Words they would not know | off-axis, kHz, "@100 Hz" (means "bass"), "@8 kHz" (means "treble"), dB. |
| Follows / continues? | Yes. |
| What works | The singer-drifting example in the check; the preset angles. |
| Suggestions | 1. Rename readouts "BASS (100 Hz)" and "TREBLE (8 kHz)". (S) 2. Make the mic's turn more obvious in the scene (draw an angle arc with "90°"). (S) |
| Hobbyist | Quick and useful. |

## Module 6 · STEREO TECHNIQUES
| Field | What |
|---|---|
| Page | MicLab · 6/10 |
| First look | A stage strip with three heads at the top, two small mics in a V at the bottom, and a coloured field with wedge outlines. Readouts TECHNIQUE XY · STEREO FROM LEVEL. |
| Overwhelm | 4. Four named techniques (XY, ORTF, AB, Mid-Side) with acronyms, plus mono compatibility. |
| Knows what it is learning? | Partly. The opening of WHAT'S HAPPENING ("You have two ears… which side is LOUDER, and which side it reaches FIRST") is excellent and lands. The four techniques blur together. |
| Knows what to do first? | Yes: open TECHNIQUE and step through. |
| Words they would not know | XY, ORTF, AB, Mid-Side, coincident, capsules, mono, "summed to mono", phase cancellation, array, the caption formula. |
| Follows / continues? | Yes, but the check ("The venue sums your feed to mono. Which array thins out?") needs "mono", "array" and "phase cancellation". |
| What works | The two-ears framing; "STEREO FROM: LEVEL / TIME / BOTH" readout in words; the stage with performers gives a reason. |
| Suggestions | 1. Lead with the ears idea on the page itself (one line under the display), not only in WHAT'S HAPPENING. (S) 2. Give each technique a plain nickname on its button ("XY · same spot", "AB · spaced apart"). (S) 3. Define mono once: "mono = both sides mixed into one speaker". (S) |
| Hobbyist | High value: this is where hobbyists are usually confused. |

## Module 7 · PLOSIVES & WIND
| Field | What |
|---|---|
| Page | MicLab · 7/10 |
| First look | Face, blue blast marks, amber voice wave, mic. Readouts BARRIER NONE · BLAST AT CAPSULE 100%. A bar "PLOSIVE ENERGY REACHING THE CAPSULE". |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: "P" and "B" puff air; a barrier stops the air, not the voice. |
| Knows what to do first? | Yes. POP FILTER drops the blast to 30 % and the tray shows a one-line explanation of the chosen barrier. Clear cause → effect. |
| Words they would not know | plosive, capsule, diaphragm (seen in Module 1), shotgun windshield, "overload". |
| Follows / continues? | Yes. No CHECK YOURSELF on this module. |
| What works | The selected option's description inside the tray ("A mesh disc a few inches out breaks up the air burst…"). The amber voice passing untouched through the barrier. |
| Suggestions | 1. Colour: the blast is blue (the colour that means "less" elsewhere) even at 100 %. Use a different hue (white/grey) for "moving air". (S, M-C) 2. Add a one-question check for consistency. (S) |
| Hobbyist | Fine; they own a pop filter. |

## Module 8 · HANDLING NOISE & ISOLATION
| Field | What |
|---|---|
| Page | MicLab · 8/10 |
| First look | Mic on a stand; red readouts "STAND SHAKE — 100 % (THE SOURCE)" at the bottom and "AT THE CAPSULE — 90 % OF THE SHAKE" at the top. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: shaking travels up the stand. |
| Knows what to do first? | Yes: MOUNT → SHOCK MOUNT. |
| Words they would not know | "decouple it" (subtitle), shock mount, conducted, high-pass filter, low-frequency thumps. |
| Follows / continues? | Yes; the footsteps check is concrete. |
| What works | Two readouts that bracket the path (source at the bottom, arrival at the top). |
| Suggestions | 1. Subtitle: "Vibration travels through the stand into the mic — a springy mount stops it." instead of "decouple it". (S) |
| Hobbyist | Fine. |

## Module 9 · HOW YOUR HAND CHANGES THE MIC
| Field | What |
|---|---|
| Page | MicLab · 9/10 |
| First look | Three panels: a hand on a mic, a small round pattern, a wavy line. Panel titles are missing on the drawing (the caption names them: "mic & hand · polar pattern · frequency response"). |
| Overwhelm | 3. |
| Knows what it is learning? | Yes after FULL CUP: everything turns red and PATTERN reads COLLAPSED. "Cupping is bad" lands; "why" (rear ports, pattern toward omni, the null disappears) needs Module 2 and 4 vocabulary. |
| Knows what to do first? | Yes (POSITION → FULL CUP; or drag the hand). The selected grip's explanation shows in the tray (good). |
| Words they would not know | grille, rear ports, omni, feedback, coloration, intelligibility, polar, frequency response. |
| Follows / continues? | Yes. |
| What works | Everyone has seen a singer cup the mic: a perfect real-world hook. Three synchronised views. |
| Suggestions | 1. Title each panel on the drawing ("HAND", "WHERE IT HEARS", "TONE"). (S) 2. Red here means "wrong", not "loud": add ✓/✗ icons so colour is not the only signal. (S, M-C) |
| Hobbyist | Enjoys it; useful for coaching singers. |

## Module 10 · COMMON HANDHELD MISTAKES
| Field | What |
|---|---|
| Page | MicLab · 10/10 (top button becomes FINISH ›) |
| First look | A swipeable card row: "✅ Correct grip" with a hand-holding-mic drawing, then "❌ …" cards. Below: SPOT THE MISTAKE — 3 ROUNDS (a face, a hand, a mic, and three answer buttons). |
| Overwhelm | 2. Friendly, picture-led. |
| Knows what it is learning? | Yes: a field guide of seven do/don't cards. |
| Knows what to do first? | Partly. The intro says "guess each habit before you read its title", but each card's title sits directly under its picture, so guessing first is impossible. The swipe affordance is only a sliver of the next card at the right edge. |
| Words they would not know | grille, antenna (wireless), capsule. |
| Follows / continues? | Yes; three picture rounds are a good finale. The SPOT THE MISTAKE picture box drew empty for a moment. |
| What works | Picture quiz ("what is going wrong in this picture?") — the right kind of check for practical knowledge. |
| Suggestions | 1. Hide each card's title until tapped (tap to reveal) so the "guess first" instruction works. (S/M) 2. Add a visible "swipe ›" hint or dots under the card row. (S) 3. End with a three-line "what you learned" recap like Foundations Module 14. (S) |
| Hobbyist | Quick, fun. |

## What's left (shared end screen)
| Field | What |
|---|---|
| Page | MicLab · FINISH › → WHAT'S LEFT |
| First look | "LAB COMPLETE · Every section is credited · ✓ 10 CREDITED". |
| Overwhelm | 1. |
| Knows what it is learning? | n/a |
| Knows what to do first? | Yes. |
| Words they would not know | "credited". |
| Follows / continues? | Yes. |
| What works | Same reassuring wording as the other labs. |
| Suggestions | 1. Same as Foundations: every module was credited although I answered no CHECK YOURSELF question in this lab. (M, SHARED) 2. Suggest a next lab. (S, SHARED) |
| Hobbyist | Fine. |

---

## Lab verdict — Microphone Principles

**Beginner's journey.** The lab opens with its hardest page: a 15-label engineering cutaway and an equation, with nothing to touch, so the beginner's first impression is "this is not for me". Those who tap NEXT are rewarded: Modules 2–9 are each a single, hands-on demonstration with a word readout (NULL, COLLAPSED, NONE → +10 dB, 6 % vs 94 %) and many have a short explanation inside the option tray. Dragging the speaker into the black null zone is the best beginner moment in the lab. The vocabulary (cardioid, omni, null, mono, grille, ports) piles up faster than it is defined, and the stereo module is a step up. The picture quiz at the end is a strong finish.

**3 biggest orientation problems**
1. The first module (capsule cutaway, 15 labels, e = B·l·v) is the most intimidating screen in the lab and has no interaction.
2. Inconsistent controls and conventions between neighbouring modules: DISTANCE slider direction flips between Modules 3 and 4; CHECK YOURSELF order changes; red means "more" in one place and "wrong" or "null" in another.
3. Key words (monitor wedge, mono, omni, null, ports) are used in checks and explanations before or without a plain definition, and two captions carry formulas.

**3 best things**
1. Module 2's "DRAG THE SPEAKER — ANYWHERE" with the PICKUP readout turning into NULL.
2. Option trays that explain the selected choice in one line (BARRIER, POSITION).
3. Real-world hooks: "a speaker run in reverse", radio-voice warmth, the singer who cups the mic, SPOT THE MISTAKE pictures.

**First 30 seconds rewrite.** Open on PICKUP PATTERNS with one card: "A microphone hears some directions better than others. Drag the speaker around the mic and watch what it hears." After the first NULL, a toast: "That black area is where the mic is almost deaf. That's where you put the speaker that faces the singer." Move INSIDE THE CAPSULE to the end as "For the curious", showing four parts by default.
