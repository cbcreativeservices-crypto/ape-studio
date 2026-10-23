/**
 * A03 FRENCH HORN — the look (charter §2 layer 3), drawn only from the shared
 * low-brass family (lessons/shared/lowbrass): the horn, its coil, rotary
 * valves and rear-facing bell with the right hand inside it, the seated
 * player and the chair — projected from the same scene the collisions and
 * the zones use. Its own HOW IT SOUNDS (the bell and the wall behind) and
 * WHERE IT SITS pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { hitTestScene, makeLowBrassInstrument, makeLowBrassPortrait, placeLabels, type LabelSpot } from '../shared/lowbrass/LowBrassArt';
import { makeLowBrassSoundPage } from '../shared/lowbrass/LowBrassSoundPage';
import { makeLowBrassSettingPage } from '../shared/lowbrass/LowBrassSettingPage';
import { A03_PLAN } from './plan.ts';
import { SCENE, SPEC } from './model.ts';

const S = SCENE;
const valvesAt = S.valves[1].c;
const slideAt = S.tubes.find((t) => t.id === 'slide1')!.pts[3];

// (Art fix 2026-10-16: the horn now sits forward with its bell beside the
// thigh — each label stands clear of the player, its leader short.)
const SIDE: LabelSpot[] = [
  { id: 'bell', text: 'BELL — POINTS BACK', short: 'BELL', at: S.bell.rim, du: -430, dv: 30, align: 'right', alts: [{ du: -400, dv: 480, align: 'right' }] },
  { id: 'hand', text: 'RIGHT HAND IN THE BELL', short: 'HAND', at: S.bellHand!.tip, du: 280, dv: 380, align: 'left', alts: [{ du: 320, dv: 250, align: 'left' }] },
  { id: 'coil', text: 'COILED TUBE', short: 'COIL', at: S.centre, du: 330, dv: 155, align: 'left' },
  { id: 'valves', text: 'ROTARY VALVES', short: 'VALVES', at: valvesAt, du: 300, dv: 40, align: 'left' },
  { id: 'mouth', text: 'MOUTHPIECE', at: S.J.mouth, du: 110, dv: -230, align: 'left' },
  { id: 'slides', text: 'TUNING SLIDES', short: 'SLIDES', at: slideAt, du: 230, dv: 80, align: 'left' },
];
const TOP: LabelSpot[] = [
  { id: 'bell', text: 'BELL — POINTS BACK', short: 'BELL', at: S.bell.rim, du: -260, dv: 330, align: 'right' },
  { id: 'hand', text: 'RIGHT HAND IN THE BELL', short: 'HAND', at: S.bellHand!.tip, du: 300, dv: 260, align: 'left' },
  { id: 'coil', text: 'COILED TUBE', short: 'COIL', at: S.centre, du: 300, dv: 200, align: 'left' },
  { id: 'valves', text: 'ROTARY VALVES', short: 'VALVES', at: valvesAt, du: 260, dv: -60, align: 'left' },
  { id: 'mouth', text: 'MOUTHPIECE', at: S.J.mouth, du: 230, dv: -200, align: 'left' },
];

export const HORN_ART: LessonArt = {
  Instrument: makeLowBrassInstrument(SPEC),
  labels: (view) => placeLabels(view, view === 'side' ? SIDE : TOP),
  hitTest: (view, _v, u, v, tol) => hitTestScene(S, '', view, u, v, tol),
  labelsYieldToMic: true,
  figure: makeLowBrassPortrait(SPEC, 'back', { u0: -520, u1: 620, v0: -1360, v1: 40 }, 'A horn player seen from the right side, seated on a chair: the horn’s round coil of tubing in front of the right side of the chest, the mouthpiece at the lips, four rotary valves under the left hand, and the flared bell beside the right thigh, pointing back, with the right hand inside it.'),
  pages: {
    sound: makeLowBrassSoundPage({
      spec: SPEC,
      wall: true,
      subject: 'A horn player seen from the right side, the bell beside the right thigh pointing back, a wall behind the player',
      shapesNote: 'This is a simplified pipe. The real horn is a long, narrow, mostly conical tube with a flaring bell, coiled up — the coiling changes nothing about the air inside. The right hand in the bell changes the shapes a little too: that is how it shades the pitch and the tone.',
      spreadNote: 'Only the overall trend is drawn: low notes spread all round, the higher overtones go mostly where the bell points — behind the player. A listener in front hears the horn largely by way of the room; behind the bell it sounds more forceful. Rooms differ: walk to both places and listen before placing a mic.',
      silentNote: 'This lab never plays a sound and draws no frequency curve for the horn: how a real horn sounds depends on the horn, the player’s hand and the room. The pictures show where the sound comes from and where it goes.',
      reveal: 'The bell points behind the player, so the room — the wall or shell behind — is part of what a listener in front hears. That is why the front and the back of a horn sound so different.',
      registers: {
        low: 'The lowest notes spread nearly all round the player — the bell’s direction matters least here.',
        mid: 'In the middle of the range the bell’s direction starts to show: more of the sound goes back and out than forward.',
        high: 'The high overtones — the edge and the brilliance — go mostly where the bell points: behind the player. In front, they arrive mainly by way of the wall.',
      },
    }),
    setting: makeLowBrassSettingPage({
      ...A03_PLAN,
      nearA11y: 'A horn player from above: the player on a chair facing right, the horn’s bell beside the right thigh pointing back toward a wall, the player’s space hatched, a music stand in front, a second horn to the player’s left and a low-brass player to the right.',
      wideA11y: { stage: 'The same from above, on a stage: the horn player’s wedge in front, a side-fill behind them, off to one side, the wall behind, the audience below.', studio: 'The same from above, in a studio room: a piano to the front left and a main pair in front of the horn; beside each player a headphone mixer on its stand, each wired back to the control room at the room’s edge.' },
      nearLanding: 'Tap anything around the horn player — or step through ITEM — to see what it means for a horn mic. There is nothing to answer yet.',
      nearIdle: 'The bell points back toward the wall; the right hand is in it; the bell may rise for “bells up”. Everything else is a neighbour a horn mic will hear — or a surface that sends the horn on.',
      stageIdle: 'A wedge in front faces the player; a side-fill behind faces across the stage. A mic behind the horn sits between the bell and that fill.',
      studioIdle: 'No monitors: each player hears the band on headphones, from a personal mixer beside them. The room — and, for a recital, the piano and a main pair — are the picture now.',
      before: [
        { title: 'ASK THE PLAYER FIRST', text: 'Ask for a soft phrase, the strongest real accent, a wide-range phrase, and any stopped, muted or “bells up” passages — and let the player show them. Never move their hand or their horn to suit a mic.' },
        { title: 'LISTEN FROM BOTH SIDES', text: 'Walk to an audience seat in front, then to a safe spot behind and beside the bell. The difference you hear — softer and blended in front, more forceful behind — is the choice the mics will make.' },
        { title: 'WORK WITH THE HORN AS IT IS', text: 'The horn and its finish are the player’s. Nothing clamps the detachable bell joint, the valve linkage or where the hand goes; a clip only if its maker confirms it fits this horn, and only with the player’s agreement.' },
      ],
      hearing: 'Protect your hearing in loud rehearsals and on loud stages. NIOSH advises no more than 85 dBA averaged over 8 hours a day, halving the time for every 3 dB above that; the US legal limit (OSHA) is 90 dBA with a 5 dB rule. These are limits for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Standing right behind a horn bell is loud: keep your time there short, and use hearing protection.',
    }),
  },
};

