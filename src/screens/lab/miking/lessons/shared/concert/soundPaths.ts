/**
 * HOW IT SOUNDS — head outlines for Lab 1's concert drums (worklets). A head
 * is drawn as its rest line displaced by an IDEAL membrane shape
 * (engine/physics/membrane.ts): the lowest shape J0(2.405 r) for a pushed
 * head, or the (1,1) "see-saw" J1(3.832 r) for a timpani's pitched shape.
 * The displacement is EXAGGERATED (said on screen once: "motion drawn
 * larger"); the rest line stays drawn by the art underneath.
 *
 *   flat heads (a snare, a timpani, a tambourine): the rest line is y = y0
 *     across u ∈ [c − R, c + R]; displacement is along +y (down).
 *   upright heads (a concert bass drum, a kick): the rest line is x = x0
 *     across v ∈ [−R, R]; displacement is along +x.
 */
import { Skia } from '@shopify/react-native-skia';
import { besselJ } from '../../../../../../features/cymatics/plateModes';
import { lowestProfile } from '../../../engine/physics/membrane.ts';

const N = 48;
/** J0 profile, 1 at the centre (plain numbers: safe in worklets). */
export const PROFILE_01: number[] = Array.from({ length: N + 1 }, (_, i) => lowestProfile(-1 + (2 * i) / N));
/** J1(j11 r)·sign — the (1,1) see-saw across a diameter, peak ±1. */
const J11 = 3.8317;
const P11_PEAK = 0.5819; // max |J1| on [0, j11] (at r ≈ 0.48)
export const PROFILE_11: number[] = Array.from({ length: N + 1 }, (_, i) => {
  const x = -1 + (2 * i) / N;
  return (Math.sign(x) * besselJ(1, J11 * Math.abs(x))) / P11_PEAK;
});

/** A flat head's outline, displaced by `amp` (mm, +y down) in `profile`. */
export function flatHead(cu: number, y0: number, R: number, amp: number, profile: number[]): ReturnType<typeof Skia.Path.Make> {
  'worklet';
  const p = Skia.Path.Make();
  for (let i = 0; i <= N; i++) {
    const u = cu - R + (2 * R * i) / N;
    const y = y0 + amp * profile[i];
    if (i === 0) p.moveTo(u, y);
    else p.lineTo(u, y);
  }
  return p;
}
/** The sliver between a flat head's rest line and its displaced outline. */
export function flatFill(cu: number, y0: number, R: number, amp: number, profile: number[]): ReturnType<typeof Skia.Path.Make> {
  'worklet';
  const p = flatHead(cu, y0, R, amp, profile);
  p.lineTo(cu + R, y0);
  p.lineTo(cu - R, y0);
  p.close();
  return p;
}
/** An upright head's outline (rest line x = x0), displaced along +x. */
export function uprightHead(x0: number, cv: number, R: number, amp: number, profile: number[]): ReturnType<typeof Skia.Path.Make> {
  'worklet';
  const p = Skia.Path.Make();
  for (let i = 0; i <= N; i++) {
    const v = cv - R + (2 * R * i) / N;
    const x = x0 + amp * profile[i];
    if (i === 0) p.moveTo(x, v);
    else p.lineTo(x, v);
  }
  return p;
}
export function uprightFill(x0: number, cv: number, R: number, amp: number, profile: number[]): ReturnType<typeof Skia.Path.Make> {
  'worklet';
  const p = uprightHead(x0, cv, R, amp, profile);
  p.lineTo(x0, cv + R);
  p.lineTo(x0, cv - R);
  p.close();
  return p;
}

export const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};
