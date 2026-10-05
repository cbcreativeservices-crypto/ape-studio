/**
 * C09a VIOLIN / FIDDLE — the look (charter §2 layer 3), drawn only from
 * the shared bowed family: the violin, its bow and sweep, and the player
 * standing or seated (the variant), projected from the same postures the
 * collisions and the zones use. Its own HOW IT SOUNDS and WHERE IT SITS
 * pages, and a face-on portrait for ORIENT.
 */
import type { ReactElement } from 'react';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { bowedHitTest, bowedLabels, makeBowedInstrument, makeBowedPortrait } from '../shared/bowed/BowedArt';
import { makeBowedSoundPage } from '../shared/bowed/BowedSoundPage';
import { makeBowedSettingPage } from '../shared/bowed/BowedSettingPage';
import { partIn } from '../shared/bowed/bowedModel.ts';
import { underChin } from '../shared/bowed/posture.ts';
import { VIOLA } from '../shared/bowed/bowedSpec.ts';
import { SEATED, SPEC, STANDING, VIOLIN_MODEL, VIOLIN_VIEWS } from './geometry.ts';

const POSE = (v: VariantId) => (v === 'seated' ? SEATED : STANDING);
const L = SPEC.string.mm;
const StandInst = makeBowedInstrument(STANDING, VIOLIN_VIEWS, true);
const SeatInst = makeBowedInstrument(SEATED, VIOLIN_VIEWS, true);

function ViolinInstrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return variant === 'seated' ? <SeatInst view={view} variant={variant} /> : <StandInst view={view} variant={variant} />;
}

const LABELS = {
  side: {
    bridge: { du: 60, dv: -60 },
    scroll: { du: 50, dv: -30 },
    bow: { du: 0, dv: -40, align: 'center' as const },
    player: { du: -150, dv: 30, align: 'right' as const },
  },
  top: {
    bridge: { du: 50, dv: 10 },
    scroll: { du: 30, dv: -40 },
    chin: { du: -60, dv: 30, align: 'right' as const },
    sweep: { du: 0, dv: 40, align: 'center' as const },
    player: { du: -120, dv: 0, align: 'right' as const },
  },
};

const VIOLA_P = underChin(VIOLA, 20, true);
const VIOLIN2_P = underChin(SPEC, 0, true);

export const VIOLIN_ART: LessonArt = {
  Instrument: ViolinInstrument,
  labels: (view, variant) => bowedLabels(POSE(variant), view, LABELS, true),
  hitTest: (view, variant, u, v, tol) => {
    const id = bowedHitTest(POSE(variant), view, u, v, tol, true);
    return id ? partIn(VIOLIN_MODEL, id, variant) : null;
  },
  figure: makeBowedPortrait(SPEC, 'A violin seen face-on, lying with its scroll to the right: the arched top with its two f-holes, the bridge, the tailpiece and the chin rest, the fingerboard, the pegs and the scroll, four strings; its bow beneath, tip at the left and the frog at the right.'),
  pages: {
    sound: makeBowedSoundPage({
      spec: SPEC,
      excite: 'bow',
      stringName: 'The open G string',
      hz: SPEC.lowest.hz,
      points: [
        { id: 'bridge', label: 'NEAR BRIDGE', at: 12 / L, blurb: 'About 1 cm from the bridge: the bow drives the high shapes strongly.' },
        { id: 'mid', label: 'USUAL', at: 30 / L, blurb: 'About 3 cm from the bridge, in the middle of the bow’s usual range.' },
        { id: 'board', label: 'TOWARD BOARD', at: 49 / L, blurb: 'About 5 cm from the bridge, toward the fingerboard.' },
        { id: 'over', label: 'OVER BOARD', at: 88 / L, blurb: 'Over the end of the fingerboard: softer, fewer high shapes.' },
      ],
      pointDefault: 'mid',
      subject: 'The violin cut across at the bridge, seen along the strings: the arched top and back, the ribs, the bass bar, the soundpost, the bridge, four strings and the bow',
      shapesNote: 'This is a simplified string. On a real violin the strings are stiff, the ends are not perfectly still, and the body favours some pitches — but the whole-number pattern, and the still points, hold closely.',
      motionNote: 'This is the ideal bowed string. Real bowing adds the bow’s bite, and how hard, how fast and where the player bows changes the tone.',
      silentNote: 'This lab never plays a sound and draws no frequency curve for the violin: how a real violin sounds depends on the instrument, the strings, the bow and the player. The pictures show where the sound comes from and where it leaves.',
      reveal: 'The bow never strikes: it grips the string, lets it slip, and grips it again — once every vibration, for as long as it moves.',
    }),
    setting: makeBowedSettingPage({
      P: STANDING,
      objects: [
        { id: 'violin', kind: 'self', at: { x: 0, z: 0 }, r: 260, label: 'violin', scene: 'all' },
        { id: 'bow', kind: 'self', at: { x: STANDING.bow.frog.x + 120, z: STANDING.bow.frog.z + 120 }, r: 200, label: 'bow', scene: 'kit' },
        { id: 'head', kind: 'self', at: { x: STANDING.player.head.x, z: STANDING.player.head.z }, r: 120, label: 'head', scene: 'kit' },
        { id: 'stand', kind: 'stand', at: { x: 760, z: -520 }, yaw: 170, r: 260, label: 'music stand', short: 'stand', scene: 'kit' },
        { id: 'violin2', kind: 'bowed', posture: VIOLIN2_P, at: { x: 150, z: 1100 }, yaw: 0, r: 380, label: 'violin 2', scene: 'kit' },
        { id: 'viola', kind: 'bowed', posture: VIOLA_P, at: { x: 1200, z: 950 }, yaw: -60, r: 380, label: 'viola', scene: 'kit' },
        { id: 'main', kind: 'pair', at: { x: 2500, z: 300 }, r: 300, label: 'main pair', short: 'main', scene: 'studio' },
      ],
      near: { u0: -1200, u1: 1800, v0: -900, v1: 1500 },
      wide: { u0: -1400, u1: 3200, v0: -1500, v1: 1650 },
      nearA11y: 'A violinist from above: the violin under the chin pointing forward-left, the bow’s sweep hatched across it, a music stand in front, a second violin and a viola beside.',
      wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience to the right.', studio: 'The same from above, in a studio room, with a main pair on a tall stand in front of the group.' },
      nearLanding: 'Tap anything around the violinist — or step through ITEM — to see what it means for a violin mic. There is nothing to answer yet.',
      nearIdle: 'The violin sits under the chin; the bow sweeps out to the player’s right and back over the left shoulder; the head is at the chin rest. Everything else is a neighbour a violin mic will hear.',
      stageIdle: 'Two floor monitors: the player’s own wedge in front, and another player’s to the side. Monitors, the PA and a loud band all reach a violin mic.',
      studioIdle: 'No monitors on the floor. The room — and a main pair, when the violin plays in a group — are part of the picture now.',
      before: [
        { title: 'ASK THE PLAYER FIRST', text: 'Standing or seated, and how do they move? Where does the bow go — long strokes, string crossings, pizzicato? What sound do they want: a classical line with the room, or a separated fiddle in a band? Hear the violin unamplified first, from the low G to the high E, quiet and loud.' },
        { title: 'WORK WITH THE VIOLIN AS IT IS', text: 'The violin is delicate and often valuable, and it is the player’s. Ask before touching it; nothing presses the bridge, the f-hole edges or the varnish, and no clip goes on without their agreement.' },
      ],
      hearing: 'Protect your hearing during soundcheck and on loud stages. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Control monitor levels, and use hearing protection where it is loud.',
    }),
  },
};
