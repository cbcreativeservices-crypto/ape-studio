# Review 2026-10-08 — Miking Lab 7 part 2 (Sports), B09–B17

Two experts reviewed the nine lessons, then fixed what was clearly wrong:
- **AE**: a working sports-broadcast A1/A2, RF coordinator and live-sound engineer;
- **CL**: a cognitive-learning and instructional-design expert.

Branch `review-lab7b`, from `final-lab` e532124f. Lab 7 part 1 (B01–B08) is reviewed separately; its shared broadcast code was only touched where B09–B11 use it, and its tests stay green.

## Summary

The lab is in good shape. The physics, the routing and the safety content are sound, and the numbers that matter were checked by hand (table "Verified" below). Each lesson runs the eight-page journey with PREDICT FIRST, six quick-check items with critical safety items, and briefs where more than one setup passes. The sports safety card is worded once and shown on every "before any mic" step.

- **Found:** 3 major and 9 minor problems (about 45 separate edits), all **FIXED**.
- **Left for the owner:** 10 new items (O-A to O-J), each with a recommendation. The owner items already in CORRECTIONS_LOG.md (L7B-G1/G2/G3, D7-1 … D7-8) were not changed; my expert opinion is at the end.
- **The three major fixes:**
  - B16 taught the air/water dB difference with an item about equal *recorded level* — but recorded level depends on sensitivity and gain, not on the dB reference. The item now asks about two quoted dB figures.
  - B15, B16 and B17 keyed "The strongest gentle peak near −12 dBFS", and their whys said "set on a gentle clap, the first real pass clips" — about the keyed answer itself. B13 and the shared headroom chain (which these lessons use) teach that a GENTLE clap at −12 dBFS is the trap. Now one term everywhere: the loudest safe peak near −12 dBFS, which in a quiet practice is the strongest gentle clap, then more margin.
  - B09–B11 called a person "it": "the commentator itself and where its sound leaves … the places a mic can hear it best" (START intro) and "what it is and its parts" (MEET IT goal). An optional `noun.person` now makes both say "they / their voice"; two engine lines that said "the instrument" for every lab now say "where the sound leaves".
- **The rest:** sibling-distractor giveaways (21 items), a negative stem, a mis-stated M/S lobe, a garbled explanation, practice intros naming cards they do not mix (5 lessons), technique "must" (6 places), and "listen" in a silent lab.
- **Not changed:** no owner-review default; no release gate (`MIKING_PUBLIC` stays false); no image or photo asset; no head or figure drawing code (a separate head-fix branch owns it).

**Method:**
- I read BUILD_PROMPTS_lab7b, the three Lab 7b sections of CORRECTIONS_LOG.md, both BATCH7 summaries, the Lab 6 review and the visual charter.
- I read every B09–B17 `lesson.ts` in full (pages, checks, symptoms, order tasks, briefs, predictions, the quick check, orient, setting, unknowns, the accuracy note) and the copy, model and plan files where words or numbers are taught.
- I read the shared models where a number is taught: `parabolic.ts`, `boundary.ts`, `passBy.ts`, `downmix.ts`, `coverage.ts`, `headroom.ts`, `safety.ts`, `practiceScenes.ts`, `feeds.ts`, `handoff.ts`, `sportMics.ts`, and the M/S and downmix steps in `arenaPages.tsx`.
- A scan over every item looked for: keys more than 1.3 × the distractors' mean length, two distractors sharing an opening the key lacks, "Yes/No" patterns, must / always / never in learner text, and names.
- On my own Expo web server (port 8217) and my own headless Chrome (CDP, 390 × 844 at 2×), I captured 50 pages: B09–B11 START, MEET IT, setups, Placement Studio, context and two-mic pages, and B12–B17 setups, microphones, Placement Studio, live checks and two-mic pages, then re-captured B09 MEET IT after the person fix. Both were stopped afterwards.

## Findings

| id | lesson / page | expert | severity | finding | fix applied / owner decision |
|---|---|---|---|---|---|
| R1 | B16 MICROPHONES `mo.mic.3` | AE | major | "A hydrophone and an air mic show the same recorded level. Is the sound pressure the same?" keyed "Not always: their dB references differ". A recorded level depends on each transducer's sensitivity and gain; the dB reference explains why two QUOTED dB figures (re 1 µPa in water, re 20 µPa in air) differ. The key gave the right fact for the wrong question; "Not always / Yes / Yes" also gave it away. | **FIXED.** "A reading under water and a reading in air both say 120 dB. Is the sound pressure the same?" Key: "No: the two media use different dB references". The explanation says the underwater reference is much smaller, so the same number is less pressure under water, and that equal recorded levels prove nothing either. No number on screen (L7B-G3-02 kept). Pinned. |
| R2 | B15 `tg.prac.gain`, B16 `mo.prac.gain`, B17 `cc.prac.gain` | AE / CL | major | Keyed "The strongest gentle peak near −12 dBFS", with whys "Set on a gentle clap, the first real pass clips" — which describes the key too. B13 `fd.ctx.2` marks "−12 dBFS for the gentlest test clap" wrong, and the shared headroom chain (on these lessons' LIVE CHECKS) starts from the trap "GENTLE clap at −12 dBFS". Same lab, two rules. | **FIXED.** Key: "The loudest safe peak near −12 dBFS" (the term of B13 and the chain). Explanation: in this quiet practice the loudest safe peak is the strongest repeatable gentle clap; set it near −12 dBFS, then keep more margin. Whys: "With a gentle clap already at −6 / −3 dBFS, the first … clips". Pinned. |
| R3 | B09–B11 START and MEET IT (engine `journeyIntro`, `restructure.meetContent`); every lab's start-path line and FOUNDATIONS card (`journeyKit.tsx`), journey stage lines (`journey.ts`) | CL | major | A person was "it": "the commentator itself and where its sound leaves — the places a mic can hear it best"; MEET IT goal "Meet the commentator in brief — what it is and its parts". The FOUNDATIONS card and the stage list said "the instrument" in a sports or speech lesson. | **FIXED.** `noun.person` (optional, `types.ts`): the START intro says "the commentator and where their voice leaves — the places a mic can hear them best", the MEET IT goal "the person and what is around them … where their voice leaves". Set on B09, B10, B11 only. The FOUNDATIONS card and start-path line now say "where the sound leaves, and the starting setups"; the stage lines "drawn where the mic goes", "What you are miking, in brief". An instrument lesson's START text is unchanged (pinned). Checked in the preview. |
| R4 | B12 LIVE CHECKS `pb.ctx.3` | CL | minor | Negative stem ("What can a high-pass filter NOT do") whose distractors were true statements, with whys "That is what it can do." | **FIXED.** "A nearby shout clipped the dish's transmitter input. What can a high-pass filter on the channel do about it?" Key "Nothing for the clip itself"; distractors "Remove the distortion it caused" (clipping distortion is broadband) and "Bring back the lost peak". Pinned. |
| R5 | B09 `b9.rec.3` | AE | minor | The partner turning toward you was explained only by distance and "less off your mic's front". The main reason is the talker's directivity: a voice is louder and brighter in front of the mouth. | **FIXED.** Key "It rises: their mouth now faces your mic"; the explanation names directivity first, distance second. Pinned. |
| R6 | B17 Mid-Side width (`arenaPages.tsx`) | AE | minor | "Wide (k > 1): each side's pickup grows a rear lobe of the opposite polarity" implied no lobe below k = 1. With a cardioid Mid, L = M + kS has an opposite-polarity lobe for every k > 0 (its minimum is 0.5 − √(0.25 + k²)); the drawing shows it dashed at every width. | **FIXED.** Modest width: "Each side already has a small opposite-polarity rear lobe (dashed); it grows with the width." Wide: "the … rear lobe … grows large". Pinned. |
| R7 | B16 `mo.place.3` | CL | minor | "Farther away, the end points are relatively closer in distance to the closest point" did not parse. | **FIXED**: "From farther back, the ends of the walk are not much farther away than its closest point, so the level changes less along the walk". |
| R8 | B17 MEET IT (sound stages) | CL | minor | "plus the PA and music, strongly the same in every mic". | **FIXED**: "which reach every mic, each at its own time". |
| R9 | B17 downmix step prompt | CL | minor | "Listen for what each output loses" in a silent lab. | **FIXED**: "Watch what each output loses — on a real job the numbers only point you to where to listen." Pinned. |
| R10 | Practice "mixed cards" intro: B10, B11, B14, B15, B17 (`copy.ts`) | CL | minor | The intro named cards that were not mixed: B10 "the handoff, the open mics" (the cards are the stands shotgun and the radio coordinator), B11 "the private circuit" (the card is frequencies), B15 "the cue" (music copies), B17 "the facts of the event" (a failed side of the pair); B14 "the structure" (the glass). | **FIXED**, each to the cards it mixes. Pinned. |
| R11 | B09 `b9.sym.rub` why and the NOTES card; B10 head role, sound goal, `b10.mic.2` prompt and why; B12 `pb.ctx.2`; B13 `fd.place.2` and its prediction; `sportMics.ts` omni handheld blurb | CL | minor | Technique as a rule: "the headset must allow it", "a boom must clear the notes", "A handheld must follow the mouth", "must reach the speaking mouth", "What must you check?", "Distance is never the fix", "What must the gain have allowed for?", "What else must change?", "so it must be close". | **FIXED**: "needs to", "follows", "What do you check?", "Moving it away is not the fix", "should", "keep it close". Safety and permission lines keep their firm words. Pinned. |
| R12 | 21 items: B09 `b9.set.2`, `b9.ctx.2`; B10 `b10.snd.3`; B11 `b11.set.2`, `b11.set.3`; B12 `pb.two.3`; B13 `fd.set.1` (critical), `fd.rec.1`, `fd.ctx.3`; B14 `cl.set.3`, `cl.two.3`, `cl.mix.3`; B15 `tg.mic.1`; B16 `mo.meet.1`, `mo.meet.2`, `mo.set.3`, `q.4` (critical); B17 `cc.set.2`, `cc.set.3`, `cc.place.3`, `cc.two.1`, `cc.two.3`, `q.5` (critical) | CL | minor | Two distractors shared an opening the key lacked ("Fit one… / Fit one…" against "Nothing alone"; "Keep it there… / Keep it there…" against "Find another approved place"; "It still fits… / It fits better…" against "The alignment no longer fits"; "Yes… / Yes…" against "No…"). A test-wise learner picks the odd one out without the idea. | **FIXED**: one distractor per item reworded to a real misconception with its own why (for example "Low under the commentary, so it is barely heard", "Unavailable, so it needs no handoff", "Only with the rider's consent", "A crew member, if the plug sits high"); the alignment keys now start "It no longer fits…". The safety facts are unchanged. Pinned (the old strings stay gone). |
| O-A | B12–B17 START paragraph (engine `journeyIntro`) | CL | — | The shared START text reads "putting a microphone on a field / a dish / a venue … the field itself and where its sound leaves". Each lesson already has a better `terms.startIntro` that the restructure no longer shows. | **OWNER** (the 2026-10-06 ruling made START the same everywhere). Recommendation: let a lesson that names no instrument (sports, crowd) show its own `startIntro`, or add a noun-aware form ("microphones at a field"). |
| O-B | People lessons outside this lab: E01, E03, E07 (Lab 5), F09 (Lab 6), B01, B02, B03, B04, B05, B07 (Lab 7a) | CL | — | Same "it / its sound" wording as R3. | **OWNER**: set `person: true` on each lesson's noun (one line, no other change) — best done in the Lab 7a review and a Lab 5/6 touch-up. Not done here (outside B09–B17). |
| O-C | B10 Placement Studio, side view | CL | — | Seen from the guest's right, the reporter stands behind the guest, so the reporter's held arm reads as the guest holding their own mic — the opposite of the lesson ("hand the mic to the guest" is a wrong answer in `b10.sym.handling`). | **OWNER** (figure drawing; the head-fix branch owns it). Recommendation: draw the reporter faintly behind, or label the hand "the reporter's hand". |
| O-D | Every plan-scale readout | AE | — | Engine precision on long distances, e.g. "≈ 10.005 m (393.9 in)" (B12 MICROPHONES). Same as Lab 6 O-B. | **OWNER**: wire the scaled rounding (`fmtLenScaled`) for metre-scale scenes; feet above about 3 m. |
| O-E | Docks (B09 context, B11 context, others) | CL | — | Word values cropped: "CARDIO…", "FIGURE…", "MONITOR …". Words, not numbers, so D36 holds. Same as Lab 6 O-D. | **OWNER**: an engine short form per value. |
| O-F | B09–B11 context badge (engine wedgeInNull) | CL | — | The badge says "monitors where a stage often puts them" on a PA exercise. | **OWNER**: let a lesson override that badge word ("the PA where the venue hangs it"). |
| O-G | Voice, the whole lab | CL | — | Page goals say "where we recommend you begin"; orient says "suggested starting points". Same as Lab 6 O-C. | **OWNER**: pick one. Recommendation: "suggest". |
| O-H | B17 MICROPHONES, B11 Placement Studio | CL | — | Crowded labels at 390 wide: B17 "U3" and "D" collide and the camera glyph covers the access route; B11 "PERIMETER BOOM" and "TEAM HEADSET" leaders cross. Readable, above 9 pt. | **OWNER**: a label pass on the small plans (like Lab 6 O-E). |
| O-I | `polarityDelay` (shared with Labs 1–6), on every B two-mic page | CL | — | Key "Nothing: polarity flips the sign…" against two distractors that both open "It …". A lab-wide shared item. | **OWNER**: reword one distractor lab-wide in a separate pass (the fact is right). |
| O-J | B16 hydrophone (`mo.mix.1`) | AE | — | "the cable strain-relieved — never pulled out by a damaged cable" follows the source line but reads as if pulling by an intact cable were fine. | **OWNER**: confirm with the hydrophone guide; suggested words "never lift it by a damaged cable, and replace a damaged cable before use". |

### Verified — no change (AE)

| check | result |
|---|---|
| Parabolic dish (B12, `parabolic.ts`) | f = r²/4d: 330²/(4·224) = 121.5 mm and 203²/(4·122) = 84.4 mm, matching the derived presets. Gain onset c/D = 343.2/0.66 = 520 Hz and /0.406 = 845 Hz. Ray reflection off y² = 4fx meets the focus on the axis; off-axis rays miss it (drawn). "Higher frequencies weaken first" for aim and focus errors; no invented dB curve; low sound reaches the element directly. The capsule is the maker's (some dishes use an omni). |
| Shotgun (B13–B15) | Below the upper mids it hears like its capsule; it narrows only higher up; rejection depends on frequency and angle; it does not "reach". Taping the slots changes the mic. |
| Boundary (B14, `boundary.ts`) | Image-source paths; first notch c/(2Δ). Perpendicular c/(4h): 0.30 m → 286 Hz, 0.10 m → 858 Hz, 0.01 m → 8.6 kHz. The captured case (h 30 cm, source 3 m out and 1 m up): Δ = 3269.6 − 3080.6 = 189 mm, first notch ≈ 908 Hz (shown 910 Hz). Hard floor, no polarity inversion. A shotgun on foam, soft mats: not a boundary. |
| Practice geometry | B13: √(10² + 16²) = 18.87 m, atan(10/16) = 32°, C 24 m (2.4 × A ≈ 7.6 dB). B14: 5 / 8 / 11 m. B15/B16: 2.00 / 2.83 m at 45°; mirror places M1/M2 give Δt = 0 along the whole walk (true). B13 coverage corner (2, 2) from M: 58° left. |
| Inverse square | 20·log(90/3) = 29.5 dB ("about 30 dB"); doubling = 6 dB. |
| Pass-by (B16, `passBy.ts`) | Slant range, 1/r × ideal polar gain, Δt and notches between two mics from the drawing; no pitch or speed number anywhere; the walking-source note has no digit. Aim along vs across: longer sector vs short strong one, and more of what lies beyond on the axis. |
| Downmix and M/S (B17, `downmix.ts`) | M = (L+R)/2: centre 0 dB, one side −6.0 dB, uncorrelated −3.0 dB. Fold-down L′ = L + 0.7071 C + 0.7071 LS (−3.01 dB). L = M + kS, R = M − kS ⇒ (L+R)/2 = M for any k; Side + lobe to the left; Side level 20·log k. LFE kept as an optional extra. |
| Delivery card | −23 LUFS integrated, ±1 LU where live work makes the target impractical, −1 dBTP true peak — said as one example, "use your broadcaster's"; dBFS input peaks kept apart from program loudness; a limiter cannot undo a clipped preamp. |
| Headroom chain (`headroom.ts`) | Clip at the first stage over its limit propagates; the output fader only scales the bus; the exercise is solvable (TX ≤ −16, preamp = −22 − TX) and the start state is the gentle-clap trap. "−12 dBFS" always "a starting point, not a delivery standard". |
| Coverage (B17, `coverage.ts`) | Counts computed: minimal 1 + 1 + 2 = 4, extensive 2 + 4 + 4 + 4 = 14; the failure drill (same role first, then the named fallback, else an honest gap) is sound broadcast practice. |
| Routing (B09–B11, `feeds.ts`) | Cough cuts the mic from everything; talkback goes to the producer only; the return is mix-minus with cues (a full program return is flagged as the late-self problem); the crowd on its own channel; the officials' private circuit can never be routed to program, PA, recorder or stream (refused, with the reason); the announcement mic is opened on purpose to the PA, program only with permission; audience mics stay out of the PA. |
| RF | Frequencies and the antenna plan belong to the venue's radio coordinator; the antenna straight, never coiled; body shadowing; batteries; a cabled fallback. |
| Speech mics | Headset capsule at the outside corner of the mouth, out of the breath; a supercardioid's nulls near 125° with a rear lobe; a figure-8 lip ribbon least sensitive at its sides, its rear still hearing the crowd; the guard sets the distance; never blow into a mic; a passive ribbon's interface and phantom checked with the audio lead; an omni handheld forgives aim, a directional one needs it. |
| Safety | Lightning: a substantial building or hard-topped vehicle, dugouts and open shelters not safe, 30 minutes after the last thunder (every lesson). Never into play, run-off, routes or the apparatus; approval before any mount or body fit; protective equipment never altered; no mic on a horse, its tack or its rider, no loud tones near horses; wet-area electrics by a qualified person; hydrophone recorder and connectors on the dry side, no people or animals in the water; no improvised overhead rigging; never provoke feedback; headphones start low. |

### Verified — no change (CL)

- **Journey:** all nine lessons run the eight pages; PREDICT FIRST is ungraded; one FROM EARLIER per page; six quick-check items with critical safety items; briefs pass more than one setup and name the wrong reasons (brand, loudness, "more mics", cancellation, recorded cheers).
- **Item rules:** `_mikingItemRules`, `mikingItemBalance` and `mikingLearnerText` pass; no key above 1.3 × its distractors' mean after the fixes; the remaining "only" keys are routing and permission rules, where a firm word is right.
- **Voice and names:** the standard starting-points line; no brands, federations, standards or citations on screen ("Hammond" untouched); no institutional words; "a consenting adult … no minors, no contact" kept.
- **Navigation:** labs never block navigation (NEXT and CONTENTS always go anywhere; the FOUNDATIONS card says so); the lab ends on the "what's left" screen. Engine features, unchanged.
- **Legibility:** the captured readouts and labels stayed at or above 9 pt at 390 wide; cropped dock values are words (O-E), never numbers.

## Owner items already logged (not changed) — expert opinion

- **D7-1** (no rule names; clearances as "typical clear zone — check your event's rules"): approve. The numbers drawn (rugby 5 m, basketball about 2 m, volleyball about 3 m) are fair typical values.
- **D7-2** (sport outlines as drawing defaults): approve; judo with no number is right.
- **D7-3** (horses and cars as plan silhouettes, no people): approve.
- **D7-4** (hydrophone kept as one optional card, dry-side connectors): approve; see O-J for one wording.
- **D7-5** (no new immersive preset): approve; immersive in words is enough for a sports lesson.
- **D7-6** (photos): not done; nothing to add.
- **D7-7** (lip-ribbon guard depth a drawing default, no readout): approve. My recollection of the classic lip ribbon's sheet is about 63 mm lips-to-ribbon, consistent with the 60 mm default — read the sheet before ever printing a number.
- **D7-8** (Part 1 coordination, separate slot ids): approve.
- **L7B-G1-12 / -13** (handheld under 15 cm; headset 2–6 cm beside the mouth corner): approve; in practice a headset capsule often sits 1–2 cm from the corner, so the 2 cm end is the realistic start.
- **L7B-G1-15** (the 60° said in words): approve. **L7B-G1-16** (booth plan TODO): approve.
- **L7B-G2-12** (targets at 1.55 m): approve. The headroom chain as an example: approve.
- **L7B-G3-11** (mirror places M1/M2, Δt = 0): approve — true geometry, well used to show why the TWO MICS page moves one mic.
- **L7B-G3-12 / -13**: approve.
- **G2 note** (venue-outline setups in B13/B14 still print a height in the close-up): approve G3's `noCloseUp` approach for B13/B14 too, in a later pass.

## Counts

| Severity | Found | Fixed | Owner |
|---|---|---|---|
| Major | 3 | 3 (R1–R3) | — |
| Minor | 9 | 9 (R4–R12) | — |
| New owner items | 10 | — | 10 (O-A … O-J) |

## Files touched

- Lesson data and copy: `lessons/b09Commentators/lesson.ts`, `b10Sideline/{lesson,copy,geometry}.ts`, `b11Athletes/{lesson,copy}.ts`, `b12Parabolic/lesson.ts`, `b13FieldDiamond/lesson.ts`, `b14CourtIce/{lesson,copy}.ts`, `b15TrackGymCombat/{lesson,copy}.ts`, `b16MotorHorseWater/lesson.ts`, `b17CrowdComplete/{lesson,copy}.ts`.
- Shared: `lessons/shared/broadcast/sportMics.ts` (one blurb), `lessons/shared/sports/arenaPages.tsx` (two strings).
- Engine (words only, backward-compatible): `engine/model/types.ts` (optional `noun.person`), `engine/journey.ts` (person-aware START; three stage lines), `engine/restructure.ts` (person-aware MEET IT goal), `engine/journeyKit.tsx` (two neutral lines).
- No image, figure/head drawing, registry or release-gate file was changed.

## Tests

- New: `test/mikingLab7bReview.test.ts`, with 9 tests.
- tsc: clean.
- Full suite: a first run during the work gave 9914 pass, 4 fail (three from this worktree having no node_modules link yet, one an absolute word in my own first draft of R12, caught by the item rules); after the fixes 9931 pass, 0 fail; after merging the newer final-lab (the Lab 6 review, Lab 7a group 3) 9994 pass, 0 fail, tsc clean.
