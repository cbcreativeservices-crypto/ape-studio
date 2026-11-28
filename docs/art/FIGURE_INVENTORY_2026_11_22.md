# Human figures: inventory and technical map (2026-11-22)

This is the inventory of every human figure drawn in the app, made read-only on 2026-11-22 for must-do row D78. The owner asked: "i want you to improve all human figures ... Find all human figures and improve them. But first show me one".

Line numbers refer to the working tree as it was on 2026-11-22.

---

## Human figures in AP&E Studio: inventory, how they are drawn, and the kit drummer

This was read-only. I changed no files and ran no tests, builds or git writes. All paths are under `C:\Users\profe\dev\ape-workbench\`. Short forms used below:
- `L\` = `src\screens\lab\miking\lessons\`
- `PF` = `L\shared\players\PlayerFigure.tsx`

Three Explore subagents swept the lessons (a–c; e/f/i/m/spk) and everything outside Miking. I read the core libraries, the drummer chain, the tests and the docs myself. Sizes are estimates from view-box mm against the rack glass (about 360 × 250–340 pt on a 390 pt phone), not measured on a device. In the size columns, hero is about 200 pt or more, medium 80–200 pt, small 25–80 pt and tiny under 25 pt.

**The main finding:** `PlayerFigure.tsx` is the hub. Almost every body, every skin head (`FigureHead`) and the shared tone table `FIGURE_TONES` / `FIGURE_SKIN` live there. Families that build their own geometry still paint with its `FigureMass`, `FigureHead`, `armPath` and `drawHand3`. So changing `FigureMass` + `FIGURE_TONES` + the head builders changes the look of roughly 90% of all figures at once. Pose, geometry and hands are separate systems and do not change with it.

---

# PART 1 — Inventory by family (counts)

## Families that paint through PlayerFigure (`FigureMass` / `FigureHead`)

| # | Family | Drawing code | What it covers | Count |
|---|---|---|---|---|
| F1 | Shared figure, direct use: `PlayerBehind` / `PlayerInFront` | `PF:1979`, `PF:2040`; built by `buildFront` :1464, `buildAbove` :1626, `buildSide` :1739 | Woodwinds a06–a09b (scene and the 10-player section plan); guitars c01 c03 c05a–c c07 (scene and stage plan); harp c10 (side, plan, pluck sequence); piano c11 and the E07 pianist; Wurlitzer i11b; broadcast b01 b02 b06 b07 b09 (`SeatedTalker`, `BroadcastArt.tsx:108`); standing presenters, talkers, reporters, athletes, press member, two-talkers b03–b06 b10 b11 (`VoiceFigure`, `StandingTalker`, `StandingPresenter`, `MovePresenter`); boom operator b04 b10 b11 f09 (`LocationArt.tsx:326`); sports clapper b14 and dish operator b12/b13 (tiny); singers e01 e03 e07 (`VoiceArt.tsx:124`, `VoiceSoundArt`); Foley f01–f05, f02/f08 pole operator, f06/f08 site people, f09 talker, f10 people and listener, f11/f14/f15/f16 measuring operator; metal players i06a–c and i12 (`metalArt.tsx:244`); mallet players i07–i10 (`MalletArt.tsx:809/942/1041`); cajón i02; timpani m06; concert bass drum m07a; tonbak m12; tabla m13 (floor, barefoot); free-reed above/front views a10 a11 | About 80 picture types in about 60 lessons |
| | …outside Miking | Imported directly | Game Audio (`GaScene.tsx:538`, `chcSpeakerMap.tsx:149`, `hud\bOutput.tsx:44`); Mic Selection (`polarStage.tsx:187`); Speaker Coverage TOP/SIDE (`micspeaker\viz.tsx:3418`, `:3766`) | 6 places |
| | …thin wrappers | `src\features\lab\figureHead.tsx` (`FigureHeadAt`, `FigureStandingAt`) | Foundations M6 wavelength ruler (`foundations\viz.tsx:1907`); Wave Physics m10/m5/m4 (`vizWave.tsx:2327`, `:2917`, `:3169`) | 4 drawings |
| F2 | **Kit drummer** (`kitScene\`) | `KitSceneArt.tsx:337/352`, `stickPlayer.tsx:88/118/189/242` | See Part 3 | About 20+ lessons |
| F3 | Bowed 3-D figure | `L\shared\bowed\BowedArt.tsx:765` (`playerGroups`); uses `armPath`, `drawHand3`, `headProfile`, `FigureMass` | Violin, viola, cello c09a–c; bass c06a/b; trumpet and trombone a01/a02 (`BrassArt.tsx:322`); sax a05a–d (`SaxArt.tsx:314`, own `headSide` / `headTop`); plus the setting plans (self and neighbours) | 13 lessons, about 8 picture types |
| F4 | Low-brass figure | `L\shared\lowbrass\LowBrassArt.tsx:731` (`profileBody` :564; hand in the bell :353) | Horn, tuba, euphonium a03/a04a/a04b: scene, portrait, 3 sound steps, plan | 3 lessons, about 6 types |
| F5 | Free-reed profile | `L\shared\freereed\PlayerProfile.tsx:332/370`, `Hand3Art` :411 | Harmonica a10 (side, top, front close-up, the hands' chamber); accordion a11 (side, top, front, bellows) | 2 lessons, 8 pictures |
| F6 | Lute players | `L\shared\lutes\lutePlayers.tsx:670/859` | Oud, sitar, veena c13–c15: scene, plan, and 5 accompanist marks (`LutePlan.tsx:59`) | 3 lessons |
| F7 | **Ensemble seating** | `L\shared\ensemble\SeatingArt.tsx` (`planSeat` :1364, `elevSeat` :1808); hands from `ensembleHands.ts`; batched paint `PaintBatch` :2478 | e02 e04 e05 e06 e08–e16, 26 seatings. Largest: orchestra e13/e14 with 57 players and a conductor (58 figures); strings e11 with 34 and a conductor; choir risers e05 with 38 and a conductor; children e06 with 16 (plan only); big band e16 with 17 plus the kit drummer | 13 lessons, 26 seatings |
| F8 | Small-percussion player | `L\shared\smallperc\Player.tsx` (`PlayerSide` :45, `PlayerTop` :118, `Arm2D` :156; hand-rolled body painted with `FigureMass` and `FigureHead`) | i03a–c, i04, i05a–d | 8 lessons |
| F9 | Plan markers: hand-rolled shoulders plus `FigureHead` | `handdrums\HandPlan.tsx:136` (M04a–c, M05, I07–I10 Setting); `speakers\BacklinePlan.tsx:158` `PlanPlayerTop` (SPK, c02 c04 c08; capsule hands with no fingers); `keys\KeysPlan.tsx:98`; `BrassSettingPage.tsx:85`; `strings\PStagePlan.tsx:102`; `c12Clavinet\art.tsx:98`; turned heads `BroadcastArt.tsx:134/143` (b01–b07 b09 b11); f09 "The head turns"; f10 in-ear head (`pages.tsx:734`) and destination head (`:1312`) | About 15 sites, about 30 lesson uses |

## Hand systems

There are **four** separate hand systems, plus some primitives. A comment in `anatomy.ts` claims "ONE HAND SYSTEM"; the code does not match it.

| # | Hand system | Code | Used by | Count |
|---|---|---|---|---|
| H1 | 2-D `handShape` | `PF:817` (kinds grip, rest, keys, above, wrap, bow; its own `FINGERS` table :730) | Drummer fists, desk hands of seated talkers, singers' resting hands, pianist's keys, boom-operator grips, plan fists | — |
| H2 | 3-D skeleton `drawHand3` | `PF:521`, skeleton in `players\handModel.ts` (`HAND` table :61, which is a *different* finger table from H1) | Guitars, bowed, brass, low brass, sax, winds, lutes, harp, harmonica/accordion, ensemble held instruments | — |
| H3 | Anatomical hand | `L\shared\hand\anatomy\AnatomicalHand.tsx:141` / `drawAnatomy.ts` / `anatomy.ts` (hands redesign 2026-10-24) | Small percussion via `HeldHand.tsx:41` and `Hand3` (`smallperc\Hand.tsx:199`) | 8 lessons |
| H4 | 2-D `Hand` from `smallperc\hands.ts` | `smallperc\Hand.tsx:107` (forearm, palm, finger tubes, nails, creases) | **Bongos and congas M04a/b and M05 "How it sounds" hand pages**: `handSoundArt.tsx:112–181` (side strike) and `:482–520` `StrokeMap` (top view); cajón i02 top; finger cymbals i06b front (hero); bar chimes i06c | 5 sites, 9 lessons |
| H5 | Mallet fists | `L\shared\mallets\MalletArt.tsx:123` `fistPaths`, `:259` | i07–i10 | 4 lessons |
| | Primitives | — | Blob palms: i03b `soundArt.tsx:93`, i05b `soundArt.tsx:54`. Held-arm stroke plus circle fist: `SportSpeechArt.tsx:484`. The engine's `HeldFistGlyph` (`engine\scene\PlacementScene.tsx:1574`). Brass lips and plunger hand as rounded rects (`BrassSoundArt.tsx:128`, `:474`) | — |

## Other families

| # | Family | Code | Where | Count |
|---|---|---|---|---|
| O1 | Voice cutaway (mid-sagittal head, neck and chest; `FigureMass` skin and shirt plus hand-rolled hair, brow, eyelid, eye, ear, airway) | `L\shared\voice\VoiceCutaway.tsx:204–240` | e01 e03 e07 f09 and b01–b07 b09–b11, step "Where the voice comes from" | 1 drawing, 14 lessons (hero) |
| O2 | Speech Lab anatomy (hand-rolled) | `speech\headSection.tsx:217` head cross-section (hero); `speechViz.tsx:68` vocal folds; `vowelViz.tsx:151` mouth and lips | Speech Lab | 3 drawings |
| O3 | Line-art head icons, Skia `HeadIcon` | `src\features\lab\headIcons.tsx`; draws the owner's PNGs | Mic Principles DISTANCE / PROXIMITY / OFF-AXIS / POP / MISTAKES ×7 / STEREO (`micspeaker\viz.tsx:1208…3121`); in Miking: `BrassSoundArt.tsx:378`, `LowBrassSoundArt.tsx:403`, `hand\HandPlan.tsx:85` (a10 a11 m12 m13, metal pages) | 3 call sites outside Miking (7+ heads) plus 3 Miking sites |
| O3 | …SVG `HeadIconSvg` / `HeadGlyph` | `headIconsSvg.tsx` | Binaural, Cable Install floor plot, Mastering mod 3, Room Design plan, Sound Systems ch. 11 and the listener glyph, Speech pop filter and distance, Start Here (`SignalPathArt.tsx:388/406`, `pages.tsx:379/381/860`) | 13 call sites in 10 files |
| O4 | SVG figures | `figureHeadSvg.tsx` / `figureBodySvg.tsx` | EQ Camera Analogy (`CameraAnalogy.tsx:155`, standing front); Room Design side view (`RoomSideView.tsx:324`, seated profile); Cable Install `PersonScale` (`svgArt.tsx:1183`, hand-rolled graphite body) | 5 drawings |
| O5 | SVG figure from above | `figureAboveSvg.tsx` | Sound Systems venue monitors, feedback loop and Operate page; Stage Plot performer symbol (`stageArt.tsx:111`) and choir on a riser (`topArtWorld.tsx:151`, about 11) | 4 call sites |
| O6 | Hand-rolled, outside Miking | — | Owner's floating ear (`foundations\viz.tsx:590–660`; Foundations M1/M2/M14 and Start Here). Canonical grip hand (`micspeaker\viz.tsx:437–730`; "exactly ONE hand drawing", 2026-07-29). Wave Physics listener: the front PNG over a rounded-rect shoulders shape (`vizWave.tsx:2341`). Wave line-art standing bodies (`vizWave.tsx:223/272`). Circle-menu COMMUNITY icon with 3 circle-head busts (`src\components\nav\circleMenuIconArt.ts:90`) | — |
| O7 | Hand-rolled, inside Miking | — | **I06b "dance": a stroked stick figure.** `dancerFront` is not registered in `POSE_OF`, so `PlayerInk` falls back to 9 px ink strokes (`L\i06bFingerCymbals\art.tsx:39–57`, `metalArt.tsx:244–262`). Bongo legs only (`L\m04bBongos\art.tsx:48–92`). F01 shoe close-up (`f01Footsteps\soundArt.tsx:41`). **b08 Audience as circle heads**, the only real crowd of heads (`L\shared\broadcast\AudienceArt.tsx:104–183`, 7 and 9 rows, tiny); this breaks the "never circle heads" rule | — |

**Lessons with no person drawn:** a12; b15–b17; f07; f12; f13; f14 venue and studio variants; m01 and i01a–e (only the kit drummer); i11a art; m07b; m08; the organ; the concert `OrchestraPlan` (hatched spaces only). Crowds and audiences elsewhere are drawn as empty chairs (`audienceChairs`), by owner rule 2026-10-10.

---

# PART 2 — How the figures are drawn today

## A. The shared figure (`PF`)

### Data model
- **Pose** (`L\shared\players\playerPose.ts:79`): a 2-D `PlayerPose` per view.
  - Joints: head `{c, r}`, neck, shoulderR/L, elbowR/L, hand `{wrist, dir, kind, posed?}`, hipR/L, kneeR/L, footR/L, floor.
  - Also: `posture` (seated, standing, lap, floor) and `facing`.
  - R joints are the near side.
  - The pose always comes from the instrument's model, never from the drawing (`PF:36–39`).
- **Widths** come from `BODY` (`playerPose.ts:107`), all in mm: headW 156, headH 228, neckW 104, shoulderHalf 188, chestHalf 172, waistHalf 150, hipHalf 176, upperArmR 50, elbowR 41, wristR 30, thighR 82, kneeR 60, ankleR 38, handLen 185, handW 86.
- **Arm half-widths:**
  - `ARM` (`PF:1185`): root 44, upper 42, elbow 37, belly 40, cuff 31, cuffGap 16.
  - `SLEEVE` (`PF:1367`): 44, 42, 40, 40.5, 31.5, 16.
  - `BARE_ARM` (`PF:1287`).

### Geometry, built once per pose
- `built()` (`PF:1906`) caches the result in a WeakMap keyed by the pose object.
- **Torso (side):** one Catmull-Rom outline `smooth()` round the hip→neck axis (`PF:1756`). The chest sits 104–112 mm forward of the axis, the back 82–112 mm behind it. The shirt is cut at the belt (`PF:1843`).
- **Pelvis and near leg:** one trouser mass (`PF:1787–1788`). Each leg is a `limb()` chain of capsules hip→knee→ankle.
- **Shoes:** a 6-point smooth outline (`PF:1790`).
- **Arms:** `sleeveArm` = `armPath` with a deltoid cap (`PF:1356`, `:1202`), drawn with an olecranon and a concave crook. The sleeve fades in out of the shirt (`Emerge` :258).
- **Unions:** all through a robust `unite()` (`PF:132`).
- **Heads:**
  - `headProfile` (`PF:424`): the fill outline does carry a nose, lips and chin silhouette.
  - `headFront` (`PF:385`) and `headAbove` (`PF:469`).
  - `intoCollar` (`PF:463`) clips the neck at the shirt.
  - Each head also builds a `line` path (ear helix, brows, nose, mouth). **`FigureHead` (`PF:495`) paints only `fill`**, so none of those features are ever painted on a body. The rule says "neutral, no face" (`PF:21–26`).

### Paint (`FigureMassCore`, `PF:295–363`), per mass, in order
1. A 4-stop `LinearGradient` along the diagonal of the mass's (or garment's) **bounding box**, positions 0 / .38 / .72 / 1. It does not follow the form.
2. Core shadow: the path minus itself shifted toward the light (`lookOf` :224), colour `core`, opacity .55, `BlurMask` = coreW × .45.
3. Rim: the path minus itself shifted away from the light, a gradient from `rim` to clear, opacity .55, blur = rimW × .9.
4. Optional `quiet` re-fill, blur 18, where a mass melts into the shoulder.
5. Far limbs: a black overlay at .3.
6. Contour stroke in `edge` colour, opacity .95, 2.2 mm wide (2.6 mm on the head). Where `soft` applies, a .42 fold line instead.

Other paint details:
- **Light comes from the upper left** (`PF:10`).
- Rim offset is (0.8·rimW, rimW); core offset is (−0.75·coreW, −coreW).
- **Contact shadows:**
  - A floor oval: black, opacity .45, blur 14, only when `pose.floor` is set (`PF:1847`, `:1986`).
  - The near arm's drop shadow on the instrument: offset (8, 12), opacity .35, blur 12 (`PF:2052`).
- **Receding figures** stay opaque: a `ColorMatrix` blends them toward `RECEDE_BG` [0.075, 0.078, 0.094], about #131418 (`PF:1955`).
- **Details:**
  - Collar: a stroked curve in `SHIRT_LINE` #161a24, 2.4 wide, opacity .9.
  - Belt: a gradient #3a2a20 → #1e150f, stroke #0b0806.
  - Hand lines: `#2a201a`, 1.8 wide, opacity .7.
  - Nails: `NAIL` fill #d6bcab, edge #6e5646, opacity .62 (`PF:700`).
  - Folds: one elbow-crook arc (`PF:1431`) and a knee crease, at opacity .5.

### Palette (`FIGURE_TONES`, `PF:63–69`)

| Tone | Ramp | Rim | Core | Edge | rimW / coreW |
|---|---|---|---|---|---|
| Shirt | #76839e #55617b #3a4357 #262c3a | #c3cde2 | #0f121a | #12151c | 7 / 30 |
| Trousers | #585c66 #3c3f47 #272a30 #17191d | #9aa0ab | #08090b | #0d0e11 | 7 / 34 |
| **Skin** | #c3ab98 #a28977 #7d6656 #5a4639 | #ecdccd | #2b1f18 | #2a201a | 4.5 / 16 |
| Shoe | #5a4030 #3a281c #22170f #120c08 | #a58a72 | #050302 | #070504 | 4 / 14 |
| Seat | #4a4c55 #2e3036 #1b1c21 #0f1013 | #8d929d | #050506 | #08080a | 5 / 20 |

`FIGURE_SKIN = FIGURE_TONES.skin` (`PF:74`, HF1 2026-10-08) is imported by the smallperc, handdrums, anatomy and low-brass/sax art.

### What limits realism (seen in the code)
1. **The head is a bald, featureless skin silhouette.**
   - It has no painted eye, brow, ear detail, hair, lips or jaw shading. The ear exists only inside the outline, and the `line` features are built but never painted.
   - Hair exists only in the ensemble family (`hairAbove`/`hairProfile`, `SeatingArt.tsx:1056`) and in the voice cutaway.
2. **Lighting is a "bevel".**
   - Each mass gets the same offset crescents and a bounding-box gradient whatever its curvature.
   - There is no cylinder shading on limbs, no subsurface warmth, no specular, and no ambient occlusion where an arm meets the torso or the head meets the collar.
   - Skin is one muted ramp.
3. **Clothing has almost no folds** (owner 2026-10-10: stroked folds "read as welts").
   - Only one elbow arc and one knee crease. Collar and belt are bands; there are no seams or hem shadows, and the shirt is always tucked.
4. **The hard dark contour** (2.2 mm, near-black, opacity .95) goes round every mass, which gives a cut-out look.
5. **Hands:**
   - H1 `grip` is a fist "seen from its back" built from capsules, used in *every* view (`PF:847–875`).
   - H1 and H2 use different finger tables (`FINGERS` `PF:730` vs `HAND` `handModel.ts:61`).
6. **Shoes** are one 6-point blob: no sole, heel or welt.
7. **At phone scale** (about 0.12–0.18 pt/mm), the 2.2 mm contour is about 0.3 pt and the blurs are 1–3 pt, so the "form" is mostly the gradient.

## B. Other families (data model and paint)

- **Bowed / brass / sax:**
  - 3-D postures (`bowed\posture.ts`, `brass\brassPosture.ts`, `sax\saxPosture.ts`) are projected per view.
  - Body built in `BowedArt.tsx:765–1076`, arms `armPath` with the `TOP_ARM`/`SIDE_ARM` radii.
  - Hands are `drawHand3` from `bowedHands.ts` / `brassHands.ts` / `saxHands.ts`.
  - All painted with `FigureMass` / `FigureHead`.
- **Ensemble:**
  - **Plan view:**
    - Chair: two rounded rects (:1378).
    - Body: `limb` thighs and smooth shoes; shoulders and back from `aboveTorso` (:1015, a smooth 460 × 242 mm outline).
    - Arms: sleeves unioned into one shirt mass (`figureArms` :671).
    - Hands: `handShape` grip fists or `drawHand3` (cached per instrument, `hand3Cache` :805).
    - Head: `headAbove` plus a hair cap in 4 tones.
  - **Elevation:**
    - Body: `elevBody` (:919) with a profile variant; arms `armPath`.
    - Head: `headFront`/`headProfile` through `intoCollar` (:2434), plus hair.
  - **Paint:** batched by material, one path per material per depth layer (`PaintBatch` :2478), using the `FigureMass` tones.
    - Depth layers use a `Shaded` colour matrix: back rows about 30% darker.
    - Ghosted players: opacity .3 with a dashed #c3cde2 outline.
    - Highlight: a #05060a veil at .42 plus an amber #ffc64d outline.
  - **Cache:** a module `Map` keyed `seating|view|hi` (:2639) plus `useMemo` (:2803). A 58-figure orchestra is "a few dozen draws".
- **Anatomical hand H3:**
  - Painted in `FIGURE_SKIN` with one light across the whole hand: gradient plus core blur 4.2, rim blur 2.6, part shade #120c08 (`AnatomicalHand.tsx:58–106`).
  - Each finger is its own lit form, with knuckle heads, an oval wrist and nails.
  - This is the most realistic hand in the app (owner: "MUCH better!!!", `anatomy.ts:2`).
- **2-D hand H4 (Bongos):**
  - A flat `LinearGradient` of `SKIN` over the hand's box for body, fingers and thumb.
  - Each piece outlined with `SKIN_RIM` #2a201a at 1.4–1.6 wide; creases in ramp[3]; a shine stroke of `FIGURE_SKIN.rim` at .35.
  - Sleeve: ramp #5d6b82 / #3f4b5f / #262e3b, rim #141820 (`smallperc\Hand.tsx:107–184`, palette :20–40).
  - **No blur and no core shadow.** Every finger tube is outlined, which is why the bongo hand reads as a cartoon.

## C. How the instruments are shaded (what a figure has to match)

- The drums and cymbals share the house look: "gradients for form, light from the upper left, rim highlights, soft contact shadows" (`L\shared\drums\DrumArt.tsx:4`; `L\shared\cymbals\CymbalArt.tsx:4`).
- **`DrumArt.tsx`** (995 lines: 46 gradients, 5 blurs). Palettes:
  - `PLY`: #4a2a12 … #5c3417
  - `LACQUER`: #3a2210 #9c6631 #e2b679 #c48f52 #7a4a20 #2f1b0a
  - `CHROME`: #3a3d45 #eef1f6 #9aa0ab #4a4e57 #c8ccd4
  - `BRONZE`
  - `INK`: #08080a
  - The inner wall has a warm radial glow and edge vignettes (:231–238).
- **`CymbalArt.tsx`** (21 gradients, 3 blurs).
  - `BRONZE`: #fbe3a6 #e2b25c #b9852f #80561a #4f3410; `BELL`; `FELT`.
  - A `SweepGradient` lathing sheen (:338).
  - Radial-gradient chrome joints (:429–465).
- **`KitSceneArt.tsx:36–42`** repeats `INK` / `LACQUER` / `WOOD_HOOP` / `CHROME`.
  - Throne: `ThroneSide` :185 has stroked legs #16171b over #7a7f8a, a post, and a seat gradient #4a4e57 → #24262c → #0e0f12. `ThroneTop` :211 uses a radial gradient.
- **There is no central palette or token file for the lab art.** Every family keeps its own module constants; only the figure tones are shared (`FIGURE_TONES`). The stage dark is implied by `RECEDE_BG`.
- **Compared with the figures:** the instruments use multi-stop gradients that run with their form (cylinders and lathe), plus specular highlights. The figures have no specular and use diagonal box gradients. That is the main visible mismatch.

## D. Tests and rules that constrain figures

### Tests
- **`test\figureAnatomy_20261008.test.ts`** (880 lines). Checks every reachable pose builder:
  - `anatomy()` :90:
    - **Limbs:** shoulder within shoulderHalf + 40 of the neck; upper arm and forearm no more than 1.15 × adult; hand within reach.
    - **Orientation:** in a side view the head is never behind the collar, a standing knee never bends backward, and the elbow never points forward.
    - **Decency:** no elbow, wrist or hand in the side-view groin box (75–340 mm forward, hip −60 to +230); front-view hands not between the thighs.
    - **Proportions:** a standing figure is 6.5–8 heads tall.
  - `articulation()` :228:
    - **Neck:** head centre 0.55–0.85 head from the collar.
    - **Wrist:** no more than 70° off the forearm.
    - **Elbow:** no tighter than 25°.
    - **Seated legs:** thigh 360–480 mm, shin 340–480 mm, knee 60–150°.
  - Adult canon (:278): shoulders 1.8–2.3 heads across, hand 0.7–0.9 head, widths taper.
  - **Many tests match PlayerFigure / SeatingArt / BowedArt source text with regexes**, so a rewrite must keep those strings or the tests must change. Examples:
    - `const head = intoCollar(headProfile(pose.head.c` (:316)
    - `const legNear = union(pelvis, ` (:372)
    - `function sleeveArm(...) { return union(cap, armPath(root, e, w, SLEEVE));` (:447)
    - The `export const ARM = {…}` and `SLEEVE = {…}` literals (:434, :448)
    - `THE CROOK` / `olecranon` (:441)
    - `const garment = garmentBox(` (:711)
    - `const b = box ?? own;` (:716)
    - The pelvis point list (:368)
  - Figure pass 3 (:793): five digits, thumb side, joint limits, wrist ≤ 70° in 3-D, per hand family; and "SLEEVES GROW OUT OF THE SHIRT" (:866).
- **`test\mikingFigureHead.test.ts`:**
  - No `LineHead` / `HEAD_LINE` / `HEAD_FILL` anywhere in Miking (:32).
  - `FigureHead` must literally be `return <FigureMass path={fill} tone="skin"` (:38), and `<FigureHead fill={b.head.fill} />` must appear (:39).
  - The front-head union string is fixed (:43).
  - The per-family `FigureHead` strings are fixed (:46–57).
  - An adult head is 1/6.8–1/8.2 of standing height (:59).
- **`test\headIcons_20261008.test.ts`:** heads on bodies use `FigureHead`, never the icon (:215); circle heads are gone (:226); an audience is chairs (:229); the visible lone head is the owner's PNG (:243).
- **`test\mikingHandAnatomy_20261024.test.ts`:** hand about 186 mm long, 70–90 mm across the knuckles, wrist about 55 mm; middle > ring ≥ index > little; the thumb comes from the base of the palm; grips, pinch and claves; "nails only facing the viewer, an oval wrist".
- **`test\stickTechniqueKit_20261122.test.ts`** (new today) — the drummer:
  - A 406 mm stick held 290 mm from the bead.
  - Side and top views agree.
  - Normal strike angles.
  - A raised stick pivots at the wrist, 20–45°.
  - **Elbow 70–145°, wrist ≤ 45°, elbow under the shoulder** (:147).
  - Beads never on a hand.
  - The anatomy rules in both views (:195).
  - The adult sits inside `env.drummer` with head top at 1390 (:255).
  - Right foot on the pedal (:382).
  - Labels and mic starts clear of sticks and fists.
- Also: `stickTechniqueEnsemble_20261122`, `stickTechniqueConcert_20261122`, `mikingHarpHands_20261016`, `mikingHandDrums.test.ts` (modified in the working tree), and `mikingStringsArt.test.ts` (guitar wrist, per D68).

### Docs
- `docs\APE_GOVERNANCE_DECISIONS_2026_10_08.md:22–30`, **D60**:
  - Head icons only for a head on its own.
  - Bodies use PlayerFigure / FigureHead, never a circle head.
  - Correct, proportional and decent (facing the same way, arms from the shoulders, nothing at the groin).
  - "A realistic figure redo (hybrid: Comp C illustrations plus an artist agent) is planned for later."
- `docs\APE_GOVERNANCE_DECISIONS_2026_10_10.md:16–27`, **D68**:
  - One smooth sleeve outline with elbow point and crook, a forearm swell, a bare wrist about 55 mm, no shoulder knob, no welts.
  - Upright back; no feet on standing figures seen from above.
  - Wrist ≤ 70°, except the mandolin and ukulele fretting hands.
  - String left hand and bow hold rules.
  - Also: "real dimensions and real anatomy … 'Salvador Dalí' shapes are rejected".
- `docs\art\FIGURE_REVIEW_2026_10_08.md`: the method (orientation, limbs, proportions, decency, contact) and a pose inventory (34 combinations, 15 code paths).
- `docs\art\HEAD_FIX_2026_10_08.md`.
- `docs\APE_LAB_VISUAL_CHARTER_2026_10_04.md`: neighbours recede (§6, cited at `PF:27`); references → model → geometry; expert and cognitive reviews before handover.
- `docs\APE_LAUNCH_MUST_DO.md:179`, **D78** (today) — the plan already written:
  1. Inventory.
  2. ONE example, the side-view kit drummer, drawn beside the current one in a dev study page, behind `FIGURE_V2_READY = false`.
  3. Refine with the owner.
  4. Then roll out family by family.
  - Images are not touched. Earlier rules hold: one continuous silhouette, no plug-in limbs, real joints, upright backs, decent neutral clothing.
- Owner quotes in the code:
  - "crude" / "a flat grey mannequin" (2026-10-05, `PF:2–3`).
  - "plug and position interchangeable limbs" (2026-10-15, `PF:252`).
  - "flat mittens" (`PF:713`).
  - "the forearm meets the hand with no wrist" (`PF:761`).
  - Opaque figures, never dimmed by opacity (`PF:1950`).
  - "Nothing moves (D8)".

## E. Performance and dev harnesses

### Performance
- **Caching:**
  - Figure paths: built once per pose object (`PF:1906`); crescents in a WeakMap per path and tone (`PF:221`).
  - Kit drummer: per view (`KitSceneArt.tsx:303`), the 3-D pose by its JSON key (`stickPose.ts:236`), and the view (`stickPose.ts:304`).
  - Sticks: by their coordinates (`stickPlayer.tsx:40`).
  - The path-op unions are expensive but run once.
- **Per-draw cost:**
  - Each `FigureMass` is 4–7 draw calls, 2 of them blurred.
  - A sleeve with `emerge` adds an offscreen `Mask` layer.
  - A receding figure adds a `Paint` save-layer.
  - A full figure is about 10–12 masses, so roughly 60–80 draw calls and about 20 blurs.
- **On screen at once:** at most about 58 figures (orchestra, batched SeatingArt) or about 11 (woodwind section plan, PlayerFigure). A typical scene has 1–5.
- **Animation:** no figure path animates per frame. The sound sequences (hand strike `handSoundArt.tsx:308–313`, harp pluck, cymbal and drum strike, low-brass buzz) only cross-fade opacity or drive the membrane through Reanimated `useDerivedValue`.

### Dev harness hashes (web dev only; `src\dev\webPreviews.tsx:135–144`)
- **Drummer:**
  - "What it is" (side): `?page=meet&step=1#labpreview/MikingLesson/M09`
  - "The parts" (side, with the top inset): `?page=meet&step=2#labpreview/MikingLesson/M09`
  - Steps are 0-based (`MikingLessonScreen.tsx:237`). The PKitOrient step keys are `start`, `what`, `parts` (`PKitOrient.tsx:104/119/135`).
  - Large crop: `#labpreview/MikingHands/M09`. The `[~u~v~w]` window fields and `~view` are described in `src\dev\MikingHandStudio.tsx:4–10`. I did not verify the field order.
- **Bongos hand:**
  - `?page=meet&step=5#labpreview/MikingLesson/M04b`. This is inferred: the instrument steps start, what, parts come first, then HSound's strike, shapes, strokes, so `StrokeMap` should be step 5. Confirm it in the browser.
  - Also `#labpreview/MikingHands/M04b`.

---

# PART 3 — The seated kit drummer (working tree, solver changed 2026-11-22)

## Chain
1. M09 "Meet it" is `M09Orient` → `PKitOrient`.
2. `art.tsx:14` draws `<KitSide swing/>` or `<KitTop/>`. These are `KitSceneArt.tsx:489` and `:520`.
3. `KitSide` draws `ThroneSide` (:497) and then `DrummerSide` (:500), which paints in this order:
   1. `Sticks` (far)
   2. `PlayerBehind`
   3. `Sticks` (near)
   4. `PlayerInFront`
4. `DrummerTop` (:352) is split into legs (under the drums) and upper.
5. The pose comes from `drummerOf` (:304): `viewDrummer(drummerPose(KIT_GROOVE))`.
   - `drummerPose` (`stickPose.ts:238`) solves both arms in 3-D. `solveArm3` (:184) is a two-bone IK solve with upper arm 300 mm and forearm 262 mm (`DRUM_ARM` :57).
   - `viewDrummer` (:307) turns that into a 2-D `PlayerPose` per view.
6. The inset is the other view, drawn by `DualView` (`engine\scene\DualView.tsx:32/87`): INSET = 0.27, at most 150 pt wide.

## Part by part

| Part | Drawn by | Size (mm, from the code) |
|---|---|---|
| Head | `headProfile` (`PF:424`) → `intoCollar` (`PF:1806`) → `FigureHead` (`PF:2029`); centre at `BODY3.head` (`stickPose.ts:126`), r = 110 (:328) | About 220 tall; head top at 1390 above the floor (`kitSceneModel.ts:55`); centre 118 below the top; seat moved back 50 (`SEAT_BACK` :124) |
| Neck | The same head fill (neck capsule 50–52 radius, `PF:452`), cut at the collar | Base 158 below the head centre (`stickPose.ts:130`) |
| Torso / shirt | `buildSide` `smooth` (`PF:1756`), tucked (`PF:1843`); shirt tone; belt (`PF:1815`) | Depth about 200–225 (chest +104–112, back −82–112); shoulders 212 / 206 below the head centre, ±200 in z |
| Upper arm / forearm | `sleeveArm` → `armPath` with `SLEEVE` (`PF:1356`, `:1202`); near arm with deltoid (`PF:1803`), far arm darker (`PF:1792`) | 300 / 262 (3-D, projected); half-widths 44 → 40 → 31.5 at the cuff |
| Fist | `handShape` kind `'grip'` (`PF:847–875`), the 2-D back-of-fist; direction = `handAxis` (`stickPose.ts:288`) | Palm about 108 × 78, thumb 94, proximal finger bones 33/36/34/28 (`FIST_LEN` :742) |
| Thigh / shin | `limb` hip→knee→ankle (`PF:1780`); near leg unioned with the pelvis | Hip at the seat height minus 90, i.e. 590 mm up; knee at (throne.u + 430, 520 up) (`stickPose.ts:321–323`); thigh about 470; radii 82 / 60 / 38 |
| Shoes | `shoe()` (`PF:1790`), shoe tone | About 246 long, 92 high; right ball of the foot on the kick pedal (`RIGHT_BALL` :144); left on the hi-hat pedal |
| Sticks | Scene: `Sticks` stroked 17 ink + 13 gradient (`KitSceneArt.tsx:321`). Lessons and close-ups: `HeldStick` tapered body plus bead (`stickPlayer.tsx:66`) | 406 long, held 290 from the bead |
| Throne | `ThroneSide` (`KitSceneArt.tsx:185`) / `ThroneTop` (:211) | Seat r 175, height 500 (`kitPlanModel.ts:66`) |

The drummer is shown at `dim` 1 in the M09–M11 scenes.

## Scale on a 390 pt phone
- The M09 side box is 2000 × 2070 mm (`m09Overheads\geometry.ts:14`), so about 0.12 pt/mm on a 250 pt-tall glass and about 0.17 pt/mm when the figure fills about 358 pt of width.
- At that scale:
  - Seated drummer from floor to head top: about 170–235 pt.
  - Head: about 27–38 pt tall.
  - Fist: about 13–18 pt.
  - Contour: about 0.3 pt.
- The top-view inset is about 97 × 85 pt (about 0.045 pt/mm), so the head there is about 7 pt across. That is tiny.

## Other lessons that show this same drummer
- **M09 Overheads, M10 Room, M11 Kit:** all art and orient pages, `PairsScene`, plans and room art, and the cymbal strike (`kitPages\CymbalStrike.tsx:170`).
- **M02 Snare and M03 Toms:** `LessonDrummer` phantom (dim .34) plus hand (`stickPlayer.tsx:242`), and the `UprightSound` `StrikeArm` (`drums\UprightSound.tsx:200`).
- **I01a–e cymbals:** `StickDrummerArt` top, `CymbalKitArt.tsx:208` phantom plus `StickHandOver`, and the `CymbalStrikeFx` `StrikeArm`.
- **M04c Timbales:** strike close-up with a dowel stick (`handSoundArt.tsx:391`).
- **E09, E15, E16:** the ensemble kit seat (`BandArt.tsx:154/307`).
- **`KitTop` neighbour in setting plans:**
  - M04a–c, M05, I07–I10 (`HandPlan.tsx:170`)
  - SPK (`StagePlan.tsx:235`)
  - a01, a02 (`BrassSettingPage.tsx:225`)
  - a05a–d (`SaxSettingPage.tsx:183`)
  - c06a/b (`BowedSettingPage.tsx:440`)
  - c01, c03, c05a–c, c07 (`guitars\StagePlan.tsx:175`)
  - c02, c04, c08 (`BacklinePlan.tsx:502`)

Because the drummer is drawn through `PlayerBehind` / `PlayerInFront`, a new look built into the shared figure reaches all of these at once.

---

# Image assets that show people (pictures, not code: owner's permission needed)

- **Line-art head icons:**
  - `assets\icons\head-side.png`, `assets\icons\head-above.png` (every lone-head icon).
  - `assets\icons\head-front.png` (the Wave Physics listener).
  - The owner's source files `assets\Head_icon_side.PNG` and `assets\Head_icon_above.PNG`.
- **Profile tab icon:** `assets\icons\nav\nav-profile.png`, a "green person" (`src\components\nav\NavIcon.tsx:37`).
- **Website:** `web\public\og\og-founder.png` (likely a portrait; not viewed). `web\public\app-screens\*.mp4` / `*.png` are screen recordings that may show the in-app figures.
- **Possibly people (not verified):**
  - `assets\onboarding\intro_v1_1080p30.mp4`.
  - Course-card and topic bucket images (`CourseSelectionScreen.tsx:367–430`; `src\data\topicImages.ts`, local copies in `assets\topic-images-webp\`), for example road crew, Foley, hearing anatomy, speech/voice, vocal mixing, choir, worship, theatrical, career, soldering and repair (hands).
  - Credential art `cert-*-v3.webp` (`assets\Certificate_Squares\`).
  - `assets\home-cards\area_commercial-70v.webp`.
  - The bucket photo `headset-microphone.webp` (`micselect\micImages.ts:22`).
  - Glossary and flashcard photos, whose URLs come from the database (`src\features\study\api.ts:366`) and cannot be listed from code.
- **Checked, no people:** the 65 bundled lab tiles (4 of them viewed; their names suggest gear), and `career_finder.webp`.

---

# What I searched, and what I could not determine

## Searched
- **Component names:** PlayerBehind, PlayerInFront, PlayerFigure, FigureMass, FigureHead, headProfile, headFront, headAbove, drawHand3, handShape, armPath, splitArm, AnatomicalHand, HandSkeleton, handOn, fitHand, stickPlayer, SeatingArt, ensembleHands, figureBodySvg, figureHead, headIcons.
- **Vocabulary:** hand, finger, fist, palm, wrist, arm, sleeve, shirt, torso, head, face, skin, hair, neck, shoulder, leg, shoe, player, talker, singer, listener, conductor, audience, crowd, person, body, silhouette, mouth, ear, vocal.
- **Places:** all 129 Miking lesson folders plus `shared\` and `engine\`; every other lab under `src\screens\lab`; `src\features\lab`, `src\components`, `src\dev`, `startHere`; `assets\`, `web\public`; the tests under `test\` and `docs\`.

## Not determined
- Exact on-device point sizes. Mine are computed from view boxes and glass sizes.
- The exact `&step=` index for the Bongos StrokeMap (inferred as 5).
- The order of the `MikingHands` crop fields.
- Whether the bucket and database images show people. I did not view them, except the few noted.
- The exact stage background colour (only implied by `RECEDE_BG`).

## Inconsistencies to know about
- `stickPose.ts:55–56` still says "seat to head top 800 mm", but the figure is now 890 mm (head top at 1390).
- The M12 and M13 headers still say "a bald head line art" (stale).
- `lutePlayers.tsx` says "house line-art bald head" in its header, but the code uses `FigureHead`.
- `smallperc\Hand.tsx` (H4) has no blur or shading. The two 2-D finger tables (H1 `FINGERS` vs H2 `HAND`) differ.
- b08's circle-head audience and the circle-menu COMMUNITY icon break the "never circle heads" rule.
- The I06b dancer falls back to a stick figure.
