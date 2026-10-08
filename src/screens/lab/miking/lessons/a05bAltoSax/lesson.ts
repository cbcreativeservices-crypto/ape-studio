/**
 * A05b ALTO SAXOPHONE — the lesson as DATA, on the shared saxophone family
 * (lessons/shared/sax/saxLesson.ts: the pages, the shared checks, the copy).
 * The words come from the owner's lesson (docs/labs/miking/source_text/
 * Alto-Saxophone-Miking-Technique-Research.txt, "L<n>" in COMMENTS only),
 * with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (SX-01 …)
 * applied. Research: docs/labs/miking/alto_sax/SOURCES.md (the family's keys)
 * and GEOMETRY_PROPOSAL.md.
 *
 * What is the alto's own: its bell curves up beside the body (L7), so one mic
 * above the bell hears the holes and the bell together; its lowest note
 * sounds D♭3, about 139 Hz (DPA-TABLE) — well above a wireless pack's 80 Hz
 * cut (SX-06).
 */
import type { Lesson } from '../../engine/model/types.ts';
import { buildSaxLesson, saxSetupTasks, saxWedges } from '../shared/sax/saxLesson.ts';
import { MOUTH_HEIGHT } from '../shared/sax/saxPosture.ts';
import { ALTO_SAX } from './geometry.ts';
import { ALTO_ZONES } from './model.ts';

export const A05B_LESSON: Lesson = buildSaxLesson({
  id: 'A05b',
  pfx: 'as',
  title: 'Alto Saxophone',
  subtitle: 'Above the bell toward the holes, into the bell, near the keys, or a clip',
  F: ALTO_SAX,
  short: 'alto',
  Short: 'Alto',
  zones: ALTO_ZONES,
  use: { worked: 'as.above', live: 'as.above', twoA: 'as.above', twoB: 'as.front', twoBType: 'saxLdc' },
  orient: [
    { title: 'WHAT IT IS', text: 'The alto saxophone, pitched in E♭, is the most common saxophone. A cane reed on the mouthpiece sets the air in a conical brass tube vibrating; the neck joins the body, the bow turns the tube back up, and the bell curves up and forward. Pads on hinged keys open and close the tone holes.', src: 'Y-SAX-MECH3' },
    { title: 'WHERE YOU MEET IT', text: 'Big bands and horn sections, jazz combos, pop, soul and funk, concert bands and saxophone quartets — on stage and in the studio. This lesson covers both.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Lead lines, solos and section parts, with a voice-like range of expression. Ask what the music needs: a natural blend in a good room, a focused lead for a loud stage, or room to move.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About 70 cm tall on its strap. Its lowest note sounds a D♭ near 139 Hz. It hangs from a neck strap beside the player’s right thigh, standing or seated — as this lab draws it.', src: 'DPA-TABLE' },
  ],
  place3: {
    prompt: 'Why can one mic a few centimetres above an alto’s bell hear the holes and the bell together?',
    options: ['The bell curves up beside the body, close to the keys', 'All of the tone holes sit just inside the alto’s bell', 'The bell is the only place the alto’s sound leaves'],
    correct: 'The bell curves up beside the body, close to the keys',
    explain: 'On the curved saxophones the bell turns up beside the body, so a mic above it is near the bell AND looking along the key stack. On the straight soprano that does not work: its bell points away from the body.',
    why: {
      'All of the tone holes sit just inside the alto’s bell': 'The holes run up the body. The bell curving up beside them is what puts both near one mic.',
      'The bell is the only place the alto’s sound leaves': 'Much of each note leaves through the open holes up the body — that is why a spot that hears both helps.',
    },
  },
  mic4: {
    prompt: 'A wireless clip pack cuts below about 80 Hz. The alto’s lowest note sounds near 139 Hz. What follows?',
    options: ['The cut sits well below its lowest note; check the lows anyway', 'It will cut the alto’s lowest notes, so switch it off for good', 'It removes the high harmonics that the bell carries out'],
    correct: 'The cut sits well below its lowest note; check the lows anyway',
    explain: 'The alto’s lowest fundamental, about 139 Hz, is well above an 80 Hz cut, which is there to keep handling noise down. Still listen to the real low line with it in and out.',
    why: {
      'It will cut the alto’s lowest notes, so switch it off for good': 'At about 139 Hz the alto’s lowest note is well above 80 Hz. The cut mostly removes handling noise.',
      'It removes the high harmonics that the bell carries out': 'A low cut removes lows, not highs. The bell’s harmonics are far above 80 Hz.',
    },
  },
  q1: {
    prompt: 'Which way does the alto’s bell point?',
    options: ['Up and forward, curving back up beside the body', 'Down and forward, straight along the line of the body', 'Back toward the player, under the right arm'],
    correct: 'Up and forward, curving back up beside the body',
    explain: 'The alto’s tube turns at the bow, and the bell rises up and forward beside the body — which is why a mic above the bell can hear the holes and the bell together.',
    why: {
      'Down and forward, straight along the line of the body': 'That is the straight soprano. The alto’s bell curves back up at the bow.',
      'Back toward the player, under the right arm': 'The bell opens up and forward, away from the player.',
    },
  },
  setup: (R) => saxSetupTasks('as', 'alto', R),
  neighbours: [
    { id: 'n1', label: 'a tenor beside (the next horn in the section)', short: 'TENOR', note: 'In a section the next horn sits close: a close mic on this alto hears it too — more so from the side. Aim so the neighbour sits off the front of the pattern.', prov: { kind: 'illustrative', reason: 'a typical big-band sax row' }, tag: 'SPILL', scene: 'kit' },
    { id: 'n2', label: 'a second alto on the other side', short: 'ALTO 2', note: 'The other neighbour in the row. Every sax mic in a section hears the horns either side of it.', prov: { kind: 'illustrative', reason: 'a typical big-band sax row' }, tag: 'SPILL', scene: 'kit' },
  ],
  stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and the band is loud. A player steps forward for solos: a closer, aimed mic — or a clip on the bell that moves with the horn — helps against the stage and feedback.',
  studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A little distance can carry the whole horn and the room; in a section, a main pair may carry it already.',
  placementReveal: 'Toward the key stack tends to bring warmth and more key noise; toward the bell, brightness and focus; farther, more of the whole horn and the room. Horns and players vary, so “it depends on this horn” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
  typeNotes: {
    saxDynCard: 'Ideas to try: begin a few centimetres above the bell, aimed at the holes; then move one thing at a time — toward the bell, toward the holes, a little farther — and play low and high notes each time.',
    saxDynSuper: 'The same places as the cardioid dynamic; its tighter pattern hears less of the stage, and its least-sensitive directions sit toward the rear, off to each side.',
    saxLdc: 'Ideas to try: begin about half a metre in front, aimed between the bell and the left-hand keys; in a good room try a little farther, or over the player’s shoulder.',
    saxClip: 'Ideas to try with a clip: keep it on the rim where it is made to go, and change only the capsule’s angle — between the bell and the keys for balance, into the bell for more bite.',
  },
  learnIntro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the part it names — the bell, the tone holes, the space in front. They are starting points, not rules. Move from there and listen: there is no single right answer, and every horn, player and room is different.',
  wedges: saxWedges(MOUTH_HEIGHT.standing, 1250, 160),
  accuracyExtra: 'The alto is drawn about 70 cm tall with a 12 cm bell.',
  contextBoxes: { plan: { u0: -500, u1: 1650, v0: -700, v1: 1000 }, side: { u0: -500, u1: 1650, v0: -350, v1: 1650 } },
});
