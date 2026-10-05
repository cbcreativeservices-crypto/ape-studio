/**
 * A08b BASS CLARINET — the look (charter §2 layer 3), from the shared
 * woodwind family: the bass clarinet (black body, silver-plated neck, bow and
 * upturned bell, the floor peg) between the seated player's knees, to low E♭
 * or low C (the variant), projected from the same layouts the collisions and
 * the zones use; its own HOW IT SOUNDS and WHERE IT SITS pages; a portrait
 * for ORIENT (the instrument in profile: the neck bends back toward the
 * player, the bell turns up and away from them).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { windLessonArt } from '../shared/woodwinds/windLessonArt';
import { frameAt, portraitOf, type Layout } from '../shared/woodwinds/windPosture.ts';
import { BASS_CLARINET_MODEL, LAYOUTS, layoutOf } from './geometry.ts';

const E = LAYOUTS.eflat;
const AXIS = frameAt(E, 600).t;
/** The profile: the body along +x, the neck bending one way, the bell the other. */
export const PORTRAIT: Layout = portraitOf(E, AXIS, { x: 0, y: 0, z: 1 });
const at = (s: number) => frameAt(PORTRAIT, s).p;
const lab = (id: string, text: string, s: number, dv: number, short?: string): StaticLabel => {
  const p = at(s);
  return { id, text, ...(short ? { short } : {}), u: p.x, v: p.y + dv, align: 'center', at: { u: p.x, v: p.y + Math.sign(dv) * 26 } };
};
const pts = [0, 95, 200, 330, 1000, 1100, 1170, 1350].map(at);
export const PORTRAIT_BOX = { u0: Math.min(...pts.map((p) => p.x)) - 70, u1: Math.max(...pts.map((p) => p.x)) + 80, v0: Math.min(...pts.map((p) => p.y)) - 90, v1: Math.max(...pts.map((p) => p.y)) + 110 };
/** HOW IT SOUNDS: the same instrument stood up, the mouthpiece at the top. */
export const SOUND_FIG: Layout = portraitOf(E, AXIS, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 }, 1);
const sp = [0, 200, 330, 1000, 1170, 1350].map((s) => frameAt(SOUND_FIG, s).p);
const SOUND_BOX = { u0: Math.min(...sp.map((p) => p.x)) - 300, u1: Math.max(...sp.map((p) => p.x)) + 300, v0: Math.min(...sp.map((p) => p.y)) - 190, v1: Math.max(...sp.map((p) => p.y)) + 110 };

export const BASS_CLARINET_ART: LessonArt = windLessonArt({
  model: BASS_CLARINET_MODEL,
  layoutOf,
  labels: {
    side: [
      { id: 'neck', text: 'NECK · MOUTHPIECE', short: 'NECK', s: 200, side: 1, off: 150 },
      { id: 'upper', text: 'UPPER JOINT', short: 'UPPER', s: 480, side: -1, off: 170 },
      { id: 'lower', text: 'LOWER JOINT', short: 'LOWER', s: 820, side: 1, off: 170 },
      { id: 'bell', text: 'UPTURNED BELL', short: 'BELL', s: 1300, side: -1, off: 160 },
    ],
    top: [
      { id: 'neck', text: 'NECK', s: 200, side: 1, off: 150 },
      { id: 'bell', text: 'BELL', s: 1300, side: -1, off: 150 },
    ],
  },
  points: {
    side: [{ id: 'peg', text: 'FLOOR PEG', at: (L) => ({ x: L.peg!.b.x, y: L.peg!.b.y - 60, z: L.peg!.b.z }), du: 150, dv: -20 }],
  },
  portrait: {
    L: PORTRAIT,
    box: PORTRAIT_BOX,
    a11y: 'A bass clarinet in profile, lying on its side: the mouthpiece and the curved silver neck at the left, the long black body with its keys and rods, the silver bow at the right turning the tube back on itself, and the upturned bell.',
    labels: [lab('mp', 'MOUTHPIECE · REED', 40, -100, 'REED'), lab('neck', 'NECK', 220, -110), lab('upper', 'UPPER JOINT', 500, 110, 'UPPER'), lab('lower', 'LOWER JOINT', 830, -110, 'LOWER'), lab('bow', 'BOW', 1080, 120), lab('bell', 'BELL', 1300, -110)],
  },
  sound: {
    fig: { L: SOUND_FIG, box: SOUND_BOX, side: 1, subject: 'A bass clarinet stood up, keys toward you, its air column drawn open' },
    other: 'open',
    notesNote: 'A simplified fingering: real bass clarinet fingerings vent and use many thumb keys — but the place much of the note leaves still moves up the body as the pitch rises, blended with the upturned bell.',
    pipeNote: 'Like the soprano clarinet, the bass clarinet is close to the ideal closed cylinder: odd multiples first, and its fingerings repeat a twelfth apart.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the bass clarinet: how a real one sounds depends on the instrument, the reed, the player and the room. The pictures show where the sound is made and where it leaves.',
    reveal: 'Much of each note leaves from the open holes, blended with the upturned bell; the lowest notes lean on the bell.',
  },
  setting: {
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Which model — to low E♭ or to low C — and which lowest note does the part use? Seated or standing, how much does the instrument move? What sound do they want? Hear it unamplified first, low to high, quiet and loud.' },
      { title: 'WORK WITH THE INSTRUMENT AS IT IS', text: 'Never use the neck, rods, pads or finish as a mount. Only a clip confirmed for this instrument, with the player’s agreement — else a stand. Keep stands and cables off the peg’s path and away from the chair.' },
    ],
    hearing: 'Protect your hearing during rehearsals and soundcheck: the brass and percussion near a woodwind section can be loud for long stretches. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it.',
    sectionLanding: 'Tap anything in the section — or step through ITEM — to see what it means for a bass clarinet mic. There is nothing to answer yet.',
    sectionIdle: 'The bass clarinet sits at the end of the clarinets, its bell low in front of the knees, its peg on the floor. Everything near it is the player’s space or a neighbour its mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front and another player’s to the side. Monitors, the PA, a loud band — and the floor — all reach a bass clarinet mic.',
    studioIdle: 'No monitors on the floor. The room — its low resonances — and a main pair above the conductor are part of the picture now.',
    a11y: { section: 'The woodwind section from above: flutes and oboes in front, clarinets and bassoons behind, the bass clarinet at the end of the clarinets, ringed in amber.', stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair on a tall stand above the conductor.' },
  },
  plan: { own: 'bcl', layoutOf, ownLabel: 'BASS CLARINET · THIS LESSON' },
});
