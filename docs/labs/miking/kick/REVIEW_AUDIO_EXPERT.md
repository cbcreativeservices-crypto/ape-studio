# M01 Kick Drum: audio-expert review

Reviewer stance: a senior live-sound and studio engineer, reviewing as a sceptic.
Date: 2026-10-04. The review was read-only; this report is the only file written.

Read for this review:
- `source_text/Kick-Drum-Miking-Technique-Research.txt`
- `kick/SOURCES.md`, `SOURCES_SHARED.md`, `CORRECTIONS_LOG.md`, `ENGINE_BLUEPRINT.md` (§6, §7, §16)
- `lessons/m01Kick/{model,geometry,lesson}.ts`, `data/micTypes.ts`
- `engine/physics/*.ts`, `engine/geometry/{zones,readouts}.ts`, `engine/a11y/describe.ts`, `engine/model/units.ts`
- `engine/scene/{CombPanel,PlacementScene,sceneWords}.tsx/.ts`, `engine/kit.tsx` (ZoneCard)
- `pages/*.tsx`
- the 8 screenshots in `scratchpad/kick_shots/`

Paths below are relative to `src/screens/lab/miking/` unless they start with `docs/`.

**Counts: CRITICAL 1 · MAJOR 10 · MINOR 18.**

The physics core is right. I checked the speed of sound, Δt, the notch formulas, the polarity-versus-delay framing, the supercardioid coefficients, the null angle, the −11.4 dB rear lobe, the −9.54 dB 3:1 figure and the unit conversions, and found no errors. The problems are in three places:
- what the lesson teaches is missing from the app (hearing safety, gain staging, the one-mic procedure);
- where a readout implies more than the model can know (null depth, 3:1 on one source, the comb's level ratio);
- where the line between "sourced" and "illustrative" leaks (zone radial bands, an unlabelled polar lobe).

---

## CRITICAL

### C1. The lesson's hearing-safety section (NIOSH) is not taught anywhere in the app
- **Where:** absent from every page. NIOSH appears only as a reference row: `lessons/m01Kick/lesson.ts:265`. The mic max-SPL figures are printed with no hearing caveat: `data/micTypes.ts:31`, `:51`, `:95`, shown by `pages/PMicrophone.tsx:89-93`. The lesson text is at L10, with the gap restated at L94.
- **Problem:** the owner's lesson opens its safety section with hearing protection. It names the NIOSH REL of 85 dBA over 8 h with a 3 dB exchange rate, says this is "unrelated to a microphone's maximum SPL rating", says to measure where the human is (not inside the drum), and says to cut volume and duration and use protection. None of that reaches the learner. The only pointer is the Sources-page "gaps" line (`lesson.ts:277`), which is phrased as a source gap and is not an instruction.
  - Meanwhile page 2 shows "Max SPL 174 dB", "> 160 dB" and "156dB SPL RMS".
  - A beginner seeing kick mics rated near 160 to 174 dB, with no hearing statement anywhere, is exactly the "max SPL as hearing limit" misconception the lesson warns against.
- **Why it matters:** this is the one safety item in the lesson that protects the learner's own body. A kick soundcheck means many repeated loud hits. It was cited [8] and checked CONFIRMED in `kick/SOURCES.md` §e, and then left out.
- **Fix:** add a warn Note to page 1's CHECK step (`pages/PInstrument.tsx`, before the ScenarioList at line 120) and repeat it under the mic cards on page 2 (`pages/PMicrophone.tsx`, next to the phantom Note at line 96). Exact wording:
  > Protect your hearing during repeated hits and soundcheck. NIOSH recommends no more than 85 dBA averaged over an 8-hour day, and halving the time for every 3 dBA above that. That is a limit for people, measured where a person listens. It has nothing to do with a microphone's maximum SPL rating, and a mic inside a drum is not a hearing meter. Keep levels and repetitions down and use hearing protection (L10, NIOSH).

  On page 2, under the examples, add:
  > Max SPL figures are distortion limits for the mic, set by each maker under its own test conditions (1 %, 0.5 % or 10 % THD), so they do not compare one-to-one. None of them is a safe listening level.

---

## MAJOR

### M1. The gain-staging procedure and the one-mic setup procedure (L13, L42-49) are missing
- **Where:** no page carries them. Fragments exist only in zone checks (`lessons/m01Kick/model.ts:82`, "Input overload on the strongest strokes") and in one symptom explanation (`lesson.ts:204`).
- **Problem:** the lesson's practical core is a 7-step procedure:
  1. ask the player;
  2. choose by spec and mount;
  3. have the drummer stop, mount, and check the whole assembly;
  4. follow the power procedure, then set gain with margin for the strongest strokes;
  5. compare positions, one variable at a time;
  6. listen solo, then in the band, at matched levels;
  7. keep the simplest position.

  L13 adds four rules: set gain using the strongest intended strokes; watch the preamp overload indicator; a lowered fader does not undo clipping; use a pad only as its manual allows. The final assessment (L89) explicitly grades "correct power and level checks", but the app never teaches them as a sequence.
- **Fix:** add a read Card to page 7 (`pages/PReadPages.tsx`, inside `PPractice` before the ScenarioList) titled "ONE-MIC SETUP, IN ORDER". Exact wording:
  > 1. Ask the player: is the front head intact or ported, and what should the kick do? No modification to the drum.
  > 2. Choose a mic whose specifications and mount suit the source, the position and the stage or studio.
  > 3. Have the drummer stop. Mount it at a documented starting point; check the whole assembly (mic, stand, cable, connector) for clearance.
  > 4. Follow the equipment's power and connection procedure. Then have the player play typical AND strongest strokes, and set input gain with headroom, watching the preamp or interface overload indicator. A lowered fader does not undo clipping that already happened at the input. Use a mic or input pad only as its manual permits.
  > 5. Compare beater-side and resonant-side positions only where the drum allows safe repositioning, one variable at a time.
  > 6. Listen to the channel alone, then with the kit and band, at similar levels, so that louder does not win.
  > 7. Keep the simplest position that works, with safe clearance and a stable live system (L42-49, L13).

### M2. Page 4's wedge exercise models the stage backwards and ignores the shell
- **Where:** `pages/PContext.tsx:29`, `:55-60`, `:148`; screenshot `06_page4_live_wedge_in_supercardioid_null.jpg`.
- **Problem, three parts:**
  - **(a) The learner moves the wedge around a fixed mic.** On a stage the wedge or drum fill stays where the drummer needs it, and the engineer turns the mic or chooses its pattern. The lesson says "aim nulls according to the actual pattern" (L68).
  - **(b) The rewarded position is somewhere no monitor goes.** With the ported default, the mic sits inside the drum 6 cm from the batter head, facing the player. The ideal supercardioid null at about 125° then puts the "correct" wedge out in front of the kick on the audience side, which is where screenshot 06 shows it. A drummer's wedge or drum fill sits beside or behind the drummer, close to the inside mic's FRONT axis. That is the real-world problem with an inside kick mic, and the exercise teaches the opposite picture.
  - **(c) The shell is ignored.** The model treats the inside mic as free field. In reality the shell and both heads sit between the mic and the wedge and do much of the isolating. The page says "the stage reflects sound", but nothing about the shell.
- **Why it matters:** a learner leaves thinking "put the monitor at 125°", rather than "aim the mic's null at where the monitor actually is, and know the drum itself shields an inside mic".
- **Fix (best):** fix the wedge at a realistic illustrative spot (drummer's side, at floor level) and make WEDGE ANGLE an AIM or PATTERN exercise on the mic. Default the exercise to an OUTSIDE position (`dpa.outside` with `kickDynSuper`, which that zone already allows), where free-field reasoning is defensible.
- **Fix (minimum, wording only):** add this Note to the LIVE well (`PContext.tsx`, after line 161):
  > On a real stage the wedge stays where the drummer needs it; you turn the mic or choose its pattern so that a null faces the wedge. Here the wedge moves only to show where this pattern rejects. A mic INSIDE the drum is also shielded by the shell and heads, which this free-field pattern ignores. The drummer's own fill usually sits close to an inside kick mic's front axis, where no pattern rejects.

### M3. Ideal null depths are printed as if real (−52.4 dB, "below −60 dB")
- **Where:** `pages/PContext.tsx:97` (screenshot 06 reads "IDEAL PICKUP −52.4 dB"), `pages/PMicrophone.tsx:111`, `:56` (`fmtDb(gainDb(...))`), `engine/model/units.ts:91-96`.
- **Problem:** an ideal first-order null is infinitely deep, so any number near it is an artefact of where the fader landed. Real kick mics give somewhere around 10 to 25 dB of rejection near the null, frequency-dependent and shallowest in the lows, which is where kick feedback lives. A bezel reading "−52.4 dB" teaches that a null removes the monitor.
- **Fix:** in the IDEAL PICKUP bezels and fader formats on pages 2 and 4, clamp the display. Below −25 dB, print `NULL (ideal)` and do not print a number. Add this caption under the page 4 bezel, and in the page 2 well when the angle is within 15° of a null:
  > An ideal pattern's null is infinitely deep on paper. Real microphones reject far less there, and least at low frequencies.

### M4. The polar lobe on pages 3 and 5 has no IDEAL label and uses the "sourced" colour
- **Where:** `engine/scene/PlacementScene.tsx:265-290` (PolarSlice, `color={BLUE}`); badge text at `pages/PPlacement.tsx:148` and `pages/PTwoMic.tsx:131`.
- **Problem:** blueprint §6.1 promised the label "IDEAL PATTERN · slice in this view". Pages 3 and 5 draw a filled blue lobe with no label, and blue is defined on the same badge as "blue = sourced" for zones. The lobe is also drawn with a 170 mm radius in drum millimetres, so it reads as a pickup reach inside the shell.
- **Fix:**
  - draw the lobe in a colour that is not the zone blue, for example the existing neutral grey or white at low opacity;
  - append to both badges: `· lobe = IDEAL pattern shape, not a range`;
  - add a small in-canvas tag next to the lobe: `IDEAL PATTERN · slice in this view`.

### M5. Zone radial bands are lab-drawn, but the zone shows as fully SOURCED
- **Where:** `engine/kit.tsx:42-56` (ZoneCard prints `bandProv` only); `lessons/m01Kick/model.ts:78`, `:94`, `:142` (`radial.prov` is illustrative); the bezel prints "SOURCED" (`pages/PPlacement.tsx:122`).
- **Problem:** three zones have lab-invented radial limits that the card never discloses:
  - `b52.near`: 1 to 8 cm off the beater line, for the guide's "slightly off-center";
  - `b52.far`: within 1.5 cm, for "on-axis with beater";
  - `dpa.outside`: 18 to 30 cm, for "on the edge".

  The lesson requires that sourced, trial and illustrative content be kept visibly separate (L96-97; charter).
- **Fix:** in ZoneCard, after line 51 add:
  `{z.radial?.prov && z.radial.prov.kind !== 'sourced' ? <Text style={styles.small}>{`Off-line band drawn by the lab: ${z.radial.prov.kind === 'illustrative' ? z.radial.prov.reason : z.radial.prov.note}`}</Text> : null}`

  When the pose is in a zone whose radial or distance band is lab-drawn, change the bezel ZONE value to `SOURCED*`, with the footnote "* band edges drawn by the lab".

### M6. Zone membership ignores where the mic is aimed
- **Where:** `engine/geometry/zones.ts:51-77`. No zone in `model.ts` constrains aim.
- **Problem:** a mic pointed at the front head, or at the floor, 6 cm from the batter head counts as "in the Beta 52A guide zone" and earns `twoZones` credit. The documented positions include orientation. The 20 to 30 cm row says "on-axis with beater". S-LIVE's Position D and the boundary row assume the element faces the beater head. Elsewhere the lesson says angle is a separate variable that matters (L39).
- **Fix:** add an optional `aim: { maxOffAxis: number; prov: Provenance }` to `DocumentedZone`. Test it in `inZone` using the same `offAxis` that `readouts.ts:141` computes. Set `maxOffAxis: 30` (marked illustrative) on `b52.near`, `b52.far`, `live.D` and `dpa.outside`, with the reason "aimed at the head it is measured from; ±30° is the lab's tolerance". If that is out of scope for v1, add a line to ZoneCard instead: "Aim is not part of this zone test; the guide's position assumes the mic faces the head."

### M7. A "3:1" ratio is shown for two mics on ONE source
- **Where:** `pages/PTwoMic.tsx:63`, `:101` (screenshot 04 shows "SPACING 3:1 · 0.8 : 1"); `engine/physics/levels.ts:122-126`.
- **Problem:** 3:1 is a guideline for mics on DIFFERENT sources: each mic should be three times farther from the other source than from its own. For an inside/outside pair on one drum the ratio has no meaning, and the page's own Note says so (`PTwoMic.tsx:144`). Printing a number under a "3:1" heading invites the learner to "fix" it by moving mics.
- **Fix:** replace the bezel item with `{ k: '3:1 RULE', v: 'N/A · ONE SOURCE' }`, or remove it from this page and teach 3:1 where two sources exist (a later kick+snare or overhead page). Keep the Note.

### M8. The comb model throws away the rear-lobe sign, contradicting page 2
- **Where:** `engine/scene/CombPanel.tsx:52-53` (`Math.abs(micGain(...))`), `:76` (`notchesHz(dt, pol, ...)` uses only the switch).
- **Problem:** page 2 teaches that the ideal supercardioid has "a small inverted lobe directly behind". If the SOURCE (for example the resonant head) falls in a directional mic's rear lobe, the ideal model inverts that mic's output. The comb should then flip between the "sum" and "difference" sets even with the POLARITY switch at "+". `Math.abs` hides this, so on the page that teaches polarity, the graph and the notch ticks show the wrong set in that case.
- **Fix:** use signed gains, and an effective sign for the ticks and the text:
  ```ts
  const gA = isModelled(patA) ? micGain(patA, pa, source) : 1000 / Math.max(1, dist(pa.p, source));
  const gB = isModelled(patB) ? micGain(patB, pb, source) : 1000 / Math.max(1, dist(pb.p, source));
  const sEff = (pol * Math.sign(gA || 1) * Math.sign(gB || 1)) as 1 | -1;
  // combDb(f, dt, Math.abs(gA), Math.abs(gB), sEff); notchesHz(dt, sEff, …)
  ```
  Apply the same `sEff` in `pages/PTwoMic.tsx:62` and `:143`. When `sEff !== pol`, show this Note:
  > The source is in mic X's rear lobe; an ideal rear lobe is polarity-inverted, so the notches follow the inverted set.

### M9. The promised near-field disclosure is missing, yet the comb's level ratio relies on 1/r
- **Where:** `engine/physics/twoMic.ts:319-324` (`micGain` = pattern ÷ r); `engine/physics/levels.ts:4-5` and `docs/labs/miking/SOURCES_SHARED.md:75` both say "the page says so". No page does (grep: no "near field" in any page).
- **Problem:** the inside mic is 6 cm from a 56 cm head. Its level relative to the outside mic is set by a point-source 1/r law that does not hold there. That ratio sets how deep the drawn notches are. Notch POSITIONS depend only on Δt and are fine; notch DEPTHS are not meaningful.
- **Fix:** add to the warn Note at `pages/PTwoMic.tsx:144`:
  > The notch POSITIONS follow from the arrival-time difference. Their DEPTH depends on the two levels, which this model takes from distance alone (1/r). That does not hold a few centimetres from a 56 cm head, so read the depths as illustrative only.

### M10. Two readouts on one screen disagree (stale in-canvas caption after a zone jump)
- **Where:** screenshot `02_page3_zone_jump_b52far_on_beater_line.jpg`. The in-canvas caption reads "A · ≈ 6 cm (2.4 in) from the batter head · ≈ 4 cm off the beater line"; the bezel and NOW line read "≈ 25 cm (9.8 in) · ≈ 0 mm". Code: `engine/scene/PlacementScene.tsx:361-389` (LiveReadout drives an animated `TextInput` `text` prop; after `jumpTo`, `useRig.ts:125-138`, the caption did not refresh in the web preview).
- **Problem:** a distance lesson that shows two different distances for the same mic undermines every readout.
- **Fix:** confirm on a phone. If the web build is the only one affected, re-key the caption on `rig.version` (`key={`live:${slot}:${rig.version}`}`) so that a jump re-renders it. If native is affected too, write the value through `setNativeProps` after `jumpTo`.

---

## MINOR

1. **The batter head is left out of "the resonance".** `lesson.ts:19` and `geometry.ts:84`. A kick's low note is a coupled system: both heads, the air and the shell. Replace the takeaway with:
   > The beater strikes the batter head. Both heads, the air inside and the shell resonate together; the front head and the port are where much of that resonance leaves the drum. Work with the drum as it is: never cut a port to match a diagram.

   Replace the `r.reso` note with:
   > The front head is where much of the drum's resonance radiates; it rings together with the batter head, the air and the shell.
2. **Shells are not tuned; heads are.** `geometry.ts:86`. Replace with:
   > The shell, the heads' tuning and any damping shape how long the drum rings.
3. **Proximity effect needs a hedge.** `pages/PPlacement.tsx:137`. Proximity effect follows the curvature of the wavefront. Close to a large head it is usually smaller than a point-source chart predicts. Append:
   > How much depends on the source's size and the mic; close to a large head it is usually less than a point-source chart suggests.
4. **D112 max SPL drops its distortion condition.** `data/micTypes.ts:51`. Use `max SPL "> 160 dB (calculated)" for 0.5 % THD`. With C1's sentence, this makes clear that the makers' max-SPL figures are not like-for-like.
5. **Dual units are not used everywhere (K-10 says they are).** Page 2's "Drawn size: … mm" (`PMicrophone.tsx:86`) and the example sizes in `micTypes.ts:31, 50, 51, 72, 95` are mm only. The page 5 badge `c = 343.2 m/s` has no imperial value. Add "(… in)" and "(1126 ft/s)".
6. **The AKG link goes to the page that could not be read.** `lesson.ts:264`. The label says "cutsheet", but `url` is the unreachable product page. Use the AKG-CUT URL from `kick/SOURCES.md:32`, and give the product page in a `note`.
7. **K-15 claims something that is not in the code.** `docs/labs/miking/CORRECTIONS_LOG.md:41` says the e 902 Positions A and C "are named in words on page 3". They are not. Either add this line to `PPlacement.tsx` (with the K-03 note, shown for `kickDynCard`):
   > The e 902 manual also lists a few centimetres from the batter head (much attack, dry) and midway between the heads (less attack).

   or correct the log.
8. **The null angle differs between documents.** `docs/labs/miking/ENGINE_BLUEPRINT.md:803` says the generic supercardioid is "≈126°"; the code, the lesson and SOURCES_SHARED all say ≈125° (125.26°). Change the blueprint to "≈125° (125.26°)".
9. **Sign convention for the level law.** `SOURCES_SHARED.md:75` and `ENGINE_BLUEPRINT.md:569` write `20·log10(rB/rA)` and also "doubling = −6.02 dB"; that expression gives +6.02. The code (`levels.ts:118-120`, `20·log10(rA/rB)`, "level at rB relative to rA") is right. Fix the two documents.
10. **The phantom-power Note is thinner than the lesson.** `PMicrophone.tsx:96`. Append:
    > Verify that the mute really covers every output in your setup. For example, Yamaha's ZG01 manual says not to connect or disconnect the mic cable while phantom is on, and to turn the mic gain fully down with the mic muted before switching phantom power.
11. **The comb graph does not say what 0 dB means.** `CombPanel.tsx:126`. 0 dB is the two signals arriving in step. At equal level that is +6 dB above either mic alone, so a comb both lifts and cuts. Change the label to "0 dB = in step", or add to the badge "· 0 dB = both arrivals in step".
12. **Readout precision is inconsistent.** Δd is rounded to 5 mm, but Δt is shown to 0.01 ms and notches to 3 significant figures (`units.ts:80-90`). In screenshot 04, Δd "≈ 24 cm" gives 714 Hz while the bezel says 711 Hz. Prefix Δt and Hz with "≈" and show Δt to 0.05 ms. That matches the ≈ 5 mm (≈ 0.015 ms) honesty rule and the fact that the acoustic centre is unknown.
13. **"Behind the front head" is ambiguous for an inside mic.** `describe.ts:185`, `PlacementScene.tsx:373`. For the reso surface, a negative distance means INSIDE the drum. For `surfaceId === 'reso'` and `distance < 0`, use "X inside the drum from the front head"; keep "behind" only for the batter head (the player's side).
14. **Page 4 gives mics patterns they do not have.** `PContext.tsx:39-42`. With the intact head, the mic is the "Small-capsule condenser" (DPA "open cardioid") drawn as a supercardioid or hypercardioid. With the ported head, a Beta 52A-sized dynamic can be drawn hypercardioid. Add to the PATTERN blurb: "a hypothetical mic with this ideal pattern, not the drawn mic's own". Better: use `kickDynSuper` at `dpa.outside` (see M2).
15. **`k.prac.1` turns a product-specific row into a generic rule.** `lesson.ts:158-160`. Change the option and the correct answer to:
    > A purpose-built kick dynamic at its own guide's starting point — e.g. the Beta 52A guide's 5 to 7.5 cm from the batter head, slightly off the beater line — clear of head, damping and beater
16. **The Beta 91A "60° above the surface" check could use a number.** `model.ts:113`. With the drawn pillow (illustrative 100 mm) and the strike 1.5 in above centre, the strike sits about 83° above the plate at 25 mm, about 73° at 60 mm and about 53° at 152 mm. That puts most of the 25 to 152 mm row beyond the 60° that S-B91-UG p.4 asks for. Show an elevation readout ("beater ≈ N° above the plate"), or flag it for the owner: the pillow height is a placeholder, and Shure's 60° figure should be re-read to confirm what it is measured from.
17. **The "Small-capsule condenser" label does not fit its cited example.** `micTypes.ts:19`. The DPA 4055 is a purpose-built 57 mm-body kick condenser. Rename to "High-SPL condenser (kick)", matching the lesson's L16 wording "a suitable high-SPL condenser".
18. **Out of audio scope, noted for the owner.** `data/registry.ts:16-21` lists Labs 2 to 7 with empty blurbs. If the hub shows these rows, check them against the house rule "NO placeholder lab rows".

---

## What is notably right

- **Polarity versus delay is taught correctly and shown live.** The text is at `PTwoMic.tsx:120`, `:138`, `:143` and `lesson.ts:133-137`. Flipping B moves the notches between `(2n−1)/(2Δt)` and `n/Δt`, while Δt stays unchanged in the bezel. The credit rule makes the learner do both.
- **The comb math is correct.** It uses `H = (gA + s·gB·e^(−j2πfΔt))/(gA+gB)`; mm ÷ (m/s) = ms is right; c = 343.2 m/s at 20 °C comes from the calculator and the panel states the temperature. The `k.two.2` answer (1 ms → 500 Hz, 1.5 kHz …; inverted: 0, 1 kHz, 2 kHz …) is right. The screenshot readouts check out: 0.70 ms → 711 Hz same polarity and 1.42 kHz inverted.
- **The comb graph is honestly labelled.** It carries a permanent "IDEAL MODEL · not a measurement of this drum", plus "predicts only the shared part … never what the pair will sound like". This respects L97.
- **The polar facts are right.** The ideal supercardioid A=(√3−1)/2 gives a 125.26° null and −11.44 dB rear lobe. Hypercardioid: 109.47° and −6.02 dB. Cardioid null at 180°. The rear is never presented as a universal rejection zone, and the Beta 52A's own 120° is quoted wherever that mic is named. The Shure spread (120/125/126°) is disclosed rather than hidden.
- **The boundary mic gets no lobe.** Beta 91A: half-cardioid, "within 60° above the surface". This is the honest choice.
- **Distances are tied to a reference head.** Every distance names its head, and the bezel follows the zone's head. "On-axis with beater" (K-01) and "at the level of the resonant head" (K-02) are both applied. The "turn away from the beater" advice is properly demoted to a labelled trial with provenance (K-03). The source quotes in `model.ts` match `kick/SOURCES.md` word for word.
- **No millimetre precision is claimed.** Readouts are rounded to ≈ 5 mm and ≈ 5°, measured to the mic front, and the acoustic-centre caveat is shown (L39).
- **The safety framing outside hearing is good.** Clearance always wins, the drummer stops before a mic moves, "never cut a port", only a mic whose manual allows it may rest on the pillow, feedback is never provoked, and no mic position alone prevents feedback.
- **Opinions are kept as opinions.** DPA's "dynamics cannot capture the natural sound" stays attributed to DPA as a manufacturer judgement (K-12). "Tendency, never result" wording is used throughout. The accuracy note says SILENT, IDEAL and ILLUSTRATIVE, and points to a calibrated measurement.
- **The 3:1 decibel figure (−9.54 dB) and its limit are stated correctly in words.** The faults are the bezel (M7) and the calculator's sentence, which is correctly logged as C-CALC-1. The residual comb of a −9.54 dB bleed, about −3.5 / +2.5 dB, checks out.


---

## Resolution (fix pass, 2026-10-04, branch `final-lab`)

Every critical and major finding is fixed; one minor is deferred to the owner. Content that departs from the owner's lesson is logged in `docs/labs/miking/CORRECTIONS_LOG.md` (K-15 to K-26). Tests: `test/mikingReviewFixes.test.ts` (34 tests) plus updates to the existing Miking tests. 390 × 844 captures: `scratchpad/kick_shots_v3/`.

| ID | Status | What changed |
|---|---|---|
| C1 | FIXED | Page 1 CHECK opens with the NIOSH warning (85 dBA / 8 h, every 3 dBA halves the time, a limit for people measured where they listen, unrelated to max SPL, a mic in a drum is not a hearing meter) and a new check `k.inst.2`. Page 2 puts the max-SPL caveat under the mic cards. Practice repeats the hearing reminder. K-21. |
| M1 | FIXED | Practice step 1 is the seven-step setup as an ORDER task (the power step sits inside step 4: mute and lower monitoring, then phantom; gain on typical AND strongest strokes) plus a gain/headroom judgement `k.prac.gain` (a fader does not undo input clipping; a pad only as the manual allows). K-18. |
| M2 | FIXED (best fix) | Page 4 rebuilt: the monitors are fixed at ILLUSTRATIVE stage positions (a downstage wedge facing upstage; the drummer's fill by the throne); the learner AIMS the mic (±45° / ±30°) and picks the pattern; the mic is outside the front head (DPA's "just outside"). The fill is the case no null reaches, and `solidOnPath` reports "SHIELDED · drum in path" when the shell or a head lies between. K-19. |
| M3 | FIXED | `fmtIdealPickup` / `isDeepNull`: below −25 dB the bezels read DEEP NULL (ideal only) with no number; the caption "infinitely deep on paper … least at low frequencies" shows near a null on pages 2 and 4. K-20. |
| M4 | FIXED | The placement lobe is drawn dashed in the IDEAL white (never the sourced blue), with an in-canvas tag "IDEAL PATTERN · SHAPE, NOT RANGE" (hidden where no clean spot exists); the badges on pages 3–5 say it. Page 2's lobe uses the same white. |
| M5 | FIXED | `zoneEdgesByLab` / `labDrawnNotes`: the zone card lists every lab-drawn edge ("* Drawn by the lab, not the source: …"); the bezel reads SOURCED* with "* lab edges"; a zone whose distance-band numbers are the lab's is drawn with a dotted edge. |
| M6 | FIXED | `DocumentedZone.aim` (±30°, ILLUSTRATIVE) on b52.near, b52.far, dpa.outside and live.D; `inZone` tests it. K-17 (owner to approve the tolerance). |
| M7 | FIXED | Page 5 has no 3:1 cell. `threeToOneReading` returns null for two mics on one source (tested). |
| M8 | FIXED | `effectivePolarity(switch, gA, gB)` with signed gains drives the comb curve, the notch ticks, the bezel and the text; a rear-lobe note appears when it differs from the switch. K-23. |
| M9 | FIXED | Page 5's warn note says notch POSITIONS follow Δt and DEPTHS are illustrative (1/r does not hold near a 56 cm head). K-22. |
| M10 | FIXED earlier (b327f71c), re-verified | Capture 08: after a zone jump the strip, the bezel and the fader all read ≈ 25 cm. Not re-checked on a phone. |
| m1 | FIXED | Takeaway and region text: both heads, the air and the shell resonate together. K-16. |
| m2 | FIXED | "The shell, the heads' tuning and any damping shape how long the drum rings." |
| m3 | FIXED | Proximity hedge added on page 3. K-26. |
| m4 | FIXED | D112 max SPL now "for 0.5 % THD". |
| m5 | FIXED | Drawn size is dual-unit; page 5's c shows m/s and ft/s. Quoted product data stays verbatim (the source's own unit). |
| m6 | FIXED | The AKG link points to the cutsheet; the product page is named in a note. |
| m7 | FIXED | The e 902 Positions A and C are named in words on page 3 for the cardioid kick dynamic; K-15 updated. |
| m8 | FIXED | The blueprint now says ≈125° (125.26°). |
| m9 | FIXED | Blueprint and SOURCES_SHARED level law: 20·log10(rA/rB). |
| m10 | FIXED | The phantom note adds "verify the mute covers every output" and the Yamaha ZG01 example. |
| m11 | FIXED | The comb graph labels "0 dB = the two arrivals in step"; the LEARN text explains +6 dB at equal level. |
| m12 | FIXED | Δt rounds to 0.05 ms with "≈"; notch cells read "≈ … Hz". |
| m13 | FIXED | A negative distance from the front head reads "inside the drum from the front head" (strip, bezel key "INSIDE FROM FRONT", screen reader). |
| m14 | FIXED | Page 4's PATTERN blurbs say "a hypothetical mic with this pattern"; cardioid swaps the drawing to the cardioid kick dynamic. |
| m15 | FIXED | `k.prac.1` is replaced by the two setup briefs (several setups pass). K-24. |
| m16 | COMPUTED (2026-10-04, after the owner's pillow ruling, K-28) · reading OPEN | With the DW 18 in pillow (121.9 mm high, retailer size) and the strike drawn 1.5 in above centre (TRIAL), the beater strike sits 82° at 25 mm, 72° at 60 mm, 51° at 152 mm above the plate surface (plate thickness ignored; pinned by test/mikingModelM01.test.ts). Read as "within 60° of the plate's perpendicular" (elevation ≥ 30°), the whole 25–152 mm band passes. Read as "at most 60° above the surface" (elevation ≤ 60°), only ≈ 110–152 mm passes — Shure's own band would mostly fail, so the first reading is the consistent one. No readout added: what Shure's 60° is measured from still needs a look at S-B91-UG p.4's figure (owner / lead). |
| m17 | FIXED | "High-SPL condenser (kick)". K-25. |
| m18 | NO CHANGE NEEDED | `readyLabs()` lists only labs with a ready lesson, so the empty Labs 2–7 rows never show. |
