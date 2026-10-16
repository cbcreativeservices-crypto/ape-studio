/**
 * A05b ALTO SAXOPHONE — the look (charter §2 layer 3), drawn only from the
 * shared saxophone family: the alto and its player, standing or seated, the
 * face-on figure for ORIENT, and the family's HOW IT SOUNDS and WHERE IT
 * SITS pages with the alto's words.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeSaxLessonArt } from '../shared/sax/saxLessonArt';
import { A05B_PLAN } from './plan.ts';
import { saxHearing, saxBefore } from '../shared/sax/saxWords.ts';
import { ALTO_SAX } from './geometry.ts';

export const A05B_ART: LessonArt = makeSaxLessonArt(ALTO_SAX, {
  figureA11y: 'An alto saxophone seen face-on, upright: the black mouthpiece with its reed and ligature at the top left, the curved neck with the octave key, the long brass body with its key cups, rods and pearl touches, the U-shaped bow at the bottom, and the bell curving up beside the body on the right, its rim open to the sky.',
  sound: {
    breathNote: 9,
    subject: 'An alto saxophone face-on',
    bellNote: 'The alto’s bell curves up beside the body, so the bell and the lower holes are close together — one reason a mic above the bell can hear both.',
    registerNote: 'A simplified cone. A real saxophone has two octave vents — the neck’s and the body’s — that the octave key switches between; each one sits close to a still point of the notes it serves.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the alto: how a real alto sounds depends on the horn, the mouthpiece, the reed and the player. The pictures show where the sound comes from and where it leaves.',
    reveal: 'Most of a note leaves at the first open hole — the open hole nearest the mouthpiece — and the open holes just past it. The bell carries the high harmonics, and the lowest notes.',
  },
  setting: {
    ...A05B_PLAN,
    nearA11y: 'An alto player from above, the horn hanging to their right, the bell’s swing hatched round it; a music stand in front, a tenor player on one side and a second alto on the other, the drum kit behind.',
    wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience to the right.', studio: 'The same from above, in a studio room, with a main pair on a tall stand in front of the section; beside each player a headphone mixer on its stand, each wired back to the control room at the room’s edge.' },
    nearLanding: 'Tap anything around the player — or step through ITEM — to see what it means for an alto mic. There is nothing to answer yet.',
    nearIdle: 'The alto hangs on its strap to the player’s right; the bell swings as they move, and the hands never leave the keys. Everything else is a neighbour an alto mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front, and another player’s to the side. Monitors, the PA and a loud band all reach an alto mic.',
    studioIdle: 'No monitors on the floor: each player hears the band on headphones, from a personal mixer beside them. The room — and a main pair, when the alto plays in a section — are part of the picture now.',
    before: saxBefore('alto'),
    hearing: saxHearing,
  },
});
