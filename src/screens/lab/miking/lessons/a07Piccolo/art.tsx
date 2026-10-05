/**
 * A07 PICCOLO — the look (charter §2 layer 3), from the shared woodwind
 * family: a wooden piccolo with a silver head joint and keys, the player
 * standing or seated, the air jet dashed — projected from the same layouts
 * the collisions and the zones use; its own HOW IT SOUNDS and WHERE IT SITS
 * pages; for ORIENT, the piccolo turned to be read, keys toward you.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { add, scale } from '../../engine/geometry/vec.ts';
import { windLessonArt } from '../shared/woodwinds/windLessonArt';
import { frameAt, portraitOf, type Layout } from '../shared/woodwinds/windPosture.ts';
import { PICCOLO_MODEL, SEATED, STANDING, layoutOf } from './geometry.ts';

const AXIS = frameAt(STANDING, 150).t;
const UP = { x: 0, y: -1, z: 0.3 };
/** ORIENT: the piccolo lying along the page, the lip plate at the left. */
export const PORTRAIT: Layout = portraitOf(STANDING, AXIS, UP);
const at = (s: number) => frameAt(PORTRAIT, s).p;
const lab = (id: string, text: string, s: number, dv: number, short?: string): StaticLabel => {
  const p = at(s);
  return { id, text, ...(short ? { short } : {}), u: p.x, v: p.y + dv, align: 'center', at: { u: p.x, v: p.y + Math.sign(dv) * 11 } };
};
export const PORTRAIT_BOX = { u0: -60, u1: 345, v0: -78, v1: 62 };
/** HOW IT SOUNDS: the same piccolo stood on end, the embouchure at the top. */
export const SOUND_FIG: Layout = portraitOf(STANDING, AXIS, UP, { x: 0, y: 0, z: 0 }, 1);
const jetTip = (L: Layout) => add(L.jet!.a, scale(L.jet!.dir, L.jet!.len));

export const PICCOLO_ART: LessonArt = windLessonArt({
  model: PICCOLO_MODEL,
  layoutOf,
  labels: {
    side: [
      { id: 'body', text: 'BODY · KEYS', short: 'BODY', s: 230, side: -1, off: 150 },
    ],
    top: [
      { id: 'head', text: 'HEAD JOINT', s: 40, side: -1, off: 140 },
      { id: 'body', text: 'BODY · KEYS', short: 'BODY', s: 230, side: 1, off: 150 },
    ],
  },
  points: {
    side: [
      { id: 'jet', text: 'AIR JET', at: (L) => jetTip(L), du: 70, dv: 70 },
      { id: 'head', text: 'HEAD JOINT · LIP PLATE', short: 'HEAD JOINT', at: (L) => frameAt(L, 30).p, du: -300, dv: -90 },
      { id: 'ear', text: 'RIGHT EAR', at: (L) => add(L.body.head.c, { x: -92, y: 10, z: 0 }), du: -150, dv: -190 },
    ],
    top: [{ id: 'jet', text: 'AIR JET', at: (L) => jetTip(L), du: 90, dv: 40 }],
  },
  portrait: {
    L: PORTRAIT,
    box: PORTRAIT_BOX,
    a11y: 'A piccolo lying on its side, keys toward you: the silver head joint with its lip plate and small embouchure hole at the left, then the short dark wooden body with its silver padded keys and rods, ending in a plain open end at the right — no bell, no foot joint.',
    labels: [lab('lip', 'LIP PLATE', 0, -48), lab('head', 'HEAD JOINT', 60, 42, 'HEAD'), lab('keys', 'KEYS', 200, -48), lab('body', 'BODY · WOOD', 260, 42, 'BODY'), lab('end', 'OPEN END', 313, -48, 'END')],
  },
  sound: {
    fig: { L: SOUND_FIG, box: { u0: -200, u1: 400, v0: -60, v1: 360 }, side: -1, subject: 'A piccolo stood on end, keys toward you, its air column drawn open' },
    other: 'closed',
    notesNote: 'A simplified fingering: real piccolo fingerings vent and cross-finger, and the top uses special fingerings not drawn here — but the first open hole still moves up toward the player as the pitch rises.',
    pipeNote: 'Like the flute, the piccolo is close to the ideal pipe open at both ends — at half the length, so every note is an octave higher. Compare a pipe closed at one end with PIPE.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the piccolo: how a real piccolo sounds depends on the instrument, the player and the room. The pictures show where the sound is made and where the sound and the air leave.',
    reveal: 'The embouchure hole radiates for every note; the first open hole carries much of the rest — the open end only when every hole is closed.',
  },
  setting: {
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Standing or seated, and how do they move — the head’s turn, the piccolo’s swing? Which passages: the low notes, the top, soft and strong, trills? What sound do they want? Hear the piccolo unamplified first — and hear what the ensemble pickup already gives you.' },
      { title: 'WORK WITH THE PICCOLO AS IT IS', text: 'A piccolo is small and often wooden. Nothing presses the body, covers a hole or touches a rod or pad; a flute clip is not assumed to fit. If the fit is uncertain, use a stand.' },
    ],
    hearing: 'Protect your hearing — and remember the player’s: the piccolo’s top register is loud right beside their right ear, and the brass and percussion behind a section can be loud for long stretches. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it.',
    sectionLanding: 'Tap anything in the section — or step through ITEM — to see what it means for a piccolo mic. There is nothing to answer yet.',
    sectionIdle: 'The piccolo sits at the end of the flute row, its end out to the player’s right; the clarinets sit right behind. Everything near it is the player’s space, the air jet, or a neighbour its mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front and another player’s to the side. Monitors, the PA and a loud band all reach a piccolo mic.',
    studioIdle: 'No monitors on the floor. The room — and a main pair above the conductor, which may already carry the piccolo — are part of the picture now.',
    a11y: { section: 'The woodwind section from above: flutes and oboes in front, clarinets and bassoons behind, the piccolo at the end of the flute row ringed in amber.', stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair on a tall stand above the conductor.' },
  },
  plan: { own: 'picc', layoutOf: () => SEATED, ownLabel: 'PICCOLO · THIS LESSON' },
});
