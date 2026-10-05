/**
 * A09b BASSOON — the look (charter §2 layer 3), from the shared woodwind
 * family: the folded bassoon — reed, bocal, wing joint, boot with its U-tube,
 * long joint, bell with its ivory ring — across the player's body on a seat
 * strap (or a harness, standing), projected from the same layout the
 * collisions and zones use; its own HOW IT SOUNDS and WHERE IT SITS pages; a
 * portrait for ORIENT (the bassoon lying on its side, bell to the right).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { windLessonArt } from '../shared/woodwinds/windLessonArt';
import { bassoonAxes, frameAt, portraitOf, type Layout } from '../shared/woodwinds/windPosture.ts';
import { BASSOON_MODEL, SEATED, layoutOf } from './geometry.ts';

const AX = bassoonAxes();
export const PORTRAIT: Layout = portraitOf(SEATED, AX.d, AX.w, { x: 0, y: 0, z: 0 });
const at = (s: number) => frameAt(PORTRAIT, s).p;
const lab = (id: string, text: string, s: number, dv: number, short?: string, du = 0): StaticLabel => {
  const p = at(s);
  return { id, text, ...(short ? { short } : {}), u: p.x + du, v: p.y + dv, align: 'center', at: { u: p.x, v: p.y + Math.sign(dv) * 24 } };
};
const ends = [at(0), at(2655), at(1270)];
const minX = Math.min(...ends.map((p) => p.x)) - 200;
const maxX = Math.max(...ends.map((p) => p.x)) + 170;
const minY = Math.min(at(0).y, at(300).y, at(845).y) - 230;
const maxY = Math.max(at(1270).y, at(2000).y) + 200;
export const PORTRAIT_BOX = { u0: minX, u1: maxX, v0: minY, v1: maxY };
/** HOW IT SOUNDS: the bassoon stood up, its bell at the top. */
export const SOUND_FIG: Layout = portraitOf(SEATED, AX.d, AX.w, { x: 0, y: 0, z: 0 }, -1);
const sp = [0, 345, 845, 1270, 1700, 2655].map((s) => frameAt(SOUND_FIG, s).p);
export const SOUND_BOX = { u0: Math.min(...sp.map((p) => p.x)) - 300, u1: Math.max(...sp.map((p) => p.x)) + 300, v0: Math.min(...sp.map((p) => p.y)) - 150, v1: Math.max(...sp.map((p) => p.y)) + 150 };

export const BASSOON_ART: LessonArt = windLessonArt({
  model: BASSOON_MODEL,
  layoutOf,
  labels: {
    side: [
      { id: 'bocal', text: 'BOCAL · REED', short: 'BOCAL', s: 200, side: -1, off: 120 },
      { id: 'wing', text: 'WING JOINT', short: 'WING', s: 560, side: 1, off: 150 },
      { id: 'boot', text: 'BOOT', s: 1050, side: 1, off: 150 },
      { id: 'long', text: 'LONG JOINT', short: 'LONG', s: 2000, side: -1, off: 150 },
      { id: 'bell', text: 'BELL', s: 2580, side: -1, off: 110 },
    ],
    top: [
      { id: 'bocal', text: 'BOCAL', s: 200, side: -1, off: 130 },
      { id: 'boot', text: 'BOOT', s: 1050, side: 1, off: 160 },
      { id: 'bell', text: 'BELL', s: 2580, side: -1, off: 120 },
    ],
  },
  portrait: {
    L: PORTRAIT,
    box: PORTRAIT_BOX,
    a11y: 'A bassoon lying on its side, keys toward you: the double reed on its curved metal bocal at the top left, the wing joint running left to the boot with its U-tube cap, the long joint running back to the right beside it, and the bell joint with its pale ring at the right end.',
    labels: [lab('reed', 'REED · BOCAL', 160, -150, 'BOCAL'), lab('wing', 'WING JOINT · LEFT HAND', 600, -150, 'WING'), lab('boot', 'BOOT · U-TUBE · RIGHT HAND', 1100, 150, 'BOOT'), lab('long', 'LONG JOINT · THUMB KEYS', 1950, 150, 'LONG JOINT'), lab('bell', 'BELL', 2550, 150)],
  },
  sound: {
    fig: { L: SOUND_FIG, box: SOUND_BOX, side: 1, subject: 'A bassoon on its side, keys toward you, its folded air column drawn open' },
    other: 'closed',
    notesNote: 'A simplified fingering: real bassoon fingerings use half-holes, flick keys and many thumb keys — but the place most of the note leaves still moves farther along the folded tube as the pitch rises: down from the bell, round the boot, up the wing joint.',
    pipeNote: 'The bassoon’s bore is close to a long cone with its tip near the reed, folded in two: it sounds every multiple and overblows an octave — compare the clarinet’s closed cylinder with PIPE.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the bassoon: how a real bassoon sounds depends on the instrument, the reed, the player and the room. The pictures show where the sound is made and where it leaves.',
    reveal: 'The very lowest note leaves from the bell; every note above it leaves farther down the folded tube.',
  },
  setting: {
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Seat strap or harness, and how much does the bassoon move? Which notes does the part use — the lowest B♭, the top? What sound do they want: the section’s foundation, a solo line, a separated part over a band? Hear the bassoon unamplified first, across its range, quiet and loud.' },
      { title: 'WORK WITH THE BASSOON AS IT IS', text: 'The bocal is delicate, and the instrument is the player’s. Ask before touching it; nothing is clamped or taped to the bocal, a joint, a rod or a pad, and no clip goes on without their agreement.' },
    ],
    hearing: 'Protect your hearing during rehearsals and soundcheck: the brass and percussion behind a woodwind section can be loud for long stretches. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Keep monitor levels down and use hearing protection where it is loud.',
    sectionLanding: 'Tap anything in the section — or step through ITEM — to see what it means for a bassoon mic. There is nothing to answer yet.',
    sectionIdle: 'The bassoons sit in the back row behind the oboes, their bells above the players’ heads. Everything near the bassoon is either the player’s space or a neighbour its mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front and another player’s to the side. Monitors, the PA and a loud band all reach a bassoon mic.',
    studioIdle: 'No monitors on the floor. The room — and a main pair above the conductor — are part of the picture now.',
    a11y: { section: 'The woodwind section from above: flutes and oboes in front, clarinets and bassoons behind, the first bassoon ringed in amber.', stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair on a tall stand above the conductor.' },
  },
  plan: { own: 'bsn1', layoutOf, ownLabel: 'BASSOON 1 · THIS LESSON' },
});
