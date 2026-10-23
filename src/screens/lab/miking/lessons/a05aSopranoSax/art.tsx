/**
 * A05a SOPRANO SAXOPHONE — the look, drawn only from the shared saxophone
 * family: the straight soprano and its player, standing or seated, the
 * face-on figure for ORIENT, and the family's HOW IT SOUNDS and WHERE IT
 * SITS pages with the soprano's words.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeSaxLessonArt } from '../shared/sax/saxLessonArt';
import { A05A_PLAN } from './plan.ts';
import { saxBefore, saxHearing } from '../shared/sax/saxWords.ts';
import { SOPRANO_SAX } from './geometry.ts';

export const A05A_ART: LessonArt = makeSaxLessonArt(SOPRANO_SAX, {
  figureA11y: 'A straight soprano saxophone seen face-on: the black mouthpiece with its reed and ligature at the top left, a short neck with the octave key, the straight brass body with its key cups, rods and pearl touches, and the bell flaring at the lower right, continuing the line of the body.',
  sound: {
    breathNote: 9,
    subject: 'A straight soprano saxophone face-on',
    bellNote: 'The soprano’s bell continues the line of the body, down and forward — far from the upper holes. Its bell starts to act like a megaphone above about 2.6 kHz, so the high harmonics come out of it strongly.',
    registerNote: 'A simplified cone. A real saxophone has two octave vents — the neck’s and the body’s — that the octave key switches between; each one sits close to a still point of the notes it serves.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the soprano: how a real soprano sounds depends on the horn, the mouthpiece, the reed and the player. The pictures show where the sound comes from and where it leaves.',
    reveal: 'Most of a note leaves at the first open hole — the open hole nearest the mouthpiece — and the open holes just past it. The high harmonics travel on to holes farther down and to the bell, which also carries the lowest notes.',
  },
  setting: {
    ...A05A_PLAN,
    nearA11y: 'A soprano player from above, the straight horn pointing forward, the horn’s swing hatched round the bell; a music stand in front, an alto player on one side and a tenor on the other, the drum kit behind.',
    wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair on a tall stand in front of the group; beside each player a headphone mixer on its stand, each wired back to the control room at the room’s edge.' },
    nearLanding: 'Tap anything around the player — or step through ITEM — to see what it means for a soprano mic. There is nothing to answer yet.',
    nearIdle: 'The soprano points forward and down from the player’s mouth; the whole horn swings as they move, and the hands never leave the keys. Everything else is a neighbour a soprano mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front, and another player’s to the side. Monitors, the PA and a loud band all reach a soprano mic.',
    studioIdle: 'No monitors on the floor: each player hears the band on headphones, from a personal mixer beside them. The room — and a main pair, when the soprano plays in a group — are part of the picture now.',
    before: saxBefore('soprano'),
    hearing: saxHearing,
  },
});
