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
