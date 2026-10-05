/**
 * A05a SOPRANO SAXOPHONE — the lesson as DATA, on the shared saxophone
 * family (lessons/shared/sax/saxLesson.ts). Words: the owner's lesson
 * (docs/labs/miking/source_text/Soprano-Saxophone-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (SX-01 …) applied. Research: docs/labs/miking/soprano_sax/ and the family
 * keys in alto_sax/SOURCES.md.
 *
 * What is the soprano's own: it is straight and its bell points down and
 * forward (L4, L7 — S-REC / S-LIVE: a mid-body mic will not catch the holes
 * and the bell together); DPA's soprano clip advice (far from the bell =
 * round and warm; in front = bite); its lowest note sounds A♭3, about 208 Hz;
 * the bell cuts in near 2.6 kHz (UNSW-SAX); "2–5 kHz" build-up (L58, sourced
 * after all — SX-08).
 */
import type { Lesson } from '../../engine/model/types.ts';
import { buildSaxLesson, saxSetupTasks, saxWedges } from '../shared/sax/saxLesson.ts';
import { MOUTH_HEIGHT } from '../shared/sax/saxPosture.ts';
import { SOPRANO_SAX } from './geometry.ts';
import { SOPRANO_ZONES } from './model.ts';

export const A05A_LESSON: Lesson = buildSaxLesson({
  id: 'A05a',
  pfx: 'ss',
  title: 'Soprano Saxophone',
  subtitle: 'A straight horn: into the bell, above it toward the holes, or a clip far from the bell',
  F: SOPRANO_SAX,
  short: 'soprano',
  Short: 'Soprano',
  zones: SOPRANO_ZONES,
  use: { worked: 'ss.above', live: 'ss.above', twoA: 'ss.into', twoB: 'ss.front', twoBType: 'roomLdc' },
  orient: [
    { title: 'WHAT IT IS', text: 'The soprano saxophone is the highest of the four common saxophones, pitched in B♭. Most are straight — mouthpiece, neck and body in one line — so its bell points down and forward instead of curving up. A cane reed on the mouthpiece sets the air in its conical brass tube vibrating; keys open and close the tone holes.', src: 'Y-HUB-SAX' },
    { title: 'WHERE YOU MEET IT', text: 'Jazz and pop features, saxophone quartets, big bands (often doubled by an alto player), film and studio sessions. This lesson covers studio recording and live sound.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A bright, singing lead voice that cuts through. Ask what the music needs: a direct, focused line for a loud stage, or a rounder, warmer sound in a quiet room.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About 70 cm long with its mouthpiece. Its lowest note sounds an A♭ near 208 Hz. Some sopranos have a curved neck or even a curved bell; this lab draws the common straight one, held down and forward.', src: 'DPA-TABLE' },
  ],
  place3: {
    prompt: 'Why will a mic at the middle of a soprano’s body not catch the holes and the bell together?',
    options: ['Its bell points down and forward, away from the middle', 'All its tone holes sit at the top, beside the mouthpiece', 'It is too quiet for a mic at the middle of the body'],
    correct: 'Its bell points down and forward, away from the middle',
    explain: 'The soprano is straight: its bell points down and forward, along the body, not up beside it. On the curved saxophones a mic above the bell hears the holes and the bell together; on the soprano the bell faces away from a mid-body mic.',
    why: {
      'All its tone holes sit at the top, beside the mouthpiece': 'Its holes run the length of the body, as on every saxophone. The difference is the bell: it points down and forward, not up.',
      'It is too quiet for a mic at the middle of the body': 'Level is not the issue. The straight bell points away from the middle of the body.',
    },
  },
  mic4: {
    prompt: 'A wireless clip pack cuts below about 80 Hz. The soprano’s lowest note sounds near 208 Hz. What follows?',
    options: ['The cut sits well below its lowest note; check the lows anyway', 'It will cut the soprano’s lowest notes, so switch it off for good', 'It removes the high harmonics that the bell carries out'],
    correct: 'The cut sits well below its lowest note; check the lows anyway',
    explain: 'The soprano’s lowest fundamental, about 208 Hz, is far above an 80 Hz cut, which is there to keep handling noise down. Still listen to the real low line with it in and out.',
    why: {
      'It will cut the soprano’s lowest notes, so switch it off for good': 'At about 208 Hz the soprano’s lowest note is far above 80 Hz. The cut mostly removes handling noise.',
      'It removes the high harmonics that the bell carries out': 'A low cut removes lows, not highs. The bell’s harmonics are far above 80 Hz.',
    },
  },
  q1: {
    prompt: 'Which way does the soprano’s bell point?',
    options: ['Down and forward, straight along the line of the body', 'Up and forward, curving back up beside the body', 'Back toward the player’s side, tucked under the right arm'],
    correct: 'Down and forward, straight along the line of the body',
    explain: 'The common soprano is straight: the bell continues the line of the body, down and forward. (Some have a curved neck or bell — ask, and look.)',
    why: {
      'Up and forward, curving back up beside the body': 'That is the alto, tenor and baritone. The straight soprano’s bell does not curve up.',
      'Back toward the player’s side, tucked under the right arm': 'The bell opens away from the player, down and forward.',
    },
  },
  setup: (R) => saxSetupTasks('ss', 'soprano', R),
  neighbours: [
    { id: 'n1', label: 'an alto beside (a saxophone quartet)', short: 'ALTO', note: 'In a quartet or a section the next horn sits close: a close soprano mic hears it too, more so from the side.', prov: { kind: 'illustrative', reason: 'a typical quartet arc' }, tag: 'SPILL', scene: 'kit' },
    { id: 'n2', label: 'a tenor on the other side', short: 'TENOR', note: 'The other neighbour. Every horn mic in a group hears the horns either side of it.', prov: { kind: 'illustrative', reason: 'a typical quartet arc' }, tag: 'SPILL', scene: 'kit' },
  ],
  stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and the band is loud. A soprano player moves the straight horn a lot: a closer, aimed mic — or a clip on the bell that moves with it — helps against the stage and feedback.',
  studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A little distance can blend the straight bell and the body and make the soprano feel less “inside the bell”.',
  placementReveal: 'Toward the holes tends to bring warmth and more key noise; toward the bell, brightness and edge; farther, more of the whole horn and the room. On the straight soprano the bell and the upper holes sit far apart, so no close spot hears all of it. Each zone’s LISTEN FOR line is an idea to check by ear.',
  typeNotes: {
    instDynCard: 'Ideas to try: begin a few centimetres above the bell, aimed up the body toward the holes; then compare the bell axis and the middle of the key stack, one change at a time, with low and high notes each time.',
    saxDynSuper: 'The same places as the cardioid dynamic; its tighter pattern hears less of the stage, and its least-sensitive directions sit toward the rear, off to each side.',
    roomLdc: 'Ideas to try: begin about half a metre in front, aimed between the bell and the left-hand keys; a little distance blends the straight bell and the body.',
    saxClip: 'Ideas to try with a clip: far from the bell and aimed back at the upper keys for a round, warm sound; in front of the bell for bite.',
  },
  learnIntro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the part it names — the bell, the tone holes, the space in front. They are starting points, not rules. The soprano is straight, so compare more than one: there is no single right answer, and every horn, player and room is different.',
  workedAim: 'Aim it up the body toward the sound holes — the lab counts it while the mic’s axis points into the key stack. On the straight soprano this hears the bell and the lower holes; compare it with the other zones. Distance, height and angle are separate things to try.',
  cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Above the soprano’s bell and aimed up the body, its rear looks down and forward — toward the floor in front, where the wedge is.',
  wedges: saxWedges(MOUTH_HEIGHT.standing, 1250, 60),
  accuracyExtra: 'The soprano is drawn straight, about 74 cm long with its mouthpiece and an 8.5 cm bell.',
  contextBoxes: { plan: { u0: -500, u1: 1650, v0: -700, v1: 900 }, side: { u0: -500, u1: 1650, v0: -350, v1: 1650 } },
});
