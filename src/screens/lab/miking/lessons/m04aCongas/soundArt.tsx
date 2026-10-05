/**
 * M04a CONGAS — HOW IT SOUNDS, drawn: the tumba cut open down its middle
 * under the family's numbered overlay (shared/handdrums/handSoundArt.tsx).
 * The section follows the model's drawing-default taper (model.ts); the tall
 * shell is SHORTENED (a labelled break) so the head stays large on a phone.
 * The strike lands near the rim, where an open tone is played (WP-CONGA).
 */
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import { HandStrikeSequence, sectionMap, type SectionSpec } from '../shared/handdrums/handSoundArt';
import { HEAD_Y, TUMBA } from './model.ts';
import { CONGA_MODEL } from './geometry.ts';

function spec(variant: VariantId): SectionSpec {
  return {
    drum: TUMBA,
    profile: [
      { y: HEAD_Y, r: TUMBA.R },
      { y: 0, r: TUMBA.rBottom },
    ],
    wall: 14,
    material: 'wood',
    head: 'rawhide',
    tool: 'hand',
    floorY: CONGA_MODEL.floorByVariant?.[variant] ?? 0,
    open: variant === 'raised',
    strikeFrac: 0.72,
    shorten: { y0: HEAD_Y + 240, y1: -190, gap: 70 },
  };
}
const SPECS = { floor: spec('floor'), raised: spec('raised') };
function boxOf(s: SectionSpec) {
  const m = sectionMap(s);
  return { u0: -TUMBA.R - 330, u1: TUMBA.R + 430, v0: HEAD_Y - 330, v1: m(s.floorY) + (s.open ? 40 : 70) };
}
const BOXES = { floor: boxOf(SPECS.floor), raised: boxOf(SPECS.raised) };

export function CongaStrike(p: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const k = p.variant === 'raised' ? 'raised' : 'floor';
  return (
    <HandStrikeSequence
      {...p}
      spec={SPECS[k]}
      box={BOXES[k]}
      words={{ s1: '① THE HAND STRIKES', s2: '② HEAD PUSHED IN', s3: '③ AIR PUSHED DOWN', s4a: '④ FROM THE HEAD', s4b: k === 'raised' ? '④ FROM THE LOWER END' : '④ AT THE FLOOR' }}
    />
  );
}
