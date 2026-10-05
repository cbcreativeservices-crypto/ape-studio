/**
 * A08a B♭ CLARINET — the look (charter §2 layer 3), drawn only from the
 * shared woodwind family: the clarinet with its keywork, the player seated or
 * standing (the variant), projected from the same layout the collisions and
 * the zones use; its own HOW IT SOUNDS and WHERE IT SITS pages, and a
 * portrait for ORIENT (the same clarinet turned to be read, keys toward you).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { windLessonArt } from '../shared/woodwinds/windLessonArt';
import { frameAt, portraitOf, type Layout } from '../shared/woodwinds/windPosture.ts';
import { CLARINET_MODEL, SEATED, layoutOf } from './geometry.ts';

/** The clarinet turned to be read: the reed at the left, the bell at the right. */
export const PORTRAIT: Layout = portraitOf(SEATED, frameAt(SEATED, 400).t, { x: 0, y: -1, z: 0.4 });
const at = (s: number) => frameAt(PORTRAIT, s).p;
const lab = (id: string, text: string, s: number, dv: number, short?: string): StaticLabel => {
  const p = at(s);
  return { id, text, ...(short ? { short } : {}), u: p.x, v: p.y + dv, align: 'center', at: { u: p.x, v: p.y + Math.sign(dv) * 15 } };
};
export const PORTRAIT_BOX = { u0: -70, u1: 770, v0: -150, v1: 112 };
/** HOW IT SOUNDS: the same clarinet stood on end, the reed at the top. */
export const SOUND_FIG: Layout = portraitOf(SEATED, frameAt(SEATED, 400).t, { x: 0, y: -1, z: 0.4 }, { x: 0, y: 0, z: 0 }, 1);

export const CLARINET_ART: LessonArt = windLessonArt({
  model: CLARINET_MODEL,
  layoutOf,
  labels: {
    side: [
      { id: 'mp', text: 'MOUTHPIECE · REED', short: 'REED', s: 45, side: -1, off: 120 },
      { id: 'barrel', text: 'BARREL', s: 120, side: 1, off: 150 },
      { id: 'upper', text: 'UPPER JOINT', short: 'UPPER', s: 270, side: 1, off: 165 },
      { id: 'lower', text: 'LOWER JOINT', short: 'LOWER', s: 505, side: -1, off: 165 },
      { id: 'bell', text: 'BELL', s: 705, side: 1, off: 110 },
    ],
    top: [
      { id: 'mp', text: 'MOUTHPIECE', short: 'REED', s: 50, side: -1, off: 150 },
      { id: 'upper', text: 'UPPER JOINT', short: 'UPPER', s: 270, side: 1, off: 190 },
      { id: 'lower', text: 'LOWER JOINT', short: 'LOWER', s: 505, side: -1, off: 190 },
      { id: 'bell', text: 'BELL', s: 712, side: 1, off: 120 },
    ],
  },
  portrait: {
    L: PORTRAIT,
    box: PORTRAIT_BOX,
    a11y: 'A B♭ clarinet lying on its side, keys toward you: the mouthpiece with its reed and metal ligature at the left, the barrel, the upper and lower joints with their ring keys, padded keys and long rods, and the flared bell at the right.',
    labels: [lab('mp', 'MOUTHPIECE · REED', 40, 95, 'REED'), lab('barrel', 'BARREL', 119, -105), lab('upper', 'UPPER JOINT', 280, 95, 'UPPER'), lab('keys', 'KEYS · RODS', 420, -105, 'KEYS'), lab('lower', 'LOWER JOINT', 520, 95, 'LOWER'), lab('bell', 'BELL', 690, -105)],
  },
  sound: {
    fig: { L: SOUND_FIG, box: { u0: -260, u1: 420, v0: -190, v1: 790 }, side: -1, subject: 'A B♭ clarinet on its side, keys toward you, its air column drawn open' },
    other: 'open',
    notesNote: 'A simplified fingering: real clarinet fingerings close and vent some holes past the first open one, and the throat notes use small keys — but the place most of the note leaves still moves up the body as the pitch rises.',
    pipeNote: 'The clarinet is close to the ideal closed cylinder: its low register is rich in the odd partials, and its fingerings repeat a twelfth apart. Real tone holes and the bell bend the picture a little.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the clarinet: how a real clarinet sounds depends on the instrument, the reed, the player and the room. The pictures show where the sound is made and where it leaves.',
    reveal: 'Most notes leave from an open hole on the body; only the lowest — every hole closed — leave mainly from the bell.',
  },
  setting: {
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Seated or standing, and how do they move? Which notes does the part use — the low register, the throat notes, the top? What sound do they want: a blended orchestral colour, an intimate solo, a separated line over a band? Hear the clarinet unamplified first, across its whole range, quiet and loud.' },
      { title: 'WORK WITH THE CLARINET AS IT IS', text: 'A wooden clarinet is delicate, and it is the player’s. Ask before touching it; nothing presses a joint, a ring key, a rod or a pad, and no clip goes on without their agreement.' },
    ],
    hearing: 'Protect your hearing during rehearsals and soundcheck: a clarinet up close, and the brass and percussion behind a woodwind section, can be loud for long stretches. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Keep monitor levels down and use hearing protection where it is loud.',
    sectionLanding: 'Tap anything in the section — or step through ITEM — to see what it means for a clarinet mic. There is nothing to answer yet.',
    sectionIdle: 'The clarinets sit behind the flutes, beside the bassoons. Everything near the clarinet is either the player’s space or a neighbour its mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front and another player’s to the side. Monitors, the PA and a loud band all reach a clarinet mic.',
    studioIdle: 'No monitors on the floor. The room — and a main pair above the conductor — are part of the picture now.',
    a11y: { section: 'The woodwind section from above: flutes and oboes in front, clarinets and bassoons behind, the first clarinet ringed in amber.', stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair on a tall stand above the conductor.' },
  },
  plan: { own: 'cl1', layoutOf, ownLabel: 'CLARINET 1 · THIS LESSON' },
});
