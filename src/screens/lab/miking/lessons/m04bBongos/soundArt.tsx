/**
 * M04b BONGOS — HOW IT SOUNDS, drawn: the hembra cut open down its middle
 * under the family's numbered overlay. A short shell, open at the bottom in
 * both setups (between the knees, or on a stand).
 */
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import { HandStrikeSequence, type SectionSpec } from '../shared/handdrums/handSoundArt';
import { HEAD_Y, HEMBRA } from './model.ts';

const SPEC: SectionSpec = {
  drum: HEMBRA,
  profile: [
    { y: HEAD_Y, r: HEMBRA.R },
    { y: HEMBRA.bottomY, r: HEMBRA.rBottom },
  ],
  wall: 10,
  material: 'wood',
  head: 'rawhide',
  tool: 'hand',
  floorY: 0,
  open: true,
  strikeFrac: 0.72,
};
const BOX = { u0: -HEMBRA.R - 260, u1: HEMBRA.R + 380, v0: HEAD_Y - 260, v1: HEMBRA.bottomY + 170 };

export function BongoStrike(p: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  return <HandStrikeSequence {...p} spec={SPEC} box={BOX} words={{ s1: '① THE FINGERS STRIKE', s2: '② HEAD PUSHED IN', s3: '③ AIR PUSHED DOWN', s4a: '④ FROM THE HEAD', s4b: '④ FROM THE OPEN END' }} />;
}
