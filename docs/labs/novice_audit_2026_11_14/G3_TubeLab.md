# G3 · TubeLab (Vacuum Tube Fundamentals): beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound off, tab-7, `http://localhost:8142/#labpreview/VacuumTube` (the harness name; the app route is `TubeLab`). Nine modules in the Rack Unit layout: a pinned drawing at the top with readouts under it (e.g. PARTS · EMISSION · CURRENT), ▴ HIDE DISPLAY / ⤢ FULL SCREEN, a scrolling text well, and dock keys at the bottom (PARTS ▸, ⚡ E-VIEW, TUBE REF ›, or a fader). The lab says "🔈 This lab teaches visually — no audio playback", so sound-off loses nothing here.

Not reached, with reason:
- **TUBE REF ›** (the Tube Reference cards): the `TubeReference` / `TubeCard` screens are not registered in the web preview harness, so the button does nothing there. Needs the app or a harness entry.
- **The glossary (term) card at first open**: the harness name `VacuumTube` is not a catalog route, so no term card shows here (by design of the harness). Whether the real `TubeLab` opens with one, and what it says, was not checked.

Shared things on every page:
- "ⓘ GUIDED LESSON — every control long-presses for its own entry" sits on every module. Long-press is invisible to a beginner and a phone user rarely tries it; this is the main help system and it is hidden behind a gesture. (SHARED, rack/kit)
- The drawing carries no part labels; parts are identified by colour (the chip colours match the drawing), which works once the learner notices it.
- Readouts in CAPS under the drawing (PLATE I, GRID, ZONE, STATE) update live: good feedback, but "PLATE I" (I = current) is never spelled out.

---

## Page 1 · Module 1 "What's inside a vacuum tube?" · 1 / 9
| Field | Finding |
|---|---|
| First look | A glowing glass tube drawn in colour (gold cage, blue and violet wire grids, a green-glowing centre). Beautiful; the eye stays on it. Thinks: "a light bulb? an old radio valve". |
| Overwhelm | 2. One drawing, three readouts (PARTS 8/8, EMISSION ON, CURRENT METERED), one paragraph. |
| Knows what it is learning? | Partly. The two sentences under the title disagree on the action: "open PARTS and tap each piece to learn its job" vs "Open PARTS and tap a part to REMOVE it". The beginner taps to learn and is surprised the part disappears. |
| Knows what to do first? | Partly. PARTS ▸ in the dock is the key; the guide says "tap CONTROL GRID". |
| Words they would not know | pentode ("Drawn as a pentode — the fullest version"), heater vs cathode, plate, control / screen grid, suppressor, E-VIEW, "emission", "METERED", "valve (TRIODE)" in the part text. |
| Follows / continues? | Yes. Tapping CONTROL GRID removed it: PARTS 7/8, CURRENT WIDE OPEN, and the tray said "NO CONTROL GRID — the flow runs WIDE OPEN. Full current, but nothing can shape it to follow a signal. ▸ Tap CONTROL GRID to add it back." Clear cause → effect, and recovery is offered. |
| What works | Remove-a-part-and-see-what-breaks is a superb way to teach what each part is for. Colour-matched chips and drawing. "Glass, metal, wire, and nothing at all" is a lovely opener. |
| Suggestions | 1. (S) Make the two sentences agree: "Tap a part to take it OUT and see what stops working." 2. (S) Put tiny labels (or numbered leader lines) on the drawing for heater, cathode, grid, plate, at least in FULL SCREEN. 3. (S) Replace "pentode" in the first paragraph with "the full version with all its parts" (pentode is taught in module 6). 4. (M, SHARED) Replace the long-press GUIDED LESSON line with a visible "?" on each control, or a one-time hint "press and hold any button to hear what it does". |
| Hobbyist | Loves it; finally sees what the parts in their tube preamp do. |

## Page 2 · Module 2 "Electron flow" · 2 / 9
| Field | Finding |
|---|---|
| First look | An EMPTY dark display (cold tube = nothing drawn), readouts HEAT 0%, STAGE 1/5, PLATE I 0%, and a WARM-UP fader in the dock. A beginner thinks the picture failed to load. |
| Overwhelm | 1. |
| Knows what it is learning? | Yes: "Slide the WARM-UP fader and watch heat become electrons, and electrons become current." |
| Knows what to do first? | Yes once they find the WARM-UP fader in the dock. |
| Words they would not know | cathode, plate, PLATE I, emission, "conducting". |
| Follows / continues? | Yes. At 73%: a glowing zig-zag heater, blue electron dots drifting to a rod marked +, "4 · Emission climbs steeply — the stream to the positive plate grows big enough to read." and "73% · conducting". Step text changes with the fader: excellent narrated feedback. |
| What works | The numbered step text that changes with the fader (1 · Cold … 4 · Emission climbs…); "no heat, no electrons, no sound" as the take-away. |
| Suggestions | 1. (S) At 0% show the cold tube outline faintly (cathode and plate in grey) with "cold — slide WARM-UP ▸", so the empty box does not read as broken. 2. (S) Label the two rods once: "cathode (hot, gives electrons)" and "plate (+, collects them)". 3. (S) Spell out "PLATE I = current reaching the plate". |
| Hobbyist | Now knows why their amp needs a minute. |

## Page 3 · Module 3 "The control grid" · 3 / 9
| Field | Finding |
|---|---|
| First look | The display (cathode, a column of grid dots, plate), readouts GRID PARTIAL / PLATE I 26%, a GRID V fader at "50% · partly negative". |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: "a whisper of voltage gating a river of current" (excellent line) and "read it again while you slide the GRID V fader". |
| Knows what to do first? | Yes. |
| Words they would not know | negative voltage, field, cut off, "repelling field lines". |
| Follows / continues? | Mostly. Sliding left to 2% gave "GRID CUT OFF · PLATE I 0% · 2% · cut off — no current flows". But the fader is in PERCENT while the idea is "more NEGATIVE = less current": low % = most negative = no current. A beginner expects 0% to mean "no grid voltage, nothing in the way". The direction of the fader fights the mental model. |
| What works | The check question ("Its small negative voltage repels the stream back") right under the idea; the CUT OFF state in words. |
| Suggestions | 1. (M) Label the fader ends in words, not percent: "◂ MORE NEGATIVE (closes)" … "LESS NEGATIVE (opens) ▸", and show the value as "−" volts in a simple scale, or as "grid: closing / partly open / open". 2. (S) Turn on ⚡ E-VIEW automatically here, since the grid's repelling field IS the lesson. |
| Hobbyist | Clear; might want real volt numbers (e.g. −2 V on a 12AX7). |

## Page 4 · Module 4 "Signal amplification" · 4 / 9
| Field | Finding |
|---|---|
| First look | An animated display with GAIN ~×7, IN GRID, OUT PLATE: a small blue wave in and a big amber wave out. |
| Overwhelm | 3. No control at all on this page (only TUBE REF ›), and three long paragraphs of reading ("Follow the color code…", "That plate current, pulled through a resistor…"). |
| Knows what it is learning? | Yes: "a small signal at the grid steers a large current… the output comes out upside-down". |
| Knows what to do first? | Partly: there is nothing to do, only to watch. After three modules of "slide the fader", the learner looks for a control. |
| Words they would not know | resistor, inverted / sign-flip, cathode follower, compressor, broadcast console. |
| Follows / continues? | Yes, if they read. |
| What works | Colour code: BLUE = input/grid, AMBER = output/plate, carried through text and drawing. "Your signal never touches the big current" is a key insight, plainly said. |
| Suggestions | 1. (M) Give the page one control: an INPUT LEVEL fader (small / medium) so the learner can see that a bigger blue wave makes a bigger amber wave, ×7 each time. Doing beats watching. 2. (S) Cut the three paragraphs to the first, and move "cathode follower" and the gear list into a fold. 3. (S) Add a "pause" so a learner can freeze one moment to compare up vs down (the guide asks them to "pick one moment"). |
| Hobbyist | The inverted output is news; good. |

## Page 5 · Module 5 "Why tubes need high voltage" · 5 / 9
| Field | Finding |
|---|---|
| First look | Readouts SUPPLY SMALL · PULL WEAK · STREAM SPARSE; a SUPPLY ▸ key in the dock. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: "why tube circuits live at hundreds of volts". |
| Knows what to do first? | Yes: open SUPPLY and pick HIGH-VOLTAGE SUPPLY (B+). |
| Words they would not know | B+ rail, headroom, filter capacitors, "swing a big signal", biasing. |
| Follows / continues? | Yes. |
| What works | Three word readouts (SMALL / WEAK / SPARSE) that a beginner can read without numbers. The safety paragraph ("the filter capacitors HOLD that charge long after the amplifier is switched off and unplugged — it is enough to kill") is clear and responsible. |
| Suggestions | 1. (S) Define "headroom" in a clause ("room for the signal to swing without hitting a limit"). 2. (S) Put the safety paragraph in a visible ⚠ box so it is not read as ordinary body text. |
| Hobbyist | The capacitor warning matters for anyone tempted to open an amp. |

## Page 6 · Module 6 "Triode · tetrode · pentode" · 6 / 9
| Field | Finding |
|---|---|
| First look | Readouts TYPE TRIODE · GRIDS 1 GRID · NEW G1 CONTROL; the newest grid glows. |
| Overwhelm | 3. The idea (each type adds one grid to fix a weakness) is neat, but the weaknesses are abstract ("The plate's field reaches back through that single grid, limiting gain and speed"; "secondary emission"). |
| Knows what it is learning? | Yes: "three tubes, one story". |
| Knows what to do first? | Yes: TYPE ▸, step through the three. |
| Words they would not know | triode / tetrode / pentode (now defined by grid count: good), 12AX7, secondary emission, linear, "gain and speed". |
| Follows / continues? | Yes. |
| What works | The "one more grid fixes the last one's weakness" story; NEW shows exactly what changed; the newest part glows. |
| Suggestions | 1. (S) Give each weakness a plain consequence ("…so a triode can only amplify so much"; "…in a tetrode some electrons bounce back off the plate — a kink in the output"). 2. (S) Say where each type is used in a sentence a beginner can place ("triode: the small tubes in a guitar amp's preamp; pentode: the big output tubes"). |
| Hobbyist | Useful naming; matches the tubes in their gear. |

## Page 7 · Module 7 "Tube bias" · 7 / 9
| Field | Finding |
|---|---|
| First look | Two plots side by side: an S-shaped "transfer curve" with a dot on it, and an output sine wave. Readouts BIAS 50% · ZONE LINEAR; a BIAS fader. |
| Overwhelm | 3. Two graphs with no axis labels; "transfer curve" is never explained in plain words. |
| Knows what it is learning? | Partly: "Bias is the idle point — where the tube rests with no signal." is clear; the graph is not. |
| Knows what to do first? | Yes: slide BIAS far left, far right, back to 50%. |
| Words they would not know | transfer curve, normalized, operating point, cutoff, linear, saturation, idle point. |
| Follows / continues? | Yes; ZONE changes in words and one side of the wave flattens. |
| What works | ZONE in words (LINEAR / CUTOFF / SATURATION); the check question; the honest "learn what bias IS here; have the work done by someone trained". |
| Suggestions | 1. (S) Label the curve's axes in plain words ("grid voltage in →", "↑ current out") and the three regions on the curve itself (CUTOFF · STRAIGHT PART · SATURATION). 2. (S) One line: "The curve shows how much current comes out for each grid voltage. The straight part copies the signal faithfully." |
| Hobbyist | "Biasing an amp after a tube change" finally makes sense. |

## Page 8 · Module 8 "Tube saturation" · 8 / 9
| Field | Finding |
|---|---|
| First look | Readouts DRIVE 20% · STATE CLEAN; a curve "vs the straight dashed ideal" and input/output waves. The display caption says "normalized tanh (soft-clipping) curve". |
| Overwhelm | 4. Three long paragraphs (WHAT, WHY it rounds, WHY it sounds good) with dB, harmonics, "grid starts to draw current", "pinches off". |
| Knows what it is learning? | Yes: "soft clipping … is most of what 'tube sound' means". |
| Knows what to do first? | Yes: slide DRIVE past 30% and 70%. |
| Words they would not know | tanh (in the caption), normalized, soft / hard clipping, dB, harmonics, "draw current", compression. |
| Follows / continues? | Yes, visually. **But this page is about SOUND** ("warmth and grit", "harsh and fizzy") and the lab plays none. Without sound, "it sounds good" is a claim the beginner must take on trust. |
| What works | Rounded vs flat-topped peaks shown side by side is the right picture; "Same overload, opposite character". |
| Suggestions | 1. (S) Remove "tanh" from the caption (the beginner-facing name is "soft-clipping curve"). 2. (M) Offer a hearing link: "Hear it in the Distortion / Saturation lab ›" or a short before/after clip behind a sound-safety gate; this is the one module where the ear is the point. 3. (S) Add a HARD CLIP comparison toggle so "chopped flat" can be seen next to "rounded". |
| Hobbyist | Would really want to hear it. |

## Page 9 · Module 9 "Tube vs transistor" · 9 / 9 (top button becomes FINISH ›)
| Field | Finding |
|---|---|
| First look | TRUE SIZE / ENLARGED · CUT OPEN; a tube and a transistor side by side with readouts TUBE VACUUM · TRANSISTOR JUNCTION. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes: "Two completely different physics doing the same job." |
| Knows what to do first? | Yes (toggle TRUE SIZE / CUT OPEN). |
| Words they would not know | semiconductor, junction, charge carriers, base. |
| Follows / continues? | Yes; FINISH · SEE WHAT'S LEFT ›. |
| What works | TRUE SIZE comparison (the size difference is the story); "Neither is 'better'". |
| Suggestions | 1. (S) One plain line for "semiconductor" ("a material like silicon that conducts only when told to"). |
| Hobbyist | Good closer. |

## Page 10 · WHAT'S LEFT + CHECK YOUR UNDERSTANDING (after FINISH ›)
| Field | Finding |
|---|---|
| First look | "Only the check is left. Everything you have done is saved on this device" and five plain questions. "✓ 9 DONE". |
| Overwhelm | 1. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes: answer 5, tap CHECK. |
| Words they would not know | transfer curve (Q3), soft clipping (Q4). |
| Follows / continues? | Yes. "Get one wrong and you can try it again straight away; nothing is lost and there is no score." The kindest check wording in my six labs. |
| What works | Five questions that match the five big ideas; the reassuring tone; REVIEW ▾, PRACTICE AGAIN, DONE · BACK TO LABS. |
| Suggestions | 1. (S) "✓ 9 DONE" after simply paging through might over-credit; consider "9 visited" until each module's own action was tried (or keep as is if visiting is the intended bar). |
| Hobbyist | Fine. |

---

## TubeLab: overall verdict
This is a calm, well-paced lab for a beginner: one idea per module, a single fader or chip tray, a drawing that reacts at once, readouts in words (CUT OFF, LINEAR, CLEAN), and narrated step text that changes as you slide. The remove-a-part opener and the warm-up fader are excellent first steps. The beginner's journey is good until module 4 (watch-only, long text), then the graphs of modules 7-8 (transfer curve, "tanh") ask for chart literacy the lab never teaches, and module 8 talks about sound the lab cannot play. Help lives behind long-press, which most beginners will never discover.

**3 biggest orientation problems**
1. The main help (GUIDED LESSON) is long-press only, on every module.
2. Graphs and faders that fight the mental model: unlabelled transfer-curve axes; GRID V in percent where low % = most negative = no current; "− EASE"-style direction issues of this kind recur in other labs.
3. Module 8's "tube sound" claim with no sound, and module 4 with nothing to do.

**3 best things**
1. Remove-a-part-and-watch-it-fail (module 1), with recovery offered in the same line.
2. Fader-narrated steps ("1 · Cold: nothing moves … 4 · Emission climbs steeply") and word readouts.
3. The final check's tone ("nothing is lost and there is no score") and responsible safety lines on high voltage and bias.

**First 30 seconds, rewritten**
Open on the glowing tube with one line: "A tube is a valve for electrons: a tiny voltage controls a big flow. That is how it amplifies. Take the tube apart to see why every piece is there." A pulsing hint on PARTS ▸ ("start here"), and the first tap removes the control grid with the result in big type: "No grid → the flow can't be controlled → no amplifier." Then: "Next: warm it up ›".

Source check (after the walk): `tubeScreenGuides.ts` matches what the pages show. `labCatalog.ts` names the real route `TubeLab`, and `TubeReference` is navigated to from `VacuumTubeLabScreen.tsx` but is not in the harness list, which is why TUBE REF › was not reachable here.

---

## Addendum (later in the night): real route `TubeLab` and the Tube Reference, reached through the full app
Walked at `http://localhost:8142/` → OPEN LABS → EXPLORE ADVANCED LABS → Audio Electronics → Vacuum Tube Fundamentals (route `TubeLab`). This closes two of the "not reached" items above.

- **Glossary card on first open (real route):** "Vacuum tube — A vacuum tube (valve) is a sealed, air-free bulb (called the envelope). A heated cathode sends electrons to a plate, and grids control that flow. It is the amplifying heart of tube amps, preamps, and mics." It agrees with the lab (unlike the cable labs' cards). For a beginner it introduces five new words at once (valve, envelope, cathode, plate, grids) before the drawing is seen; module 1 then teaches them one at a time, so the card could be shortened to its first and last sentence.

## Page 11 · Tube Reference (TUBE REF › from any module)
| Field | Finding |
|---|---|
| First look | "TUBE REFERENCE · 40 tubes · structure, pins, ratings, substitutions", a search box ("Search — 12AX7, ECC83, GZ34, octal…") and long grouped lists: PREAMP & SMALL-SIGNAL TRIODES, POWER PENTODES & BEAM TETRODES, DIRECTLY-HEATED TRIODES, RECTIFIERS. |
| Overwhelm | 4. Forty part numbers (12AX7, ECC83, 7025, 6SN7GTB, CV181, KT88…) is a catalogue, not a lesson. |
| Knows what it is learning? | Partly: the group headings are good and each has a plain line ("Voltage gain at the front of the chain. mu (µ) = how much the tube amplifies."; "The filament IS the cathode"). |
| Knows what to do first? | Yes with the guide ("Type ECC83 in the search box…"). Typing ECC83 left exactly the 12AX7 row: good, and it teaches that one tube has several names. |
| Words they would not know | mu, Noval / Octal / UX4, beam tetrode, kinkless tetrode, directly-heated, rectifier, B+, top-cap anode, phase inverter. |
| Follows / continues? | **The row numbers are out of order inside the groups** (01-09 then 38-40 in the triodes; 10-19 then 31-35 in the power tubes; 20-23 then 36-37; 24-30): a beginner reads the numbers as an order and thinks rows are missing. |
| What works | Grouping by job; the search that finds alternative names; the closing safety line. |
| Suggestions | 1. (S) Renumber within groups, or drop the numbers. 2. (S) Start each group with "the one you'll meet first" (12AX7, EL34/6L6, 300B, 5AR4) highlighted. 3. (S) Gloss Noval / Octal once ("9-pin / 8-pin base"). |
| Hobbyist | Very useful as a lookup; the alternate names are what they search for. |

## Page 12 · Tube card (12AX7) · NOT CHECKED, with reason
Tapping the 12AX7 row opened "01 / 40 · 12AX7 · PREAMP & SMALL-SIGNAL TRIODES" with PAGE 1 / PAGE 2 tabs, but the body read: "The 12AX7 card needs an active Academy sign-in — sign in and try again. RETRY". The preview is a dev member with no live sign-in, and signing in is off-limits, so the card content could not be read. One orientation note that stands anyway: the screen-guide card opened on top of that error and said "Read PAGE 1, then tap PAGE 2. Double-tap the card to zoom in…", which a learner who hits the sign-in error cannot do. (SHARED: guide cards should not open over an error state.)
