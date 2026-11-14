# G6b · BinauralLab (Binaural Panner) — the parts G6 did not walk

Walked 2026-11-14, sound OFF, `http://localhost:8142/#labpreview/BinauralLab`, tab-5 (reused: tab cap reached; G6 finished), emulated 390 x 844. First-visit intro card and Sound Safety had already been consumed in this tab by G6, so I did NOT meet them fresh; the LEARN and CHECK first-visit popups were still unseen and I met those as a newcomer would.

**How I got the drag to work (for the coordinator):** in this pane the click/drag coordinate frame is the emulated viewport stretched to 800 x 600 (x = css·800/390, y = css·600/844), while screenshots show the page at ~0.78 scale. G6's drags (aimed at what the screenshot showed) landed in the wrong place, which is why they "did not register". Taps by element ref are unaffected. Aimed with the corrected frame, the stage drag works on web. Side effect on web only: a mouse drag selects the stage labels (FRONT 0°, −90°, +90°, BEHIND turn blue-highlighted); a finger on a phone would not do this.

---

## Page 1b · EXPLORE — the head-stage drag (completes G6's page 1)

| Field | Finding |
|---|---|
| Page | Binaural Panner Lab · EXPLORE · stage drag + OBJ/SRC trays + the two on-page CHECK YOURSELF cards · `#labpreview/BinauralLab` |
| First look | (Arrival judged by G6.) On this visit the page reopened with an "AZ — what this does" sheet already up from the earlier session; the AZ definition in it is clear ("0° front, +90° right, −90° left, ±180° behind"). |
| Overwhelm | **2 / 5 once dragging.** Dragging the amber object is the most satisfying direct-manipulation moment in my set: grab it, it follows, and the bezel answers at once. |
| Knows what it is learning? | **Partly.** What changes on screen is a number (ITD 488 → 656 → 0 µs) and, below the fold, "far-ear delay ≈ … · far-ear level −6.9 dB". Nothing on the stage itself shows WHICH ear is the far one. Dragging from −60° to +60° gives the same numbers (488/490 µs, −6.9 dB) on both sides, so a sound-off beginner sees "nothing changed" when the whole lesson (the late ear swapped sides) just happened. |
| Knows what to do first? | **Yes.** Caption "Drag a sound object around the head" + the objects look grabbable. A tap on an object selects it (OBJ readout switches, the selected ring changes colour) — good. |
| Words they would not know | "µs" · "far-ear level −6.9 dB" · "head-shadow low-pass" · "HRTF pinna cues" (THE TWO CUES) · "OBJ 2 OFF" · tray symbols "1 ● 2 ○ 3 ○ OFF" (filled/empty circles are the only on/off signal) · "Broadband" (SRC tray) · "crosstalk". |
| Follows / continues? | What I saw while dragging object 1: −60° front-left ITD 488 µs → +60° front-right 490 µs → +90° right 656 µs, −8.0 dB → +180° behind **0 µs, 0.0 dB** (identical to FRONT) → +167° behind at 2.7 m, 118 µs, −1.8 dB. Findings: (a) **Behind reads exactly like front** (0 µs, 0.0 dB); the screen does not say "same as front — that is why front/back is hard", so the beginner thinks the lab is broken at the back. The sentence exists in LEARN (Guided step 4, Common mistakes) but not where the surprise happens. (b) **Distance changes only the DIST number**: no ring/size/brightness change on the object and no level shown on EXPLORE, though the caption says "radius sets distance". (c) **Objects stack invisibly**: dragging object 1 to +60° parked it exactly on top of object 2, hiding it; a beginner would think object 2 vanished. (d) Tapping object 2 shows "OBJ 2 OFF" and its own source "TONE 440" (object 1 is PINK); the per-object source is not explained, and turning it on means finding the OBJ tray and reading ● / ○. (e) Hitting the exact angles LEARN quotes is hard by finger: I aimed for +30° and got ITD 259 µs (LEARN promises 261); the AZ fader jumped from +132° to +180° on one short drag. A beginner who reads "261" and sees "259" assumes they did it wrong. |
| What works | The drag itself (immediate, anchored, no jump). AZ label returns on the bezel when the value fits ("AZ +90° right"). The SRC tray's one-line meaning for PINK: "Broadband noise feeds BOTH cues at once — timing at the low end, shadow at the top. The easiest source to place." CHECK YOURSELF wrong answers are amber "not quite", not red. |
| Suggestions | 1. **Show which ear is late on the stage**: a small "L / R" tag on the head with the far ear dimmed or given a short "late" tick that moves when the object crosses the middle; and write it in THE TWO CUES: "Object 1 is on your RIGHT, so your LEFT ear hears it 0.49 ms later and quieter." This is the single change that makes the drag teach without sound. **M.** 2. **When AZ is within ~10° of 0° or 180°, add one line under the bezel**: "Front and behind give the same cues here — that is why your brain mixes them up." **S.** 3. **Give DIST a visible effect**: object icon smaller/dimmer with distance, or a "level −6 dB" readout next to DIST. **S–M.** 4. **Offset stacked objects** (or draw the hidden one's ring on top) so an object never disappears under another. **S.** 5. **Add preset angle chips to the AZ tray** (0 · ±30 · ±90 · ±150 · 180) so the numbers LEARN quotes can be hit exactly; or have LEARN say "about 260 µs". **S.** 6. **OBJ tray: words, not just circles** ("1 ON · 2 OFF · 3 OFF", "Turn this object off"). **S.** |
| Hobbyist | Will love dragging three objects; will notice right away that front/back are identical and that the stage does not show elevation — the LEARN copy covers both honestly. |

### On-page CHECK YOURSELF (walked: wrong first, then right)
- "What does the pan-pot NOT do?" Wrong ("Work on headphones") → "THE TWO CUES panel above shows what the pan-pot leaves out." Helpful pointer, but the panel shows two cues and does not say which one a pan-pot already does (level), so the beginner still has to infer it. Right → "A pan-pot is level-only… On their own these two cues still mostly place a sound inside your head…" — honest, but it quietly contradicts LAB NOTES' promise to "hear them localize" around you. **Suggestion:** say in LAB NOTES that the sounds will mostly feel inside/near the head. **S.**
- "Which source is EASIEST to localize?" Wrong ("A 250 Hz sine tone") → "Flip SRC between TONE 250 and PINK while dragging the object." Needs sound, and "TONE 250" is two steps away (SRC → TONE, then the TONE FREQUENCY row lower in the tray). Sound-off learners get no reason. **Suggestion:** add the reason in words to the wrong hint ("A steady low tone has no sharp start and almost no level difference between ears"). **S.**
- Answer-length tell confirmed on both cards (right answer is the long one with its reason glued on).

---

## Page 2 · LEARN (walked)

| Field | Finding |
|---|---|
| Page | Binaural Panner Lab · LEARN tab |
| First look | A long text page, no picture. Eye lands on the bordered paragraph "In Stereo Imaging, PAN moved a sound by level alone. Your ears use more." Thinks: "the reading part — and it assumes I did Stereo Imaging". About one second later the WHAT YOU'RE LEARNING popup slides over the paragraph I had started reading. |
| Overwhelm | **3 / 5.** Calm, but long: paragraph, 4 bullets, CONTROLS (6 entries), GUIDED STEPS (6, each NOTICE/WHY), COMMON MISTAKES (5), PRO TIPS (5), FORMULA. |
| Knows what it is learning? | **Yes.** WHAT YOU WILL UNDERSTAND is plain ("How two ears place a sound…", "Why noise is easier to place than a low, steady tone"). |
| Knows what to do first? | **Partly.** The popup says "Read the two ear cues first. Then find the ITD line under FORMULA / CONCEPT, and on EXPLORE set AZ to +45°…" — sends a beginner to the formula (the hardest block, at the very bottom) as step two. |
| Words they would not know | "interaural time difference (ITD)" and "interaural level difference (ILD)" are defined in the paragraph (good) · "0.7 ms" · "sphere" · "pinna", "HRTF" (defined in COMMON MISTAKES, after first use in LAB NOTES) · "crosstalk" (defined) · "dB" · "Bus norm 0.79" (Guided step 6) · "Woodworth sphere", "θ in radians", "gain ∝ 1/d" (FORMULA). |
| Follows / continues? | Guided step 1's NOTICE/WHY ("The noise sits to your left… Your right ear is farther away, so it hears the sound later") is exactly the which-ear sentence EXPLORE lacks. Steps 1 and 5 need sound. **Step 6 cannot be followed on web**: it says THE MIX, HONESTLY "shows Bus norm 0.79", but on web that panel shows the "install the v7 build" note instead (see G6). Step 4 ("+30° and +150° both read 261 µs") is the best silent experiment in the lab but hard to hit exactly (see EXPLORE e). Nothing at the end says "now try it on EXPLORE" or "then CHECK". |
| What works | Definitions of ITD/ILD inside the first paragraph; GUIDED STEPS that state the expected number so a silent learner can verify; COMMON MISTAKES as quoted myths ("Binaural works on speakers too."); the honest PRO TIP "Hear this lab as the left-right half of the story". |
| Suggestions | 1. **WHERE TO START: replace "find the ITD line under FORMULA" with "Do Guided step 2 and step 4 on EXPLORE — you can see both without sound."** **S.** 2. **Do not assume Stereo Imaging**: start with "A simple PAN knob moves a sound by making one side louder. Your ears use more than that." **S.** 3. **Delay the first-visit popup until before the first scroll, or show it immediately** — appearing ~1 s after the page, it covers text the learner already started reading. **S, SHARED.** 4. **Rewrite step 6 so it works where the bus line is absent**, or hide the step when it cannot be seen. **S.** 5. **Add one top-down picture**: head, two ears, an arrow to each ear (long/short), the far one shaded = "later and darker". **M.** 6. **End with "Next: try steps 2 and 4 on EXPLORE, then CHECK (4 questions)".** **S, SHARED.** |
| Hobbyist | Will value the FORMULA and the Woodworth reference, and the honesty about HRTF. Step 6 (bus normalisation) is the one they would chase and cannot see on web. |

---

## Page 3 · CHECK (walked: every question wrong first, then right)

| Field | Finding |
|---|---|
| Page | Binaural Panner Lab · CHECK tab |
| First look | "CHECK YOUR UNDERSTANDING / BINAURAL PANNER LAB / Answer all 4 correctly to pass… nothing is lost and there is no score." + "4 still to get right". Calm. All four questions are on one scrolling page. WHAT YOU'RE LEARNING popup slid in ~1 s later. |
| Overwhelm | **2 / 5.** |
| Knows what it is learning? | **Yes** ("Review: what ITD is, what the head shadow does…"). |
| Knows what to do first? | **Yes** — tap an answer. The popup's "Reread the two ear cues at the top of LEARN" is a good, gentle fallback. |
| Words they would not know | "interaural time difference (ITD)" in Q1's question itself (fine if LEARN was read) · "crosstalk" (feedback) · "pinna" (feedback). |
| Follows / continues? | Yes. **Wrong-answer feedback = the right-answer feedback, word for word**: a wrong pick shows "NOT QUITE — TRY ANOTHER" plus the full explanation, which names the answer (Q1 wrong "louder" → "…The brain uses that tiny delay to place the source"; Q4 wrong → "Height… comes from how the outer ear (pinna) colors sound"). So the retry is a reading test, not a thinking test. Q1's wrong option "The far ear hears the sound louder" is a near-miss (it is the OTHER cue, reversed); the feedback does not say "that's the second cue — and it's quieter, not louder", missing a teaching moment. Answer-length tell: in all 4 questions the right answer is the longest. On the last correct tap the learner is at the bottom; "Every question answered correctly — the check is passed." appears only at the TOP (off-screen); at the bottom there is just "Check passed." above FINISH — fine but easy to miss. |
| What works | Amber "not quite", green "correct", per-card ✓; live "N still to get right" counter; explanations are accurate and short; FINISH · SEE WHAT'S LEFT is a clear exit. |
| Suggestions | 1. **Different text for a wrong pick**: say why THAT choice is wrong, without giving the answer ("Louder is the other cue, and it goes the other way — think about time"). Keep the full explanation for after the right pick. **M, SHARED (check-card data shape, all labs).** 2. **Equalise answer lengths**; move the "— because…" clauses into feedback. **S, this lab's data.** 3. **Pin a small "Passed ✓" banner next to FINISH**. **S, SHARED.** |
| Hobbyist | Fair and quick; 4 questions is right. Will notice the long-answer pattern. |

---

## Page 4 · WHAT'S LEFT (walked)

| Field | Finding |
|---|---|
| Page | Binaural Panner Lab · end screen (after FINISH) |
| First look | Big green "LAB COMPLETE", "Where you are", "✓ 1 CREDITED  REVIEW ▾", PRACTICE AGAIN FROM THE START, DONE · BACK TO LABS, DISCUSS THIS LAB ›. |
| Overwhelm | **1 / 5.** |
| Knows what it is learning? | **No summary**: nothing restates what was learned ("far ear = later + darker; front/back is the hard part"). |
| Knows what to do first? | **Yes** — DONE · BACK TO LABS. |
| Words they would not know | "credited", "1 CREDITED" (1 of what? the check), "Every check is credited". |
| Follows / continues? | Yes; but no suggestion of which lab to do next. (I did not press DISCUSS THIS LAB: it opens the forum.) A "WHERE YOU ARE" first-visit popup arrived late (it was still pending when I navigated away), telling me to "Read WHAT'S LEFT. If the check's row is still there, tap it…" — useful words, but they belong on the screen, not in a popup that lands after the learner has read it. |
| What works | Calm, reassuring ("Practicing never removes credit"), clear primary exit. |
| Suggestions | 1. **One-line "You learned"** recap (2-3 bullets from WHAT YOU WILL UNDERSTAND). **S, SHARED.** 2. **"1 CREDITED" → "Check passed ✓"**. **S, SHARED.** 3. **"Next lab:" suggestion** (e.g. Stereo Imaging if not done). **M, SHARED.** |
| Hobbyist | Fine; would skip straight to DONE. |

---

## Lab verdict — BinauralLab (adds to G6's)

**Beginner's journey (after walking it):** Dragging a sound around the head is genuinely inviting and responsive, and the LEARN page's guided steps give numbers a silent learner can check. But the stage never shows WHICH ear is late, so moving the object from left to right produces the same numbers and teaches nothing without sound; behind looks identical to front with no explanation at that moment; and the CHECK reveals each answer in the wrong-answer text. The end screen is calm but says nothing about what was learned.

**3 biggest orientation problems (walked)**
1. The far ear is never shown on the stage; left/right swaps give identical numbers.
2. Front = behind (0 µs) with no on-the-spot explanation; distance has no visible effect; stacked objects vanish.
3. CHECK wrong-answer feedback gives the answer away; LEARN's start points to the formula; step 6 cannot be seen on web.

**3 best things**
1. The anchored drag on the top-down stage.
2. LEARN Guided steps that quote the number to look for (silent-checkable).
3. Kind check (amber "not quite", counter, no score) and a calm end screen.

**First 30 seconds rewrite (drag-specific)**
Stage with object 1 at −60°, the LEFT ear lit, a tag "LEFT ear hears it first". Pointer: "Drag me to the other side of your head." When it crosses: the right ear lights and the line reads "Now your RIGHT ear hears it first — your LEFT ear 0.49 ms later and a little duller. That gap is how your brain knows where I am."
