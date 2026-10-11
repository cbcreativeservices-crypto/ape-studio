/**
 * C09c CELLO — the look (charter §2 layer 3), drawn only from the shared
 * bowed family (lessons/shared/bowed): the cello, its bow and sweep, the
 * seated cellist and the chair, projected from the same posture the
 * collisions and the zones use. Its own HOW IT SOUNDS and WHERE IT SITS
 * pages (the drum pages do not fit a string).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { bowedHitTest, bowedLabels, makeBowedInstrument, makeBowedPortrait } from '../shared/bowed/BowedArt';
import { makeBowedSoundPage } from '../shared/bowed/BowedSoundPage';
import { makeBowedSettingPage } from '../shared/bowed/BowedSettingPage';
import { underChin } from '../shared/bowed/posture.ts';
import { VIOLA, VIOLIN } from '../shared/bowed/bowedSpec.ts';
import { CELLO_VIEWS } from './geometry.ts';
import { POSTURE, SPEC } from './model.ts';

const P = POSTURE;
const L = SPEC.string.mm;

const LABELS = {
  side: {
    bridge: { du: 70, dv: -30 },
    fb: { du: 90, dv: -30 },
    // No SCROLL here: seated tall, the cellist's head hides the scroll from
    // the player's right (owner 2026-10-10) — it stays named from above.
    tail: { du: 90, dv: 30 },
    endpin: { du: 40, dv: -60 },
    player: { du: -140, dv: 60, align: 'right' as const },
  },
  top: {
    bridge: { du: 60, dv: -20 },
    fhole: { du: 60, dv: 40 },
    scroll: { du: -60, dv: -40, align: 'right' as const },
    bow: { du: 0, dv: -40, align: 'center' as const },
    sweep: { du: 0, dv: -60, align: 'center' as const },
    player: { du: -40, dv: 0, align: 'right' as const },
  },
};

/** Neighbours on the plan: a viola and a violin of the same family, a stand. */
const VIOLA_P = underChin(VIOLA, 20);
const VIOLIN_P = underChin(VIOLIN);

export const CELLO_ART: LessonArt = {
  Instrument: makeBowedInstrument(P, CELLO_VIEWS, true),
  labels: (view) => bowedLabels(P, view, LABELS, true),
  hitTest: (view, _v, u, v, tol) => bowedHitTest(P, view, u, v, tol, true),
  figure: makeBowedPortrait(SPEC, 'A cello seen face-on, lying with its scroll to the right: the arched top with its two f-holes, the bridge, the tailpiece and the endpin, the fingerboard, the pegs and the scroll, four strings; its bow beneath, tip at the left and the frog at the right.'),
  pages: {
    sound: makeBowedSoundPage({
      spec: SPEC,
      excite: 'bow',
      stringName: 'The open C string',
      hz: SPEC.lowest.hz,
      points: [
        { id: 'bridge', label: 'NEAR BRIDGE', at: 20 / L, blurb: 'About 2 cm from the bridge: the bow drives the high shapes strongly.' },
        { id: 'mid', label: 'USUAL', at: 55 / L, blurb: 'About 5.5 cm from the bridge, in the middle of the bow’s usual range.' },
        { id: 'board', label: 'TOWARD BOARD', at: 100 / L, blurb: 'About 10 cm from the bridge, toward the fingerboard.' },
        { id: 'over', label: 'OVER BOARD', at: 180 / L, blurb: 'Over the end of the fingerboard: softer, fewer high shapes.' },
      ],
      pointDefault: 'mid',
      subject: 'The cello cut across at the bridge, seen along the strings: the arched top and back, the ribs, the bass bar, the soundpost, the bridge, four strings and the bow',
      shapesNote: 'This is a simplified string. On a real cello the strings are stiff, the ends are not perfectly still, and the body favours some pitches — but the whole-number pattern, and the still points, hold closely.',
      motionNote: 'This is the ideal bowed string. Real bowing adds a little roughness — the bow’s bite — and how hard and how fast the cellist bows changes the tone.',
      silentNote: 'This lab never plays a sound and draws no frequency curve for the cello: how a real cello sounds depends on the instrument, the strings, the bow and the player. The pictures show where the sound comes from and where it leaves.',
      reveal: 'The bow never strikes: it grips the string, lets it slip, and grips it again — once every vibration, for as long as it moves.',
    }),
    setting: makeBowedSettingPage({
      P,
      objects: [
        { id: 'cello', kind: 'self', at: { x: 0, z: 0 }, r: 300, label: 'cello', scene: 'all' },
        { id: 'bow', kind: 'self', at: { x: P.bow.frog.x, z: P.bow.frog.z }, r: 160, label: 'bow', scene: 'kit' },
        { id: 'endpin', kind: 'self', at: { x: P.endpinTip!.x, z: P.endpinTip!.z }, r: 140, label: 'endpin', scene: 'kit' },
        { id: 'stand', kind: 'stand', at: { x: 760, z: -420 }, yaw: 160, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
        { id: 'viola', kind: 'bowed', posture: VIOLA_P, at: { x: 250, z: 900 }, yaw: -40, r: 380, label: 'viola', scene: 'kit' },
        { id: 'violin', kind: 'bowed', posture: VIOLIN_P, at: { x: 1250, z: 700 }, yaw: -95, r: 380, label: 'violin', scene: 'kit' },
        { id: 'main', kind: 'pair', at: { x: 2500, z: 350 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
      ],
      near: { u0: -1300, u1: 1800, v0: -900, v1: 1300 },
      wide: { u0: -1400, u1: 3200, v0: -1500, v1: 1650 },
      nearA11y: 'A cello quartet seat from above: the cellist on a chair with the cello in front, the bow’s sweep hatched, a music stand in front, a viola and a violin beside.',
      wideA11y: { stage: 'The same from above, on a stage: the cellist’s wedge in front, another wedge to the side, the audience to the right.', studio: 'The same from above, in a studio room, with a main pair on a tall stand in front of the group.' },
      nearLanding: 'Tap anything around the cellist — or step through ITEM — to see what it means for a cello mic. There is nothing to answer yet.',
      nearIdle: 'The cellist sits behind the cello; the bow sweeps out to both sides; the endpin, the chair and the feet share the floor. Everything else is a neighbour a cello mic will hear.',
      stageIdle: 'Two floor monitors: the cellist’s own wedge in front, and another player’s to the side. Monitors, the PA and loud neighbours all reach a cello mic — and the cello’s body reflects them.',
      studioIdle: 'No monitors on the floor. The room — and a main pair, when the cello plays in a group — are part of the picture now.',
      before: [
        { title: 'ASK THE PLAYER FIRST', text: 'How do they sit and sway? Where does the bow go — long strokes, string crossings, pizzicato? What sound do they want: a full body, more bow, more room? Hear the cello unamplified in the room first, from the low C to the high A.' },
        { title: 'WORK WITH THE CELLO AS IT IS', text: 'The cello is valuable and delicate, and it is the cellist’s. Ask before touching it; nothing presses the bridge, the top, the f-holes or the varnish, and no clip goes on without their agreement.' },
      ],
      hearing: 'Protect your hearing during soundcheck and on loud stages. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Turn monitors down before moving a mic near a player, keep levels sensible, and use hearing protection.',
    }),
  },
};
