/**
 * A05a SOPRANO SAXOPHONE — the look, drawn only from the shared saxophone
 * family: the straight soprano and its player, standing or seated, the
 * face-on figure for ORIENT, and the family's HOW IT SOUNDS and WHERE IT
 * SITS pages with the soprano's words.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeSaxLessonArt } from '../shared/sax/saxLessonArt';
import { ALTO, TENOR } from '../shared/sax/saxSpec.ts';
import { saxPosture } from '../shared/sax/saxPosture.ts';
import { saxBefore, saxHearing } from '../shared/sax/saxWords.ts';
import { SOPRANO_SAX } from './geometry.ts';

const ALTO_P = saxPosture(ALTO, 'standing');
const TENOR_P = saxPosture(TENOR, 'standing');

export const A05A_ART: LessonArt = makeSaxLessonArt(SOPRANO_SAX, {
  figureA11y: 'A straight soprano saxophone seen face-on: the black mouthpiece with its reed and ligature at the top left, a short neck with the octave key, the straight brass body with its key cups, rods and pearl touches, and the bell flaring at the lower right, continuing the line of the body.',
  sound: {
    breathNote: 9,
    subject: 'A straight soprano saxophone face-on',
    bellNote: 'The soprano’s bell continues the line of the body, down and forward — far from the upper holes. Its bell starts to act like a megaphone above about 2.6 kHz, so the high harmonics come out of it strongly.',
    registerNote: 'A simplified cone. A real saxophone has two octave vents — the neck’s and the body’s — that the octave key switches between; each one sits close to a still point of the notes it serves.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the soprano: how a real soprano sounds depends on the horn, the mouthpiece, the reed and the player. The pictures show where the sound comes from and where it leaves.',
    reveal: 'Most of a note leaves at the first open hole — the open hole nearest the mouthpiece — and the open holes just past it. The bell carries the high harmonics, and the lowest notes.',
  },
  setting: {
    objects: [
      { id: 'sax', kind: 'self', at: { x: 200, z: 0 }, r: 300, label: 'soprano', scene: 'all' },
      { id: 'stand', kind: 'stand', at: { x: 860, z: -300 }, yaw: 170, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
      { id: 'n1', kind: 'sax', posture: ALTO_P, at: { x: -60, z: -950 }, r: 400, label: 'alto', scene: 'kit' },
      { id: 'n2', kind: 'sax', posture: TENOR_P, at: { x: -60, z: 900 }, r: 420, label: 'tenor', scene: 'kit' },
      { id: 'kit', kind: 'kit', at: { x: -1900, z: -300 }, r: 700, label: 'drums', scene: 'kit' },
      { id: 'main', kind: 'pair', at: { x: 1550, z: 150 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
    ],
    near: { u0: -2700, u1: 1300, v0: -1450, v1: 1500 },
    wide: { u0: -2700, u1: 1900, v0: -1550, v1: 1900 },
    nearA11y: 'A soprano player from above, the straight horn pointing forward, the horn’s swing hatched round the bell; a music stand in front, an alto player on one side and a tenor on the other, the drum kit behind.',
    wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience to the right.', studio: 'The same from above, in a studio room, with a main pair on a tall stand in front of the group.' },
    nearLanding: 'Tap anything around the player — or step through ITEM — to see what it means for a soprano mic. There is nothing to answer yet.',
    nearIdle: 'The soprano points forward and down from the player’s mouth; the whole horn swings as they move, and the hands never leave the keys. Everything else is a neighbour a soprano mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front, and another player’s to the side. Monitors, the PA and a loud band all reach a soprano mic.',
    studioIdle: 'No monitors on the floor. The room — and a main pair, when the soprano plays in a group — are part of the picture now.',
    before: saxBefore('soprano'),
    hearing: saxHearing,
  },
});
