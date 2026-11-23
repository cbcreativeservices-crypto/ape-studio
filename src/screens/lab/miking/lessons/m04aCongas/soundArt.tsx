/**
 * M04a CONGAS — HOW IT SOUNDS, drawn: ONE drum of the set — the tumba — cut
 * open down its middle under the family's numbered overlay
 * (shared/handdrums/handSoundArt.tsx). The cut drum is drawn on its own,
 * centered (its place in the set does not matter to how it makes sound). The
 * section follows the elevation's bellied stave outline (art.tsx); the tall
 * shell is SHORTENED (a labelled break) so the head stays large on a phone.
 * The strike lands near the rim, where an open tone is played (WP-CONGA).
 * The page is silent: no recording of any drum is played.
 */
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { HandDrum } from '../shared/handdrums/handDrumModel.ts';
import { HandStrikeSequence, sectionMap, type SectionSpec } from '../shared/handdrums/handSoundArt';
import { shellProfile } from '../shared/handdrums/handDrumArt';
import { BELLY, HEAD_Y, TUMBA } from './model.ts';
import { CONGA_MODEL } from './geometry.ts';

/** The tumba, centered for its own section drawing. */
export const SECTION_DRUM: HandDrum = { ...TUMBA, c: { x: 0, z: 0 } };

function spec(variant: VariantId): SectionSpec {
  return {
    drum: SECTION_DRUM,
    // The same bellied outline as the elevation (art.tsx).
    profile: shellProfile(SECTION_DRUM, BELLY),
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
  return { u0: -SECTION_DRUM.R - 330, u1: SECTION_DRUM.R + 430, v0: HEAD_Y - 330, v1: m(s.floorY) + (s.open ? 40 : 70) };
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
