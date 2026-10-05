# Miking Lab 1 (Drums): skeptical review of the 17 lessons

Reviewer roles: (a) senior live and studio drum-miking engineer, (b) learning designer.
Date: 2026-10-05. The review was read-only: no code was changed, and nothing was run except two throw-away read scripts. Those scripts dumped the learner strings and computed the option statistics through `lessonById`, and both were deleted afterwards.

**The standard.** M01 Kick, as it stands after its two review passes (`kick/REVIEW_AUDIO_EXPERT.md` and `kick/REVIEW_COGNITIVE.md`, with their resolutions), plus `BUILDER_BRIEF.md`.

**Depth.** Six lessons were read line by line: M02 snare, M03 toms, M09 overheads, M10 room, M11 kit and SPK. The other ten were reviewed through their checks, numbers, safety text and voice: M04a–c, M05, M06, M07a/b, M08, M12 and M13.

**Counts: CRITICAL 2 · MAJOR 11 · MINOR 12.**

---

## What is right, and should stay

- All 17 lessons have the full 9-page journey.
- Every lesson has:
  - the 85 dBA / 8 h / 3 dB hearing item, marked critical in the quick check;
  - the order "mute the outputs, then phantom";
  - "gain on the strongest strokes" and "a fader does not undo input clipping";
  - "stop the player before anything moves";
  - two setup briefs graded on reasoning.
- The physics numbers check out:
  - c = 343 m/s, so 34 cm/ms;
  - 0.11 m ≈ 0.3 ms;
  - 0.56 m ≈ 1.6 ms;
  - 4 m ≈ 12 ms;
  - 3.4 m ≈ 10 ms;
  - 2.7 ms gives a first notch at ≈ 185 Hz;
  - 1 ms gives notches at 500 Hz and its odd multiples; inverted, at 0, 1, 2 kHz;
  - the ORTF figures: 17 cm, 110°, a maximum time difference of ≈ 0.5 ms;
  - the M-S matrix: L = M + S, R = M − S;
  - supercardioid null near 125°, hypercardioid null near 110°;
  - the snare's top and bottom heads moving the same way, so the two mics start opposite;
  - the timpani mode ratios: about 1.5, 2 and 2.5;
  - the open back of a speaker being opposite in polarity.
- "Polarity flips the sign; it does not remove a delay" is taught the same way in all 17 lessons.

---

## CRITICAL

### C1. The keyed answer to the snare's flagship reference-surface check is wrong in the lab's own model
`src/screens/lab/miking/lessons/m02Snare/lesson.ts:216-226` (`sn.place.1`)

**What is wrong.**
- The prompt: the zone is "2.5–7.5 cm above the RIM", and the readout says "5 cm above the batter HEAD". The keyed answer is "Not quite".
- The lab draws the hoop 10 mm above the head (`model.ts:37`, `H_UP`; unknowns at line 753). On a real snare it sits about 10–20 mm above.
- So 5 cm above the head is 3–4 cm above the rim, which is **inside** 2.5–7.5 cm. The zone checker would report IN.
- The distractor "Yes: 5 cm falls inside the band" reaches the right verdict, but for the wrong reason.
- The item therefore teaches the right principle with a false example. A sharp learner who works it out is marked wrong.
- M07b's version of the same idea is correct: there the readout is 5 cm *below the snare-side head*.

**Exact fix.**
- Change the prompt's readout to one that is clearly outside the band: "Your readout says 2 cm above the batter HEAD."
- Change the explain to: "The rim stands about 1 cm above the head here, so 2 cm above the head is only about 1 cm above the rim — under the 2.5 cm start, and close to the sticks."
- Pin it with a test: the item's numbers, converted with `H_UP`, must fall outside the zone.

### C2. Systemic test-taking cue: a "Yes…" option is never the right answer (0 of 67)

**What is wrong.**
- Across all 17 lessons (681 checks), 67 items have an option starting "Yes". The "Yes" option is correct in **0** of them.
- In the 63 items that offer both "Yes" and "No/Not", the "No/Not" option is correct 62 times. The one exception is `m03Toms tm.mic.3`, where neither option is correct.
- This sits alongside a second pattern: the hedged option ("Not yet: match the levels…", "compare both states…") is the key in most "should I…?" items.
- A learner who never picks "Yes" and always picks the hedge passes a large share of the twoMic, placement and context checks without reasoning.
- This is the same class of failure as Kick's cognitive C1. Kick shares it: `k.two.*`.

**Where it shows most.** The repeated stems:
- "Is X a rule?"
- "Does 3:1 make … coherent?"
- "Should the low mic be inverted…?"
- "Is that a fault to fix?"
- "Are you in it?"

They appear in M02, M04a–c, M05, M06, M07a/b, M10, M12 and M13.

**Exact fix.**
- Rewrite about a third of these items so that "Yes" is the reasoned key, with a condition attached. Examples:
  - M07b "Are you in it?" with a readout that *is* inside the band.
  - M10 `rm.two.*`: "Yes — the room is late by design; keep it."
  - M09: "Is the snare lined up? Yes — equal snare distance does that."
- Turn the others from Yes/No stems into "what do you do / what changes" stems.
- Add a ratchet to `test/_mikingItemRules.ts`, applied by every Lab 1 test: across a lesson's scenarios, symptoms and diagnostic, when a "Yes" option is present, "Yes" must be the key in at least 30 % of those items.

---

## MAJOR

### M1. The quick check is exempt from the length-cue rule, and several quick checks give their answers away
**Files:** `test/mikingLab1Drums.test.ts:95-97`, `test/mikingHandDrums.test.ts:270-281`, `test/mikingKitLessons.test.ts:174-176`, `test/mikingConcertLessons.test.ts:157-163`, `test/_mikingItemRules.ts:37`. Each counts "correct is the longest" over scenarios and symptoms only.

**What is wrong.**
- Measured on `diagnostic`, the correct option is the longest in:

  | Lesson | Correct is the longest |
  |---|---|
  | M05 | 6 of 6 |
  | M04c | 5 of 6 |
  | M02 | 4 of 6 |
  | M04a | 4 of 6 |
  | M04b | 4 of 6 |
  | M03 | 3 of 6 |
  | SPK | 3 of 6 |

- The critical hearing item `q.6` is the longest option in 11 of the 17 lessons.
- The quick check is what lets an EXPERIENCED learner skip the foundations (LESSON_JOURNEY §2.2/§2.5), so a "pick the longest" learner skips the hearing teaching.
- LESSON_JOURNEY §5 says the rules apply to "every check, quick check and practice item".

**Exact fix.**
- Include `lesson.diagnostic` in the longest-count in all five tests, with at most 1 of 6 per lesson.
- Then re-balance the options. M05 `m05Djembe/lesson.ts:559-620` comes first; make the wrong options the same length and form as the key.
- For every `q.6`, make one distractor as long as the key. For example: "Only that the mic will not distort; your ears need their own level and time limit" is a *correct* variant; turn it into a near-miss distractor instead.

### M2. Bottom and rear mic polarity is explained in contradictory ways across the lessons
**The physics.** Wherever two mics face opposite sides of one moving surface, they start opposite:
- the two heads of a snare or tom;
- a head and the open lower end of a conga, djembe, tonbak or timbale (the head moving down rarefies the air above it while it pushes air out of the foot);
- the front and back of a cone.

**What each lesson says.**
- M02, M03 and M07b explain this and say "inverting usually helps — check both states".
- SPK says "flip the rear mic, then judge".
- M04a (`m04aCongas/lesson.ts:355`) and M05 (`m05Djembe/lesson.ts:57`, `:332-337`) say "never invert a channel just because it is below the drum". M05 marks as WRONG "Yes — a mic below a drum is the one to invert, **as a rule of thumb**". That rule of thumb is exactly what the snare lesson teaches.
- M04a, M04b, M04c, M05, M12 and M13 never explain *why* a bottom or opening mic starts opposite.

A learner who takes the lessons in registry order meets three different models.

**Exact fix.**
- Use one sentence in every lesson that has a below or opening mic: "Mics facing opposite sides of a moving head usually start opposite — so flipping one is the first thing to TRY; then compare both states at matched level, in mono, because the delay can make either state better."
- Replace M05's wrong option with "Yes — and once flipped, it never needs checking again".
- Remove "never invert a channel just because it is below the drum" from M04a:355 and M05:57.
- Add a sound-page stage to M04a, M05 and M12 showing the head and the foot moving opposite ways, as M02 does.

### M3. The congas lesson misapplies 3:1 and contradicts Kick's definition
`m04aCongas/lesson.ts:338-347` (`cg.two.3`)

**What is wrong.**
- One mic per conga is two mics on two **different** sources: exactly where 3:1 applies.
- The `why` says "A spacing ratio is about spill between mics on different sources. These mics share the same drums." That is false for this pair, and it contradicts M01 and M12.
- The stem "a fixed ratio farther apart" / "three times farther apart" also misstates 3:1. The rule is mic-to-mic distance at least 3 × each mic's distance to its own source, not mics "three times farther apart".

**Exact fix.**
- New stem: "One mic per conga. Does placing them by 3:1 (each mic at least three times nearer its own drum than the other) make the sum trouble-free?"
- Key: "It reduces how much of the other drum each mic hears; still check the pair in mono."
- The distractor becomes: "Yes — once spaced 3:1, the pair cannot comb".

### M4. Kit: the phantom-count check assumes room mics are condensers, which the room lesson refutes
`m11Kit/lesson.ts:163-166` (`kt.mic.1`) and `:38` (takeaway)

**What is wrong.**
- The key, "Five — every condenser in the plan", counts "a pair of room mics" as condensers.
- M10 `rm.mic.3` teaches "Common, not required: a dynamic or ribbon can suit". M10 `rm.mic.4` warns that ribbon and phantom compatibility varies.
- The M11 takeaway also states a fixed role-to-mic map: "small condensers over cymbals and in the room".

**Exact fix.**
- Stem: "…two small-condenser overheads, a pair of condenser room mics and a hi-hat condenser…".
- Takeaway: "…small condensers are common over the cymbals and in the room — count whatever condensers you choose: each needs phantom."

### M5. Timpani: the explanation of the reference-surface check is factually wrong
`m06Timpani/lesson.ts:204`

**What is wrong.**
- The explain says "1 m above the floor is below the height of most timpani heads".
- The lab draws the heads at 760 mm (`lesson.ts:550`). Real heads sit at about 0.7–0.9 m.
- So 1 m above the floor is about 0.25 m **above** the heads. The `why` on line 206 ("roughly at head height") is close; the explain contradicts it.

**Exact fix.** "A distance only means something with its reference. The heads here sit about 0.76 m up, so 1 m above the floor is only about 25 cm above them — far closer than the starting point."

### M6. M12 and M13 teach "a wedge should NOT go straight behind a supercardioid"
`m12Tonbak/lesson.ts:273-280`, `m13Tabla/lesson.ts:272-279`

**What is wrong.**
- In the ideal pattern (0.37 + 0.63 cos θ), straight behind is about −11.7 dB, while the sides are about −8.6 dB.
- So straight behind is a *better* wedge spot than the sides. The worst spot is in front.
- The NOT framing teaches a false ranking: that the rear is a bad place for a monitor. It is also a negative stem, which the item rules avoid elsewhere.

**Exact fix.**
- Reword positively, as in M02 `sn.ctx.2`: "With a supercardioid on the stand, where does a wedge get the most rejection?"
- Key: "Toward the rear, off to one side of the axis".
- Distractors: "Directly behind…", "Beside the mic…".

### M7. SPK says the highs come out of both horn bells
`spk/pages.tsx:96` ("Two horn bells … The highs … come out of the turning bells")

**What is wrong.**
- On the classic rotary cabinet, one bell is the driver's horn and the other is a blocked dummy for balance.
- This matters for miking: the upper mic hears **one** sweep per revolution, not two. That sets the tremolo rate a mic hears and the stereo pair's alternation.
- The unknowns (`lesson.ts:730`) admit "whether both horn bells radiate is not stated", yet the learner text asserts that they do.

**Exact fix.** "Two horn bells turning on one axis at the top — on the classic cabinet only one sounds; the other balances it. The highs, above about 800 Hz, sweep past once per turn."

### M8. Toms: "aim toward the centre = more low end, less attack" is muddled with the strike point
`m03Toms/lesson.ts:229-237`, `:556` (prediction), `copy.ts:78`, `:80`, `:90`, `model.ts:115`, `:210`

**What is wrong.**
- The source (DPA, correction T-01) describes the mic's **position**: nearer the rim versus toward the centre.
- The lesson turns this into **aim** while keeping the mic at the rim. Aiming at the stick's strike point, near the centre, is what most engineers use to get *more* stick attack.
- The lesson itself says "the attack starts where the stick meets the batter head" (`tm.rec.1`).
- So a learner gets "aim at the strike → less attack" next to "the attack starts at the strike".

**Exact fix.**
- Make it about position, not aim. Stem: "You move the mic in from over the rim toward the centre (still clear of the sticks)…"
- Key: "More low end and body; less of the rim's higher attack".
- Add one line to `copy.ts:90`: "Aim at where the stick lands for more of the strike itself."

### M9. Voice: "one engineer's account" and "published" survive in four lessons
**Where.**
- `m04cTimbales/lesson.ts:143`, `:230`, `:237-238`, `:383`, `:782`; `model.ts:86`, `:123`
- `m05Djembe/lesson.ts:45`, `:212`, `:709`, `:774`; `model.ts:128`
- `m04bBongos/lesson.ts:710`, `:778`
- `m12Tonbak/lesson.ts:702`

**What is wrong.**
- The owner's ruling: learners see "after our research, here is where we recommend you begin", with no citations and no "guide says".
- "One engineer's studio preference", "No published source gives a timbale mic distance" and "One published top mic sits 5–10 cm…" are citation voice, which Kick does not use.
- `test/mikingLearnerText.test.ts` does not catch them.

**Exact fix.**
- Reword as starting points:
  - "Another idea to try: from beneath the drum…";
  - "We could not find a recommended distance, so these are regions to begin in…";
  - "Two starting points: very close, or about 41 cm — different sounds, not rules."
- Add `/\b(published|one engineer|engineer’s account)\b/i` to the learner-text ban.

### M10. Kit Brief 1 fails a plan that the same lesson's studio check endorses
`m11Kit/lesson.ts:521` (option `d`)

**What is wrong.**
- "Every drum and cymbal spotted, the overheads only for cymbals" is graded **fail**, with the feedback "may be unnecessary". A hedge is not a reason to fail.
- `kt.ctx.studio` (line 295) teaches "Separate tracks keep later decisions open", and the takeaway says a fully spotted plan "can be right".

**Exact fix.** Keep it failing, for a stated reason: "Overheads used only for cymbals give up the open whole-kit picture this brief asks for — spot mics can be recorded, but the picture comes from the overheads first." Or make it pass with "if the overheads are set for the whole kit".

### M11. Try-before-tell gaps against the Kick standard
**What is wrong.**
- Kick opens pages 2–5 and the two-mic page with an ungraded PREDICT card (cognitive M1).
- M11 has no prediction on `placement` or `context` (`m11Kit/lesson.ts:544-546`).
- M10 has none on `sound` (`m10Room/lesson.ts:545-548`).

**Exact fix.**
- M11 placement: "Predict: you add a close tom mic to the four-mic base. What else gets louder in it?" (options: the rest of the kit / only the tom / it depends).
- M11 context: "Which channels does the PA need first on a loud small stage?"
- M10 sound: "A room mic 5 m away and an overhead 1 m away: which hears the snare first, and by how much?"

---

## MINOR

1. **Room: the wrong mechanism for "the room's share grows"**
   - Files: `m10Room/lesson.ts:107`, `:155`.
   - The text says "the reflections arrive closer behind it". That is incidental.
   - Fix: "the direct sound falls about 6 dB each time the distance doubles, while the room's reverberant sound stays roughly even — so farther out, the room takes over."
2. **3:1 is only ever taught as "does not apply"**
   - Where: M01 and M12, plus M04a (wrongly).
   - No lesson shows the case where it *does* apply: adjacent tom spots, or kit spots against each other.
   - Fix: add one positive 3:1 line to M03 `tm.place.3` or M11's bleed page, with M01's definition word for word.
3. **SPK is filed under Lab 1 (Drums)**
   - Lab 1's blurb says "a drawn drum". SPK repeats `c02GuitarAmp` almost verbatim: `spk.two.1` ≈ the C02 item at `lesson.ts:329`, and the snd/set items too.
   - Owner call: move it to Lab 4, or cut the duplicated checks and link "see Electric Guitar".
4. **Rotary-cabinet speeds**
   - `shared/speakers/rotor.ts:31-32` shows the low rotor fast at 372 rpm and the horn slow at 44 rpm. The classic cabinet is about 340 and 48.
   - They are labelled "one adjustable cabinet's defaults", which is acceptable.
   - Fix: add "classic cabinets run the low rotor slower" to the speed-switch blurb (`spk/pages.tsx:504-505`).
5. **Bongos: a number-recall check**
   - `m04bBongos/lesson.ts:153-154` asks the learner to recall "1.19 = 8⅝ ÷ 7¼", the lab's drawn sizes.
   - Fix: test the relation, not the drawn number. "A head 20 % larger at the same tension sounds… lower by about the same proportion."
6. **Tabla: a recall item on an unverified fact**
   - `m13Tabla/lesson.ts:93-94` keys the bayan patch as "off-centre, toward the player".
   - The research marks this fact "Medium" and not re-read (`tabla/SOURCES.md:24`). The direction is recall, not reasoning.
   - Fix: verify it, and grade "off-centre" only.
7. **Room: a check that is recall of the lab's convention**
   - `rm.place.1`, `m10Room/lesson.ts:212-214`: "In front of what? The kick's front head" can only be recalled from the lab, not reasoned out.
   - Fix: give the reference in the stem and ask what changes if it is measured from the snare instead.
8. **Kit: a recall check**
   - `kt.mic.2`, `m11Kit/lesson.ts:175-178`: "Which kind of mic is a common choice for a close tom spot?"
   - Fix: replace it with a properties scenario: low profile, no phantom, under a low crash.
9. **Duplicate IDs in the corrections log**
   - `CORRECTIONS_LOG.md:72-80` vs `:120-121` both use S-01 and S-02 (snare and kit).
   - `:86-88` vs `:126-128` both use T-01 to T-03 (toms and timpani).
   - Fix: prefix them by lesson (S2-, K11-, T3-, TP-).
10. **The same three items appear in all 17 lessons**
    - The polarity/Δt prediction, the item "flip → Δt?" and the item "what removes the delay?" appear nearly word for word.
    - The consistency is good, but by the fifth lesson the answer is memorised, not reasoned.
    - Fix: vary the scenario per instrument (a different source and a different symptom), keeping the same principle.
11. **Snare: the low-end lift needs one more clause**
    - `sn.place.2` says "less proximity effect" on lifting the mic from 5 cm to 12 cm. That is fine for a dynamic, but the Kick standard adds "with a directional mic".
    - Fix: append "(with a directional mic)" to the explain at `m02Snare/lesson.ts:233`.
12. **Overheads: the X/Y mono advice is slightly overstated**
    - `ov.two.3` (`m09Overheads/lesson.ts:339-342`).
    - Fix: add "it can still colour off-axis sources through each capsule's off-axis response — just not by comb filtering".

---

## Top 5 to fix first

1. **C1:** the snare's `sn.place.1` key is wrong in the lab's own model. Change the readout to 2 cm.
2. **C2:** "Yes" is never correct, in 0 of 67 items. Re-key about a third and add the ratchet.
3. **M2 + M3:** one bottom-mic polarity model across all lessons, and the conga 3:1 explanation fixed.
4. **M1:** apply the length-cue rule to the quick check, starting with M05's 6 of 6 and every `q.6`.
5. **M5, M6, M7:** the technical errors in timpani "1 m above the floor", "not behind a supercardioid", and the horn's dummy bell.

---

## Resolution (fix pass, branch `miking-fix1`, 2026-10-05)

Each finding was checked against the code and the physics before anything changed. **Totals: 21 fixed · 2 partly fixed (M2: no new animation stage; M8: the reworded mechanism was rejected) · 3 rejected (M6; minors 3 and 10).**

### Engine-wide guards (new; they cover every lab, including lessons added later)

- **`test/mikingItemBalance.test.ts`** reads every lesson in the registry and checks four things.
  - **Length.**
    - In every check, symptom and quick-check item, the correct option is ≤ 1.25 × the mean length of the others.
    - Per lesson, the correct option is the longest in ≤ ¼ of all items, and in ≤ 2 of the 6 quick-check items.
    - No wrong option says always, any, never or every.
  - **Answer pattern, per lab.**
    - On yes/no items, neither "Yes" nor "No" is the key in more than 70 % of items.
    - Where a "Yes…" option is offered, "Yes" is the key in at least 30 %.
    - Where a "No…/Not…" option is offered, "No/Not" is the key in at most 70 %.
  - **Shown slot.** The slot an answer is shown in holds it in no more than 50 % of items, both engine-wide and per lab, and in no more than 60 % per lesson.
  - **Polarity.**
    - Every lesson that discusses a bottom, opening or rear mic's polarity quotes `OPPOSITE_SIDES_POLARITY` word for word.
    - No learner text says "never invert" or "rule of thumb".
    - No key calls inverting a rule.
- **`engine/model/itemOrder.ts`** (new) decides the order the options are shown in.
  - The order used to be seeded by the item id alone. Ids repeat across lessons (`q.6`, `s.mono`), so the same item put its answer in the same slot in every lesson.
  - The seed now mixes the id with the options, and the shuffle uses the LCG's high bits.
  - `kit.tsx` and `journeyKit.tsx` both use it.
- **`engine/model/sharedItems.ts`** (new) holds two shared pieces.
  - `OPPOSITE_SIDES_POLARITY` is the one shared explanation of an opposite-side mic's polarity:
    - mics on opposite sides start opposite;
    - flipping one is a common first thing to try, never a rule;
    - polarity flips the sign and leaves the delay;
    - check both states by ear, at matched level, in mono.
  - `micRatingCheck` is the max-SPL check. The reasoned key is now "Yes — it will not distort; it says nothing about your ears". It replaces the "Does that tell you…? No" item in about 30 lessons.
- **`test/mikingLearnerText.test.ts`** now also bans citation voice: "one engineer", "engineer's account", and "no published" / "published source|guidance|…". "A mic's published response" stays allowed, because it refers to a spec sheet.

### Critical

| # | Verdict | What changed |
|---|---|---|
| C1 | **Fixed**. Confirmed: `H_UP` = 10 mm, so 5 cm above the head is 4 cm above the rim, inside the band. | `sn.place.1` now states the 1 cm step. The key is "Yes — measured from the rim, that is about 4 cm". The "inside whichever surface" distractor has the right verdict for the wrong reason. The explain adds that 2 cm would fall outside. Pinned in `mikingLab1Drums.test.ts` against `SNARE_ZONES` and `H_UP`. |
| C2 | **Fixed**. "Yes" used to be the key in 0 of 67. | **Now:**<br>• Drums: "Yes" is the key in 22 of 67 items that offer it, and "No/Not" in 51 of 78.<br>• Strings: 19 of 55 and 48 of 70.<br>**Re-keyed:**<br>• the max-SPL check, in every lesson;<br>• M02 `sn.place.1` and `sn.two.4`;<br>• M03 `tm.two.3`;<br>• M05 `dj.two.3`;<br>• M09 `oh.two.1`;<br>• M10 `rm.two.1` and `rm.place.3`;<br>• M04a `cg.two.3`;<br>• M04c `tb.place.3`;<br>• C05A `place.1`;<br>• C09b `va.two.4`;<br>• C12 `cv.two.4`.<br>Each "Yes" key carries a condition, and a second "Yes" distractor carries the wrong one, so "always pick Yes" fails. The ratchet is in the engine-wide test, not in `_mikingItemRules.ts`. |

### Major

| # | Verdict | What changed |
|---|---|---|
| M1 | **Fixed**, with a limit of ≤ 2 of 6 rather than 1. | The quick check now counts toward the length rules, both engine-wide and in `mikingLab1Drums.test.ts`. The `q.6` near-miss now reads "It is safe for a while, as long as…" in every lesson. M05 dropped from 6/6 to 1. M02, M03, M04a–c, M09, SPK and ten Lab 4 lessons were also rebalanced. A limit of ≤ 1 was not adopted: with three options, chance is 2 of 6, and a key that is never the longest becomes a cue of its own. |
| M2 | **Fixed**; the new stage is text only. | One shared sentence is now used in M02, M03, M04a, M05, M07b, M12, SPK, C02, C04 and C12. "Never invert a channel just because it is below the drum" was removed from M04a and M05. M05's "rule of thumb" item was rewritten, and its new distractor is "…needs no further checking". In M04a, M05 and M12, the existing "air is pushed" sound stages now say that the head and the foot push opposite ways. There is no new animation stage, because that needs an art review. |
| M3 | **Fixed** (confirmed). | `cg.two.3` now treats one mic per conga as the case where 3:1 applies, using Kick's definition. The key is "Yes — each hears less of the other drum; still check in mono". The distractor is "…can no longer comb at all". |
| M4 | **Fixed** | The `kt.mic.1` stem now names condenser room mics. The takeaway says small condensers are common, and to count whichever condensers you choose. |
| M5 | **Fixed** (confirmed: the heads are drawn at 760 mm). | The explain and the why now say that 1 m above the floor is only about 25 cm above the heads. |
| M6 | **Rejected**, on the lead's ruling. | A supercardioid has a rear lobe, and its nulls lie off the rear axis, as Kick teaches. So "a wedge should not go straight behind" is correct, and the key stays in M12 `tb.ctx.2` and in M13. The "rear sides" distractor is the best spot, so the item still separates the null from the lobe. |
| M7 | **Fixed** (confirmed). | `spk/pages.tsx` now says one bell sounds and the other is a blocked balance bell, so a mic hears one sweep per turn. `bellToMic` now follows the sounding bell only, and its test was updated. `LeslieDisplay`'s plan view draws the balance bell capped, and the inside-view label now reads "HORN ROTOR (ONE BELL SOUNDS)". The side view still draws both bell shapes alike. The a11y label and the unknowns note were updated. |
| M8 | **Partly fixed**; the change to the mechanism was **rejected**. | The source (DPA, `toms/SOURCES.md` L72) speaks of "pointing" toward the rim or the centre. So the lesson's wording about aim is faithful, and it stays aim, not position. To clear up the confusion, the key now reads "less of the rim's higher-pitched attack". The explain says this is not the stick's strike itself. |
| M9 | **Fixed** | M04b, M04c (lesson and model), M05 (lesson and model) and M12 are reworded as starting points. The new ban also found M04a, C05A, C07, C14 and C15, which are fixed too. |
| M10 | **Fixed** | Plan `d` now fails for a stated reason: cymbal-only overheads give up the whole-kit picture that the brief asks for. |
| M11 | **Fixed** | Predictions were added to M11's placement and context pages, and to M10's sound page (12 ms). |

### Minor

| # | Verdict | What changed |
|---|---|---|
| 1 | **Fixed** | M10: the direct sound drops 6 dB per doubling of distance, against an even reverberant field. Both explains now say so. |
| 2 | **Fixed** | M03 `tm.place.3`: one mic per tom is where 3:1 applies, in Kick's words. M04a also teaches it now. |
| 3 | **Rejected**: the owner's call. | Moving SPK, or cutting what it duplicates, is a catalogue decision. |
| 4 | **Fixed** | The FAST blurb now says these speeds are one adjustable cabinet's settings, and that classic cabinets run the low rotor slower. |
| 5 | **Fixed** | `bg.rec.1` now tests the relation: a head 20 % wider sounds about 1.2 times lower. |
| 6 | **Fixed**: graded on "off-centre" only. | The direction could not be verified (the research rates it Medium). The checks no longer key "toward the player", and the learner text says "drawn here toward the player". |
| 7 | **Fixed** | `rm.place.1` now asks what goes wrong when the 1 m is measured from the snare. |
| 8 | **Fixed** | `kt.mic.2` is now a properties scenario. |
| 9 | **Fixed** | Kit IDs K11-01 and K11-02; timpani IDs TP-01 to TP-03. The comment in `m06Timpani/model.ts` was updated too. |
| 10 | **Rejected** for this pass, because it is not cheap. | Varying the polarity/Δt trio per instrument across 37 lessons needs its own content pass. The yes/no and shown-slot guards now stop a memorised answer form or position from carrying over between lessons. |
| 11 | **Fixed** | M02 `sn.place.2` now adds "(with a directional mic)". |
| 12 | **Fixed** | M09 `oh.two.3` now says that an X/Y pair has no comb filtering between its capsules but can still colour sources off-axis. |
