/**
 * A04a TUBA — the look (charter §2 layer 3), drawn only from the shared
 * low-brass family (lessons/shared/lowbrass): the tuba on the player's lap,
 * its body and bows, four pistons under the right hand, and the bell UP or
 * FRONT, with the seated player and the chair — projected from the same
 * scene the collisions and the zones use. Its own HOW IT SOUNDS (the air
 * column, where the bell sends the sound) and WHERE IT SITS pages.
 */
import type { VariantId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { hitTestScene, makeLowBrassInstrument, makeLowBrassPortrait, placeLabels, type LabelSpot } from '../shared/lowbrass/LowBrassArt';
import { makeLowBrassSoundPage } from '../shared/lowbrass/LowBrassSoundPage';
import { makeLowBrassSettingPage } from '../shared/lowbrass/LowBrassSettingPage';
import type { BrassScene } from '../shared/lowbrass/lowBrassScene.ts';
import { EUPH } from '../shared/lowbrass/lowBrassSpec.ts';
import { FRONT, SPEC, UP } from './model.ts';

/** The labels for one orientation (off the instrument, with leaders). */
export function uprightLabels(s: BrassScene, view: 'side' | 'top'): LabelSpot[] {
  const up = s.orient === 'up';
  const valvesAt = s.valves[1].c;
  // The leader for the body goes to the bottom bow as drawn.
  const bow = s.tubes.find((t) => t.id === 'bowArt') ?? s.tubes.find((t) => t.id === 'bottomBow')!;
  // The leader goes to the 3rd valve slide's crook (the longest loop drawn
  // out of the valve block), where the slides read best from either view.
  const v3 = s.tubes.find((t) => t.id === 'vslide3');
  const slideAt = v3 ? v3.pts[Math.floor(v3.pts.length / 2)] : s.tubes.find((t) => t.id === 'slide1')!.pts[3];
  if (view === 'side') {
    return [
      { id: 'bell', text: up ? 'BELL — POINTS UP' : 'BELL — FACES FRONT', short: 'BELL', at: s.bell.rim, du: up ? 330 : 120, dv: up ? -60 : -s.bell.R - 120, align: 'left', alts: [{ du: -300, dv: -80, align: 'right' }] },
      { id: 'valves', text: 'PISTON VALVES', short: 'VALVES', at: valvesAt, du: 260, dv: -40, align: 'left' },
      { id: 'body', text: 'BODY AND BOWS', short: 'BODY', at: bow.pts[Math.floor(bow.pts.length / 2)], du: 330, dv: 120, align: 'left' },
      { id: 'mouth', text: 'MOUTHPIECE', at: s.J.mouth, du: -150, dv: -170, align: 'right' },
      { id: 'slides', text: 'TUNING SLIDES', short: 'SLIDES', at: slideAt, du: 110, dv: 70, align: 'left' },
    ];
  }
  return [
    { id: 'bell', text: up ? 'BELL — POINTS UP' : 'BELL — FACES FRONT', short: 'BELL', at: s.bell.rim, du: up ? 300 : 120, dv: up ? 240 : 300, align: 'left' },
    { id: 'valves', text: 'PISTON VALVES', short: 'VALVES', at: valvesAt, du: 260, dv: -150, align: 'left' },
    { id: 'mouth', text: 'MOUTHPIECE', at: s.J.mouth, du: -150, dv: -230, align: 'right' },
  ];
}

const sceneOf = (variant: VariantId) => (variant === 'front' ? FRONT : UP);

export const TUBA_ART: LessonArt = {
  Instrument: makeLowBrassInstrument(SPEC),
  labels: (view, variant) => placeLabels(view, uprightLabels(sceneOf(variant), view)),
  hitTest: (view, variant, u, v, tol) => hitTestScene(sceneOf(variant), variant === 'front' ? '.front' : '', view, u, v, tol),
  labelsYieldToMic: true,
  figure: makeLowBrassPortrait(SPEC, 'up', { u0: -480, u1: 760, v0: -1820, v1: 40 }, 'A tuba player seen from the right side, seated on a chair: the tuba’s large body resting on the lap and leaning against the chest, the mouthpiece at the lips, four piston valves under the right hand, and the wide bell rising beside the player’s head, pointing up.'),
  pages: {
    sound: makeLowBrassSoundPage({
      spec: SPEC,
      wall: false,
      subject: 'A tuba player seen from the right side, the tuba on the lap',
      shapesNote: 'This is a simplified pipe. The real tuba is a long, widening (conical) tube with a large bell, folded up — the folding changes nothing about the air inside. The valves add lengths of tube, which lowers every shape’s pitch together.',
      spreadNote: 'Only the overall trend is drawn: the low notes spread nearly all round — a little weaker on the side away from the bell — and the higher overtones go mostly where the bell points. An upward bell sends them to the ceiling; a front bell, toward the audience and the mics.',
      silentNote: 'This lab never plays a sound and draws no frequency curve for the tuba: how a real tuba sounds depends on the tuba, the player and the room. The pictures show where the sound comes from and where it goes.',
      reveal: 'Nearly all of the sound leaves from the bell — and where the bell points decides where the overtones go. That is why a tuba’s bell direction comes first when you plan a mic.',
      registers: {
        low: 'The lowest notes — the tuba’s home — spread nearly all round the player, only a little weaker on the side away from the bell.',
        mid: 'Higher up, more of the sound follows the bell: the space the bell faces gets more than the space behind it.',
        high: 'The upper overtones — the attacks and the edge that make a low note easy to follow — go mostly where the bell points, in a cone round its axis.',
      },
    }),
    setting: makeLowBrassSettingPage({
      spec: SPEC,
      objects: [
        { id: 'tuba', kind: 'self', at: { x: 0, z: 0 }, r: 420, label: 'tuba', scene: 'all' },
        { id: 'stand', kind: 'stand', at: { x: 760, z: -150 }, r: 250, label: 'music stand', short: 'stand', scene: 'kit' },
        { id: 'euph', kind: 'brass', spec: EUPH, orient: 'up', at: { x: 60, z: -1150 }, r: 480, label: 'euphonium beside', short: 'euphonium', scene: 'kit' },
        { id: 'main', kind: 'pair', at: { x: 2500, z: 0 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
      ],
      near: { u0: -1300, u1: 1400, v0: -1800, v1: 1500 },
      wide: { u0: -1500, u1: 3100, v0: -2200, v1: 2000 },
      nearA11y: 'A tuba player from above: the player on a chair facing right, the tuba on the lap with its wide bell beside the head, the player’s space hatched, a music stand in front and a euphonium player to the left.',
      wideA11y: { stage: 'The same from above, on a stage: the tuba player’s wedge in front, another wedge to the side, the audience to the right.', studio: 'The same from above, in a studio room, with a main pair in front of the players.' },
      nearLanding: 'Tap anything around the tuba player — or step through ITEM — to see what it means for a tuba mic. There is nothing to answer yet.',
      nearIdle: 'The tuba rests on the lap; the right hand works the valves; the bell sways a little as the player breathes. Everything else is a neighbour a tuba mic will hear.',
      stageIdle: 'Two floor monitors and a PA with subwoofers: their low end reaches an open tuba mic too — check it with the player silent.',
      studioIdle: 'No monitors on the floor. The room — and a main pair, when the tuba plays in a group — are part of the picture now.',
      before: [
        { title: 'FIND THE BELL FIRST', text: '“Tuba” is not one shape: ask the player which tuba this is, where its bell points while playing — up, front or back — and whether they use a stand or support. Then hear a low held note, the lowest note actually written, short notes and a loud phrase.' },
        { title: 'WORK WITH THE TUBA AS IT IS', text: 'The tuba is heavy and its slides bend easily. Never use a slide as a handle or a mic mount, and let the player manage the horn while any hardware goes near it. A bell clip only if its maker confirms it fits this bell.' },
        { title: 'DO NOT SET A FILTER FROM THE WORD “TUBA”', text: 'A low-cut filter can thin the lowest written note and its harmonics. Choose any filter with the part playing — not from a table.' },
      ],
      hearing: 'Protect your hearing in loud rehearsals and on loud stages. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Keep levels and time sensible, and use hearing protection.',
    }),
  },
};
