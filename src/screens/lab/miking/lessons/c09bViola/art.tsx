/**
 * C09b VIOLA — the look (charter §2 layer 3), drawn only from the shared
 * bowed family: the viola, its bow and sweep, and the player standing or
 * seated, projected from the same postures the collisions and zones use.
 */
import type { ReactElement } from 'react';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { bowedHitTest, bowedLabels, makeBowedInstrument, makeBowedPortrait } from '../shared/bowed/BowedArt';
import { makeBowedSoundPage } from '../shared/bowed/BowedSoundPage';
import { makeBowedSettingPage } from '../shared/bowed/BowedSettingPage';
import { partIn } from '../shared/bowed/bowedModel.ts';
import { SEATED, SPEC, STANDING, VIOLA_MODEL, VIOLA_VIEWS } from './geometry.ts';
import { C09B_PLAN } from './plan.ts';

const POSE = (v: VariantId) => (v === 'seated' ? SEATED : STANDING);
const L = SPEC.string.mm;
const StandInst = makeBowedInstrument(STANDING, VIOLA_VIEWS, true);
const SeatInst = makeBowedInstrument(SEATED, VIOLA_VIEWS, true);

function ViolaInstrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
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

export const VIOLA_ART: LessonArt = {
  Instrument: ViolaInstrument,
  labels: (view, variant) => bowedLabels(POSE(variant), view, LABELS, true),
  hitTest: (view, variant, u, v, tol) => {
    const id = bowedHitTest(POSE(variant), view, u, v, tol, true);
    return id ? partIn(VIOLA_MODEL, id, variant) : null;
  },
  figure: makeBowedPortrait(SPEC, 'A viola seen face-on, lying with its scroll to the right: the arched top with its two f-holes, the bridge, the tailpiece and the chin rest, the fingerboard, the pegs and the scroll, four strings; its bow beneath.'),
  pages: {
    sound: makeBowedSoundPage({
      spec: SPEC,
      excite: 'bow',
      stringName: 'The open C string',
      hz: SPEC.lowest.hz,
      points: [
        { id: 'bridge', label: 'NEAR BRIDGE', at: 12 / L, blurb: 'About 1 cm from the bridge: the bow drives the high shapes strongly.' },
        { id: 'mid', label: 'USUAL', at: 32 / L, blurb: 'About 3 cm from the bridge, in the middle of the bow’s usual range.' },
        { id: 'board', label: 'TOWARD BOARD', at: 54 / L, blurb: 'About 5.5 cm from the bridge, toward the fingerboard.' },
        { id: 'over', label: 'OVER BOARD', at: 97 / L, blurb: 'Over the end of the fingerboard: softer, fewer high shapes.' },
      ],
      pointDefault: 'mid',
      subject: 'The viola cut across at the bridge, seen along the strings: the arched top and back, the ribs, the bass bar, the soundpost, the bridge, four strings and the bow',
      shapesNote: 'This is a simplified string. On a real viola the strings are stiff, the ends are not perfectly still, and the body favours some pitches — but the whole-number pattern, and the still points, hold closely.',
      motionNote: 'This is the ideal bowed string. Real bowing adds the bow’s bite, and the player’s pressure, speed and bow position change the tone.',
      silentNote: 'This lab never plays a sound and draws no frequency curve for the viola: how a real viola sounds depends on the instrument, the strings, the bow and the player. The pictures show where the sound comes from and where it leaves.',
      reveal: 'The bow never strikes: it grips the string, lets it slip, and grips it again — once every vibration, for as long as it moves.',
    }),
    setting: makeBowedSettingPage({
      ...C09B_PLAN,
      nearA11y: 'A violist from above: the viola under the chin pointing forward-left, the bow’s sweep hatched across it, a music stand in front, a violin on one side and a cello on the other.',
      wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair on a tall stand in front of the group.' },
      nearLanding: 'Tap anything around the violist — or step through ITEM — to see what it means for a viola mic. There is nothing to answer yet.',
      nearIdle: 'The viola sits under the chin; the bow sweeps out to the player’s right; the head is at the chin rest. In a quartet, a violin and a cello sit close on either side.',
      stageIdle: 'Two floor monitors: the player’s own wedge in front, and another player’s to the side. Monitors, the PA and loud neighbours all reach a viola mic.',
      studioIdle: 'No monitors on the floor. Hear the viola in the room first — and a main pair, when it plays in a group.',
      before: [
        { title: 'ASK THE PLAYER FIRST', text: 'Which passage — the low C and the high A, quiet and forceful bows, string changes, pizzicato? Standing or seated, and how do they sway? Where are the chin and shoulder rests? Hear the viola in the room first, and change position before reaching for EQ.' },
        { title: 'WORK WITH THE VIOLA AS IT IS', text: 'The viola is the player’s, and often valuable. Ask before touching it; nothing presses the bridge, the f-hole edges or the varnish, and no clip goes on without their agreement.' },
      ],
      hearing: 'Protect your hearing during soundcheck and on loud stages. NIOSH advises no more than 85 dBA averaged over 8 hours a day, halving the time for every 3 dB above that; the US legal limit (OSHA) is 90 dBA with a 5 dB rule. These are limits for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Keep monitoring at a safe level, turn the system down before moving a live mic, and use hearing protection where it is loud.',
    }),
  },
};
