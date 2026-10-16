# Figure review — 2026-10-08

**Owner, on a Pixel screenshot of F04 "Impacts, Liquids and Textures" (MEET IT 2/6):** the performer's lower body looked turned around, the trousers showed a bulge, and an arm seemed to come out of his hip. "Study all of our figures and make sure they are drawn correctly, proportionally, and decently."

**How the review was done.** A temporary gallery (since removed) drew the MEET IT art of all 129 Miking lessons, in every variant, side and top, at 390 pt wide in headless Chrome. Every figure was checked against these points:

- **Orientation.** The head, hips, knees and feet face the same way.
- **Limbs.** Each arm starts at its own shoulder. The upper arm and forearm are adult lengths. Each hand is within reach of its shoulder.
- **Proportions.** The head, neck and shoulders are in scale.
- **Decency.** No bulge, and no hand or arm at or in front of the groin.
- **Contact.** Each hand touches the object it holds.

The fixes are in the shared builders. One change corrects every lesson that uses a pose.

Before/after pictures, each one pair, are in `docs/art/figure_review_2026_10_08/`.

## What caused the F04 picture

1. **The shared side figure (PlayerFigure `buildSide`) had no hips.**
   - The shirt ran below the hips. It had a lump at the front (the old "lap" point, 53 mm under the hip) and a large "seat" behind.
   - Standing, this read as a bulge in front and a belly behind. That is why the lower body looked turned the wrong way. The legs themselves always pointed the right way.
2. **The Foley performer's arms had no lengths.** `standing()` took any elbow and wrist it was given. In F04 WATER the far arm was:

   | Part | Drawn | Adult |
   |---|---|---|
   | Upper arm | 777 mm | ≈ 325 mm |
   | Hand from shoulder | 1083 mm | — |

   The far elbow sat below the hip. So the arm seemed to come out of the hip, and the hand hung at knee height in front of the thigh.

## Pose inventory (34 distinct pose/view combinations, 15 code paths)

| Code path | Views | Lessons |
|---|---|---|
| **Shared PlayerFigure** (PlayerPose → `buildFront` / `buildSide` / `buildAbove`) | front seated, front standing, side standing, side seated, side floor, above (6) | guitars C01 C03 C05A–C C07 E07; piano C11 E07; harp C10; clavinet C12; kit M09–M11 I01a–e; tonbak M12; tabla M13; cajón I02; woodwinds A06–A09b; free reed A10 A11; singer E01 E03 E07; broadcast B01–B07 B09–B11; Foley F01–F05; location F09; spatial F10; measuring F11–F16 |
| Bowed 3-D figure (`bowed/BowedArt`, `bass`) | side, above (2) | C06a C06b C09a–c |
| Lute players (`lutes/lutePlayers`) | front, above (2) | C13 C14 C15 |
| Brass (`brass/BrassArt`) | side, above (2) | A01 A02 |
| Low brass (`lowbrass/LowBrassArt`) | side, above (2) | A03 A04a A04b |
| Saxophone (`sax/SaxArt`) | side, above (2) | A05a–d |
| Free-reed profile (`freereed/PlayerProfile`) | side (1) | A10 A11 |
| Small percussion (`smallperc/Player` + `Arm2D` + `Hand`) | side, above (2) | I02 I03a–c I04 I05a–d |
| Metal line art (`metal/metalArt`, I06b `dancerFront`) | side, above, front, dancer front (4) | I06a I06b I06c I12 |
| Mallets (`mallets/MalletArt`) | side, plan (2) | I07–I10 |
| Electric piano line art (`keys/KeysArt`) | side, top (2) | I11b |
| Ensemble (`ensemble/SeatingArt` + `BandArt`) | front elevation, section, plan (3) | E02 E04 E05 E06 E08–E16 |
| Body-worn torso (`broadcast/BodyWornArt`) | front (1) | B02 B04 B05 |
| Field sites, small people (`field/SiteArt`) | side, plan (2) | F06 F07 F08 |
| Hand-drum plans (`handdrums/HandPlan`) | plan (1) | M04a–c M05 |

## Issues found and fixed

| # | Pose / code path | Issue | Fix | Lessons affected |
|---|---|---|---|---|
| 1 | Shared **side** figure (`PlayerFigure.buildSide`), all postures | The shirt ran below the hips: a lump in front of the crotch and a seat behind, so the lower body seemed turned around | The shirt is tucked in at the belt. Below it is one trouser **pelvis** joined to the near leg: a flat front never further forward than the thigh, the seat behind, the crotch under | Every side-view figure (row 1 above, side views) |
| 2 | Foley `standing()` arms | No arm lengths. Upper arm up to 777 mm, forearm up to 381 mm, hands up to 1083 mm from the shoulder | `armChain()`: a true two-bone arm from its own shoulder (upper 325 mm, forearm 265 mm). The authored elbow is only a hint. A wrist out of reach is pulled back. An elbow never points forward when the hand is below the shoulder | F01 F02 F03 F04 F05; also the field pole operator (F02, F08) and the dish operator (B12), which use the same builder |
| 3 | Foley `standing()` posture | A hand working low in front could only reach by stretching | New `lean` option: the upper body bends forward at the hips, and the head stays nearly upright over the collar | F04 impact/live 28°, water 30°, texture 25°; F03 paper 30° |
| 4 | F04 poses (data) | Far hand at the groin or knee (impact, water, texture, live) | Far hand on the table edge (impact, live), under the jug (water), on the board (texture) | F04 |
| 5 | Far hands ahead of the thigh (data) | A far hand at the trousers' front read as being at the groin | The far hand now hangs beside the thigh. The walker's swing is kept at the side | F01 walker, F02 worn, F03 keys/door/live, F05 artist |
| 6 | Shared **standing talker / singer** (`voicePose.SINGER_SIDE`) | The near hand hung at the trousers' front edge | The hands hang beside the thighs (wrist 6 mm ahead of the collar line, not 40) | E01 E03 E07, B03–B07 B09–B11, F09 F10, F11–F16 (operator) |
| 7 | Metal line art, side (`metalArt.playerSide`) | The arm was a curve that sagged to the hip before turning up to the hand (the "arm from the hip" again) | `elbow2D()`: a two-bone arm from the shoulder with the elbow bent down. Profile lengths are 265/240 mm, foreshortened, and never longer than an adult arm | I06a I06b I06c I12 |
| 8 | Ensemble figures (`SeatingArt`) | The torso and the shoulder oval were drawn in opposite directions and cancelled where they overlapped. That left a hole over the chest (a "coat hanger"). The neck skin ran down below the shoulder line | Every figure part is now unioned into its mass (`addFig`). The neck ends at the collar | E02 E04 E05 E06 E08–E16 |
| 9 | Small-percussion player (`smallperc/Player`) | The neck was stretched: about 120 mm between the jaw and the collar | The head was lowered 26 mm onto the collar | I02 I03a–c I04 I05a–d |

No figure had a mirrored leg chain in the data. The "turned around" look came from issue 1 on its own.

## Ratchet

`test/figureAnatomy_20261008.test.ts` runs 46 checks and locks the fixes.

1. **Every pose builder the node tests can reach** is checked from its joints. These are: the Foley bodies F01–F05 (side and top), the singer, the seated and standing talker (both facings), and the measuring operator (both facings). The checks are:
   - the head is not behind the collar;
   - the knees never bend backward;
   - each foot is under the body;
   - each shoulder is at the top of the torso;
   - the upper arm and forearm are never longer than an adult's (`ARM`);
   - each hand is within reach of its own shoulder;
   - an elbow never points forward when the hand is below the shoulder;
   - nothing is in the **groin box** of a standing figure, 75–340 mm in front of the hips, from 60 mm above them to 230 mm below. Hands resting on a declared prop surface (a table top, a chair rail) are allowed;
   - the figure is 6.5–8 heads tall.
2. **The checker is itself tested.** It catches the F04 water arm as it was shipped, a backward knee, and a head turned away.
3. **`standing()` / `armChain()`.** Both bones keep their lengths and a hand is pulled back into reach. `lean` moves the collar forward and down and leaves the legs alone.
4. **Skia drawings, checked from the source:**
   - `buildSide`: the shirt is tucked; the pelvis front is never further forward than the thigh; the pelvis is joined to the near leg; the far arm starts at the far shoulder and is painted behind the shirt.
   - Metal: the elbow is solved (`elbow2D`).
   - Ensemble: parts are unioned and the neck ends at the collar.
   - Small percussion: the head height is locked.

## Left as it is (owner's call, not anatomy errors)

- **Bowed and brass figures.** They are translucent and built from tubes so the instrument shows through. They are crude, but the joints are consistent and the figures are decent.
- **Lute players (front view).** The thighs are foreshortened toward the viewer and read as two separate knee ovals.
- **Standing figures from above.** The toes show past the chest. This is correct, but it can read as dark pads beside the head.
- **I05a cowbell, from above.** The folded arm's forearm is hidden under the upper arm (correct from above), so the sleeve reads as a stump.
- **Leaning Foley performer (F03 paper, F04).** The throat is a little thick because the profile head's neck column stays vertical.
- **Figures drawn only on later pages** (for example the brass setting page's singer, the hand-drum plans and the sport pages). These are not on MEET IT, so they were reviewed in the code, not captured.

---

# Pass 2 — 2026-10-15 (owner go)

**Owner's standard:** "arm and leg proportions (forearm, elbow, upper arm, shoulders, chest, waist, hips, thighs, upper leg, lower leg, ankle, foot. hands, wrist, fingers, knuckles, finger tips, finger nails ALL NEED TO BE IN PROPORTION and articulate correctly." Mid-pass the owner added: "shoulder transitions from shirt sleeves to the shirt body look very unnatural and plug and position interchangeable limbs and parts rather than a beautifully drawn human figure." Hands ON instruments (necked strings, keyed winds) were left for a dedicated pass that follows this one.

## Owner decisions A (keep-outs allowed to move with the anatomy)

| Item | Was | Now | Keep-outs re-derived | Placements |
|---|---|---|---|---|
| Singers / talkers (E01 E03, B lessons) — neck too long | collar at the torso datum: ≈ 85 mm of neck under the jaw | the drawn collar 24 mm higher (`COLLAR_LIFT`); shoulders, arms, lav marks, pack stay on the datum | neck capsule ends at the collar (24 mm shorter); torso box top = collar − 10 (24 mm higher) — standing and seated | all suggested placements still clear (Lab 5/7 tests) |
| A06/A07 flute, piccolo — left upper arm a level band across the chest | shoulders square; left elbow bend ≈ 37° | the chest turns 25° right, the left shoulder 35 mm forward (`flutistBody`); bend ≈ 65° (flute), elbow 86 mm below the shoulder | shoulders capsule and arm capsules follow the joints; hands, flute, reference points unchanged | unchanged (woodwind tests) |
| I12 gong — mallet hand at the shoulder | player {500, −560}: shoulder ≈ 0.6 m from the strike point | {580, −1000} (bossed {580, −870}, `playerAt`); hand on the handle (`MALLET_REACH`), shoulder→hand 0.84–0.91 of reach; front view draws the player in front of the post | `env.player` per variant around the new place; `env.mallet` from the striking shoulder to the strike point | unchanged; all clear (52/52) |

## Shared figure (PlayerFigure) — one garment

- The shirt body and both sleeves are shaded in ONE light (FigureMass `box` = the garment's bounds): a sleeve no longer reads lighter or darker than the shirt it leaves.
- Within ≈ 150 mm of the shoulder a sleeve's edge over the shirt is a soft fold with no rim (`soft`); lower down an arm in front of the body keeps its contour.
- The front deltoid lies ALONG the arm (`capAlong`), so it turns with it and never stands out as a pad; the profile deltoid closes inside the sleeve (no dimple).
- Shirt sleeves have their own widths (`SLEEVE`): cloth over the elbow, not the bare arm's pinch. A nearly straight arm's crook no longer loops into a notch.

## Families

| Family | Lessons | What changed (body only — hands on instruments untouched) |
|---|---|---|
| Bowed strings + brass sharing the body (`bowed/BowedArt.playerGroups`) | C06a C06b C09a–c, A01 A02 | Profile torso = the house side figure (collar, chest, belly, healthy back, tucked shirt, belt, trouser pelvis); neck into the collar; house legs and shoes; near sleeve flows out of the shirt (one light, soft join); a forward shoulder (trombone slide arm, bass bow arm) grows the shirt round it; top view one garment, no feet on standing figures; bow arm at adult lengths (upper 315, forearm ≈ 255; was 170–190) |
| Low brass (`lowbrass/LowBrassArt`) | A03 A04a A04b | `profileBody()` with buildSide's shaping; pelvis joined to the near leg; shoes flat on the floor; sleeve joined at the deltoid with no rim at the join |
| Lutes (`lutes/lutePlayers`) | C13 C14 C15 | One shirt with one outline; front shaping; oud thighs into knees (no knee ovals); sitar/veena cross-legged, near shin over far, bare feet; oud upper arm drawn at 310 mm |
| Small percussion, free reed, mallets | I03a–I05d, A10 A11, I07–I10 | Top view house shoulder outline; sleeves in the shirt's light; A11 upper arms ≈ 305 mm (were 240), strap over the shoulder; vibraphone fists grip ALONG the shaft (thumb-on-top hold) |
| Ensembles (`ensemble/SeatingArt`, BandArt through it) | E02–E16 | One body builder (front/profile, standing/seated): sloped shoulders, chest > waist > hips, belt, legs to real shoes; sleeves joined to the shirt's shoulder; neck into the collar; singers' hands beside the thighs; plan shoulders rounded, no feet from above |

Reviewed as an illustrator (proportion, joints, opacity, clashes at 3×) and as a player (posture and holds) — `C:\Users\profe\Downloads\2026-10-15_MIKING_FIGURES_PASS2_BEFORE_AFTER.png` holds the labelled pairs.

## Open (for the hands-on-instrument pass, or needing a model joint moved)

- **Hands on instruments (next pass):** guitar fretting hand still a raised fan; bow holds and string left hands; trumpet/trombone/horn/tuba fingers; oud risha, sitar mizrab, veena left hand from below; accordion keyboard/bass hands; ensemble quartet and horn fists; no fingernails on the shared PlayerFigure hands.
- **Flute left hand** sits where the model's key station puts it (≈ 30 cm along the flute); the elbow now bends 65° but would hang lower with the wrist moved toward the head joint (the keyed-winds hand pass).
- **Joints that feed keep-outs, not moved here:** bowed bass shoulder→grip 773 mm (arm ≈ 690) and plucked 798 mm; cello left hand 152 mm from its shoulder; sitar right elbow 458 mm from the shoulder (adult ≈ 310) and veena upper arm 363 mm; I05a cowbell and I05c woodblock wrists behind the chest (forearm hidden from above); ensemble trumpet/trombone hold points put the elbows at shoulder height (E10, E16).
- **Gong:** the front and side views are drawn as projections of a player turned toward the gong (the figure itself is frontal / profile).

---

# Pass 3 — 2026-10-16 (owner go): hands on instruments, shoulders and sleeves

**Owner:** "check that the hand is correctly positioned, placed, bent, fingers and digits accounted for … shoulder transitions from shirt sleeves to the shirt body look very unnatural and plug and position interchangeable limbs and parts". Evidence: `C:\Users\profe\Downloads\2026-10-16_MIKING_HANDS_AND_SHOULDERS_BEFORE_AFTER.png` (15 instruments at 3×, 3 full-figure shoulders).

## One hand model

`shared/players/handModel.ts` (pure): an adult hand in 3-D — four fingers of three phalanges (index 38/22/17, middle 43/26/17, ring 40/25/17, little 32/19/16 mm) and a thumb (metacarpal 44, phalanges 31/26) on a knuckle arc; joints limited (MCP −20…90°, PIP 0…110°, DIP 0…80°, spread per finger); IK puts each pad on its target; `fitHand` turns the hand until the pads land with the wrist ≤ 70° (3-D). `PlayerFigure.drawHand3` draws a posed skeleton bone by bone (palm hull, thenar, wrist cut at the cuff, finger-over-finger lines, knuckle row, nails at 3×), split in front of / behind the instrument. Every family poses its hands with it and exports `handCases()`; `test/figureAnatomy_20261008.test.ts` runs them all (five digits, bone lengths, thumb side, joint ranges, 3-D wrist, playing digits ≤ 3 mm).

## Families

| Family | What changed |
|---|---|
| Guitar family (C01 C03 C05A–C C07, E07) | Fretting arm solved in 3-D (forearm reaches forward, foreshortened; wrist ≈ 57°); C-major shape — index, middle, ring pads on their strings behind their frets, little finger resting just off the strings, thumb behind the neck; the same skeleton seen from above. Pick held between the thumb's pad and the index, point on the strings. Lap steel: bar hand (index on the bar, thumb and middle on its sides, ring/little resting behind it) and finger-pick hand. |
| Bowed (C06a C06b C09a–c) | First-position stopping hands (violin spacing, cello one finger per semitone, bass 1-2-4), thumb behind the neck; bow hold with the thumb bent under the frog, fingers draped (violin little finger on top, French bass hold); pizzicato pads on the strings. |
| High brass (A01 A02) | Valve pads on the buttons, thumb under the leadpipe between valves 1 and 2, little finger on a hook; left hand round the casings; trombone hands on receiver/brace/bell brace and the outer slide brace (braces moved apart). |
| Low brass (A03 A04a A04b) | Horn levers + little finger in the hook + thumb lever, right hand cupped in the bell; tuba/euphonium pads on every valve button, thumb ring. |
| Lutes (C13 C14 C15) | Oud risha between thumb and index; sitar mizrab on the index, index/middle pulling the main string; veena right hand on the melody strings. |
| Winds + sax (A05a–d A06–A09b) | Left hand above right; pads on the keys/rings/plates; thumbs on thumb rest, octave key, B key, hook; flute wrist toward the head joint (elbow 73°, 124 mm below the shoulder). Sax player now the house body (opaque). |
| Free reed + small perc (A10 A11 I05a I05c) | Accordion chord on the keys, bass hand under the strap on the buttons; harmonica cupping states; cowbell/woodblock stick hands with the forearm in front of the chest. |
| Ensembles (E02–E16) | 42 posed holds at the ensemble scale; violin/viola left fingers curl down onto the strings; brass elbows hang. |

## One garment

Shared figure: every sleeve **emerges** from the shirt (FigureMass `emerge`: invisible at the point of the shoulder, fully there ≈ 150 mm down; its drop shadow too); the shirt's outline is hushed under the deltoids; rim light and core shadow fade at the shoulder; one soft crease in a bent elbow's crook — never a line along the sleeve. Bowed/brass, low brass, lutes, free reed and small-perc bodies got the same treatment in their own painters. Dimmed players (pianist, tabla, tonbak, harpist) recede by colour, as one opaque layer, instead of by opacity. A robust path union was added (a fretting sleeve once came back as its deltoid cap alone).

## Joints and keep-outs moved (owner approved: keep-outs follow corrected anatomy)

Pass-2 OPEN items closed: bowed bass shoulder→grip 773 → 665 mm (plucked 798 → 650); cello left hand 152 → 257 mm from its shoulder; sitar right upper arm 458 → 310, veena 363 → 310 (oud 367 → 310); I05a/I05c forearms in front of the chest; E10/E16 brass elbows below the shoulders; flute left elbow. Brass valve arm: with real 265 mm forearms and pads on the buttons the right elbow rises to ≈ 20° below level (the round-4 pin now 18–58° for that arm; the holding arm still ≥ 38°). Every dependent keep-out (arm capsules, hand boxes, plan footprints) was re-derived; every suggested starting placement and plan re-checked by the family tests and `mikingPlanCollisions`. Per-family old → new numbers are in the commit messages (0e6c82b5 … 9d49da3a).

## Open

- Veena: the true left-hand reach (arm beneath the neck) needs the player ≈ 15 cm closer; the tala strings are drawn on the audience side (real veenas: the player's side) — moving them moves the two-mic starting placement (owner's call).
- Bassoon: the model puts the wing joint directly behind the long joint, so the left fingers cannot reach its front (instrument change).
- Cello/bass: the spec puts the highest string on the player's left; believed to belong on the bow side (owner's call).
- Brass: the trombone left grip encloses the gooseneck by ≈ 4 mm; the trumpet left palm grazes the bell tube by ≈ 3 mm; side-view trumpet fingertips sit ≈ 30 mm above the caps (the curl is into the picture).
- Violin/viola bow hand from the side still reads as a closed hand (the slant toward the tip not achieved); angled 1st violinist (E11 vn1.1) seen edge-on to the finger curl.
- Harmonica partly cupped reads as a pinch plus a hand; accordion side-view black keys at the chest end (needs a reference).
- Narrow necks (mandolin, ukulele) from the front: the fingers read as parallel and upright; the guitar pick fist is plain.
- Hand solving costs ≈ 35–300 ms per posture on first draw (cached after).
