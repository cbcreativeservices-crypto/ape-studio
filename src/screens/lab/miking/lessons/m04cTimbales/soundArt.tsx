/**
 * M04c TIMBALES — HOW IT SOUNDS, drawn: the 14 in timbale cut open down its
 * middle (a shallow brass shell, open at the bottom) under the family's
 * numbered overlay, struck with a stick.
 */
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import { HandStrikeSequence, type SectionSpec } from '../shared/handdrums/handSoundArt';
import { HEAD_Y, SMALL } from './model.ts';

const SPEC: SectionSpec = {
  drum: SMALL,
  profile: [
    { y: HEAD_Y, r: SMALL.R },
    { y: SMALL.bottomY, r: SMALL.rBottom },
  ],
  wall: 5,
  material: 'brass',
  head: 'film',
  tool: 'stick',
  floorY: 0,
  open: true,
  strikeFrac: 0.55,
};
const BOX = { u0: -SMALL.R - 300, u1: SMALL.R + 400, v0: HEAD_Y - 330, v1: SMALL.bottomY + 170 };

export function TimbaleStrike(p: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  return <HandStrikeSequence {...p} spec={SPEC} box={BOX} words={{ s1: '① THE STICK STRIKES', s2: '② HEAD PUSHED IN', s3: '③ AIR PUSHED DOWN', s4a: '④ FROM THE HEAD', s4b: '④ FROM THE OPEN END' }} />;
}
