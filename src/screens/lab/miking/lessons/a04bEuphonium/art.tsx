/**
 * A04b EUPHONIUM — the look (charter §2 layer 3), drawn only from the shared
 * low-brass family (lessons/shared/lowbrass): the euphonium on the player's
 * lap, its body and bows, three top valves and the fourth at the side, the
 * bell UP or FRONT, with the seated player and the chair — projected from
 * the same scene the collisions and the zones use. Its own HOW IT SOUNDS and
 * WHERE IT SITS pages.
 */
import type { VariantId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { hitTestScene, makeLowBrassInstrument, makeLowBrassPortrait, placeLabels } from '../shared/lowbrass/LowBrassArt';
import { makeLowBrassSoundPage } from '../shared/lowbrass/LowBrassSoundPage';
import { makeLowBrassSettingPage } from '../shared/lowbrass/LowBrassSettingPage';
import { A04B_PLAN } from './plan.ts';
import { uprightLabels } from '../a04aTuba/art';
import { FRONT, SPEC, UP } from './model.ts';

const sceneOf = (variant: VariantId) => (variant === 'front' ? FRONT : UP);

export const EUPH_ART: LessonArt = {
  Instrument: makeLowBrassInstrument(SPEC),
  labels: (view, variant) => placeLabels(view, uprightLabels(sceneOf(variant), view)),
  hitTest: (view, variant, u, v, tol) => hitTestScene(sceneOf(variant), variant === 'front' ? '.front' : '', view, u, v, tol),
  labelsYieldToMic: true,
  figure: makeLowBrassPortrait(SPEC, 'up', { u0: -480, u1: 720, v0: -1660, v1: 40 }, 'A euphonium player seen from the right side, seated on a chair: the euphonium on the lap, the mouthpiece at the lips, three valves on top under the right hand and a fourth at the side under the left, and the bell rising beside the player’s head, pointing up.'),
  pages: {
    sound: makeLowBrassSoundPage({
      spec: SPEC,
      wall: false,
      subject: 'A euphonium player seen from the right side, the euphonium on the lap',
      shapesNote: 'This is a simplified pipe. The real euphonium is a widening (conical) tube with a large bell, folded up — which gives it its round, full tone. The valves add lengths of tube, which lowers every shape’s pitch together.',
      spreadNote: 'Only the overall brass trend is drawn: the low notes spread nearly all round, the higher overtones go mostly where the bell points — up from an upright bell, forward from a bell-front one. No euphonium-only measurement is drawn.',
      silentNote: 'This lab never plays a sound and draws no frequency curve for the euphonium: how a real euphonium sounds depends on the instrument, the player and the room. The pictures show where the sound comes from and where it goes.',
      reveal: 'Nearly all of the sound leaves from the bell — and a mic “in front of the player” sits in a very different place relative to an upward bell than to a front one. Find the bell first.',
      registers: {
        low: 'The lowest notes spread nearly all round the player.',
        mid: 'In the middle of the range more of the sound follows the bell — up, or to the front.',
        high: 'The upper overtones — the edge of the attacks and the high notes — go mostly where the bell points, in a cone round its axis.',
      },
    }),
    setting: makeLowBrassSettingPage({
      ...A04B_PLAN,
      nearA11y: 'A euphonium player from above: the player on a chair facing right, the euphonium on the lap with its bell beside the head, the player’s space hatched, a music stand in front and a tuba player to the right.',
      wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair in front of the players; beside each player a headphone mixer on its stand, each wired back to the control room at the room’s edge.' },
      nearLanding: 'Tap anything around the euphonium player — or step through ITEM — to see what it means for a euphonium mic. There is nothing to answer yet.',
      nearIdle: 'The euphonium rests on the lap; both hands work valves; the player may rise to stand. Everything else is a neighbour a euphonium mic will hear.',
      stageIdle: 'Two floor monitors: the player’s own in front, another to the side. Monitors, the PA and the band all reach a euphonium mic.',
      studioIdle: 'No monitors on the floor: each player hears the band on headphones, from a personal mixer beside them. The room — and a main pair, when the euphonium plays in a group — are part of the picture now.',
      before: [
        { title: 'IDENTIFY THIS HORN', text: 'Ask for the actual model and see where its bell points: euphoniums and baritones share a pitch, names vary by country, and some bell-front models are informally called baritones. Three valves or four, compensating or not — the mic does not fix the instrument.' },
        { title: 'HEAR THE LINE', text: 'Is it a lyrical melody, an inner part or a low foundation? Ask for quiet and loud phrases, the lowest note the part needs, tongued attacks, legato, the high notes, any mute — and whether the player stands.' },
        { title: 'WORK WITH THE EUPHONIUM AS IT IS', text: 'The euphonium and its finish are the player’s. A clip only if its maker confirms it fits this bell — a trumpet or trombone clip may not — and never tape on the finish.' },
      ],
      hearing: 'Protect your hearing in loud rehearsals and on loud stages. NIOSH advises no more than 85 dBA averaged over 8 hours a day, halving the time for every 3 dB above that; the US legal limit (OSHA) is 90 dBA with a 5 dB rule. These are limits for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Keep levels and time sensible, and use hearing protection.',
    }),
  },
};
