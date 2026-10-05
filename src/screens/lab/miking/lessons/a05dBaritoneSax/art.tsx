/**
 * A05d BARITONE SAXOPHONE — the look, drawn only from the shared saxophone
 * family: the baritone and its player, standing or seated, the face-on
 * figure for ORIENT, and the family's HOW IT SOUNDS and WHERE IT SITS pages
 * with the baritone's words.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeSaxLessonArt } from '../shared/sax/saxLessonArt';
import { ALTO, TENOR } from '../shared/sax/saxSpec.ts';
import { saxPosture } from '../shared/sax/saxPosture.ts';
import { saxBefore, saxHearing } from '../shared/sax/saxWords.ts';
import { BARITONE_SAX } from './geometry.ts';

const TENOR_P = saxPosture(TENOR, 'standing');
const ALTO_P = saxPosture(ALTO, 'standing');

export const A05D_ART: LessonArt = makeSaxLessonArt(BARITONE_SAX, {
  figureA11y: 'A baritone saxophone seen face-on, upright: the black mouthpiece at the top left, the neck rising into a loop above the body, the long brass body with its key cups, rods and pearl touches, the bow at the bottom, and the big bell curving up beside the body, with the low A key near its rim.',
  sound: {
    breathNote: 9,
    subject: 'A baritone saxophone face-on',
    bellNote: 'The baritone’s holes are spread along a long body, so where a note leaves moves a long way between the lowest and the highest notes — one reason a farther mic, or the triangle, takes in more of the horn.',
    registerNote: 'A simplified cone. A real saxophone has two octave vents — the neck’s and the body’s — that the octave key switches between; each one sits close to a still point of the notes it serves.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the baritone: how a real baritone sounds depends on the horn, the mouthpiece, the reed and the player. The pictures show where the sound comes from and where it leaves.',
    reveal: 'Most of a note leaves at the first open hole — the open hole nearest the mouthpiece — and the open holes just past it. The bell carries the high harmonics, and the lowest notes.',
  },
  setting: {
    objects: [
      { id: 'sax', kind: 'self', at: { x: 80, z: 160 }, r: 360, label: 'baritone', scene: 'all' },
      { id: 'stand', kind: 'stand', at: { x: 900, z: -260 }, yaw: 170, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
      { id: 'n1', kind: 'sax', posture: TENOR_P, at: { x: 40, z: -1000 }, r: 400, label: 'tenor', scene: 'kit' },
      { id: 'n2', kind: 'sax', posture: ALTO_P, at: { x: 40, z: -1950 }, r: 380, label: 'alto', scene: 'kit' },
      { id: 'kit', kind: 'kit', at: { x: -2000, z: -600 }, r: 700, label: 'drums', scene: 'kit' },
      { id: 'main', kind: 'pair', at: { x: 1650, z: -400 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
    ],
    near: { u0: -2800, u1: 1400, v0: -2400, v1: 1100 },
    wide: { u0: -2800, u1: 2000, v0: -2500, v1: 1900 },
    nearA11y: 'A baritone player from above, the big horn hanging to their right, the bell’s wide swing hatched round it; a music stand in front, a tenor and an alto along the row to the left, the drum kit behind.',
    wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience to the right.', studio: 'The same from above, in a studio room, with a main pair on a tall stand in front of the section.' },
    nearLanding: 'Tap anything around the player — or step through ITEM — to see what it means for a baritone mic. There is nothing to answer yet.',
    nearIdle: 'The baritone hangs on its harness to the player’s right; the big horn swings widely as they turn, and the hands never leave the keys. Everything else is a neighbour a baritone mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front, and another player’s to the side. Monitors, the PA and a loud band all reach a baritone mic.',
    studioIdle: 'No monitors on the floor. The room — and a main pair, when the baritone plays in a section — are part of the picture now.',
    before: saxBefore('baritone'),
    hearing: saxHearing,
  },
});
