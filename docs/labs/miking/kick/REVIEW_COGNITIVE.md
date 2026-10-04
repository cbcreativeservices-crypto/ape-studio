# Kick Drum (M01): learning and cognitive review

Reviewer: learning-science and instructional-design pass. This was a read-only review, done on 2026-10-04.
Read for this review:
- the plan (`MIKING_LABS_PLAN_2026_10_04.md`) and the owner's lesson (`source_text/Kick-Drum-Miking-Technique-Research.txt`);
- `lessons/m01Kick/lesson.ts`, `model.ts` and `geometry.ts` (labels only);
- `pages/*.tsx`, `MikingLessonScreen.tsx`, `MikingHubScreen.tsx`;
- `engine/steps.tsx`, `engine/kit.tsx`, `engine/a11y/describe.ts`, `engine/scene/sceneWords.ts`, `engine/progress/*`;
- `data/micTypes.ts`, `data/registry.ts`, `kit/labNav.ts`;
- the eight screenshots in `scratchpad/kick_shots/`.

Paths are relative to `src/screens/lab/miking/` unless they say otherwise.

The lesson source sets the yardstick (L4, L89). It assesses *reasoning and safe setup choices, with more than one acceptable tonal solution*. Passing needs four things: safe placement, correct power and level checks, musical reasoning, and an accurate account of polarity versus delay. A preferred brand, bass emphasis or a genre preset is not part of passing.

Counts: **2 CRITICAL, 12 MAJOR, 11 MINOR.**

---

## CRITICAL

### C1. The checks can be passed on test-taking cues, and the final task has become a single-answer quiz
- **Where:**
  - `lessons/m01Kick/lesson.ts:65-177` (all 14 scenarios) and `:180-230` (6 symptoms);
  - `pages/PReadPages.tsx:61-62` (Practice);
  - `engine/kit.tsx:76-126`.
- **Problem:**
  - **The longest option is the right one.** I measured all 20 items. In **19 of 20**, the correct option is the longest, often 2 to 5 times longer than the others:
    - `k.prac.1`: 120 characters against 34 and 26;
    - `s.dist`: 108 against 27 and 23.
  - **The wrong options are absurd or absolute.** Examples:
    - "Drill through the shell" and "It makes the kick louder";
    - "Yes, always" and "Always more low bass";
    - "Any mic resting on the batter head".
  - The result: anyone who picks the longest, most hedged option scores about 95% without reading the lesson. Retries are free, and with only three options the worst case is two taps.
  - **Several items test recall of brands or numbers, which the lesson rules out:**
    - `k.mic.1` (`:77-80`) asks which *brand model* has which pattern;
    - `k.place.1` (`:101-104`) asks which head the Beta 52A's "5 to 7.5 cm" is measured from;
    - `k.ctx.2` (`:125-128`) asks for "125° (120° in the Beta 52A guide)".
  - **The final task has become three single-answer items** (`k.prac.1`–`3`). The source's task is to choose a setup, describe an alternative and justify a second channel, with more than one acceptable solution. The only "right" one-mic setup offered is the Beta 52A near row (`:157-160`), so an outside mic or a boundary mic on the pillow can never count as correct.
- **Principle at stake:**
  - Constructive alignment: the assessment must match the stated outcome.
  - Item-writing validity: no grammatical or length cues, and every wrong option must be a believable misconception.
  - Desirable difficulty: a retrieval check only helps when it actually takes effort.
- **Fix:**
  1. **Rewrite every item so the options are about the same length and each wrong option is a real misconception.** Examples:
     - `k.mic.1` becomes: "Two kick dynamics are both specified *cardioid*. You swap one for the other between soundchecks. What should you do?"
       - (a) "Re-check the placement and the sound — same pattern, different shaped response" ✓
       - (b) "Nothing — the same pattern means the same sound"
       - (c) "Move it closer to make up for the new mic"
     - `k.place.1` becomes: "A guide says 5 to 7.5 cm from the batter head. Your readout says 6 cm from the **front** head. Are you in that zone?"
       - (a) "No — the number only means something from the head it names" ✓
       - (b) "Yes — 6 cm is inside 5 to 7.5 cm"
       - (c) "Yes, if the mic points at the beater"
     - `k.ctx.2` becomes: "The wedge sits directly behind a supercardioid kick mic. Is that its deepest rejection?"
       - (a) "No — a supercardioid picks up a little directly behind; its deepest rejection is off to each side of the rear" ✓
       - (b) "Yes — every directional mic rejects most at the back"
       - (c) "Yes, as long as the mic is inside the drum"
  2. **Turn Practice into a constructed task on the Placement scene.**
     - Show a scenario card, for example: *"Ported front head, loud club show, the drummer wants a defined attack."*
     - The learner picks a mic type, rests it in **any** valid, clear zone for that mic and head (several are accepted), then picks one alternative.
     - The learner then chooses justifications from a multi-select list: clearance, power available, spill, gain before feedback, and polarity/delay checks if adding a second mic.
     - Feedback checks the reasoning for consistency. For example: "You chose the boundary mic; does this channel have phantom power?" It never compares the answer to one fixed position.
  3. **Add a test to the item lint:** no correct option more than 1.3× the longest wrong option, and no "always", "any" or "never" in wrong options unless the item is about that word.

### C2. Two of the four pass criteria the lesson names are never practised or assessed, and hearing safety is missing
- **Where:**
  - `lessons/m01Kick/lesson.ts:55` (the Practice takeaway says "correct power and level checks … pass");
  - `pages/PMicrophone.tsx:96` (power appears as a single note);
  - `lesson.ts:199-205` (level appears only as the explanation of a symptom);
  - no page anywhere covers hearing.
- **Problem:**
  - **The source has a full "Safety and setup checks" section and a seven-step setup procedure (L9-L13, L42-L49):**
    - NIOSH 85 dBA and the 3 dB exchange rate;
    - a mic's maximum SPL rating is *not* a hearing limit;
    - mute and lower monitoring before switching phantom power;
    - set gain with headroom on the strongest strokes;
    - a lowered fader does not undo clipping.
  - **The app covers almost none of it:**
    - hearing safety is absent;
    - the procedure is never taught as a sequence;
    - no item asks about power or gain.
  - The takeaway still tells the learner that these things are what passing means.
- **Principle at stake:** Constructive alignment, and procedural knowledge. A procedure is learned by ordering and doing its steps, not by reading a note.
- **Fix:**
  1. **On page 2, add one CHECK item about power.** "The channel you've been given has no phantom power. Which of the lesson's mic types can you still use?" The answer is the two kick dynamics, because the boundary mic and the condenser both need phantom.
  2. **On page 6, add a sequencing card.** Ask the learner to put the steps in order:
     - "Stop the drummer";
     - "Mount the mic and check clearance and cable path";
     - "Mute the outputs and lower monitoring";
     - "Switch phantom if the mic needs it";
     - "Set gain on the strongest strokes, with headroom";
     - "Compare positions one change at a time".
     It should be credited when the order is right, with a free retry.
  3. **On page 1's CHECK step, add a short hearing note:** "Repeated hits during setup are loud. NIOSH's guideline is 85 dBA averaged over 8 hours, and every 3 dB more halves the safe time. A mic's maximum SPL rating says nothing about your ears. Keep levels and repeats down and wear protection." Add one item: "The mic is rated to 174 dB SPL. Is the drum safe to stand next to all session?" The answer is no: a mic rating is not a hearing limit.
  4. **Make the Practice takeaway list only what is actually assessed,** until the items above exist.

---

## MAJOR

### M1. The lesson tells before the learner tries, and gives away the answer in the prompt
- **Where:**
  - pages 2–5 all open with a LEARN read step (`PMicrophone.tsx:72-99`, `PPlacement.tsx:127-140`, `PContext.tsx:107-125`, `PTwoMic.tsx:111-122`);
  - `PTwoMic.tsx:138` (the prompt says "the notches move, Δt does not");
  - `PContext.tsx:155-159` (the well prints the null angle before the task).
- **Problem:** Every finding the learner could discover is stated first: the polarity versus delay finding, where the supercardioid null sits, and the tendency of each zone. The activity then only confirms what was already said. Only page 1 lets the learner act first.
- **Principle at stake:** Generation and prediction effects; productive failure. Committing to a prediction before the reveal makes the feedback stick.
- **Fix:** Add one ungraded prediction tap at the top of each rack step. The readout or graph appears as soon as the learner answers.
  - **Page 5:** "Before you touch anything: if you flip B's polarity, what happens to the delay Δt? (gets longer / stays the same / goes to zero)". Replace the prompt with: "Flip B's polarity both ways, then move a mic. Watch which readout each action changes."
  - **Page 4:** "Where will this supercardioid reject the wedge best? (directly behind / toward the rear but off to one side / at the sides)". Hide the NULL bezel cell until the learner first moves the control.
  - **Page 3:** "You move the mic from near the batter head toward the front head. Predict: (more attack / more resonance / it depends on this drum)". The revealed answer reads: "Both of the last two: guides document the tendency toward resonance, and drums vary."
  - Move the LEARN read *after* the rack step, as a "What you just saw" summary.

### M2. A wrong answer gets no explanation of why it is wrong
- **Where:** `engine/kit.tsx:119-123` and `:107`.
- **Problem:** A wrong pick shows only "not the best fit here. Choose again; the explanation comes with the option that fits." The misconception the learner just chose is never addressed. With three options, they guess again.
- **Principle at stake:** Elaborated feedback. Correcting the specific misconception is what changes the learner's mental model; "right or wrong" alone does not.
- **Fix:**
  - Add an optional `why?: Record<string, string>` to `MikingScenario` and `Symptom`, and show it when that option is picked.
  - Example for `k.two.1`, on "It becomes zero": "✗ Flipping polarity changes the sign of the signal, not when it arrives — the mics are still the same distance apart, so the delay is unchanged. Try again."
  - Example for `s.dist`, on "Pull the channel fader down": "✗ The fader comes after the preamp; if the preamp already clipped, a lower fader just makes the distortion quieter."

### M3. The objective of page 2 ("choose") is never practised, and the page is dense with jargon
- **Where:**
  - goal: `lesson.ts:23`;
  - cards: `PMicrophone.tsx:79-91`;
  - specs: `data/micTypes.ts:19-98`.
- **Problem:**
  - The page asks the learner to choose a mic, but nothing asks them to choose one *for a situation*. The COMPARE step explores polar patterns.
  - The cards put a lot of specialist terms in front of a novice: "End-address", "Max SPL 174 dB (1 kHz, 1% THD, 1 kΩ load)", "11–52 V DC, 5.4 mA", "P48", "Electret", "spec field", "free-field lobe", "first-order", "frequency-independent", and "small inverted lobe (−11.4 dB)".
- **Principle at stake:**
  - Practice must match the objective.
  - Reduce extraneous load, and signal only what the decision needs.
- **Fix:**
  - **Give each card three plain lines**, with the full specs behind a "Spec details ▾" toggle:
    - "Power: none needed" / "Needs phantom power from the desk";
    - "Mount: stand, kept off the heads" / "Rests on the pillow — its own manual allows it";
    - "Pattern: cardioid (rejects most behind)" / "supercardioid (rejects most off to each side of the rear)".
  - **Add one "choose" item**, the phantom item in C2.1, plus: "Inside the drum, there is no room for a stand. Which type is designed for that?"

### M4. The four evidence labels are not explained where the learner first meets them
- **Where:**
  - page 1's badge "grey = illustrative" and the scene labels "PEDAL · ILLUSTRATIVE", "PORT · ILLUSTRATIVE" (`PInstrument.tsx:87`; screenshot 01);
  - the definitions only arrive on page 3 (`PPlacement.tsx:134`), in the hub footnote (`MikingHubScreen.tsx:61`), and in badges as "IDEAL MODEL".
- **Problem:**
  - SOURCED, TRIAL, ILLUSTRATIVE and IDEAL MODEL carry the lesson's honesty, but a novice meets "ILLUSTRATIVE" on page 1 with no definition.
  - "TRIAL" can be misread as "a trial you should run".
  - The tags print words, so colour is not the only signal, which is good. The *meaning* behind the words is the gap.
- **Principle at stake:** Pre-training: teach the key terms before the complex scene. Signalling.
- **Fix:**
  - Put a short "How to read this lab" card in page 1's well, before the scene prompt. It must list each label as a separate line, with the coloured tag drawn beside each line:
    - **SOURCED** — a number from a named manual or article.
    - **TRIAL** — the lab's reading of words that give no number ("a few inches").
    - **ILLUSTRATIVE** — drawn so the picture makes sense; no source gives its size.
    - **IDEAL MODEL** — textbook physics, not a measurement of this drum or mic.
  - Rename the tag "TRIAL" to "TRIAL READING" wherever there is room.

### M5. Rack steps on a phone repeat the same numbers in up to four places and drop the label that matters
- **Where:**
  - `PPlacement.tsx:118-123` (bezel) and `:155-158` (Landing, NowLine, ZoneCard);
  - `PTwoMic.tsx:97-102` and `:138-139`;
  - screenshots 02, 03 and 04.
- **Problem:**
  - At 390 wide, the distance appears in the scene overlay line, the bezel, the NOW line and the fader caption. The first two bezel cells lose their labels (the cropped-readout rule, D36). The label they lose, "FROM BATTER", is exactly the reference-head idea the page teaches.
  - The well is about 220 px tall. Before the zone card appears, it holds the 3-line "YOU ARE LOOKING AT", a 3-line prompt and a 4-line NOW.
  - **The overlay disagrees with the bezel in screenshot 02.** After a ZONE jump, the overlay reads "≈ 6 cm … from the batter head" while the bezel and NOW read "≈ 25 cm". Conflicting readouts are worse than none.
- **Principle at stake:** The redundancy principle (the same information in several places adds load), split attention, and the coherence of feedback.
- **Fix:**
  - **Shorten the bezel labels so they fit:** "↔ BATTER" (or "FROM BAT."), "OFF LINE", "AIM", "ZONE".
  - **On rack steps, drop the NOW line for sighted users.** Keep it as an accessibility-only live region; the scene overlay already shows the same facts.
  - **Show "YOU ARE LOOKING AT" only on the step's first visit,** or shorten it to one line, for example "Side view · ported head · kick dynamic".
  - **Have engineering verify the stale overlay after `jumpTo`** in screenshot 02.

### M6. Internal line codes from the source document appear in learner text
- **Where:**
  - about 40 instances such as "(L7)", "(L18)", "(L39, L47)", "(L97)" and "K-03":
    - `PInstrument.tsx:106,120`;
    - `PMicrophone.tsx:79,96`;
    - `PPlacement.tsx:134-137,160-161`;
    - `PContext.tsx:115,122,159`;
    - `PTwoMic.tsx:118-120,144`;
  - every `explain` in `lesson.ts`.
- **Problem:** These codes point to line numbers in the owner's research file, which a learner never sees. They are noise in nearly every paragraph.
- **Principle at stake:** The coherence principle: cut what does not serve learning.
- **Fix:**
  - Remove the L-codes and K-codes from all learner-facing strings. Keep them in code comments, or in a `cite` field that only the Sources page renders.
  - Where a source matters to the learner, name it in words: "(Shure Beta 52A guide)".

### M7. On page 4 the learner moves the wedge rather than the mic, and STUDIO mode has no activity
- **Where:**
  - `PContext.tsx:70-80` (the WEDGE ANGLE control) and `:81` (the STUDIO toggle);
  - `:94-104` (the studio bezel shows only labels);
  - `:155` ("Studio: no wedge").
- **Problem:**
  - **Agency is the wrong way round.** On a real stage you cannot move the monitor; you aim the mic or choose its pattern. The skill the source teaches is to "aim nulls according to the actual pattern" (L68). Moving the wedge trains the opposite move.
  - **The page is called "Studio or live", but STUDIO is an empty state.** The source wants the switch to change the scenario questions about spill, feedback margin, acoustic contribution and mounting.
- **Principle at stake:** Transfer-appropriate processing: practise the action you will take on the job. Every control should change the picture.
- **Fix:**
  - **Fix the wedge in a plausible place** (audio expert to confirm where). The learner then:
    - turns the mic's AIM (azimuth) within its zone's allowed range, and/or
    - switches PATTERN until the wedge sits in the rejection.
  - Credit = wedge in null *by the learner's mic or pattern choice*.
  - **In STUDIO, show one decision card** in place of the wedge. "No wedge, a good-sounding room. What could justify moving from inside to outside the front head? (the room adds something useful / it is always louder / it removes spill)". This uses the lesson's studio column.

### M8. The ideal null shows as "−52.4 dB", which invites the idea that a null is near silence
- **Where:** `PContext.tsx:97` (IDEAL PICKUP) and screenshot 06; `PMicrophone.tsx` bezel `IDEAL PICKUP`.
- **Problem:** At the exact ideal null, the formula approaches minus infinity. A novice reads "−52.4 dB" as what a real mic does, but real kick mics give far shallower nulls that change with frequency. The badge says IDEAL, but the large precise number is what people remember.
- **Principle at stake:** Misconception prevention. The precision of a number signals how certain it is.
- **Fix:**
  - Clamp the display: anything below −30 dB shows "**deep null (ideal)**".
  - Add one line in the well: "Real mics reject far less than the ideal null, and less at low frequencies. Use the null to *aim*, not to promise silence."

### M9. The idea that "moving inward gives more bass" is invited and not resolved
- **Where:**
  - `lessons/m01Kick/model.ts:81` (the near-batter zone quotes Shure: "maximum bass sound");
  - `model.ts:97`;
  - `PPlacement.tsx:137`;
  - `lesson.ts:109-112` (`k.place.2`).
- **Problem:**
  - The learner reads that the position *nearest the batter head* gives "maximum bass sound". They also read that moving *toward the front head* "can reveal more resonance".
  - Nothing reconciles the two. Proximity effect explains the first; it is mentioned once in the LEARN prose, but not at the zone where the tension appears.
  - `k.place.2`'s wrong option "Always more low bass" is too easy to reject to confront the idea.
- **Principle at stake:** Refutation text: name the misconception, say why it is attractive, then explain.
- **Fix:**
  - Add to `b52.near`'s tendency: "Why 'maximum bass' this close? A directional mic near a radiating surface boosts its own lows (proximity effect). That is this mic, this close, not a rule that moving inward always adds bass."
  - Add a refutation item: "A friend says *'the further into the drum, the more bass — always'*. What's the best reply? (a) 'Partly: a directional mic close to a head boosts lows (proximity effect), but the surface it faces and the drum matter, so check it' ✓ (b) 'Yes, the inside of the drum is where the bass is' (c) 'No, the outside always has more bass'".

### M10. The "louder sounds better" trap is only mentioned in one explanation
- **Where:** `lesson.ts:212` (the explanation for `s.solo`); `PTwoMic.tsx:119` ("at a controlled level").
- **Problem:**
  - The source stresses this in L48 ("so louder does not win automatically") and L71.
  - In the app, a learner only sees it if they answer one symptom card, and only after answering correctly. No item makes the learner face the error.
  - The polarity comparison is where it bites hardest: one polarity state often sums *louder*.
- **Principle at stake:** Confront misconceptions explicitly, and give retrieval practice on the misconception itself.
- **Fix:** Add `k.two.4`: "You flip B's polarity and the kick suddenly sounds bigger — and the meter shows the sum is 3 dB louder. What do you conclude? (a) 'Not yet — match the levels, then compare both states again in mono' ✓ (b) 'Inverted is better; keep it' (c) 'Normal was wrong because it was quieter'". The explanation should end with: "A louder version almost always sounds 'better' at first. Compare at matched level."

### M11. A "3:1" readout sits on the page that says 3:1 does not apply to this pair
- **Where:** `PTwoMic.tsx:101` (bezel "SPACING 3:1"), `:144`; screenshot 04 ("0.8 : 1").
- **Problem:** The bezel shows "0.8 : 1" as if it were a pass/fail gauge. A novice reads "fails 3:1, so phase trouble", which is exactly the coherence misconception the page warns against.
- **Principle at stake:** Signalling: whatever sits in the bezel is read as what matters.
- **Fix:**
  - Replace the cell with "LEVEL A vs B (ideal, by distance)", or drop it.
  - Move 3:1 to a note in the well: "3:1 check: 0.8 : 1. This guideline is for mics on *different* sources; it says nothing about whether this inside/outside pair works. Judge the pair in mono."

### M12. All retrieval comes straight after the reading, and nothing is cumulative
- **Where:**
  - every page's CHECK step follows its LEARN step within a minute or two;
  - Practice (`PReadPages.tsx:61-62`) reuses only practice-tagged items.
- **Problem:**
  - Retrieval straight after reading mostly tests short-term memory.
  - Practice is the natural place for mixed retrieval, but no item there reaches back to pages 2–5: pattern, power, polarity, port air.
  - The answer to `k.inst.1` appears almost word for word on the same page: the INTACT blurb in `lessons/m01Kick/geometry.ts:112` and the part text in `:66`.
- **Principle at stake:** Spacing and interleaving: delayed, mixed retrieval builds lasting memory and the ability to tell similar cases apart.
- **Fix:**
  - Make Practice a short mixed set: the C1 constructed task plus four interleaved items, one each on reference head, pattern null, polarity versus delay, and phantom power. Draw them from a pool, so a practice run differs from the first run.
  - Reword `k.inst.1` as a scenario so it is not a copy of the blurb: "The drummer's front head has no hole and they want to keep it. Your options?"

---

## MINOR

- **m1. The nav bar says MODULE; the rest of the lesson says PAGE.**
  - Where: `src/screens/lab/kit/labNav.ts:113` (`MODULE ${i + 1} · STEP`); the page body uses "PAGE 1 GOAL" (`MikingLessonScreen.tsx:214`), and the hub and end screen say "pages".
  - Fix: pass a unit noun through `useLabNav`, so the strip reads "PAGE 3 · STEP 2 / 3" here.
- **m2. The page goal is the least visible text on screen.**
  - Where: `MikingLessonScreen.tsx:214`, `:292`. It uses Oswald 10.5, amber, with wide letter spacing, and shows on the first step only.
  - Fix: set it at 13–14 pt in sentence case, and repeat a one-line form on the rack step: "Goal: rest the mic in two documented zones."
- **m3. Page 1's CHECK step brings in new content right before the question.**
  - Where: `PInstrument.tsx:120` ("Ask the player first … Drum Tuning Lab …").
  - Fix: move it to page 1's rack well as the closing card, so the CHECK step holds only the check.
- **m4. `k.prac.2` uses a genre as its cue.**
  - Where: `lesson.ts:165`.
  - Problem: "An alternative for a jazz drum…" pairs *jazz* with *outside*. The source warns that DPA's jazz and rock cases are examples, not genre rules.
  - Fix: "An alternative for a drum with an intact front head, where the drummer wants the head's natural ring?"
- **m5. The zone card says the same thing twice.**
  - Where: `engine/kit.tsx:49-50`. The band line and the quote line are nearly identical.
  - Fix: show the quote only, with the band as a tooltip, or the reverse.
- **m6. Screen-reader gaps.**
  - Where:
    - `kit.tsx:107` announces only "Correct." and the explanation is not read;
    - `PInstrument.tsx:108` reads the "✓/○" glyphs aloud;
    - the Practice choice chips (`PReadPages.tsx:71`) lack their field name, so the reader says "intact" without "Front head".
  - Fix:
    - announce `Correct. ${explain}`;
    - write "found" / "not yet" instead of the glyphs;
    - `accessibilityLabel={`${f.label}: ${c}`}`.
- **m7. The end screen shows no first-try results.**
  - Where: `answers` stores whether the first pick was right (`mikingProgress.ts:31`), but nothing shows it.
  - Fix: on the what's-left screen, show a review hint per page that never touches credit: "First try: 2 of 3 — worth a second look."
- **m8. Page 5 does not show progress on its activity.**
  - Where: page 5's activity (polarity both ways plus a move, `PTwoMic.tsx:65-71`) shows no progress on the rack step, unlike page 3's "n of 2".
  - Fix: add "Activity: polarity → − ✓ · back to + ○ · mic moved ○".
- **m9. A mic is drawn inside a drum with an intact head.**
  - Where: screenshot 08. The blocked mic is drawn *inside* the intact drum, outlined in red.
  - Problem: a novice may read that as "it got in".
  - Fix: draw the blocked attempt as a ghost at the head plane, with the line "can't pass an intact head".
- **m10. Specialist terms in shared kit text.**
  - Where:
    - "stays open — A/B while you watch" (`kit/rack/DockTray.tsx:159`);
    - "OVERLAY", "free field", "point source" and "Δd" in the badges (`PTwoMic.tsx:131`).
  - Fix:
    - "stays open — compare while you watch";
    - "straight-line paths (a drawing aid) · sound modelled from a single point with no reflections".
- **m11. The Sources page shows variable names and author-facing notes.**
  - Where:
    - `lesson.ts:280-288` shows variable names such as "(hHoop)", "(cHoop)", "(yFloor)", "(portY, portZ)", "(rodPhaseDeg)";
    - the "CORRECTIONS MADE TO THE LESSON TEXT" list (`PReadPages.tsx:131-134`, `lesson.ts:290-301`) is for the owner, not the learner.
  - Fix:
    - remove the code identifiers from learner text;
    - retitle the section "Where this lab differs from the original lesson, and why", or move it behind a "For reviewers ▾" toggle.

---

## What works well

- **Honest framing throughout.** Tones are described as *tendencies*. Each zone shows its source's own words and the head it is measured from. The lab never claims millimetre accuracy, and invented frequency curves are explicitly refused. This is uncommon, and it is right for the subject.
- **Evidence labels are never colour alone.** `ProvenanceTag` always prints the word, and TRIAL also uses a dashed border (`kit.tsx:27-35`). The bezel ZONE cell prints SOURCED, TRIAL or the name of the blocking part.
- **Feedback on placement is physical and immediate.** The mic stops at the part it would hit, and the line says which part ("× BATTER HEAD", screenshot 03). Clearance is also tied to "stop the drummer". This builds the safety habit through action.
- **Polarity versus delay is built in properly.** Credit on page 5 needs polarity flipped both ways *and* a moved mic. The ideal comb graph follows the drawing. The warning that the graph covers only the shared part of the sound (`PTwoMic.tsx:144`) is exactly the right limit to state.
- **Page 1 lets the learner act first.** They tap to discover the parts, with an accessible PART stepper for those who do not drag.
- **The eight-page arc follows the source's logic:** meet, choose, place, context, two mics, troubleshoot, practice, sources. The front-head choice made on page 1 carries forward and changes the start zones on pages 3 and 4. That is good adaptive continuity.
- **Credit is clear and kind.** Each page banks when it is done. "TO EARN CREDIT" states the requirement along with the learner's current standing. The what's-left screen lists each page and its requirement. START OVER (PRACTICE) keeps credit. Retries are never penalised. The hub shows "n of 8 pages".
- **Screen-reader text carries the same facts as the picture.** `describeScene` gives where the mic is, the head it is measured from, the zone with its source, and clear or blocked. It is built from committed state, so it does not chatter during a drag.
- **Plain, adult language.** I found no institutional wording (no classroom, instructor or student) and no upsell or "free" copy aimed at members. The preview and guest notes are factual.
- **Safety norms are stated as rules:** never provoke feedback, never cut a port, a boundary mic rests on the pillow only under its own manual.

---

## Top 5 to fix first
1. **C1:** rewrite the checks without length or absolute-word cues, remove brand and number recall, and make Practice a constructed setup task with more than one accepted answer.
2. **C2:** teach and check power, gain staging and hearing safety, or stop naming them as pass criteria.
3. **M1 + M2:** add a prediction before each rack activity, and give each wrong option its own explanation.
4. **M7:** let the learner aim the mic, not move the wedge, and give STUDIO a real decision.
5. **M5 + M6:** cut the duplicated readouts and the L/K codes, fix the bezel labels so "from batter" survives at 390 wide, and check the stale overlay in screenshot 02.


---

## Resolution (fix pass, 2026-10-04, branch `final-lab`)

Every critical and major finding is fixed (M12 in part); three minors are partial or deferred, with reasons. Lesson departures are logged in `docs/labs/miking/CORRECTIONS_LOG.md` (K-15 to K-26). Tests: `test/mikingReviewFixes.test.ts`. Captures at 390 × 844: `scratchpad/kick_shots_v3/`.

| ID | Status | What changed |
|---|---|---|
| C1 | FIXED | All 27 checks rewritten: wrong options are real misconceptions of the same length and form (the correct option is now the longest in 2 of 27; tests: never > 1.6× the mean of the others, longest in at most a quarter); no "always / any / never / every" in wrong options; no model names in options; the brand/number items (`k.mic.1`, `k.place.1`, `k.ctx.2`) became reasoning items. Practice is a constructed task: two briefs, five setups each with two or three passing, six reasons; `gradeSetup` checks the reasoning (documented + clearance + power required; brand / bass wrong). |
| C2 | FIXED | Hearing safety on page 1 (+ `k.inst.2`); a power choice `k.mic.4`; the setup sequence as an ORDER task and the gain item on Practice; the takeaway now matches what is assessed. |
| M1 | FIXED | Pages 2–5 open on the rack activity with an ungraded PREDICT FIRST card; the NULL cell reads "?" until the learner has predicted and acted; the explanation ("What you just saw") appears after the try, and the LEARN read follows the activity. |
| M2 | FIXED | A `why` for every wrong option of every scenario and symptom (validated); a wrong pick shows and announces its own explanation; a right pick announces the explanation too. |
| M3 | FIXED | Each mic card has three plain lines (power, mount, pattern) with SPEC DETAILS behind a toggle; choose items for power (`k.mic.4`) and mount (`k.mic.3`). |
| M4 | FIXED | "How to read this lab" on page 1, before the prompt: SOURCED, TRIAL READING, ILLUSTRATIVE, IDEAL MODEL, each with its tag drawn. The tag now reads "TRIAL READING". |
| M5 | FIXED | The NOW line is a screen-reader live region only; the landing is one line; at 390 wide the page-3 bezel keeps "FROM BATTER" and "OFF BEATER LINE" (capture 07); the stale overlay is fixed (capture 08). |
| M6 | FIXED | No L- or K-codes in learner text (tested on the lesson data and the page sources); sources named in words. |
| M7 | FIXED | Page 4: the monitor stays put and the learner aims the mic / chooses the pattern; STUDIO shows the decision card `k.ctx.studio`, which is part of the page credit. |
| M8 | FIXED | "DEEP NULL (ideal)" with no number below −25 dB; the "aim, not silence" line in the well. |
| M9 | FIXED | The near-batter zone tendency explains "maximum bass" as proximity effect; refutation item `k.place.3`. |
| M10 | FIXED | `k.two.4` (louder is not better; match levels, compare in mono); the page-5 LEARN text names the trap. |
| M11 | FIXED | No 3:1 cell on page 5; the note explains 3:1 is for different sources. |
| M12 | FIXED in part | Practice ends with a mixed review (reference head, pattern null, polarity vs delay; power is in both briefs); `k.inst.1` is reworded as a scenario. DEFERRED: drawing the items from a pool per run — progress is keyed on fixed item ids, so a pool needs its own per-run storage design. |
| m1 | DEFERRED | The nav strip's "MODULE" noun is the shared lab-nav house rule (`kit/labNav.ts`: "ALWAYS MODULE"); changing it is a cross-lab decision for the owner. |
| m2 | FIXED | The goal is 13.5 pt sentence case ("Page n goal: …"); on pages 2–5 it now sits on the rack step. |
| m3 | FIXED | "Ask the player first" moved to page 1's rack well; the CHECK step holds the hearing note and the checks. |
| m4 | FIXED | The jazz cue is gone (the old `k.prac.2` is replaced by the briefs). |
| m5 | FIXED | The zone card shows the source's words and the lab-drawn edges, not the band twice. |
| m6 | FIXED | Announcements carry the explanation; page 1 reads "found / not yet"; Practice chips are labelled "Front head: intact". |
| m7 | FIXED | The what's-left screen adds "First try: n of m right — worth a second look" per page; credit is untouched. |
| m8 | FIXED | Page 5 shows "Activity: polarity → − ✓ · back to + ○ · mic moved ○". |
| m9 | PARTIAL | The note now says "A stand mic cannot pass an intact head: mic it from outside." Drawing the blocked attempt as a ghost at the head plane is deferred (it changes the shared scene's stop drawing on every page). |
| m10 | PARTIAL | Page 5's badge is in plain words ("dashed = straight paths · one point source, no reflections"). DockTray's "A/B while you watch" is shared kit used by every lab — deferred. |
| m11 | FIXED | Unknowns are in words (identifiers kept in a code-only `dims` field); the corrections list is titled "Where this lab differs from the original lesson, and why" and shows no ids. |
