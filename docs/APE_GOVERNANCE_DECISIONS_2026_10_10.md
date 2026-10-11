# AP&E governance decisions — 2026-10-10

Owner rulings from the 2026-10-10 overnight art pass, the item-by-item browser review, and the Comp C audits. Continues D58–D66 (APE_GOVERNANCE_DECISIONS_2026_10_08.md).

## D67 · Lab drawings are professional and dimensionally true
- Every lab drawing (Skia/SVG) is drawn to real dimensions and real anatomy. It must hold up to working pro-audio engineers. "Salvador Dalí" shapes are rejected.
- **Necked instruments:** body on the LEFT, headstock on the RIGHT, as a person faces them. Use a 180° turn, never a mirror, so the instrument stays right-handed.
- **Look closely for clashes at 3×.** Nothing passes through anything else:
  - no hand through a tuba bell;
  - no bow through a face;
  - no leg or stand through a drum;
  - no label or leader on top of what it names.
- **Audiences** are drawn as empty chairs at true scale, never as heads.
- **Lone heads** use the owner's PNG icons. The side PNG is placed so its lips sit on the mouth anchor (headIconGeometry `SIDE_LIPS_PX`).

## D68 · Figures (extends D60)
- **Arm:** one smooth sleeve outline from shoulder to cuff:
  - an elbow point and crook;
  - a forearm swell in the upper third;
  - a bare wrist, about 55 mm, narrower than the heel of the hand;
  - no knob at the shoulder (`FigureMass quiet`) and no stroked "welts" along the sleeve.
- **Back:** upright, not hunched. **Feet:** not shown on standing figures seen from above.
- **Wrists:** bend 70° at most. Exempt: the mandolin and soprano ukulele fretting hands, whose close-held geometry makes 70° impossible (owner: leave as is).
- **String-instrument left hand:** the thumb is behind the neck, the palm faces the neck, the fingers arch over the board onto the strings, and the wrist is in line with the forearm.
- **Bow hold:** pronated, three fingers over the stick, the little finger arched, and the thumb bent under the stick opposite the middle finger.
- **Seated cellist:** sits tall, with the scroll beside the head. The cello's side-view SCROLL label is hidden because the head covers the scroll.
- **Ratchet:** `test/figureAnatomy_20261008.test.ts` and `test/mikingStringsArt.test.ts` (guitar wrist).

## D69 · Controls at the bottom; the bezel is read-only
- Every lab control lives in the bottom dock. Only HIDE DISPLAY and FULL SCREEN sit in the middle. This includes buttons drawn inside a display and control buttons in the scrolling well.
- **Exempt:** quiz answers, predict cards, page navigation and links.
- **No BezelItem has `onPress`** (`test/bezelReadOnly_20261010.test.ts`).
- The Patchbay lab moved onto the Rack Unit (12 interactive modules). A long fader readout stays in its own half and never runs over the lane name.

## D70 · Cable drawings are traceable and professionally dressed
- **Traceable:** every cable is its own line from connector to connector. Shared routes are drawn as parallel lanes with a visible gap and a fixed order, with concentric corners. Strokes never merge.
- **Dressed / correct states are pro-run:**
  - square turns along edges and risers, with even tie or tape intervals;
  - power runs at right angles to signal;
  - service loops at the ends, with drops straight down to each stand or wedge;
  - spare cable coiled at the box end.
- **Monitor sends** leave from the SAME side as the snake / stage box, with a MON → snake return lane.
- **As-found / wrong states** stay messy on purpose, but every cable in them is still traceable.
- **Monitor wedges** everywhere are real 2-way stage wedges at true size (600 × 420 mm), with a sloped baffle, a woofer, a horn and a rear input. Never a guitar-amp shape. Shared: `miking/lessons/shared/wedge2Way.tsx`.

## D71 · Brand names (extends D58)
- Allowed as everyday industry words: Hammond, Clavinet, Baby bass, Dobro, Harmon mute, O2, MTV/CMJ, Vocaloid, Octapad, auto-tune, 808/909/707/303, record-label and agency names, and Leslie.
- Mic and gear maker or model names in learner text remain OUT.

## D72 · Comp C technical-accuracy audit applied
- About 535 of 570 rows are applied: 10 S1, about 85 S2, about 440 S3, plus 15 template sentences swept app-wide. The 23 BRAND rows were skipped under D71.
- **PLR:** each Mixing Guide keeps its PLR target and adds one line giving the loudness that PLR implies.
- **Practice-room positions:** stated in words ("4 m from B"), not as coordinates.
- **Clavinet:** redrawn to the real action. The tangent under the key presses the string DOWN onto an anvil; there is one pickup above the string and one below.
- **Speaker Coverage line array:** trimmed so the bottom box always clears the performer's head by at least 1 m.

## D73 · Comp C images: accuracy beats beauty
- 24 of 42 topic images are accepted and installed in `assets/topic-images-webp`. 18 are rejected; the redo brief is in Downloads/2026-10-10_COMP_C_IMAGE_REDO_BRIEF.md.
- **The rules every image must meet:**
  - real equipment traced from real plans and specs, to the mm;
  - no invented parts, extra markings, extra cables or split paths;
  - stereo channels match;
  - no device running while it is switched off;
  - the topic is visible;
  - rigging shows correct, rated practice.

## D74 · No production OTA during store review
- Production OTAs and the topic-tiles bucket upload wait until BOTH stores approve, then go out together. The preview channel may be updated during review.
- The checklist is in the session handoff (2026-10-11).
- The Terms page carries "Subscriptions & In-App Purchases" with the Apple Standard EULA link. It is live (076844a8, Apple 3.1.2).
