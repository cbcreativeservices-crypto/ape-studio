/**
 * Room Design & Monitoring Lab — "explain this screen" content (owner
 * 2026-10-31, the Screen Guide rollout after the Wave Physics pilot). One
 * guide per module (keyed by RoomModuleId) plus one for the shared what's-left
 * screen. The lab has no menu screen of its own: it opens on module 1.
 *
 * Every line was written against the module's own code (modIntro / modCreate /
 * modMonitoring / modExplore / modTreatment / modReview, RoomPlanView,
 * RoomSideView, roomModel): the names are the on-screen names (bezel keys,
 * dock labels, tray headings and chips, labels drawn on the plan), and every
 * number quoted in TRY THIS is what roomModel.analyze() prints for the DEFAULT
 * design (4.00 × 5.00 m, 2.50 m flat ceiling, carpet / drywall / drywall, one
 * desk, a door and a window; stereo pair 1.60 m apart, 0.90 m from the front
 * wall, tweeters and ears at 1.20 m) unless the step says otherwise. Change a
 * module's labels, ranges or the default design → update its guide here;
 * test/screenGuide_roomdesign_20261031.test.ts pins the shape and the numbers.
 *
 * STEPPED: each section must fit a 375×812 phone with no scrolling, so each is
 * held to SCREEN_GUIDE_BUDGET (types.ts). Tighten wording; never cut accuracy.
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never skills;
 * no gear brand names; no "N of total"; "suggest", never the other word; no
 * build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { RoomModuleId } from './registry';

export const ROOM_SCREEN_GUIDES: Record<RoomModuleId, ScreenGuide> = {
  // ── 1 · What a room model can tell you (reading page) ────────────────────
  intro: {
    intro: {
      learning: 'Every number in this lab is one of three kinds: CALCULATED, ESTIMATED or MEASURED. A model shows where problems are likely; only a measurement describes your real room.',
      start: 'Read THREE KINDS OF NUMBER, then HEARING FIRST. Before you check, guess which kind a speaker-to-ear distance is. Then tap NEXT to open Create the room.',
    },
    seeing: [
      'This page is for reading; there’s no drawing yet. It takes Wave Physics and Speaker Placement & Coverage into your own room.',
      'Start with THREE KINDS OF NUMBER: CALCULATED (exact arithmetic), ESTIMATED (a model built on simple physics) and MEASURED (taken in the real room).',
      'HEARING FIRST gives the safe-level rule for monitoring. HOW THE LAB RUNS lists the five modules that follow, in order.',
    ],
    control: [
      'Nothing to set here. Scroll to read.',
      'Tap NEXT at the bottom to open Create the room. Use the strip under the title to jump to any module, or ‹ to leave the lab.',
      'Tap ⓘ on any module whenever you want that screen explained.',
    ],
    changes: [
      'CALCULATED numbers come straight from what you enter. Move a wall and they change exactly.',
      'ESTIMATED numbers come from typical material values and simple physics. Real walls flex and leak, and furniture changes the sound; an estimate can’t see that.',
      'MEASURED is the only kind that describes the real room. The REVIEW module sets your measurements beside the model.',
    ],
    teaches: [
      'A room model shows where problems are likely. It is never a verdict on the room.',
      'Symmetry, equal distances and a seat on the center line are suggested starting points, not rules.',
      'Distances and sizes are exact arithmetic, but how bass, decay and reflections behave in the real room can only be estimated until you measure it.',
    ],
    tryThis: [
      'Before you read on, guess which kind a speaker-to-ear distance is. Then check under THREE KINDS OF NUMBER: a distance is exact arithmetic, so it’s CALCULATED.',
      'Take a decay time worked out from a formula, and one timed after a hand clap in the room. Decide which kind each one is. They’re not the same.',
      'Tap NEXT and look under the display: every live module has a badge naming the kind of number it shows.',
    ],
  },

  // ── 2 · Create the room ──────────────────────────────────────────────────
  create: {
    intro: {
      learning: 'How a room is described for acoustics: size, height, surfaces and furniture. Also why dimensions that are simple multiples of each other stack bass resonances on one note.',
      start: 'Read AREA, VOLUME and RATIO S:M:L on the default room. Then ride the CEILING fader and watch the side view open and RATIO change. Open FINISH to compare materials.',
    },
    seeing: [
      'Your room from above (PLAN), FRONT wall at the top. Width runs across, length up the left side. Doors and windows carry their wall’s tag (W2, W3).',
      'It starts 4.00 m wide, 5.00 m long, 2.50 m high, with a door, a window and a desk.',
      'Readouts: VIEW (PLAN or SIDE), AREA, VOLUME and RATIO S:M:L: the dimensions sorted smallest to largest, each divided by the smallest.',
      'The badge says CALCULATED: exact arithmetic.',
    ],
    control: [
      'Drag a corner to reshape the room, or drag a piece of furniture to move it.',
      'LENGTH and WIDTH faders: 2 m to 15 m. CEILING fader: 2 m to 6 m. Riding CEILING opens the side view, where you see the height.',
      'Flip the SIDE VIEW switch, or tap VIEW in the readouts, to see the room from the side.',
      'SHAPE tray: TYPE THE DIMENSIONS, UNITS, WALL SHAPE (RECTANGLE, ANGLED, IRREGULAR, CURVED), CEILING (FLAT, SLOPED, VAULTED, MIXED), + DOOR, + WINDOW, + OPENING, + DESK, + SOFA, + SHELF, + RACK, and NEW ROOM to start over.',
      'FINISH tray: pick the FLOOR, WALLS and CEILING materials. Each lists its absorption (α, how much sound it soaks up) at 125 Hz, 500 Hz and 2 kHz.',
    ],
    changes: [
      'AREA is the floor plan. VOLUME is that area times the ceiling height.',
      'Each dimension sets its own bass resonances (room modes). If one is a simple multiple of another, their modes stack on one note.',
      'Not a rectangle, or not a flat ceiling? Later mode estimates use the bounding box or mean height: LESS reliable.',
      'FINISH recolors the plan now; later it changes decay times and reflection levels.',
    ],
    teaches: [
      'A room is described for acoustics by its plan, height, surfaces, openings and large objects.',
      'Room ratios are written smallest : middle : largest, not length : width : height.',
      'A desk matters: its top bounces sound up to your ears.',
      'Dimensions that are simple multiples of each other stack their bass modes on the same notes.',
    ],
    tryThis: [
      'On the default room, read AREA 20.0 m², VOLUME 50.0 m³ and RATIO S:M:L 1:1.6:2.0. The 2.0: the 5 m length is twice the 2.50 m height, so both have a mode at 68.6 Hz.',
      'Ride CEILING to 2.65 m. The side view opens and RATIO reads 1:1.5:1.9: no longer a simple multiple, and close to the 1 : 1.4 : 1.9 in the notes below. Then set it back to 2.50 m.',
      'In SHAPE pick ANGLED. The note below the display warns that mode estimates will use the bounding box: LESS reliable. Then SHAPE › NEW ROOM brings the default room back.',
    ],
  },

  // ── 3 · Monitoring setup ─────────────────────────────────────────────────
  monitoring: {
    intro: {
      learning: 'How the stereo triangle keeps the center image steady, what nearfield and midfield mean, and why distance from the front wall moves a dip in the bass.',
      start: 'Check that DIST L and DIST R match and L−R is green. Then ride FRONT and watch L’s front-wall dip move in the list below. Then ride SEAT and watch ANGLE.',
    },
    seeing: [
      'The plan again, now with the speakers (L, R), your head and the stereo triangle. It starts equilateral: 1.60 m on each side.',
      'Under your head: the listening angle and distance class, e.g. NEARFIELD · 1.60 m. It turns amber with ? when the distance doesn’t fit the class.',
      'Readouts: DIST L and DIST R (speaker to ears), ANGLE (red NONE when there’s no triangle) and L−R (green within 5 cm, red beyond).',
    ],
    control: [
      'Drag a speaker or the listener on the plan. In the side view, drag up or down to change height.',
      'SPREAD sets the distance between L and R, kept even about the room’s center line. FRONT sets the speakers’ distance from the front wall. SEAT sets your distance from the front wall.',
      'HEIGHT: first pick WHICH HEIGHT (the tweeters, your seated ears or the sub). Riding it opens the side view.',
      'SETUP tray: CONFIGURATION (STEREO, STEREO + SUB, MULTICHANNEL), LISTENING DISTANCE CLASS (NEARFIELD, MIDFIELD, OTHER), TOE-IN (STRAIGHT, TOE-IN 15°, TOE-IN 30°) and an optional label for your monitors.',
    ],
    changes: [
      'Sit off center and the nearer speaker arrives first, pulling the image its way. A closer seat or a wider spread widens the angle.',
      'Front wall, nearer side wall, floor and ceiling each send a late copy. Half a wavelength late, it cancels: f = c ÷ (2 × extra path), c = speed of sound. L’s list is below.',
      'With STEREO + SUB, a sub very close to walls and floor gains bass: up to about +6 dB per boundary.',
    ],
    teaches: [
      'In a stereo triangle, equal left and right distances keep the center image steady.',
      'Nearfield listening is about 1–1.5 m (the screen accepts 0.8–1.8 m); midfield is about 2–4 m.',
      'Where a speaker sits from the front wall sets where a bass dip falls: farther away, lower dip.',
      'Toe-in is the aim you met in Speaker Placement & Coverage. Get the geometry right first.',
    ],
    tryThis: [
      'In SETUP pick MIDFIELD: the line under your head turns amber and reads MIDFIELD · 1.60 m ?. 1.60 m sits in the nearfield band (0.8–1.8 m), not midfield (1.8–4.2 m).',
      'Ride FRONT from 0.90 m to 1.20 m. L’s front-wall cancellation moves from ~101.9 Hz to ~77.0 Hz: farther from the wall, lower dip. Ride it back to 0.90 m.',
      'Ride SEAT down to about 1 m. ANGLE turns red and reads NONE: your seat is only 10 cm in front of the speakers, and the screen needs 30 cm to draw a triangle.',
    ],
  },

  // ── 4 · Explore placement ────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'Why bass changes from seat to seat (room modes), why reflections within 15 ms blur the image, and how each reflection acts like a mirrored speaker.',
      start: 'Flip LAYOUT to START and pick MODE 34.3 Hz. Drag the listener toward the rear wall and watch AT EARS. Then tap TRACE to follow the earliest reflection.',
    },
    seeing: [
      'The colors are MODE PRESSURE: one room mode at ear height. RED = a pressure maximum, BLUE = a null, yellow and green in between.',
      'Your speakers, your head and the triangle from Monitoring setup sit on top. Reflection paths show with TRACE or LAYERS.',
      'Readouts: MODE (its frequency), AT EARS (its pressure at your head, % of maximum), EARLY <15ms (reflections within 15 ms) and 1ST (the earliest one’s delay).',
    ],
    control: [
      'Drag the listener or a speaker. The map stays put; every readout follows.',
      'MODE: pick from ROOM MODE TO MAP (lowest first, each named axial, tangential or oblique with its numbers, e.g. (1,0,0)), then slide through them.',
      'LAYERS tray: switch TRIANGLE, WALL DISTANCES, REFLECTIONS, MODE PRESSURE and TREATMENT on or off.',
      'TRACE shows the reflection paths and sends a pulse along the next one: speaker → surface → ears.',
      'LAYOUT flips between kept positions: START (where they began; a move made on START goes into EDITED), OPTION A and OPTION B. SAVE keeps the positions in a slot, or saves the whole design.',
    ],
    changes: [
      'An axial mode bounces between one pair of surfaces: f = n × c ÷ (2 × distance), c = speed of sound. Tangential and oblique modes use two or three pairs and are weaker.',
      'Move your seat across the map: AT EARS rises on red, falls on blue. That note sounds heavy or thin there.',
      'A reflection arrives about 1 ms late for every extra 34 cm it travels. Within 15 ms it blurs the image and colors the tone.',
    ],
    teaches: [
      'Bass changes from seat to seat because each room mode has its own peaks and nulls.',
      'The image-source idea: a reflection behaves as if it came from the speaker mirrored behind the surface.',
      'There is rarely one “best” spot. Comparing positions shows what each move gains and loses.',
      'Reflections within about 15 ms change image and tone; a mode’s null can make a bass note almost vanish.',
    ],
    tryThis: [
      'Flip LAYOUT to START. MODE 34.3 Hz, the first length mode: AT EARS reads 13 %. Drag the listener back: 0 % at mid-room (2.50 m), the null, then up toward 100 % (red) by the rear wall.',
      'Flip LAYOUT back to START. 1ST reads +0.7 ms: the bounce off the desk top, the earliest reflection here. Tap TRACE and the pulse rides that path first.',
      'In SAVE tap OPTION A, then drag the listener. WHAT CHANGED lists the difference between START and OPTION A.',
    ],
  },

  // ── 5 · Add treatment ────────────────────────────────────────────────────
  treatment: {
    intro: {
      learning: 'Where each kind of treatment works: absorbers at reflection points for mids and highs, traps in corners for bass. Also why thickness, not more thin panels, reaches low frequencies.',
      start: 'Tap BASS TRAPS IN THE CORNERS and watch RT60 125 ≈ fall. Then tap CEILING CLOUD and watch TREATED rise. Use ITEM OFF and ITEM ON to compare.',
    },
    seeing: [
      'The plan shows every modeled reflection path, colored by level, with your treatment in gold. A ✓ on a path means it meets treatment.',
      'Readouts: TREATED (treated paths / all paths), RT60 500 (time to fall 60 dB, at 500 Hz), RT60 125 ≈ (same at 125 Hz, rough), VS BARE (the 500 Hz change against the bare room).',
      'Below the display: the selected item, its α, with-and-without numbers and a safety note.',
    ],
    control: [
      'ADD tray: ABSORB NEXT (an absorber — panel, rug or cloud — at the next untreated reflection point, named on the key), BASS TRAPS IN THE CORNERS, CEILING CLOUD, RUG, DIFFUSER (REAR WALL), FREESTANDING PANEL.',
      'THICK (up to 40 cm) and SIZE (0.40–2.40 m) shape the selected item. A rug has SIZE only.',
      'ITEM ON / ITEM OFF: compare the readouts and the plan with and without the selected item.',
      'ITEMS tray: SELECT, SWITCH OFF or REMOVE each item; ALL OFF (COMPARE) and ALL ON. You can drag any item on the plan.',
    ],
    changes: [
      'Put treatment on a reflection point and that path weakens: its ✓ appears and TREATED rises.',
      'Absorption shortens decay. Sabine: RT60 = 0.161 × volume ÷ (area × α, summed).',
      'A porous panel absorbs less below about c ÷ (4 × thickness), c = speed of sound: 858 Hz at 10 cm. Compare its α at 125 Hz.',
      'Every mode peaks in corners, so traps there reach bass; thick ones soak up mids too. A diffuser scatters instead.',
    ],
    teaches: [
      'Absorbers at reflection points (the ceiling over the desk is one) tame mids and highs; traps in corners reach bass.',
      'Thickness, not more thin panels, is what reaches low frequencies.',
      'Treatment is judged by comparing: an item that changes nothing isn’t helping.',
      'Absorption removes reflected energy and shortens decay; diffusion spreads it out without removing it.',
    ],
    tryThis: [
      'On the default room (Create the room › SHAPE › NEW ROOM) tap BASS TRAPS IN THE CORNERS: RT60 125 ≈ goes 0.40 s to 0.31 s, VS BARE −0.15 s (mids drop too), TREATED 0/14.',
      'Traps still in, tap CEILING CLOUD: TREATED reads 2/14 and VS BARE −0.17 s. ITEM OFF brings back 0/14 and −0.15 s.',
      'The key reads ABSORB NEXT: FLOOR RUG (+3.7 ms). Tap it: TREATED reads 2/14. Here that floor bounce passes under the desk; in a real room, the desk top would block it.',
    ],
  },

  // ── 6 · Review the room (report page) ────────────────────────────────────
  review: {
    intro: {
      learning: 'How to read a room as observations and next steps, not a grade: which seat problems are worth moving for, and why a measurement outranks the model.',
      start: 'Read the TRY FIRST row in SUGGESTED NEXT STEPS. Then type a value you measured in RESONANCE FOUND or MEASURED RT60 (MID) and see how the model compares.',
    },
    seeing: [
      'A report on your design, with no score, on purpose.',
      'ROOM AND LAYOUT (CALCULATED): plan, ceiling, area, volume, surfaces, speaker positions, distances, angle, wall distances.',
      'LIKELY ACOUSTIC BEHAVIOR (ESTIMATED; mode frequencies CALCULATED for a rectangle): THE PLAN AS REVIEWED, modes, seat pressure, reflections, RT60.',
      'Then SUGGESTED NEXT STEPS, MEASURE VERSUS ESTIMATE and SAVED DESIGNS — BEFORE AND AFTER.',
    ],
    control: [
      'Scroll to read. Tap FULL SCREEN under the plan to see it large.',
      'MEASURED RT60 (MID) and RESONANCE FOUND: type a value you measured in the real room. CLEAR MEASURED VALUES empties them.',
      'Tap SAVE THIS DESIGN. Each saved design has COMPARE AS “BEFORE”, LOAD and DELETE.',
      'To change the room, go back to the earlier modules. NEXT at the bottom finishes the lab.',
    ],
    changes: [
      'Every line reads your one design from the earlier modules. Change the room, speakers or treatment there, and this page follows.',
      'Next steps are marked: ! look at this first, ▸ worth testing, ✓ as it should be, ⓘ normal. The first ! carries TRY FIRST.',
      'Your measured value sits beside the model. When they differ, the measurement wins.',
    ],
    teaches: [
      'A room is read as observations and next steps, not a grade.',
      'A seat near a null of a length mode is worth moving for. Width and height nulls are normal at a centered, seated position.',
      'A model estimates; a measurement describes. When they disagree, the measurement has the last word.',
    ],
    tryThis: [
      'On the default design, the TRY FIRST row says your seat sits near a null of the 34.3 Hz length mode: that note nearly disappears there.',
      'Type 34 in RESONANCE FOUND. The nearest modeled mode is axial (1,0,0) at 34.3 Hz, 0.3 Hz above: a close match for a simple model.',
      'On the untreated default (Create the room › SHAPE › NEW ROOM), type 0.45 in MEASURED RT60 (MID). Against the 0.55 s estimate, the room is 18 % deader than the model.',
    ],
  },
};

/** The shared what's-left screen (FINISH · SEE WHAT'S LEFT ›). */
export const ROOM_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How the lab’s steps fit together in order: describe the room, set up the monitors, explore placement, add treatment, then review the model against measurement.',
    start: 'Look under WHAT’S LEFT and tap any module’s row to open it. Or tap PRACTICE AGAIN FROM THE START to model your own room.',
  },
  seeing: [
    'WHAT’S LEFT lists the modules you haven’t opened yet, each with its number. Once you’ve opened them all, it reads LAB COMPLETE.',
    '✓ DONE holds the modules you’ve opened; REVIEW ▾ shows them.',
    'Your progress here is saved on this device only.',
  ],
  control: [
    'Tap any module’s row to open it.',
    'PRACTICE AGAIN FROM THE START reopens module 1. DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'Opening a module checks it off. A practice run never removes a check mark.',
    'Your design stays while the lab is open. Leaving the lab clears it; a design you saved comes back with LOAD in REVIEW.',
  ],
  teaches: [
    'Room work follows an order: shape and surfaces, then speaker and seat geometry, then modes and reflections, then treatment.',
    'Model numbers show where problems are likely; a measurement in the real room has the last word.',
  ],
  tryThis: [
    'Open any module you skipped, straight from its row.',
    'Tap PRACTICE AGAIN FROM THE START and model your real room from a tape measure’s numbers. Compare its RATIO S:M:L with the default room’s 1:1.6:2.0.',
  ],
};
