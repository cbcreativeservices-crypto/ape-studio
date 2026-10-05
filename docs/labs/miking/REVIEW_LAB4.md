# Lab 4 (Strings): skeptical review of 20 lessons

- **Reviewer stance:** a senior studio and live engineer (acoustic, amplified, bowed, keyboard and world strings), plus a learning designer.
- **Date:** 2026-10-05.
- **Scope:** read-only; this file is the only one written.
- **Bar:** M01 Kick and its two reviews (`kick/REVIEW_AUDIO_EXPERT.md`, `kick/REVIEW_COGNITIVE.md`), and `BUILDER_BRIEF.md`.

Paths are relative to `src/screens/lab/miking/` unless they start with `docs/`.

## What was read

**Read deeply:**
- C01 (`lessons/c01Guitar/*`);
- C02 (`lessons/c02GuitarAmp/*`, `shared/speakers/ampZones.ts`, `shared/electric/ampPages.tsx`);
- C08 (`lessons/c08BassAmp/*`);
- C11 (`lessons/c11Piano/model.ts`, `lesson.ts`);
- C09a and C09c (`model.ts`, `lesson.ts`), plus the cello SOURCES rows for the clip.

**Read for zones, checks and labels:** C03, C04, C05A–C, C06a/b (`shared/bowed/bass.ts`, `bassArt.tsx`), C07, C09b, C10, C12, C13, C14 and C15 (`shared/lutes/LuteArt.tsx`, `luteSpec.ts`).

**Counts: CRITICAL 0 · MAJOR 5 · MINOR 15.**

## Overall

The physics and the safety content are sound and consistent:
- string harmonics and the plucking point;
- the whole-tone tension of ×1.26 (C04);
- E1 at 41.2 Hz, B0 at 30.9 Hz and C2 at 65 Hz;
- ORTF at 17 cm / 110°, aimed 45° down;
- the cardioid at −6 dB at 90°;
- open-back polarity;
- "a speaker output only to a speaker";
- the lid set by someone who knows the piano;
- mic max SPL versus the 85 dBA / 3 dB hearing guideline, present in all 20 lessons.

The Kick-review lessons were applied across the lab:
- briefs where several setups pass, with graded reasons;
- gain set on the loudest passage;
- "a fader does not undo clipping";
- mono checks;
- polarity versus delay;
- options shuffled by `engine/kit.tsx:53`.

The journey order (meet → sound → setting → mic → placement with a worked example → context → two mics → troubleshoot → practice), the try-before-tell predictions and the starting-points voice are in place in every lesson I opened.

The problems are:
- one confusing physics phrase copied into ten lessons;
- part labels drawn on top of three instruments;
- three teaching gaps: piano under-board polarity, DI hum and ground lift, and where the sitar's shimmer comes from;
- small unit and wording inconsistencies.

---

## MAJOR

### M1. "Every even shape is still there" says the opposite of what it means, in ten lessons
- **Where:**
  - `lessons/c01Guitar/lesson.ts:97-102`, `:591-596`, `lessons/c01Guitar/copy.ts:69` (shapesNotes);
  - `shared/guitars/stringsCopy.ts:87`;
  - the same item pair in `c03Resonator/lesson.ts:88-93, 347-352`, `c05bMandolin/lesson.ts:88-93, 347-352`, `c05cUkulele/lesson.ts:88-93, 347-352`, `c07AcousticBass/lesson.ts:88-93, 347-352`, `c13Oud/lesson.ts:92-97, 375-380` and `c15Veena/lesson.ts:105-110, 412-417`.
- **Problem:** the writers meant "still" as *motionless*. In plain English, "still there" means *still present*.
  - So the correct option, "Only the odd ones; every even shape is still there", contradicts itself.
  - The distractor "Only the even ones; the odd shapes are still there" reads as equally self-contradictory. A learner who knows the physics hesitates, and one who does not is taught nothing.
  - The *why* line "a shape still there is not driven" compounds it.
  - This is the one place where the check tests wording instead of reasoning.
- **Fix:** replace the phrase everywhere, in both the sound check and the quick check, as follows:
  - Correct option: `'Only the odd ones; the even shapes stay silent (a still point sits at the middle)'`.
  - Distractor: `'Only the even ones; the odd shapes stay silent'`.
  - *Why* for "All of them": `'The pick touches one spot. A shape with a still point there is not driven at all.'`
  - In `copy.ts:69` and `stringsCopy.ts:87`: `'Plucked in the exact middle, every even shape has a still point under the pick, so it is not set moving — a rounder, hollower note.'`
  - Add a learner-text test that bans `/still there/` in Lab 4 lesson files.

### M2. Part labels are drawn over the instrument: upright bass, sitar and veena (both owner reports confirmed from the code)
- **Where:**
  - Upright bass (C06a/b): `shared/bowed/bassArt.tsx:18-34`.
  - Sitar (C14): `shared/lutes/LuteArt.tsx:77-79` (side view) and `:83` (top view).
  - Veena (C15): `shared/lutes/LuteArt.tsx:92, 94, 98, 99`.
- **Problem:**
  - **Bass.** The offsets are the cello's, about 60–90 mm (`c09cCello/art.tsx:22-35`). The bass is 700 mm across its lower bouts (`bowedSpec.ts:178`), and its f-holes sit 170 mm off the centre line (`bowedSpec.ts:186`). So BRIDGE (+80), TAILPIECE (+90), FINGERBOARD (+90) and F-HOLE (+70) all land inside the body outline. At the view's scale (2.4 m across 390 pt, about 0.16 pt per mm), an 80 mm offset is about 13 pt: the 9-pt text sits on the top plate.
  - **Sitar, side view.** "MAIN BRIDGE" is anchored at (−10, 70), left-aligned. The tabli has a 145 mm radius centred at x = −60, so the anchor is 86 mm from its centre: the text runs across the soundboard and the strings. "SYMPATHETIC STRINGS" is anchored at (250, −152), right-aligned, so it runs back over the gourd: the gourd's half-height is about 164 mm at x = −10. In the top view, "ARCHED FRETS" is centred at (520, z 60), on the neck line.
  - **Veena.** "FRETS ON WAX" is centred on the neck edge (y = neck.half). Both "YALI" labels and "TALA STRINGS" in the top view (v = z = 0) sit on the neck axis.
  - **Root cause:** `fitLabels` (engine/scene/labelLayout.ts) prevents only label-against-label collisions. The test `test/mikingArtPass.test.ts:51` never checks a label against the instrument.
- **Fix:**
  1. **Bass.** Derive the offsets from the silhouette instead of fixed millimetres. In the side view:
     - `bridge: { du: BASS_SPEC.lower.mm / 2 + 60, dv: -20 }`;
     - `tail: { du: BASS_SPEC.lower.mm / 2 + 60, dv: 40 }`;
     - `fb: { du: BASS_SPEC.upper.mm / 2 + 60, dv: -30 }`.

     In the top view: `fhole: { du: BASS_SPEC.lower.mm / 2 + 60, dv: 60 }`. Draw a 0.75-pt leader from each label back to its anchor, the pattern the speaker labels already use.
  2. **Sitar.**
     - MAIN BRIDGE: anchor at `V(-10, g.gourd.a + 40, 0)`, centred, below the gourd, with a leader.
     - SYMPATHETIC STRINGS: anchor at `V(400, -g.neck.half - 60, 0)` with `'left'` align, so it runs up the neck and away from the gourd.
     - Top-view FRETS: `V(520, 0, g.neck.depth + 70)`.
  3. **Veena.**
     - FRETS ON WAX: `V(420, g.neck.half + 60, 70)`.
     - Side-view YALI: `V(930, g.neck.half + 50, 70)`.
     - Top-view YALI: `V(905, 0, 40 + g.neck.depth + 40)`.
     - TALA STRINGS: move v off z = 0 by the neck depth plus 40.
  4. **Test.** For every Lab 4 art, assert that the four corners of each fitted label box return `null` from that lesson's `hitTest` (`bowedHitTest` / `luteHit`) at tolerance 0.
  5. **Verify.** Check at 390 × 844, inline and in full screen.

### M3. Piano: the mic under the soundboard, and the one behind an upright, face the board's other side, and their polarity is never taught
- **Where:**
  - `lessons/c11Piano/model.ts:289-305` (`gp.under`; its tendency is at :304);
  - `:346-362` (`up.rear`);
  - the twoMic page (`lesson.ts:59-61`, `:317-321`).
- **Problem:**
  - A soundboard is a diaphragm. When its top face pushes air upward, its underside pulls air down, just as the open-back combo does (C02 teaches this, `c02GuitarAmp/lesson.ts:101-108`). So a mic underneath blended with a mic above starts out largely opposite in polarity at low frequencies. The same holds for a mic behind an upright's soundboard blended with a top-open or hammer mic.
  - The lesson says only "Blended with a mic above: check in mono".
  - The twoMic page then states, correctly for an over-the-strings pair, that "Neither mic is inverted here". That leaves the learner believing no piano pair ever needs a polarity check.
  - Missing this is the classic thin-piano blend, and it is the same idea as the snare top and bottom (Lab 1) and the C02 rear mic. Leaving it out breaks consistency across the labs.
- **Fix:**
  - `gp.under` tendency: append `'It faces the other side of the soundboard from any mic above, so blended with one it starts out roughly opposite in polarity in the lows: try this mic’s polarity both ways, in mono, at matched levels.'`
  - `gp.under` checks: replace the last item with `'Blended with a mic above: compare both polarity states in mono'`.
  - `up.rear` tendency: add the same sentence ("the other side of the soundboard from a mic at the top or the hammers").
  - Add one check to the twoMic page:
    - **prompt:** `'A mic under the grand’s soundboard and one over the strings sound thin together. What do you try first?'`
    - **correct:** `'Each alone, then mono, then this mic’s polarity both ways'`
    - **explain:** `'The board pushes air up as it pulls air down, so the two start out roughly opposite in the lows. Compare both polarity states in mono at matched levels; the delay between them is still there.'`
  - Log the change in `CORRECTIONS_LOG.md` (C11).

### M4. The DI lessons have no hum or buzz symptom, and "defeat a safety ground" is never told apart from a DI's ground-lift switch
- **Where:**
  - `lessons/c08BassAmp/lesson.ts:419-500` (seven symptoms, none about hum);
  - `c02GuitarAmp/lesson.ts:424-509` and `c04Steel/lesson.ts:421-500` (same gap);
  - `shared/electric/ampPages.tsx:716` (ELECTRICAL SAFETY).

  Only C12 has a hum item (`c12Clavinet/lesson.ts:466-477`).
- **Problem:**
  - A ground-loop hum when a bass DI and the head share a mains circuit is the most common real fault on a bass channel.
  - The safety card says, correctly, never to "defeat a safety ground". Every passive and active DI has a ground-lift switch that lifts only the audio ground at pin 1 of the XLR, never the mains earth. That switch is the standard first remedy.
  - Without that distinction, a learner either fears the lift switch or, worse, believes that lifting the mains earth is the same thing.
- **Fix:**
  1. Add a symptom to C08 (and the same to C02 and C04, with "DI" read as "direct output"):
     - **observation:** `'Hum or buzz on the DI channel'`
     - **firstChecks:** `'Is it a cable, a shared power circuit, or the DI’s ground? Swap one cable at a time; try the DI’s ground-lift switch, as its manual describes.'`
     - **options:** `['Swap cables one at a time, then try the DI’s ground-lift switch', 'Remove the earth pin from the amp’s mains plug', 'Turn the DI channel up so the bass covers the hum']`
     - **why:** for the earth pin, `'Never. The mains earth is the safety path that stops a fault becoming a shock — a technician’s job.'`; for turning up, `'More gain raises the hum with the bass.'`
     - **explain:** `'A DI’s ground lift breaks only the audio ground at its XLR output; the amp’s mains earth stays connected. If the lift does not cure it, stop and get a qualified technician.'`
  2. At `ampPages.tsx:716`, after "defeat a safety ground", add `'(a DI’s ground-lift switch, which lifts only the audio ground at its XLR, is a different, normal control — use it as its manual says)'`.

### M5. Sitar: the lesson says the sympathetic shimmer is heard "toward the neck, not at the bridge", but the art draws the sympathetic strings' own bridge on the soundboard
- **Where:**
  - `lessons/c14Sitar/lesson.ts:144`, `:244`, `:30`;
  - `lessons/c14Sitar/model.ts:80` (high-zone tendency).

  The art and model draw the taraf bridge on the tabli: `shared/lutes/luteSpec.ts:151`, `sitarArt.tsx:63, 217-218`, `luteModel.ts:378`.
- **Problem:**
  - The sympathetic strings (taraf) cross their own small bridge on the tabli, just in front of the main bridge. Most of their sound is radiated by the same soundboard as the main notes.
  - A mic up the neck hears relatively more string and less main-bridge attack, so the shimmer can *stand out* there. The *why* line "The shimmer is heard more toward the neck and with distance, not right at the bridge" states that as a fact, and the drawing on the same page contradicts it.
  - The takeaway's "answer only the notes that match their tuning" (`:30`; also `:24`) also leaves out the overtones. A taraf string also rings when a played note's overtone matches it.
- **Fix:**
  - `:244` why: `'The shimmer also leaves through the soundboard (the sympathetic strings have their own small bridge there), but right at the main bridge the nearest attack and buzz dominate it.'`
  - `:144` explain: `'Toward the neck, a mic hears relatively more of the strings and the left hand, so any sympathetic shimmer can stand out more — and less of the board’s body. A tendency to check.'`
  - `model.ts:80`: change "more of the sympathetic strings’ shimmer" to "the sympathetic strings’ shimmer can stand out more".
  - `:30` (and `:24`): "ring with the notes — or the overtones — that match their tuning".
  - Log the change as a C14 correction.

---

## MINOR

1. **The C02 rear-mic band hides the delay.** `shared/speakers/ampZones.ts:166, 178` say "switch this mic’s polarity" and give 15–30 cm behind the back. That puts the rear mic about 40–55 cm from the cone (back plus cabinet depth), against about 3 cm for the front mic: roughly 1.1–1.5 ms. The flip fixes the sign, not the timing.
   - Fix, appended to the tendency: `' It is also farther from the cone than the front mic, so a delay remains after the flip — listen in mono and move it if the low mids thin out.'`
2. **"Removes the arrival-time difference itself": "moving the mic closer" only reduces it.** At `c08BassAmp/lesson.ts:408-410` and `c04Steel/lesson.ts:410-412`, the speaker and amp add their own lag, so moving closer never removes it.
   - Fix the correct option: `'Delaying the DI to match (moving the mic closer only shrinks it)'`. Keep the explain's "no single delay fixes every frequency".
3. **The supercardioid null is 126° in C02 and C04 but 125° everywhere else.** `c02GuitarAmp/lesson.ts:296`, `c04Steel/lesson.ts:280` against C01, C10, C11 and C12.
   - Fix: use "near 125°" in both, for consistency (the textbook figure is about 126°; either is fine, but one number across the lab).
4. **C02 shows the kick card's words on a guitar amp.** `data/micTypes.ts:60` ("A kick dynamic with a cardioid pattern…") appears through `C02_MICS` (`c02GuitarAmp/model.ts`) on the guitar-amp mic page (`pages/PMicrophone.tsx:191`).
   - Fix: give the card a lesson-neutral blurb, `'A large end-address dynamic with a cardioid pattern, built for loud, low sources. Needs no power. Models differ in tone, so two are not interchangeable.'`, or override it per lesson.
5. **C08 talks of "this 12 in cone" in a lesson about 10 in woofers.** `c08BassAmp/pages.tsx:50-51`. The rest of C08 draws and names the woofer as 10 in (`lesson.ts:675`).
   - Fix: "…beams a little later than the 12 in cone drawn in the speaker explorer". Better still, have the explorer draw the 10 in woofer for `rig: 'bass'`.
6. **The inch figure does not match the band.** `shared/speakers/ampZones.ts:259`: "60–100 cm (2–3 ft)", but 100 cm is 3.3 ft.
   - Fix: "60–100 cm (2–3.3 ft)" (or "about 2–3 ft (60–90 cm)" with `max: 900`).
7. **C11 `up.front` mixes centimetres and inches that do not agree.** `lessons/c11Piano/model.ts:367`: "a few centimetres (several inches)", with zone distance 60–200 mm.
   - Fix: "about 6–20 cm (2–8 in) in front of the hammers".
8. **C02 BRIEF 2 asks for a "wider" sound, but both passing setups are mono pairs** (front+rear, and close+room summed). `c02GuitarAmp/lesson.ts:553`.
   - Fix: "a fuller sound with more depth".
9. **C09a side zone: the label is inches-only and the band never names the side.** `lessons/c09aViolin/model.ts:77-78`. The internal record (V-03) says "the side away from the bow"; the learner text says only "clear of the bow".
   - Fix: label `'About 5–10 cm from the side'`; band `'…from the bass-side rib by the lower bout (the side away from the bow), aimed at the body…'`.
10. **C06a/b f-hole start: "the far side from the player" is vague.** `shared/bowed/bass.ts:101`.
    - Fix: "in front of the treble (G-string) f-hole, the one away from the player".
11. **C09c clip: "in front of" is ambiguous** (out from the top, or toward the fingerboard?). `lessons/c09cCello/model.ts:96`.
    - Fix: "bring the capsule about 4–9 cm from the bridge’s foot on the fingerboard side, under the strings and below the bow’s path".
12. **C10: "twice as loud, roughly 6 dB" mixes perceived loudness with level, and "One reported setup" leaks a source voice.** `lessons/c10Harp/copy.ts:123`. A 6 dB rise is double the *amplitude*; *perceived* "twice as loud" is about 10 dB.
    - Fix: "One setup to try: bring the upper spot about 6 dB above the lower — a starting point, not a rule."
13. **The correct option is slightly too often the longest in C13 and C14.** Measured over the shuffled checks:
    - C13: 10 of 23 (43 %);
    - C14: 9 of 23 (39 %);
    - chance is 33 %;
    - C01, C10 and C12 sit at 25 %.

    Fix: trim the longest correct options in `c13Oud/lesson.ts` and `c14Sitar/lesson.ts` (for example `:119`, `:143`) to the length of their distractors.
14. **C14 high-zone wording is narrow.** `lessons/c14Sitar/model.ts:80` ("on its own it loses the body") is fine, but "the second of a pair" reads as a rule. Fix: "usually the second of a pair".
15. **The electric lessons' practice sheet has no hum line.** `c02GuitarAmp/lesson.ts:713`, `c08BassAmp/lesson.ts:705`.
    - Fix: add "hum checked (DI ground lift as its manual says; mains earth never touched)" to the `notes` field label, to support M4.

---

## Checked and found sound (no action)

**C01 Guitar**
- The steel 14-fret joint puts the 12th fret 35 mm out on the neck: 645 mm × (2^(−12/12) − 2^(−14/12)) = 35.4 mm.
- The octave courses on the 12-string are correct.
- The twelve-string, nylon and steel zones are measured from named points.
- Brief 2 (no phantom) passes only dynamics.

**C02 Electric guitar**
- Centre is brighter and edge darker, the majority view, held as a tendency.
- The off-centre combo speaker is found first.
- The speaker output is critical in q.5.
- The DI is taken before the amp, and pedals before the DI mean it is no longer dry.
- A condenser does not feed back merely for being sensitive.
- The side-address front is covered.
- The stop conditions for heat and smoke are present.

**C08 Electric bass**
- One woofer, never the gap between two.
- The DI low cut of −6 dB at 80 Hz is set against 41 and 31 Hz.
- PRE/POST follows the manual.
- An active bass can overload the DI.
- A phantom-powered DI is still not a mic.
- The briefs pass several setups.

**C11 Piano**
- The lid is hinged on the bass side and opens on the curve.
- 130 dB near the hammers is paired with the hearing line.
- The short stick asks for space for the mic and its arm.
- Mics come out before the lid goes down.
- The upright is pulled out from the wall by its owner.
- The rim-versus-strings reference trap is covered.

**C09a Violin and C09c Cello**
- The bow arm's reach is correct: at the tip forward and right; at the frog the stick swings back over the left side.
- The cello clip goes under the strings between the bridge and the fingerboard, as DPA documents (`docs/labs/miking/cello/SOURCES.md:11-12`).
- The endpin and feet are kept clear.
- "Body reflects the kit" matches the sources.
- The proximity effect and the low C at 65 Hz are both covered.

**C04 Steel**
- The ×1.26 tension figure is correct.
- The pedals and knee levers are kept clear.
- The volume pedal's swing reaches peaks.

**Safety across the lab**
- The hearing note is in all 20 lessons (C06a/b through `bassWords.ts`).
- Clips and holders need the owner's agreement.
- Nothing goes inside an amp.
- Foam stays out of the bass and the harp (an owner item already logged).

---

## Resolution (fix pass, 2026-10-05, branch `miking-fix4`)

Each finding was checked against the code before it was changed.

### Major

| Finding | Verdict | What changed |
|---|---|---|
| M1 "still there" | **Fixed** | All ten item pairs, `c01Guitar/copy.ts` and `shared/guitars/stringsCopy.ts`: "the even shapes stay silent" / "the odd shapes stay silent"; the why "a shape with a still point there is not driven at all"; the notes "every even shape has a still point under the pick, so it is not set moving". The review's "(a still point sits at the middle)" was left out of the key: it made the key the longest option. Test: `mikingLab4Review` bans a shape being "still there" in Lab 4. |
| M2 labels on the instrument | **Fixed** (bass, sitar, veena) + engine-wide test | Confirmed in the code and on screen. Bass placement view (`bassArt.tsx`): the top view's F-HOLE, SCROLL, BOW and BOW'S PATH moved off the body; the side view's SCROLL moved off the scroll. The review's side-view offsets were not needed: in side view the bass is edge-on and those labels were already clear. Bass ORIENT portrait (`BowedArt.tsx`, shared by violin, viola and cello): TOP, FINGERBOARD and TAILPIECE sat on the body; every label now sits above the body or in the gap above the bow (`portraitLabels`, `portraitHit`). Sitar (`LuteArt.tsx`): MAIN BRIDGE below the gourd, SYMPATHETIC STRINGS beside the neck below ARCHED FRETS (the review's `V(400, -half-60)` with left align ran across the neck, so it was not used), GOURD off the gourd in both views, top-view FRETS off the neck. Veena: FRETS ON WAX, both YALI labels, TALA STRINGS and RESONATOR moved clear. **Leaders:** `ArtLabel`/`StaticLabel` gain an optional `lead` (the part's u, v). `labelLayout.leaderLine` gives a hairline from the label box to the part, drawn by `StaticLabels` and `PlacementScene`. **Test** `test/mikingLabelsClear.test.ts` (loads the real art modules through `test/_mikingTsxLoader.ts`). For every lesson, variant and view it lays out the labels as the phone does at 390 wide: the read-step figure, plus the stage at three heights. It samples each label box through the lesson's own hit test at tolerance 0, with the player's figure excluded. C06a, C06b, C14 and C15 must be at zero (they are), and so must the four bowed portraits. The other lessons carry a ratchet (`KNOWN`) that may only go down: they currently name many parts by writing on them (338 placements across Labs 1 and 4). Moving those is a separate pass. The guitar family is in another branch's art pass. |
| M3 piano polarity | **Fixed** | `gp.under` and `up.rear` tendencies carry the other-side-of-the-board note. The `gp.under` check now reads "compare both polarity states in mono". New check `pn.two.5`, credited on the twoMic page. The `pn.two.1` why no longer says "Neither mic is inverted here" without a condition: it now says both mics face the same side, and points to the under-board case. Logged as C11-R1. |
| M4 hum / ground lift | **Fixed** | A `s.hum` symptom in C02, C04 and C08. The key is to swap one cable at a time, then use the DI's ground lift. The earth-pin option is answered "Never" (it is the mains safety path; a technician's job). The explanation says the lift breaks only the audio ground at the XLR and the mains earth stays connected. The `ampPages.tsx` safety card names the ground-lift switch as a different, normal control. Lengths were balanced to the 1.25 rule, so the wording differs slightly from the review's. |
| M5 sitar shimmer | **Fixed** | `:244` why, the `rec.1` explain, `model.ts` high-zone tendency ("can stand out more"; "usually the second of a pair", which is also minor 14), the takeaways ("the notes — or the overtones — that match their tuning") and the `:354` explain. Logged as C14-R1. |

### Minor

| # | Verdict | Note |
|---|---|---|
| 1 C02 rear-mic delay | Fixed | Appended to `ampZones.ts` rear tendency. |
| 2 "removes the arrival-time difference" | Fixed | C08 and C04 key: "Delaying the DI / the direct path to line up with the mic". The explanation says that moving the mic closer only shrinks the gap. |
| 3 126° vs 125° | Fixed | "near 125°" in C02 and C04. |
| 4 kick card on the guitar amp | Fixed | `micTypes.ts` `kickDynCard` blurb made neutral ("…built for loud, low sources such as a kick drum or a bass cabinet…"); M01 still reads correctly. |
| 5 "this 12 in cone" | Fixed (wording) | "the 12 in cone drawn in this explorer". Drawing a 10 in woofer for `rig: 'bass'` is left as an art item. |
| 6 2–3 ft | Fixed | "2–3.3 ft". |
| 7 C11 `up.front` units | Fixed | "about 6–20 cm (2–8 in)". |
| 8 "wider" | Fixed | "a fuller sound with more depth". |
| 9 C09a side zone | Partly fixed | Label is now "About 5–10 cm from the side". The band's side was not renamed: the internal record says "treble rib", the review says "bass-side rib". The side should be confirmed on the geometry before the words change. |
| 10 bass f-hole | Fixed | "the treble (G-string) f-hole, the one on the far side from the player" (the zone is built on `fholeT`). |
| 11 cello clip | Fixed | "4–9 cm from the bridge's foot on the fingerboard side — under the strings, below the bow's path". |
| 12 harp 6 dB | Fixed | "One setup to try: bring the upper spot about 6 dB above the lower — a starting point, not a rule." |
| 13 longest option C13/C14 | Fixed | See answer balance. |
| 14 "the second of a pair" | Fixed | "usually the second of a pair". |
| 15 practice-sheet hum line | Fixed | C02, C04 and C08 `notes` labels. |

### Answer balance (lab-wide rule, applied to Lab 4)

Before this pass:
- the key was the first option in the source in 807 of 807 items;
- "Yes…" was the key in 0 of 55 items that offered it;
- 17 keys ran longer than 1.25 × the others' mean;
- the key was the longest option in more than a quarter of the items in C10, C12, C13 and C14 once the quick check was counted.

What changed:
- **Keys moved.** Keys now sit in all three places, balanced both in the source and on the screen (the engine's own shuffle).
- **Shared hearing check reworded.** It now asks "Do you still need a limit…?", with the key "Yes — max SPL is a distortion limit, not a hearing limit".
- **New "Yes" keys.** C04 `ps.ctx.2`, C08 `ba.mic.3` and C10 `hp.place.1` now have reasoned "Yes" keys.
- **"Yes" distractors reworded.** Several "Yes" distractors were reworded without "Yes": C05C, C09b, C12 and C15.
- **Lengths evened out.** Long keys and short distractors were evened out.

`test/mikingLab4Review.test.ts` pins these rules for every Lab 4 lesson:
- the key is at most 1.25 × the others' mean length;
- the key is the longest in at most ¼ of a lesson's items;
- "Yes" is the key in at least 30 % of the items that offer it;
- each slot holds 20–45 % of the keys, in the source and on screen.

The same test pins M1 and M3–M5.
