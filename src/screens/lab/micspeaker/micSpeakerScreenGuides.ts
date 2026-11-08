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
    intro: {
      learning: 'How a dynamic mic turns sound into electricity: air pushes the diaphragm, the diaphragm moves a coil through a magnet, and the moving coil makes a voltage.',
      start: 'Watch the waves push the diaphragm, then follow one ⊗/⊙ mark as it flips. Read e = B · l · v under the drawing, then open WHAT’S HAPPENING.',
    },
    seeing: [
      'Inside a moving-coil (dynamic) mic: the diaphragm, the coil behind it, and the magnet’s gap. The coil stays still in the picture; watch the waves, the current and its glow.',
      'The amber glow is the current the coil makes. The ⊗/⊙ marks show which way it flows, and they flip each time it reverses.',
      'Under it, e = B · l · v: the voltage follows the coil’s VELOCITY. WHAT’S HAPPENING explains each part.',
    ],
    control: [
      'There’s nothing to set here. The drawing moves on its own, so watch it and read the notes below it.',
      'Tap ⤢ FULL SCREEN, under the drawing, to see the coil and the magnet larger. Tap ⓘ WHAT THE DISPLAY SHOWS for a short explanation of the cutaway.',
      'Use ‹ PREV and NEXT › in the strip under the title to move between the lab’s sections; the strip calls each one a MODULE. Tap the middle of the strip to see the full list.',
    ],
    changes: [
      'Sound pressure pushes the diaphragm, and the diaphragm drags the coil through the magnet’s gap.',
      'A wire moving through a magnetic field makes a voltage: e = B · l · v (field × wire length × speed).',
      'So the output is biggest when the coil moves fastest. It reverses every half-cycle, as the coil turns back the other way.',
    ],
    teaches: [
      'A dynamic mic is a small generator: sound becomes motion, and motion becomes voltage.',
      'A rear port, described in WHAT’S HAPPENING, lets sound reach the back of the diaphragm too. That opening is what makes a mic favor one direction.',
      'The coil moves back and forth, so the voltage swings positive and negative: a mic’s output is AC, a copy of the sound wave’s motion.',
    ],
    tryThis: [
      'Watch one ⊗/⊙ marker: it swaps twice per cycle. Each swap is the current reversing, because the coil has turned back (AC).',
      'Watch the amber glow pulse: brightest when the current is strongest (the coil moving fastest), dim as the current passes through zero and reverses.',
    ],
  },

  // ── 2 · POLAR ─────────────────────────────────────────────────────────────
  polar: {
    intro: {
      learning: 'A mic hears some directions better than others. Its polar pattern maps that sensitivity, and a null is a deaf direction you can aim at unwanted sound.',
      start: 'On CARDIOID, drag the speaker behind the mic until PICKUP reads NULL. Then open PATTERN and try FIGURE-8 and OMNI with the speaker in the same spot.',
    },
    seeing: [
      'You’re looking down on a handheld mic with its front (the grille) pointing up. The small speaker is the sound the mic is hearing.',
      'Color = how strongly the mic hears each spot. The green line from the speaker fades as pickup drops.',
      'SOURCE is the speaker’s angle from the mic’s front. PICKUP is the level in dB compared with straight ahead, or NULL ≤−26 dB. PATTERN names the pattern in use.',
    ],
    control: [
      'Drag the speaker anywhere on the display (DRAG THE SPEAKER — ANYWHERE). It can touch the mic but can’t sit on top of it.',
      'Open PATTERN and choose OMNI, CARDIOID (where you start), SUPER, HYPER or FIGURE-8. The tray stays open, so you can flip between them while the field redraws. Each option has a one-line description.',
      'Tap ⤢ FULL SCREEN for a bigger field. You can still drag the speaker there.',
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
      'SUPER and HYPER narrow the front and move the null forward, but they pick up a little from directly behind.',
    ],
    tryThis: [
      'On CARDIOID, drag the speaker behind the mic (SOURCE near 180°): PICKUP reads NULL ≤−26 dB — where a monitor wedge belongs.',
      'Keep it behind and switch to FIGURE-8: PICKUP jumps to about 0 dB. The back lobe hears as well as the front.',
      'On CARDIOID, drag the speaker until SOURCE reads 90° (or 270°): PICKUP reads about −6 dB — half the front’s pickup.',
    ],
  },

  // ── 3 · DISTANCE ──────────────────────────────────────────────────────────
  distance: {
    intro: {
      learning: 'Moving a mic away loses direct sound fast but leaves the room sound almost unchanged, so distance sets the balance between the voice and the room.',
      start: 'Slide DISTANCE all the way in and read DIRECT and ROOM. Then slide it out to 48 in and watch ROOM take over.',
    },
    seeing: [
      'A talker and a mic in a room. The warm glow at the mouth is the direct sound; it fades into the even glow of the room’s reflections. The wavefronts move slowly so you can follow them.',
      'DIST is the distance in inches. LEVEL is the direct sound in dB compared with 4 in. DIRECT and ROOM are each one’s share of what the mic hears.',
      'The two bars below repeat DIRECT and ROOM for a quick comparison.',
    ],
    control: [
      'Move the DISTANCE fader to place the mic 4 in to 48 in from the mouth. You start at 17 in.',
      'As you move it, the mic slides through the field, and the fader lane shows the distance and the level compared with 4 in.',
      'Tap ⤢ FULL SCREEN to see the talker, the mic and the room’s glow larger.',
    ],
    changes: [
      'Direct sound follows the inverse-square law: each doubling of distance costs about 6 dB.',
      'The room’s reflected sound is about the same everywhere, so moving barely changes it.',
      'So what really changes is the BALANCE. Here DIRECT and ROOM cross near 12 in, the critical distance. Real rooms differ, often farther.',
    ],
    teaches: [
      'Close sound is a high direct-to-room ratio, not just a louder one.',
      'Turning up the gain cannot fix a distant mic: the room comes up with it.',
      'Typical speech working distance is about 4–12 inches.',
      'Past the critical distance, where direct and room sound are equal, the mic hears more room than voice.',
    ],
    tryThis: [
      'Slide DISTANCE all the way in: DIST reads 4 in, LEVEL 0.0 dB, DIRECT 90% and ROOM 10%.',
      'Set DISTANCE until DIST reads 12 in: DIRECT and ROOM both read 50% — the crossover. One inch either side tips the balance.',
      'Slide all the way out: DIST 48 in, LEVEL −21.6 dB, ROOM 94% — the room has taken over.',
    ],
  },

  // ── 4 · PROXIMITY ─────────────────────────────────────────────────────────
  proximity: {
    intro: {
      learning: 'Directional mics get bassier when they move very close to the source. This is the proximity effect, and omni mics don’t have it.',
      start: 'Slide DISTANCE all the way in to 1 in and watch the left end of the curve rise. Then open MIC and switch to OMNI.',
    },
    seeing: [
      'At the top, a talker in profile and a mic on a stand. The GAP line shows the mouth-to-grille distance and the bass rise; a warm glow swells at the capsule as you move in.',
      'At the bottom, the response curve runs 0 to +12 dB across 40 Hz–16 kHz. Watch a low shelf (a lift of the lowest notes) rise at the left.',
      'DIST shows the gap, BOOST the bass lift, and MIC which design you’re using.',
    ],
    control: [
      'Move the DISTANCE fader from 12 in (where you start) down to 1 in from the mouth.',
      'Open MIC and choose CARDIOID (where you start) or OMNI. The tray stays open, so you can switch between the two designs while the curve reacts.',
      'Tap ⤢ FULL SCREEN to see the talker, the mic and the curve larger, together.',
    ],
    changes: [
      'A directional mic hears the pressure DIFFERENCE between the front and back of its diaphragm (a pressure-gradient design).',
      'Far away, that difference comes from the tiny front-to-back delay, and it shrinks toward the bass. Up close, the front is also much louder than the back. That difference doesn’t shrink, so bass rises.',
      'OMNI is a pure pressure design: BOOST reads FLAT at any distance.',
    ],
    teaches: [
      'Proximity effect: directional mics get bassier up close; omnis do not.',
      'It can help (a warm radio voice) or hurt (a muddy singer): one reason channel strips have a high-pass filter, a control that trims the lowest bass.',
      'Here, at 1 in the bass lift starts at 220 Hz and climbs to about +10 dB near 50 Hz; at 12 in there’s none. Real mics vary.',
      'Moving a singer back a few inches controls the bass at the source.',
    ],
    tryThis: [
      'Slide DISTANCE all the way in: DIST reads 1 in and BOOST reads +10 dB — the left end of the curve lifts.',
      'Stay at 1 in and switch MIC to OMNI: BOOST reads FLAT and the curve lies flat.',
      'Back on CARDIOID, slide out to 12 in: BOOST reads NONE.',
    ],
  },

  // ── 5 · OFF-AXIS ──────────────────────────────────────────────────────────
  offaxis: {
    intro: {
      learning: 'Turning a mic away from the source makes it quieter and duller: the highs fall away faster than the lows.',
      start: 'Open PRESET and tap 90°. Compare @100 Hz with @8 kHz, then tap 180° and watch the right end of the curve drop.',
    },
    seeing: [
      'At the top, a talker and a mic you can turn away from them. At the bottom, the mic’s response curve, −26 to +6 dB across 40 Hz–16 kHz.',
      'ANGLE shows how far the mic is turned. @100 Hz (a low frequency) and @8 kHz (a high one) give each level in dB compared with aiming straight on.',
    ],
    control: [
      'Move the ANGLE fader from 0° (aimed straight at the talker, where you start) to 180° (facing away).',
      'Open PRESET to jump to 0°, 30°, 60°, 90° or 180°. The tray stays open, so you can step between angles and compare.',
      'Tap ⤢ FULL SCREEN to see the turning mic and its curve larger, together.',
    ],
    changes: [
      'Turning away loses level by the cardioid pattern from POLAR: about 6 dB at 90°.',
      'Highs lose more. Short high-frequency waves are about the size of the capsule, so it beams them; long low waves wrap around it.',
      'On this screen, an extra cut above 2 kHz grows with the angle, so @8 kHz falls faster than @100 Hz.',
    ],
    teaches: [
      'Off-axis sound is duller, not only quieter: the highs fall away faster than the lows.',
      'That’s why a singer drifting off the mic sounds muffled first.',
      'Smooth off-axis behavior is a mark of a good microphone.',
      'A small turn costs little level, but the loss grows quickly past 60° as the mic heads for its null behind.',
    ],
    tryThis: [
      'Tap PRESET 90°: @100 Hz reads −6.0 dB and @8 kHz reads −9.0 dB — the highs drop 3 dB more.',
      'Tap 60°: @100 Hz reads −2.5 dB and @8 kHz −4.5 dB. The right end of the curve tilts down.',
      'Tap 180°: @100 Hz reads −23.1 dB and @8 kHz −29.1 dB — directly behind, deep in the null.',
    ],
  },

  // ── 6 · STEREO ────────────────────────────────────────────────────────────
  stereo: {
    intro: {
      learning: 'Two mics make stereo by copying your ears’ two clues: which side is louder, and which side hears a sound first.',
      start: 'Open TECHNIQUE and step from XY to ORTF to AB, watching STEREO FROM. Then pick MID-SIDE and read its IN MONO line in WHAT’S HAPPENING.',
    },
    seeing: [
      'Two mics face a stage (the lit deck at the top). The field around them shows what the pair picks up together with the technique you chose.',
      'TECHNIQUE names the pair. STEREO FROM tells you what makes the left-right difference: LEVEL, LEVEL+TIME, TIME or MIX.',
      'Under the display, read what the two mics are doing and when the technique is used.',
    ],
    control: [
      'Open TECHNIQUE and choose XY (where you start), ORTF, AB or MID-SIDE. The tray stays open, so you can compare them while the field redraws. Each option says what it is and when to use it.',
      'Open WHAT’S HAPPENING, below, for the exact angles and spacing of each pair and its IN MONO line.',
      'Tap ⤢ FULL SCREEN to see the pair and its field larger.',
    ],
    changes: [
      'Your ears place a sound by which side is LOUDER and which side hears it FIRST. Two mics can copy either clue.',
      'XY: two cardioids at one point, angled about 90° apart — level only. ORTF: 17 cm apart at 110° — level and a little time.',
      'AB: spaced omnis — time only. MID-SIDE: a forward mic plus a sideways figure-8; the width is set later, in the MIX.',
    ],
    teaches: [
      'Stereo pairs make width from level differences, time differences, or both.',
      'Time-based pairs can sound hollow when summed to mono — comb filtering (some pitches boosted, others canceled); level-based pairs fold down cleanly.',
      'MID-SIDE lets you set the width after recording, and in mono the sideways part cancels, leaving the forward mic alone.',
    ],
    tryThis: [
      'Step XY → ORTF → AB and watch STEREO FROM: LEVEL, then LEVEL+TIME, then TIME — the mics move apart as time takes over.',
      'Pick MID-SIDE: STEREO FROM reads MIX. Open WHAT’S HAPPENING and read why its IN MONO line says perfectly safe.',
    ],
  },

  // ── 7 · PLOSIVES ──────────────────────────────────────────────────────────
  pop: {
    intro: {
      learning: 'A plosive is both sound and a puff of moving air. Pop filters, foam and windshields stop the air but let the sound through.',
      start: 'Open BARRIER and tap POP FILTER. Watch BLAST AT CAPSULE fall while the amber voice still passes, then compare FOAM with SHOTGUN WINDSHIELD.',
    },
    seeing: [
      'A plosive (“P”, “B”) is hitting a mic. The blue is the air blast (wind); the amber is the voice, which always gets through.',
      'BARRIER names what’s in front of the mic. BLAST AT CAPSULE is the share of the blast that still reaches the capsule.',
      'The PLOSIVE ENERGY REACHING THE CAPSULE bar below shows the same share at a glance.',
    ],
    control: [
      'Open BARRIER and choose NONE (where you start), POP FILTER, FOAM or SHOTGUN WINDSHIELD. The tray stays open, so you can compare them; each option has a one-line description.',
      'Tap ⤢ FULL SCREEN to watch the blast meet the barrier up close.',
    ],
    changes: [
      'A plosive is two things at once: a sound wave and a jet of moving air.',
      'Sound is a tiny pressure ripple that passes through mesh and foam. The jet is bulk air flow, and a barrier breaks it up and slows it.',
      'So the blue blast shrinks with each barrier while the amber voice gets through. FOAM costs a little top end.',
    ],
    teaches: [
      'Pop filters, foam and windshields share one idea: stop the moving air, let the sound through.',
      'One hard “P” can overload a capsule and leave a low thump in the recording.',
      'The air jet travels straight out from the lips, so aiming the mic a little to the side of it also helps.',
    ],
    tryThis: [
      'Tap POP FILTER: BLAST AT CAPSULE falls from 100% to 30%, and the amber voice still passes.',
      'Compare FOAM (50%) with SHOTGUN WINDSHIELD (12%) — the full basket makes the stillest air around the mic.',
    ],
  },

  // ── 8 · HANDLING ──────────────────────────────────────────────────────────
  shock: {
    intro: {
      learning: 'Handling noise is vibration traveling through solid things, like the floor and the stand, not sound in the air. A shock mount keeps most of it out.',
      start: 'Open MOUNT and switch from RIGID MOUNT to SHOCK MOUNT. Watch INTO MIC fall and the bands stretch while the mic stays steady.',
    },
    seeing: [
      'A mic on a stand that is being shaken. The red label at the bottom, STAND SHAKE — 100% (THE SOURCE), marks where the shake starts.',
      'The label above the capsule shows how much of that shake reaches the mic.',
      'MOUNT names the holder. INTO MIC is the share of the shake that gets in; the VIBRATION TRANSMITTED INTO THE MIC bar below repeats it.',
    ],
    control: [
      'Open MOUNT and choose RIGID MOUNT (where you start) or SHOCK MOUNT. The tray stays open, so you can switch back and forth while the shaking redraws.',
      'Tap ⤢ FULL SCREEN to see the bands and the clip up close.',
    ],
    changes: [
      'Footsteps, knocks and cable tugs travel THROUGH solids — floor, stand, clip — into the capsule as low thumps. No air needed.',
      'RIGID: a hard clip passes the shake straight into the body.',
      'SHOCK: elastic bands hold the mic. They act as a soft spring: the mic’s mass (its inertia) keeps it nearly still while the ring shakes with the stand.',
    ],
    teaches: [
      'Handling noise is vibration conducted through solids, not sound in the air.',
      'A shock mount keeps that vibration in the stand; a high-pass filter (a control that trims the lowest bass) is the electrical version of the same idea.',
      'Footsteps on a stage or a bumped stand reach the mic this way, even when the room itself is quiet.',
    ],
    tryThis: [
      'Switch MOUNT from RIGID MOUNT to SHOCK MOUNT: INTO MIC falls from 90% to 15%, and the bands stretch while the mic stays steady.',
      'Watch the label above the capsule as you switch: AT THE CAPSULE — 90% OF THE SHAKE becomes 15%.',
    ],
  },

  // ── 9 · HAND GRIP ─────────────────────────────────────────────────────────
  hand: {
    intro: {
      learning: 'Why cupping a mic’s grille causes trouble: the hand blocks the rear ports, the cardioid pattern collapses, and the null that kept the monitor out disappears.',
      start: 'Drag the hand up toward the grille and watch PATTERN change. Then open POSITION and compare CORRECT with FULL CUP on the polar panel.',
    },
    seeing: [
      'Three linked panels: the mic with a hand on it, its polar pattern (the ghost outline is the cardioid it should have) and its frequency response.',
      'GRIP shows where the hand is. PATTERN tells you how the pickup is holding up: INTACT, DEGRADING or COLLAPSED.',
      'Under the display, a verdict names the grip (Correct grip ✅ to start) and says what it does.',
    ],
    control: [
      'Drag the hand up or down the mic on the display. At the very top, the hand cups the whole grille.',
      'The GRIP fader makes the same move, from the bottom of the handle up to the grille.',
      'Open POSITION to jump straight to LOW HANDLE, CORRECT (where you start), GRILLE RIM or FULL CUP.',
      'Tap WHY IT HAPPENS ▾, below the display, to see a cutaway of the rear ports.',
    ],
    changes: [
      'A cardioid hears the front AND, through rear ports, the back — timed so sound from behind cancels itself.',
      'Fingers on the grille rim start covering those ports: the pattern degrades and the response grows peaks and dips.',
      'A full cup blocks them: the mic falls back toward OMNI, the rear null is gone, and the hand adds its own resonance.',
    ],
    teaches: [
      'Why cupping invites feedback: the null aimed at the monitor disappears.',
      'A good grip: the hand on the body, just below the grille, touching it nowhere.',
      'A cardioid’s direction depends on the back of its head as much as the front: block the rear ports and it stops being a cardioid.',
    ],
    tryThis: [
      'Tap POSITION, then FULL CUP: PATTERN reads COLLAPSED and the polar panel spreads away from the ghost cardioid.',
      'Tap GRILLE RIM: PATTERN reads DEGRADING — the trouble starts as soon as fingers reach the rim.',
      'Tap LOW HANDLE: PATTERN stays INTACT — fine for the sound, but less control; on a wireless mic the antenna is there.',
    ],
  },

  // ── 10 · MISTAKES (reading page) ─────────────────────────────────────────
  mistakes: {
    intro: {
      learning: 'The six handheld-mic habits that hurt the sound or the show, and which principle each one breaks: the pattern, the angle, the distance, or stagecraft.',
      start: 'Swipe through the seven cards and guess each habit before you read its title. Then play SPOT THE MISTAKE — 3 ROUNDS.',
    },
    seeing: [
      'Swipe through a field guide of seven handheld-mic pictures: one ✅ Correct grip and six ❌ habits.',
      'The habits: Holding the grille, Cupping the grille, Pointing away, Too far away, Covering the switch, Blocking the antenna.',
      'Below the cards, SPOT THE MISTAKE — 3 ROUNDS shows a picture with no title for you to name.',
    ],
    control: [
      'Swipe the cards left and right. Long-press a card, or tap ⓘ WHAT THE DISPLAY SHOWS, for a fuller explanation; WHAT’S HAPPENING opens a short note.',
      'In SPOT THE MISTAKE, pick the habit each picture shows. The answer names the section that taught it, or marks it as stagecraft.',
      'Tap FINISH, at the foot of the page or on the strip, to go to the end of the lab.',
    ],
    changes: [
      'Each habit breaks a principle from earlier: grille and cup collapse the pattern (HAND GRIP), pointing away goes off-axis (OFF-AXIS), too far lets the room in (DISTANCE).',
      'The switch and the antenna are stagecraft: a thumb on the switch can mute the mic, and a hand over the antenna can cause wireless dropouts.',
      'Each visit brings a new random set of rounds, so you can practice again.',
    ],
    teaches: [
      'These habits matter wherever a handheld mic is used: on a stage, in theater, worship, broadcast or a presentation.',
      'Every mistake here has a cause you’ve met: a collapsed pattern, an off-axis angle, too much room, or a hand in the wrong place.',
      'Pointing away and standing too far share one fix: keep the mic close and aimed at the mouth.',
    ],
    tryThis: [
      'Before reading a card’s title, guess the habit from the picture alone.',
      'Play every round of SPOT THE MISTAKE; for each miss, reopen the section its answer names (the switch and the antenna are stagecraft).',
    ],
  },
};

/** The what's-left screen (LabEndScreen) at the end of Microphone Principles. */
export const MIC_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of the whole lab: how a mic turns sound into voltage, where it listens, and what distance, angle, air, vibration and a hand do to it.',
    start: 'Tap any row under WHAT’S LEFT to open a section you missed. Already complete? Open REVIEW ▾, go back to POLAR and HAND GRIP, and compare the cardioid null.',
  },
  seeing: [
    'You’ve reached the end of Microphone Principles. LAB COMPLETE means you’ve opened every section; otherwise WHAT’S LEFT lists the ones you haven’t opened yet.',
    'REVIEW ▾ opens the mic sections you’ve already seen.',
  ],
  control: [
    'Tap a row to jump straight to that section.',
    'Tap PRACTICE AGAIN FROM THE START to go back to CAPSULE, or DONE · BACK TO LABS to leave the lab.',
  ],
  changes: [
    'Each of the ten sections counts as done as soon as you open it. Once all ten are open, the lab is complete.',
    'Practicing again or reviewing never takes away a section you’ve already opened, so you can repeat any mic experiment freely.',
  ],
  teaches: [
    'A mic is a small generator with a direction: its pattern decides what it hears, and its null decides what it ignores.',
    'Distance sets the voice-to-room balance and the bass, angle sets the highs, and air blasts, vibration and a cupped hand can each spoil a good mic.',
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
    intro: {
      learning: 'A loudspeaker works like a flashlight for sound: where it sits, where it aims and how wide its pattern is decide which seats it covers.',
      start: 'Tap SPKR 2 and find the hot ridge where the two wedges cross. Then open PATTERN and switch from 90°×60° to 60°×40°.',
    },
    seeing: [
      'You’re looking down on the room, drawn to scale (the 5 m bar): stage at the top, audience below. Stage right is the left of your screen.',
      'Color shows the level at every spot: RED / ORANGE hottest, GREEN the target, BLUE quiet, BLACK a dead zone.',
      'EDIT shows what the faders move. POS, AIM and PATTERN show the selected box’s settings.',
    ],
    control: [
      'Move the POSITION fader (0–100 %) to slide the selected box along the stage. With FILLS selected, it moves the pair in or out from the center.',
      'Move the AIM fader (−60° to +60°) to turn the selected box. AIM leaves the dock while FILLS are selected, because fills fire straight out.',
      'Open PATTERN and choose 60°×40°, 90°×60° (where you start), 100°×100° or 120°×60°. The first number is the width you see from above.',
      'SPKR 1, SPKR 2 and FILLS choose what the faders edit. Your first tap on SPKR 2 or FILLS adds it; tap it again while it’s selected to remove it.',
    ],
    changes: [
      'Level falls about 6 dB each time the distance doubles, so seats cool from red near a box to green and blue farther back.',
      'The rated angle is where the level is already 6 dB below straight ahead; past it, seats cool fast.',
      'A narrower pattern packs the same power into a smaller wedge: louder on its axis. Where two beams overlap, energy adds into a hot ridge.',
    ],
    teaches: [
      'A loudspeaker is a flashlight for sound: position, aim and pattern decide who stands in the beam.',
      'A map shows coverage, hot spots, dead zones, overlap, and where front fills (small boxes on the stage lip) help.',
      'A narrow pattern reaches deeper but misses the sides; a wide one covers the sides but runs out sooner.',
      'The colors compare seats; they don’t predict SPL (sound pressure level, the measured loudness).',
    ],
    tryThis: [
      'Tap SPKR 2: a blue-outlined box appears at stage left, and the middle seats where the two wedges cross run hotter.',
      'Switch PATTERN from 90°×60° to 60°×40°: color reaches deeper down the room, while the side seats go cooler.',
      'Tap FILLS: two small green-outlined boxes appear on the stage lip, POS reads fills tight, and the front-center seats warm up.',
    ],
  },

  // ── 2 · SIDE VIEW ─────────────────────────────────────────────────────────
  side: {
    intro: {
      learning: 'Why speakers are flown high and tilted down: height and tilt even out the level from the front row to the back, and deep rooms need delay speakers.',
      start: 'Pull HEIGHT to low and see the front rows run hot. Then raise it to flown high and add TILT until the color evens out.',
    },
    seeing: [
      'The room from the side, drawn to scale (the 5 m bar): the stage with a singer at the left, the speaker, then rows of empty chairs under the level map.',
      'The wedge outline is the speaker’s vertical pattern; the colors are the same level scale as TOP VIEW.',
      'HEIGHT and TILT show where the box hangs and how far it points down. V PATTERN shows the wedge’s height (ARRAY with a line array); ROOM, the room setting.',
    ],
    control: [
      'Move the HEIGHT fader from low (on a tripod stand) through mid (where you start) to flown high, hung near the ceiling.',
      'Move the TILT fader from −5° to 35° of down-tilt. You start at 12°.',
      'Open V PATTERN to set how tall the wedge is: V 40°, V 60° (where you start, the 90°×60° box), V 100°, or V 60° from the 120°×60° box. It leaves the dock while LINE ARRAY is on.',
      'Open ROOM to change STAGE HEIGHT, CEILING HEIGHT, AUDIENCE DISTANCE, and FLAT SEATING / SLOPED SEATING.',
      'Open SYSTEM: ADD DELAY SPEAKER hangs a delay box over the middle seats, LINE ARRAY turns the main box into an array, and REAR DELAY SPKR hangs a box ahead of the rear rows with a TIME-ALIGNED ● / MISALIGNED switch.',
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
      'A delay speaker must wait for the sound from the stage, or the rear seats hear it twice.',
    ],
    tryThis: [
      'Pull HEIGHT to low: HEIGHT reads low, and the front chairs run much hotter than the back rows.',
      'Raise HEIGHT to flown high, then add TILT until the color evens out from the front row to the back.',
      'Open SYSTEM, tap REAR DELAY SPKR, then tap TIME-ALIGNED ● so it reads MISALIGNED: the two green fronts reach the rear rows out of step.',
    ],
  },

  // ── 3 · READING IT (reading page) ────────────────────────────────────────
  read: {
    intro: {
      learning: 'How to read a coverage map at a glance, and the words system techs use for it: coverage, dispersion, hot spot, dead zone, overlap, fills and delays.',
      start: 'Read the color key from RED / ORANGE down to BLACK. Then long-press any of the seven terms for more, and answer the check question.',
    },
    seeing: [
      'This page starts with the color key for both coverage maps; each swatch is taken from the map itself.',
      'RED / ORANGE, YELLOW, GREEN, CYAN / BLUE and BLACK, each with its meaning.',
      'Then come seven terms: COVERAGE, DISPERSION, HOT SPOT, DEAD ZONE, OVERLAP, FRONT FILLS and DELAY SPEAKERS. THE BIG IDEA and a check question end the page.',
    ],
    control: [
      'There’s nothing to set: scroll to read. Long-press a term for a fuller explanation; ⓘ WHAT THE DISPLAY SHOWS explains the color key.',
      'Answer the check question to test yourself. Tap FINISH, at the foot of the page or on the strip, to end the lab.',
    ],
    changes: [
      'Red to deep blue spans about 20 dB. Each doubling of distance moves a seat about 6 dB down the ramp.',
      'BLACK is not just far away: the pattern never reaches that seat at a workable level — geometry failing.',
      'Overlap reads hot; in a real room it also causes comb filtering, boosting some frequencies and cutting others.',
    ],
    teaches: [
      'How to read a coverage map at a glance: the audience on green, no black, as little red as possible.',
      'These are the words system techs use for what the maps show.',
      'What each color asks of the system, from a hot spot to a dead zone.',
    ],
    tryThis: [
      'Go back to TOP VIEW, find a BLACK seat, then add FILLS or SPKR 2 until it is no longer black.',
      'In SIDE VIEW, set HEIGHT to low and find the HOT SPOT — the front row, right in front of the box.',
    ],
  },
};

/** The what's-left screen (LabEndScreen) at the end of Speaker Placement & Coverage. */
export const SPEAKER_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of the lab: how dispersion, position, aim, height and tilt decide who hears a loudspeaker, and how fills and delays reach the rest.',
    start: 'Tap any row under WHAT’S LEFT to open a section you missed. Already complete? Open REVIEW ▾, go back to TOP VIEW or SIDE VIEW, and try a new layout.',
  },
  seeing: [
    'You’ve reached the end of Speaker Placement & Coverage. LAB COMPLETE means you’ve opened every section; otherwise WHAT’S LEFT lists the ones you haven’t opened yet.',
    'REVIEW ▾ opens the coverage sections you’ve already seen.',
  ],
  control: [
    'Tap a row to jump straight to that section.',
    'Tap PRACTICE AGAIN FROM THE START to go back to TOP VIEW, or DONE · BACK TO LABS to leave the lab.',
  ],
  changes: [
    'Each of the three sections counts as done as soon as you open it. Once all three are open, the lab is complete.',
    'Practicing again or reviewing never takes away a section you’ve already opened, so you can try new speaker layouts freely.',
  ],
  teaches: [
    'Pattern, position and aim decide which seats sit in a speaker’s beam; height and tilt decide how evenly it reaches front to back.',
    'Where one box can’t reach everyone, front fills cover the front rows and time-aligned delay speakers cover the back.',
  ],
  tryThis: [
    'Jump to SIDE VIEW and turn on LINE ARRAY: V PATTERN reads ARRAY and the hang covers the depth of the room.',
    'Jump to TOP VIEW and cover every seat with no BLACK, using as few boxes as you can.',
  ],
};
