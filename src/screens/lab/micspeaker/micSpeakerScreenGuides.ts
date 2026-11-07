/**
 * Microphone Principles + Speaker Placement & Coverage — "explain this
 * screen" content (Screen Guide rollout, owner 2026-10-31; the pattern and the
 * content standard are the Wave Physics pilot, wave/waveScreenGuides.ts).
 *
 * One guide per section, keyed by the screens' own SECTIONS keys (the same ids
 * as units.ts: MIC_PRINCIPLES_UNITS / SPEAKER_COVERAGE_UNITS), plus one for
 * each lab's what's-left end screen. Neither lab has a home menu — each opens
 * straight on its first section — so there is no home guide.
 *
 * Every line was written against the screen's own code
 * (MicPrinciplesLabScreen / SpeakerCoverageLabScreen / viz.tsx /
 * coverageModel.ts): the names are the on-screen names (bezel keys, dock
 * labels, option labels, drawn labels), and every number in TRY THIS is what
 * the screen prints at that setting — off-axis from viz.offAxisDb, proximity
 * from proxBoostForInches, pickup from gainAt. Change a label, a range or a
 * default → update the guide here; test/screenGuide_micspeaker_20261031.test.ts
 * pins the shape, the names and the numbers.
 *
 * STEPPED: each section must fit a 375×812 phone with no scrolling, so each is
 * held to SCREEN_GUIDE_BUDGET (types.ts). Copy rules: plain language, short
 * sentences; KNOWLEDGE, never skills; "suggest", never "recommend"; no gear
 * maker or model names; no "N of total"; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

// ═══ MICROPHONE PRINCIPLES ═══════════════════════════════════════════════

export type MicSectionId = 'capsule' | 'polar' | 'distance' | 'proximity' | 'offaxis' | 'stereo' | 'pop' | 'shock' | 'hand' | 'mistakes';

export const MIC_SCREEN_GUIDES: Record<MicSectionId, ScreenGuide> = {
  // ── 1 · CAPSULE (reading page) ───────────────────────────────────────────
  capsule: {
    seeing: [
      'A still cutaway of a moving-coil (dynamic) mic: the diaphragm, the coil and the magnet’s gap. The coil is drawn at rest; only the incoming waves, the current and its glow move.',
      'Amber = the current the coil makes. The ⊗/⊙ marks show its direction and flip as it reverses.',
      'Under it: e = B · l · v — the voltage tracks the coil’s VELOCITY. Then WHAT’S HAPPENING to read.',
    ],
    control: [
      'Nothing to set: this page is for watching and reading. The drawing animates on its own.',
      '⤢ FULL SCREEN, under the drawing, enlarges it. ⓘ WHAT THE DISPLAY SHOWS opens its guided-lesson entry.',
      'The strip under the title moves between the lab’s sections (it calls each one a MODULE): ‹ PREV, NEXT ›, and the middle readout opens a list of them all.',
    ],
    changes: [
      'Sound pressure pushes the diaphragm, and the diaphragm drags the coil through the magnet’s gap.',
      'A wire moving through a magnetic field makes a voltage: e = B · l · v (field × wire length × speed).',
      'So the output is biggest when the coil moves fastest, and it reverses every half-cycle as the coil turns back.',
    ],
    teaches: [
      'A dynamic mic is a small generator: sound becomes motion, and motion becomes voltage.',
      'The rear port named in WHAT’S HAPPENING is what makes a mic directional — the part behind POLAR, PROXIMITY and HAND GRIP.',
      'Foundations of Sound showed what a sound wave is; here it meets a mic. Next, POLAR maps where a mic listens.',
    ],
    tryThis: [
      'Watch one ⊗/⊙ marker: it swaps twice per cycle. Each swap is the current reversing, because the coil has turned back (AC).',
      'Watch the amber glow pulse: brightest when the current is strongest (the coil moving fastest), dim as the current passes through zero and reverses.',
    ],
  },

  // ── 2 · POLAR ─────────────────────────────────────────────────────────────
  polar: {
    seeing: [
      'The pickup field from above, around a handheld mic whose front (the grille) points up. A small speaker is the sound source.',
      'Color = how strongly the mic hears each spot. The green line from the speaker fades as pickup drops.',
      'Readouts: PATTERN, SOURCE (the speaker’s angle from the mic’s front) and PICKUP (dB versus straight ahead, or NULL ≤−26 dB).',
    ],
    control: [
      'Drag the speaker anywhere on the display (the chip says DRAG THE SPEAKER — ANYWHERE). It may touch the mic, never overlap it.',
      'PATTERN key: OMNI, CARDIOID (the start), SUPER, HYPER or FIGURE-8. The tray stays open, so you can compare them while the field redraws; each option has a one-line description.',
      '⤢ FULL SCREEN enlarges the field, and the drag still works there.',
    ],
    changes: [
      'Each pattern mixes two parts: A, an omni part that hears all around, and B, a figure-8 part (cos θ: +1 in front, 0 at the sides, −1 behind). Pickup = |A + B·cos θ|.',
      'Where A and B cancel, a null appears: at 180° for CARDIOID, about 126° for SUPER, about 110° for HYPER, 90° and 270° for FIGURE-8.',
      'θ is the SOURCE angle. PICKUP depends only on it; the color also fades with distance.',
    ],
    teaches: [
      'A mic does not hear equally in every direction: its pattern is a map of sensitivity.',
      'A null is a tool — aim it at what you do not want, like a monitor wedge behind a cardioid.',
      'OMNI has no null: natural sound, but no direction to aim away from a monitor.',
      'Next, DISTANCE adds the room. HAND GRIP later shows a hand erasing the null.',
    ],
    tryThis: [
      'On CARDIOID, drag the speaker behind the mic (SOURCE near 180°): PICKUP reads NULL ≤−26 dB — where a monitor wedge belongs.',
      'Keep it behind and switch to FIGURE-8: PICKUP jumps to about 0 dB. The back lobe hears as well as the front.',
      'On CARDIOID, drag the speaker until SOURCE reads 90° (or 270°): PICKUP reads about −6 dB — half the front’s pickup.',
    ],
  },

  // ── 3 · DISTANCE ──────────────────────────────────────────────────────────
  distance: {
    seeing: [
      'A talker and a mic in a sound field: the direct sound (warm, at the mouth) fades into the room’s even glow. Wavefronts are slowed so you can see them.',
      'Readouts: DIST (inches), LEVEL (direct sound in dB versus 4 in), DIRECT and ROOM (each one’s share of what the mic hears).',
      'Below the display, two bars repeat DIRECT and ROOM.',
    ],
    control: [
      'DISTANCE fader: 4 in to 48 in from the mouth. It starts at 17 in.',
      'The lane shows the distance and the level versus 4 in; the display slides the mic through the field as you move it.',
      '⤢ FULL SCREEN enlarges the scene.',
    ],
    changes: [
      'Direct sound follows the inverse-square law: each doubling of distance costs about 6 dB.',
      'The room’s reflected sound is about the same everywhere, so moving barely changes it.',
      'So what changes is the BALANCE. In this model DIRECT and ROOM cross near 12 in (the critical distance); real rooms differ, often farther.',
    ],
    teaches: [
      'Close sound is a high direct-to-room ratio, not just a louder one.',
      'Turning up the gain cannot fix a distant mic: the room comes up with it.',
      'Typical speech working distance is about 4–12 inches.',
      'Builds on POLAR; next, PROXIMITY shows what moving very close does to the bass.',
    ],
    tryThis: [
      'Slide DISTANCE all the way in: DIST reads 4 in, LEVEL 0.0 dB, DIRECT 90% and ROOM 10%.',
      'Set DISTANCE until DIST reads 12 in: DIRECT and ROOM both read 50% — the crossover. One inch either side tips the balance.',
      'Slide all the way out: DIST 48 in, LEVEL −21.6 dB, ROOM 94% — the room has taken over.',
    ],
  },

  // ── 4 · PROXIMITY ─────────────────────────────────────────────────────────
  proximity: {
    seeing: [
      'Top: a talker in profile and a mic on a stand. The GAP line reads the mouth-to-grille distance and the bass rise; a warm glow swells at the capsule.',
      'Bottom: the response curve, 0 to +12 dB across 40 Hz–16 kHz. A low shelf (a lift of the lowest notes) rises at the left as the mic moves in.',
      'Readouts: DIST, BOOST and MIC.',
    ],
    control: [
      'DISTANCE fader: from 12 in (the start) down to 1 in from the mouth.',
      'MIC key: CARDIOID (the start) or OMNI. The tray stays open so you can compare the two designs while the curve reacts.',
      '⤢ FULL SCREEN enlarges the scene and the curve together.',
    ],
    changes: [
      'A directional mic hears the pressure DIFFERENCE between the front and back of its diaphragm (a pressure-gradient design).',
      'Far away, that difference comes from the tiny front-to-back delay, and it shrinks toward the bass. Up close, the front is also much louder than the back — a difference that does not shrink — so bass rises.',
      'OMNI is a pure pressure design: BOOST reads FLAT at any distance.',
    ],
    teaches: [
      'Proximity effect: directional mics get bassier up close; omnis do not.',
      'A tool (radio-voice warmth) and a trap (a muddy singer) — one reason channel strips have a high-pass filter (a control that trims the lowest bass).',
      'The model: at 1 in, a bass lift that starts at 220 Hz and climbs to about +10 dB near 50 Hz; none at 12 in. Real mics vary.',
      'Next, OFF-AXIS turns the mic away.',
    ],
    tryThis: [
      'Slide DISTANCE all the way in: DIST reads 1 in and BOOST reads +10 dB — the left end of the curve lifts.',
      'Stay at 1 in and switch MIC to OMNI: BOOST reads FLAT and the curve lies flat.',
      'Back on CARDIOID, slide out to 12 in: BOOST reads NONE.',
    ],
  },

  // ── 5 · OFF-AXIS ──────────────────────────────────────────────────────────
  offaxis: {
    seeing: [
      'Top: a talker and a mic that turns away from them. Bottom: the mic’s response curve, −26 to +6 dB across 40 Hz–16 kHz.',
      'Readouts: ANGLE, @100 Hz (a low frequency) and @8 kHz (a high one) — each in dB versus aiming straight on.',
    ],
    control: [
      'ANGLE fader: 0° (aimed straight at the talker, the start) to 180° (facing away).',
      'PRESET key: 0°, 30°, 60°, 90° or 180° — a quick jump. The tray stays open so you can compare angles.',
      '⤢ FULL SCREEN enlarges the mic and the curve together.',
    ],
    changes: [
      'Turning away loses level by the cardioid pattern from POLAR: about 6 dB at 90°.',
      'Highs lose more. Short high-frequency waves are about the size of the capsule, so it beams them; long low waves wrap around it.',
      'The model adds a cut above 2 kHz that grows with the angle, so @8 kHz falls faster than @100 Hz.',
    ],
    teaches: [
      'Off-axis sound is duller, not only quieter: the highs fall away faster than the lows.',
      'Why a singer drifting off the mic sounds muffled first.',
      'Smooth off-axis behavior is a mark of a good microphone.',
      'Closes the placement arc (POLAR, DISTANCE, PROXIMITY). Next, STEREO uses two mics.',
    ],
    tryThis: [
      'Tap PRESET 90°: @100 Hz reads −6.0 dB and @8 kHz reads −9.0 dB — the highs drop 3 dB more.',
      'Tap 60°: @100 Hz reads −2.5 dB and @8 kHz −4.5 dB. The right end of the curve tilts down.',
      'Tap 180°: @100 Hz reads −23.1 dB and @8 kHz −29.1 dB — directly behind, deep in the null.',
    ],
  },

  // ── 6 · STEREO ────────────────────────────────────────────────────────────
  stereo: {
    seeing: [
      'Two mics in front of a stage (the lit deck at the top), with their combined pickup field drawn for the chosen technique.',
      'Readouts: TECHNIQUE, and STEREO FROM — what makes the left-right difference: LEVEL, LEVEL+TIME, TIME or MIX.',
      'Under the display: what the two mics are doing and when to use the technique.',
    ],
    control: [
      'TECHNIQUE key: XY (the start), ORTF, AB or MID-SIDE. The tray stays open so you can compare them while the field redraws; each option says what it is and when to use it.',
      'WHAT’S HAPPENING, below, adds the exact geometry and an IN MONO line for each.',
      '⤢ FULL SCREEN enlarges the pair and its field.',
    ],
    changes: [
      'Your ears place a sound by which side is LOUDER and which side hears it FIRST. Two mics can copy either clue.',
      'XY: two cardioids at one point, angled about 90° apart — level only. ORTF: 17 cm apart at 110° — level and a little time.',
      'AB: spaced omnis — time only. MID-SIDE: a forward mic plus a sideways figure-8; the width is set later, in the MIX.',
    ],
    teaches: [
      'Stereo pairs make width from level differences, time differences, or both.',
      'Time-based pairs can sound hollow when summed to mono — comb filtering (some pitches boosted, others canceled); level-based pairs fold down cleanly.',
      'Uses the patterns from POLAR. Next comes the practical arc — air blasts, vibration, then the hand — starting with PLOSIVES.',
    ],
    tryThis: [
      'Step XY → ORTF → AB and watch STEREO FROM: LEVEL, then LEVEL+TIME, then TIME — the mics move apart as time takes over.',
      'Pick MID-SIDE: STEREO FROM reads MIX. Open WHAT’S HAPPENING and read why its IN MONO line says perfectly safe.',
    ],
  },

  // ── 7 · PLOSIVES ──────────────────────────────────────────────────────────
  pop: {
    seeing: [
      'A plosive (“P”, “B”) arriving at a mic. Blue = the air blast (wind); amber = the voice, which always passes.',
      'Readouts: BARRIER and BLAST AT CAPSULE — the share of the blast that still reaches the capsule.',
      'Below the display, the PLOSIVE ENERGY REACHING THE CAPSULE bar repeats it.',
    ],
    control: [
      'BARRIER key: NONE (the start), POP FILTER, FOAM or SHOTGUN WINDSHIELD. The tray stays open so you can compare them; each option has a one-line description.',
      '⤢ FULL SCREEN enlarges the scene.',
    ],
    changes: [
      'A plosive is two things at once: a sound wave and a jet of moving air.',
      'Sound is a tiny pressure ripple that passes through mesh and foam. The jet is bulk air flow, and a barrier breaks it up and slows it.',
      'So the blue blast shrinks with each barrier while the amber voice gets through. FOAM costs a little top end.',
    ],
    teaches: [
      'Pop filters, foam and windshields share one idea: stop the moving air, let the sound through.',
      'Why one hard “P” can overload a capsule with a low thump.',
      'Opens the practical arc; next, HANDLING looks at vibration through solids.',
    ],
    tryThis: [
      'Tap POP FILTER: BLAST AT CAPSULE falls from 100% to 30%, and the amber voice still passes.',
      'Compare FOAM (50%) with SHOTGUN WINDSHIELD (12%) — the full basket makes the stillest air around the mic.',
    ],
  },

  // ── 8 · HANDLING ──────────────────────────────────────────────────────────
  shock: {
    seeing: [
      'A mic on a stand that is being shaken. The red label at the bottom reads STAND SHAKE — 100% (THE SOURCE).',
      'The label above the capsule shows how much of that shake reaches the mic.',
      'Readouts: MOUNT and INTO MIC. The VIBRATION TRANSMITTED INTO THE MIC bar below repeats it.',
    ],
    control: [
      'MOUNT key: RIGID MOUNT (the start) or SHOCK MOUNT. The tray stays open so you can compare the two while the shake redraws.',
      '⤢ FULL SCREEN enlarges the scene.',
    ],
    changes: [
      'Footsteps, knocks and cable tugs travel THROUGH solids — floor, stand, clip — into the capsule as low thumps. No air needed.',
      'RIGID: a hard clip passes the shake straight into the body.',
      'SHOCK: elastic bands hold the mic. They act as a soft spring: the mic’s mass (its inertia) keeps it nearly still while the ring shakes with the stand.',
    ],
    teaches: [
      'Handling noise is vibration conducted through solids, not sound in the air.',
      'A shock mount keeps that vibration in the stand; a high-pass filter (a control that trims the lowest bass) is the electrical version of the same idea.',
      'Follows PLOSIVES; next, HAND GRIP looks at the hand on a handheld mic.',
    ],
    tryThis: [
      'Switch MOUNT from RIGID MOUNT to SHOCK MOUNT: INTO MIC falls from 90% to 15%, and the bands stretch while the mic stays steady.',
      'Watch the label above the capsule as you switch: AT THE CAPSULE — 90% OF THE SHAKE becomes 15%.',
    ],
  },

  // ── 9 · HAND GRIP ─────────────────────────────────────────────────────────
  hand: {
    seeing: [
      'Three linked panels: the mic and a hand, its polar pattern (the ghost outline is the intended cardioid) and its frequency response.',
      'Readouts: GRIP (where the hand is) and PATTERN — INTACT, DEGRADING or COLLAPSED.',
      'Under the display, the grip’s verdict (Correct grip ✅ to start) and what it does.',
    ],
    control: [
      'Drag the hand up or down the mic on the display — the top is a full cup around the grille.',
      'GRIP fader: the same move, from the bottom of the handle up to the grille.',
      'POSITION key: LOW HANDLE, CORRECT (the start), GRILLE RIM or FULL CUP — jumps straight to each grip.',
      'WHY IT HAPPENS ▾, below the display, opens a cutaway of the rear ports.',
    ],
    changes: [
      'A cardioid hears the front AND, through rear ports, the back — timed so sound from behind cancels itself.',
      'Fingers on the grille rim start covering those ports: the pattern degrades and the response grows peaks and dips.',
      'A full cup blocks them: the mic falls back toward OMNI, the rear null is gone, and the hand adds its own resonance.',
    ],
    teaches: [
      'Why cupping invites feedback: the null aimed at the monitor disappears.',
      'A good grip: the hand on the body, just below the grille, touching it nowhere.',
      'Ties together POLAR (the null) and CAPSULE (the rear port). Next, MISTAKES reviews the habits.',
    ],
    tryThis: [
      'Tap POSITION, then FULL CUP: PATTERN reads COLLAPSED and the polar panel spreads away from the ghost cardioid.',
      'Tap GRILLE RIM: PATTERN reads DEGRADING — the trouble starts as soon as fingers reach the rim.',
      'Tap LOW HANDLE: PATTERN stays INTACT — fine for the sound, but less control; on a wireless mic the antenna is there.',
    ],
  },

  // ── 10 · MISTAKES (reading page) ─────────────────────────────────────────
  mistakes: {
    seeing: [
      'A reading page: a swipeable field guide of seven handheld-mic pictures — one ✅ Correct grip and six ❌ habits.',
      'The habits: Holding the grille, Cupping the grille, Pointing away, Too far away, Covering the switch, Blocking the antenna.',
      'Below: SPOT THE MISTAKE — 3 ROUNDS, a picture with no title to name.',
    ],
    control: [
      'Swipe the cards left and right. Long-press one, or tap ⓘ WHAT THE DISPLAY SHOWS, for its guided-lesson entry; WHAT’S HAPPENING opens a short note.',
      'In SPOT THE MISTAKE, pick the habit each picture shows. The answer names the section that taught it, or marks it as stagecraft.',
      'FINISH at the foot of the page, or on the strip, opens the end of the lab.',
    ],
    changes: [
      'Each habit breaks a principle from earlier: grille and cup collapse the pattern (HAND GRIP), pointing away goes off-axis (OFF-AXIS), too far lets the room in (DISTANCE).',
      'The switch and the antenna are stagecraft: a hand can mute the mic or cause wireless dropouts.',
      'The rounds are drawn at random on each visit.',
    ],
    teaches: [
      'The handheld habits that matter on a stage, in theater, worship, broadcast or a presentation.',
      'Recognizing a mistake and naming its cause — a review of the whole lab.',
      'The last section; the end screen lists anything not yet opened.',
    ],
    tryThis: [
      'Before reading a card’s title, guess the habit from the picture alone.',
      'Play every round of SPOT THE MISTAKE; for each miss, reopen the section its answer names (the switch and the antenna are stagecraft).',
    ],
  },
};

/** The what's-left screen (LabEndScreen) at the end of Microphone Principles. */
export const MIC_END_GUIDE: ScreenGuide = {
  seeing: [
    'The end of the lab: LAB COMPLETE, or WHAT’S LEFT with a row for each section not yet credited.',
    'REVIEW ▾ opens the sections already credited.',
  ],
  control: [
    'Tap a row to jump straight to that section.',
    'PRACTICE AGAIN FROM THE START reopens CAPSULE; DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'A section counts once you have opened it; the lab completes when every section has been seen.',
    'Practicing again or reviewing never removes credit already earned.',
  ],
  teaches: [
    'This lab covered how a mic makes voltage, where it listens, and how distance, angle, air, vibration and a hand change what it hears.',
    'Next in Audio Fundamentals: the Wave Physics Laboratory, where sound meets rooms.',
  ],
  tryThis: [
    'Jump to POLAR and find the CARDIOID null again — then HAND GRIP, and watch FULL CUP erase it.',
    'Reopen a section whose check question you missed; nothing you have earned is lost.',
  ],
};

// ═══ SPEAKER PLACEMENT & COVERAGE ════════════════════════════════════════

export type SpeakerSectionId = 'top' | 'side' | 'read';

export const SPEAKER_SCREEN_GUIDES: Record<SpeakerSectionId, ScreenGuide> = {
  // ── 1 · TOP VIEW ──────────────────────────────────────────────────────────
  top: {
    seeing: [
      'The room from above, to true scale (the 5 m bar): stage at the top, audience below. Stage right is the left of your screen.',
      'Color shows the level at every spot: RED / ORANGE hottest, GREEN the target, BLUE quiet, BLACK a dead zone.',
      'Readouts: EDIT (what the faders move), POS, AIM and PATTERN.',
    ],
    control: [
      'POSITION fader (0–100 %): slides the selected box along the stage — or, for FILLS, moves the pair in or out from the center.',
      'AIM fader (−60° to +60°): turns the selected box. It leaves the dock while FILLS are selected; fills fire straight out.',
      'PATTERN key: 60°×40°, 90°×60° (the start), 100°×100° or 120°×60°. The first number is the width you see here.',
      'SPKR 1 / SPKR 2 / FILLS keys choose what the faders edit. The first tap on SPKR 2 or FILLS adds it; a tap while it is selected removes it.',
    ],
    changes: [
      'Level falls about 6 dB each time the distance doubles, so seats cool from red near a box to green and blue farther back.',
      'The rated angle is where the level is already 6 dB below straight ahead; past it, seats cool fast.',
      'A narrower pattern packs the same power into a smaller wedge: louder on its axis. Where two beams overlap, energy adds into a hot ridge.',
    ],
    teaches: [
      'A loudspeaker is a flashlight for sound: position, aim and pattern decide who stands in the beam.',
      'Coverage, hot spots, dead zones, overlap and front fills, read off a map.',
      'Wave Physics showed how sound spreads and adds; here it places boxes. Next, SIDE VIEW adds height and tilt.',
      'A teaching model, not an SPL (sound pressure level, the measured loudness) prediction.',
    ],
    tryThis: [
      'Tap SPKR 2: a blue-outlined box appears at stage left, and the middle seats where the two wedges cross run hotter.',
      'Switch PATTERN from 90°×60° to 60°×40°: color reaches deeper down the room, while the side seats go cooler.',
      'Tap FILLS: two small green-outlined boxes appear on the stage lip, POS reads fills tight, and the front-center seats warm up.',
    ],
  },

  // ── 2 · SIDE VIEW ─────────────────────────────────────────────────────────
  side: {
    seeing: [
      'The room in profile, to true scale (the 5 m bar): the stage with a singer at the left, the speaker, then rows of empty chairs under the level map.',
      'The wedge outline is the speaker’s vertical pattern; the colors are the same level scale as TOP VIEW.',
      'Readouts: HEIGHT, TILT, V PATTERN (ARRAY with a line array) and ROOM.',
    ],
    control: [
      'HEIGHT fader: low (on a tripod stand) → mid (the start) → flown high, hung near the ceiling.',
      'TILT fader: −5° to 35° of down-tilt; it starts at 12°.',
      'V PATTERN key: how tall the wedge is — V 40°, V 60° (the start, the 90°×60° box), V 100°, or V 60° from the 120°×60° box. It leaves the dock while LINE ARRAY is on.',
      'ROOM key: STAGE HEIGHT, CEILING HEIGHT, AUDIENCE DISTANCE and FLAT SEATING / SLOPED SEATING.',
      'SYSTEM key: ADD DELAY SPEAKER, LINE ARRAY and REAR DELAY SPKR, which adds a TIME-ALIGNED ● / MISALIGNED switch.',
    ],
    changes: [
      'Low and level, the front rows sit close to the box and run hot; the far rows cool.',
      'Raised, the box is farther from the front rows, so near and far seats sit at more similar distances. Tilt aims the wedge’s loud CENTER far and its quieter EDGE near.',
      'A delay speaker sits nearer the rear seats, so it is fired late and both arrivals land together. MISALIGNED shows them out of step: heard as an echo or a smear.',
    ],
    teaches: [
      'Why speakers fly: height plus down-tilt evens out front and back.',
      'The room is half the design — stage, ceiling, depth and slope all change the answer.',
      'Deep rooms need help: line arrays and time-aligned delay speakers.',
      'Follows TOP VIEW; next, READING IT names everything you saw.',
    ],
    tryThis: [
      'Pull HEIGHT to low: HEIGHT reads low, and the front chairs run much hotter than the back rows.',
      'Raise HEIGHT to flown high, then add TILT until the color evens out from the front row to the back.',
      'Open SYSTEM, tap REAR DELAY SPKR, then tap TIME-ALIGNED ● so it reads MISALIGNED: the two green fronts reach the rear rows out of step.',
    ],
  },

  // ── 3 · READING IT (reading page) ────────────────────────────────────────
  read: {
    seeing: [
      'A reading page: the color key for both coverage maps, each swatch taken from the map itself.',
      'RED / ORANGE, YELLOW, GREEN, CYAN / BLUE and BLACK, each with its meaning.',
      'Then seven terms — COVERAGE, DISPERSION, HOT SPOT, DEAD ZONE, OVERLAP, FRONT FILLS, DELAY SPEAKERS — THE BIG IDEA and a check question.',
    ],
    control: [
      'Nothing to set: scroll to read. Long-press a term for its guided-lesson entry; ⓘ WHAT THE DISPLAY SHOWS opens the color key’s entry.',
      'Answer the check question to test yourself. FINISH, at the foot of the page or on the strip, ends the lab.',
    ],
    changes: [
      'Red to deep blue spans about 20 dB. Each doubling of distance moves a seat about 6 dB down the ramp.',
      'BLACK is not just far away: the pattern never reaches that seat at a workable level — geometry failing.',
      'Overlap reads hot; in a real room it also combs, boosting some frequencies and cutting others.',
    ],
    teaches: [
      'How to read a coverage map at a glance: the audience on green, no black, as little red as possible.',
      'The words system techs use for what the maps show.',
      'The last section of this lab. Room Design & Monitoring comes next in Acoustics.',
    ],
    tryThis: [
      'Go back to TOP VIEW, find a BLACK seat, then add FILLS or SPKR 2 until it is no longer black.',
      'In SIDE VIEW, set HEIGHT to low and find the HOT SPOT — the front row, right in front of the box.',
    ],
  },
};

/** The what's-left screen (LabEndScreen) at the end of Speaker Placement & Coverage. */
export const SPEAKER_END_GUIDE: ScreenGuide = {
  seeing: [
    'The end of the lab: LAB COMPLETE, or WHAT’S LEFT with a row for each section not yet credited.',
    'REVIEW ▾ opens the sections already credited.',
  ],
  control: [
    'Tap a row to jump straight to that section.',
    'PRACTICE AGAIN FROM THE START reopens TOP VIEW; DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'A section counts once you have opened it; the lab completes when every section has been seen.',
    'Practicing again or reviewing never removes credit already earned.',
  ],
  teaches: [
    'This lab covered how dispersion, position, aim, height and tilt decide who hears a loudspeaker, and how fills and delays reach the rest.',
    'Next in Acoustics: Room Design & Monitoring, where you model a room of your own.',
  ],
  tryThis: [
    'Jump to SIDE VIEW and turn on LINE ARRAY: V PATTERN reads ARRAY and the hang covers the depth of the room.',
    'Jump to TOP VIEW and cover every seat with no BLACK, using as few boxes as you can.',
  ],
};
