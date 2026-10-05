/**
 * A09a OBOE — the look (charter §2 layer 3), from the shared woodwind
 * family: the oboe with its dense keywork and double reed, the player seated
 * or standing, projected from the same layout the collisions and zones use;
 * its own HOW IT SOUNDS and WHERE IT SITS pages; a portrait for ORIENT.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { windLessonArt } from '../shared/woodwinds/windLessonArt';
import { frameAt, portraitOf, type Layout } from '../shared/woodwinds/windPosture.ts';
import { OBOE_MODEL, SEATED, layoutOf } from './geometry.ts';

export const PORTRAIT: Layout = portraitOf(SEATED, frameAt(SEATED, 300).t, { x: 0, y: -1, z: 0.4 });
const at = (s: number) => frameAt(PORTRAIT, s).p;
const lab = (id: string, text: string, s: number, dv: number, short?: string): StaticLabel => {
  const p = at(s);
  return { id, text, ...(short ? { short } : {}), u: p.x, v: p.y + dv, align: 'center', at: { u: p.x, v: p.y + Math.sign(dv) * 13 } };
};
export const PORTRAIT_BOX = { u0: -60, u1: 640, v0: -140, v1: 105 };
/** HOW IT SOUNDS: the same oboe stood on end, the reed at the top. */
export const SOUND_FIG: Layout = portraitOf(SEATED, frameAt(SEATED, 300).t, { x: 0, y: -1, z: 0.4 }, { x: 0, y: 0, z: 0 }, 1);

export const OBOE_ART: LessonArt = windLessonArt({
  model: OBOE_MODEL,
  layoutOf,
  labels: {
    side: [
      { id: 'reed', text: 'DOUBLE REED', short: 'REED', s: 25, side: -1, off: 125 },
      { id: 'upper', text: 'UPPER JOINT', short: 'UPPER', s: 170, side: 1, off: 160 },
      { id: 'lower', text: 'LOWER JOINT', short: 'LOWER', s: 380, side: -1, off: 160 },
      { id: 'bell', text: 'BELL', s: 575, side: 1, off: 110 },
    ],
    top: [
      { id: 'reed', text: 'REED', s: 25, side: -1, off: 150 },
      { id: 'upper', text: 'UPPER JOINT', short: 'UPPER', s: 170, side: 1, off: 180 },
      { id: 'lower', text: 'LOWER JOINT', short: 'LOWER', s: 380, side: -1, off: 180 },
      { id: 'bell', text: 'BELL', s: 580, side: 1, off: 120 },
    ],
  },
  portrait: {
    L: PORTRAIT,
    box: PORTRAIT_BOX,
    a11y: 'An oboe lying on its side, keys toward you: the double reed with its thread wrap at the left, the narrow upper joint and the lower joint covered in ring keys, plates and padded keys on long rods, and the small flared bell at the right.',
    labels: [lab('reed', 'DOUBLE REED', 22, 90, 'REED'), lab('upper', 'UPPER JOINT', 160, -100, 'UPPER'), lab('keys', 'KEYS · RODS', 300, 90, 'KEYS'), lab('lower', 'LOWER JOINT', 400, -100, 'LOWER'), lab('bell', 'BELL', 560, 90)],
  },
  sound: {
    fig: { L: SOUND_FIG, box: { u0: -260, u1: 420, v0: -190, v1: 660 }, side: -1, subject: 'An oboe on its side, keys toward you, its air column drawn open' },
    other: 'closed',
    notesNote: 'A simplified fingering: real oboe fingerings use half-holes, octave keys and cross-fingerings — but the place most of the note leaves still moves up the body as the pitch rises, and the small holes mean no single hole tells the whole story.',
    pipeNote: 'The oboe’s bore is close to a narrow cone with its tip near the reed, so it sounds every multiple and overblows an octave — compare the clarinet’s closed cylinder with PIPE.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the oboe: how a real oboe sounds depends on the instrument, the reed, the player and the room. The pictures show where the sound is made and where it leaves.',
    reveal: 'Most notes leave from an open hole on the body; only the lowest — every hole closed — leave mainly from the bell.',
  },
  setting: {
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Seated or standing, and how much does the oboe pivot as they breathe and read? Which notes does the part use — the lowest B♭, the top? What sound do they want: a natural orchestral colour, an intimate solo, a separated line? Hear the oboe unamplified first, across its range, quiet and loud.' },
      { title: 'WORK WITH THE OBOE AS IT IS', text: 'The oboe and its reed are delicate, and they are the player’s. Ask before touching anything; nothing goes on the reed, a joint, a ring key, a rod or a pad, and no clip or adhesive without their agreement.' },
    ],
    hearing: 'Protect your hearing during rehearsals and soundcheck: the oboe cuts through, and the brass and percussion behind a woodwind section can be loud for long stretches. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Keep monitor levels down and use hearing protection where it is loud.',
    sectionLanding: 'Tap anything in the section — or step through ITEM — to see what it means for an oboe mic. There is nothing to answer yet.',
    sectionIdle: 'The oboes sit in the front row beside the flutes, the bassoons right behind. Everything near the oboe is either the player’s space or a neighbour its mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front and another player’s to the side. Monitors, the PA and a loud band all reach an oboe mic.',
    studioIdle: 'No monitors on the floor. The room — and a main pair above the conductor — are part of the picture now.',
    a11y: { section: 'The woodwind section from above: flutes and oboes in front, clarinets and bassoons behind, the first oboe ringed in amber.', stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair on a tall stand above the conductor.' },
  },
  plan: { own: 'ob1', layoutOf, ownLabel: 'OBOE 1 · THIS LESSON' },
});
