/**
 * M05 DJEMBE — HOW IT SOUNDS, drawn: the goblet cut open down its middle (the
 * model's profile) under the family's numbered overlay. Raised, the open foot
 * radiates freely; on the floor it meets the floor.
 */
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import { HandStrikeSequence, type SectionSpec } from '../shared/handdrums/handSoundArt';
import { DJEMBE, HEAD_Y, PROFILE, R, SUPPORT } from './model.ts';

function spec(raised: boolean): SectionSpec {
  return { drum: DJEMBE, profile: PROFILE, wall: 18, material: 'wood', head: 'goat', tool: 'hand', floorY: raised ? SUPPORT : 0, open: raised, strikeFrac: 0.75 };
}
const SPECS = { floor: spec(false), raised: spec(true) };
const BOXES = {
  floor: { u0: -R - 300, u1: R + 420, v0: HEAD_Y - 330, v1: 70 },
  raised: { u0: -R - 300, u1: R + 420, v0: HEAD_Y - 330, v1: SUPPORT + 50 },
};

export function DjembeStrike(p: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const k = p.variant === 'raised' ? 'raised' : 'floor';
  return (
    <HandStrikeSequence
      {...p}
      spec={SPECS[k]}
      box={BOXES[k]}
      words={{ s1: '① THE HAND STRIKES', s2: '② HEAD PUSHED IN', s3: '③ AIR PUSHED DOWN', s4a: '④ FROM THE HEAD', s4b: k === 'raised' ? '④ OUT OF THE FOOT' : '④ AT THE FLOOR' }}
    />
  );
}
