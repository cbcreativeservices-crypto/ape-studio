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
    seeing: [
      'A reading page with no live display. The lab starts here, before any drawing.',
      'THREE KINDS OF NUMBER: CALCULATED (exact arithmetic), ESTIMATED (a simplified model) and MEASURED (a number taken in the real room).',
      'HEARING FIRST: the safe-level rule for monitoring. HOW THE LAB RUNS: the five modules that follow, in order.',
    ],
    control: [
      'Nothing to set here: scroll to read.',
      'NEXT at the bottom opens Create the room. The strip under the title jumps to any module; ‹ leaves the lab.',
      'Tap ⓘ on any module to have that screen explained.',
    ],
    changes: [
      'CALCULATED numbers come straight from your entries: move a wall and they change exactly.',
      'ESTIMATED numbers come from teaching-table materials and simple physics. Real walls flex and leak, and furniture changes the sound — the model cannot see that.',
      'MEASURED is the only tier that describes the real room. The REVIEW module sets it beside the model.',
    ],
    teaches: [
      'A room model shows where problems are LIKELY. It is never a verdict on the room.',
      'Symmetry, equal distances and a seat on the center line are starting points, not laws.',
      'It takes Wave Physics (reflection, absorption, standing waves, the Room Builder) and Speaker Placement & Coverage (aim and dispersion) into a model of your own room.',
    ],
    tryThis: [
      'Before reading on, guess the tier of a speaker-to-ear distance. Then check under THREE KINDS OF NUMBER: distances are exact arithmetic, so CALCULATED.',
      'A decay time worked out from a formula and one timed after a hand clap in the room: find each one’s tier. They are not the same.',
      'Tap NEXT: every live module carries a badge under its display naming the tier of what it shows.',
    ],
  },

  // ── 2 · Create the room ──────────────────────────────────────────────────
  create: {
    seeing: [
      'Your room from above (PLAN), FRONT wall at the top; doors and windows carry their wall’s tag (W2, W3). Width runs across, length up the left side.',
      'It starts 4.00 m wide, 5.00 m long, 2.50 m high, with a door, a window and a desk.',
      'Readouts: VIEW (PLAN or SIDE), AREA, VOLUME and RATIO S:M:L — the dimensions sorted smallest to largest, divided by the smallest.',
      'The badge under it: CALCULATED, exact arithmetic.',
    ],
    control: [
      'Drag a corner to reshape the room; drag a piece of furniture to move it.',
      'LENGTH and WIDTH faders: 2 m to 15 m. CEILING fader: 2 m to 6 m — riding it opens the side view, where the height shows.',
      'SIDE VIEW switch, or tap VIEW on the readouts: the room seen from the side.',
      'SHAPE tray: TYPE THE DIMENSIONS, UNITS, WALL SHAPE (RECTANGLE, ANGLED, IRREGULAR, CURVED), CEILING (FLAT, SLOPED, VAULTED, MIXED), + DOOR, + WINDOW, + OPENING, + DESK, + SOFA, + SHELF, + RACK, and NEW ROOM.',
      'FINISH tray: the FLOOR, WALLS and CEILING materials, each listed with its absorption (α) at 125 Hz, 500 Hz and 2 kHz.',
    ],
    changes: [
      'AREA is the floor plan. VOLUME is that area times the ceiling height.',
      'Each dimension sets its own bass resonances (room modes). When one is a simple multiple of another, their modes share a frequency.',
      'Not a rectangle, or not a flat ceiling: later mode estimates use the bounding box or mean height — LESS reliable.',
      'FINISH recolors the plan now and changes the decay and reflection estimates later.',
    ],
    teaches: [
      'How a room is described for acoustics: plan, height, surfaces, openings and large objects.',
      'The room-ratio convention: smallest : middle : largest, not length : width : height.',
      'The desk matters: its top bounces sound to the ears, and the model draws that path.',
      'Every later module reads this one room — the next one places the speakers in it.',
    ],
    tryThis: [
      'On the default room read AREA 20.0 m², VOLUME 50.0 m³ and RATIO S:M:L 1:1.6:2.0. The 2.0: the 5 m length is twice the 2.50 m height, so their modes share 68.6 Hz.',
      'Ride CEILING to 2.65 m: the side view opens and RATIO reads 1:1.5:1.9 — no longer a simple multiple, close to the 1 : 1.4 : 1.9 in the notes. Then set it back to 2.50 m.',
      'In SHAPE pick ANGLED: the note below the display warns the mode estimates will use the bounding box, LESS reliable. Then SHAPE › NEW ROOM brings the default room back.',
    ],
  },

  // ── 3 · Monitoring setup ─────────────────────────────────────────────────
  monitoring: {
    seeing: [
      'The plan again, now with the speakers (L, R), your head and the stereo triangle — at the start an equilateral one, 1.60 m a side.',
      'Under the head: the listening angle and the distance class, e.g. NEARFIELD · 1.60 m — amber, with ?, when the distance is outside that class.',
      'Readouts: DIST L and DIST R (speaker to ears), ANGLE (NONE in red with no triangle), L−R (green within 5 cm, red beyond).',
    ],
    control: [
      'Drag a speaker or the listener on the plan; in the side view, drag up and down for height.',
      'SPREAD: the distance between L and R, set evenly about the room’s center line. FRONT: the speakers’ distance from the front wall. SEAT: the listener’s distance from the front wall.',
      'HEIGHT: first pick WHICH HEIGHT — the tweeters, your seated ears or the sub. Riding it opens the side view.',
      'SETUP tray: CONFIGURATION (STEREO, STEREO + SUB, MULTICHANNEL), LISTENING DISTANCE CLASS (NEARFIELD, MIDFIELD, OTHER), TOE-IN (STRAIGHT, TOE-IN 15°, TOE-IN 30°) and an optional label for your monitors.',
    ],
    changes: [
      'Seat off center: the nearer speaker arrives first and pulls the image its way. A closer seat or a wider spread widens the angle.',
      'The front wall, nearer side wall, floor and ceiling each send a late copy; half a wavelength late, it cancels: f = c ÷ (2 × extra path), c = speed of sound. L’s list is below.',
      'With STEREO + SUB: a sub near walls and floor gains bass instead, up to about +6 dB per boundary.',
    ],
    teaches: [
      'The stereo triangle, and why matched left and right geometry keeps the center image steady.',
      'Nearfield (about 1–1.5 m; the screen accepts 0.8–1.8 m) and midfield (about 2–4 m) listening.',
      'Speaker–boundary cancellation: why the distance to the front wall moves a dip in the bass.',
      'Toe-in is the aim from Speaker Placement & Coverage. Geometry comes first; Explore placement adds modes and reflections.',
    ],
    tryThis: [
      'In SETUP pick MIDFIELD: the line under the head reads MIDFIELD · 1.60 m ? in amber. 1.60 m sits in the screen’s nearfield band (0.8–1.8 m), not midfield (1.8–4.2 m).',
      'Ride FRONT from 0.90 m to 1.20 m: L’s front wall cancellation moves from ~101.9 Hz to ~77.0 Hz. Further from the wall, the dip goes lower. Ride it back to 0.90 m.',
      'Ride SEAT down to about 1 m: ANGLE turns red and reads NONE. The seat is only 10 cm ahead of the speakers, and the model needs 30 cm for a triangle.',
    ],
  },

  // ── 4 · Explore placement ────────────────────────────────────────────────
  explore: {
    seeing: [
      'The plan with MODE PRESSURE: one room mode at ear height. RED = a pressure maximum, BLUE = a null, yellow and green between.',
      'The speakers, the listener and the triangle from Monitoring setup. Reflection paths appear with TRACE or LAYERS.',
      'Readouts: MODE (its frequency), AT EARS (its pressure at your head, % of maximum), EARLY <15ms (reflections within 15 ms), 1ST (the earliest one’s delay).',
    ],
    control: [
      'Drag the listener or a speaker; the map stays, every readout follows.',
      'MODE: pick from ROOM MODE TO MAP (lowest first, each named axial, tangential or oblique with its numbers, e.g. (1,0,0)), then slide through them.',
      'LAYERS tray: TRIANGLE, WALL DISTANCES, REFLECTIONS, MODE PRESSURE and TREATMENT on or off.',
      'TRACE: shows the reflection paths and sends a pulse along the next one, speaker → surface → ears.',
      'LAYOUT flips between kept positions: START (where they began; a move made on START goes into EDITED), OPTION A, OPTION B. SAVE keeps the positions in a slot, or saves the whole design.',
    ],
    changes: [
      'An axial mode bounces between one pair of surfaces: f = n × c ÷ (2 × distance), c = speed of sound. Tangential and oblique modes use two or three pairs and are weaker.',
      'Move the seat through the map: AT EARS rises on red, falls on blue — that note sounds heavy or thin there.',
      'A reflection travels further than the direct sound: about 1 ms later per 34 cm. Inside 15 ms it blurs the image and colors the tone.',
    ],
    teaches: [
      'Why bass changes from seat to seat: room modes, mapped one at a time.',
      'The image-source idea: a reflection behaves as if it came from the speaker mirrored behind the surface.',
      'Comparing kept positions against START, instead of trusting one “best” spot.',
      'Add treatment comes next and goes after these reflections and the bass.',
    ],
    tryThis: [
      'Flip LAYOUT to START. MODE 34.3 Hz, the first length mode: AT EARS reads 13 %. Drag the listener back: 0 % at mid-room (2.50 m), the null, then up toward 100 % (red) by the rear wall.',
      'Flip LAYOUT back to START. 1ST reads +0.7 ms: the desk-top bounce, the earliest reflection here. Tap TRACE — the pulse rides that path first.',
      'In SAVE tap OPTION A, then drag the listener: WHAT CHANGED lists the difference between START and OPTION A.',
    ],
  },

  // ── 5 · Add treatment ────────────────────────────────────────────────────
  treatment: {
    seeing: [
      'The plan with every modeled reflection path, colored by level, and your treatment in gold. A ✓ on a path means it meets treatment.',
      'Readouts: TREATED (treated paths / all modeled paths), RT60 500 (time to fall 60 dB, at 500 Hz), RT60 125 ≈ (the same at 125 Hz, rough), VS BARE (the 500 Hz change against the bare room).',
      'Below the display: the selected item, its α, with-and-without numbers and a safety note.',
    ],
    control: [
      'ADD tray: ABSORB NEXT (an absorber — panel, rug or cloud — at the next untreated reflection point, named on the key), BASS TRAPS IN THE CORNERS, CEILING CLOUD, RUG, DIFFUSER (REAR WALL), FREESTANDING PANEL.',
      'THICK (up to 40 cm) and SIZE (0.40–2.40 m) shape the selected item. A rug has SIZE only.',
      'ITEM ON / ITEM OFF: compare the readouts and the plan with and without the selected item.',
      'ITEMS tray: SELECT, SWITCH OFF or REMOVE each item; ALL OFF (COMPARE) and ALL ON. Drag any item on the plan.',
    ],
    changes: [
      'On a reflection point, treatment weakens that path: its ✓ appears, TREATED rises.',
      'Absorption shortens decay. Sabine: RT60 = 0.161 × volume ÷ absorption.',
      'A porous panel absorbs less below about c ÷ (4 × thickness), where c is the speed of sound: 858 Hz at 10 cm. See α at 125 Hz.',
      'Corners hold every mode’s pressure peak: traps there reach the bass, and thick ones soak up mids too. A diffuser scatters.',
    ],
    teaches: [
      'Where each kind of treatment works: reflection points for mids and highs (the ceiling over the desk is one), corners for bass.',
      'Why thickness — not more thin panels — reaches low frequencies.',
      'Compare, don’t cover: switch items off and on, and keep what changes something.',
      'It applies the Wave lab’s absorption and diffusion to your room. Review the room collects the result.',
    ],
    tryThis: [
      'On the default room (Create the room › SHAPE › NEW ROOM) tap BASS TRAPS IN THE CORNERS: RT60 125 ≈ 0.40 s to 0.31 s, VS BARE −0.15 s (mids drop too), TREATED 0/14.',
      'Traps still in, tap CEILING CLOUD: TREATED reads 2/14 and VS BARE −0.17 s. ITEM OFF brings back 0/14 and −0.15 s.',
      'The key reads ABSORB NEXT: FLOOR RUG (+3.7 ms). Tap it: TREATED reads 2/14. The model lets that bounce pass under the desk; a real desk top blocks it.',
    ],
  },

  // ── 6 · Review the room (report page) ────────────────────────────────────
  review: {
    seeing: [
      'A report on your design. No score, on purpose.',
      'ROOM AND LAYOUT (CALCULATED): plan, ceiling, area, volume, surfaces, speaker positions, distances, angle, wall distances.',
      'LIKELY ACOUSTIC BEHAVIOR (ESTIMATED; mode frequencies CALCULATED for a rectangle): THE PLAN AS REVIEWED, modes, seat pressure, reflections, RT60.',
      'Then SUGGESTED NEXT STEPS, MEASURE VERSUS ESTIMATE and SAVED DESIGNS — BEFORE AND AFTER.',
    ],
    control: [
      'Scroll to read. FULL SCREEN under the plan opens it large.',
      'MEASURED RT60 (MID) and RESONANCE FOUND: type a value you measured. CLEAR MEASURED VALUES empties them.',
      'SAVE THIS DESIGN. Each saved design has COMPARE AS “BEFORE”, LOAD and DELETE.',
      'To change the room, go back to the earlier modules. NEXT at the bottom finishes the lab.',
    ],
    changes: [
      'Every line reads the one design from the earlier modules: change the room, the speakers or the treatment there, and this page follows.',
      'Next steps are marked: ! look at this first, ▸ worth testing, ✓ as it should be, ⓘ normal. The first ! carries TRY FIRST.',
      'A measured value is set beside the model. When they differ, the measurement wins.',
    ],
    teaches: [
      'How to read a room as observations and next steps, not a grade.',
      'Which seat problems are worth moving for (the length axis) and which are normal at a centered, seated position.',
      'Why measurement has the last word. This closes the Acoustics labs; Digital Audio Systems opens the Signal labs.',
    ],
    tryThis: [
      'On the default design the TRY FIRST row says the seat sits near a null of the 34.3 Hz length mode — that note nearly disappears there.',
      'Type 34 in RESONANCE FOUND: the nearest modeled mode is axial (1,0,0) at 34.3 Hz, 0.3 Hz above — a close match for a simple model.',
      'On the default, untreated design (SHAPE › NEW ROOM) type 0.45 in MEASURED RT60 (MID): against the 0.55 s estimate, the room is deader than the model by 18 %.',
    ],
  },
};

/** The shared what's-left screen (FINISH · SEE WHAT'S LEFT ›). */
export const ROOM_END_GUIDE: ScreenGuide = {
  seeing: [
    'WHAT’S LEFT, or LAB COMPLETE once every module has been opened: the modules you have not opened yet, each with its number.',
    '✓ DONE: the modules already opened — REVIEW ▾ shows them.',
    'This lab records progress on this device, not certificate credit.',
  ],
  control: [
    'Tap any module’s row to open it.',
    'PRACTICE AGAIN FROM THE START reopens module 1. DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'Opening a module ticks it. A practice run never removes a tick.',
    'The design stays on screen while the lab is open. Leaving the lab clears it; a saved design comes back with LOAD in REVIEW.',
  ],
  teaches: [
    'The lab’s path at a glance: model the room, set up the monitors, explore placement, add treatment, review.',
    'Next in Audio Fundamentals: the Signal labs, starting with Digital Audio Systems.',
  ],
  tryThis: [
    'Open any module you skipped, straight from its row.',
    'Tap PRACTICE AGAIN FROM THE START and model your real room from a tape measure’s numbers.',
  ],
};
