/**
 * FIGURE V2 — A STANDING PERSON FROM THE FRONT, FOR SCALE (wave 7 of D78,
 * 2026-11-24): the approved front view (figureV2/FigureV2Front.tsx,
 * PersonFrontV2 on its standing pose, read only — not edited here), placed by
 * the feet and drawn at the height the screen's drawing already used (an adult
 * of 1755 mm in Foundations, 1.75 m in Wave Physics), so every proportion the
 * learner compares (a wavelength, a speaker, an ear's height) stays the same.
 * Skia only (the Skia labs: Foundations, Wave Physics).
 */
import { memo } from 'react';
import { Group } from '@shopify/react-native-skia';
import { FRONT_STANDING } from '../../screens/lab/miking/lessons/shared/figureV2/frontPlan.ts';
import { PersonFrontV2, personFrontPlan } from '../../screens/lab/miking/lessons/shared/figureV2/FigureV2Front';
import { FigureScale, useFigureScale } from '../../screens/lab/miking/lessons/shared/figureV2/detail';
import type { CastMember } from '../../screens/lab/miking/lessons/shared/figureV2/cast';

/** The standing front figure's crown (the top of the hair) and floor, mm in its own frame. */
const extents = new Map<string, { top: number; floor: number }>();
export function frontExtents(who: CastMember): { top: number; floor: number } {
  const hit = extents.get(who.id);
  if (hit) return hit;
  // (Ensembles3: /elsewhere-front painted blank — a plan whose head lacked a hair outline gave Math.min() of nothing,
  // NaN, and a NaN scale drew nothing) the crown from whatever outlines the head has, never NaN
  const F = personFrontPlan(FRONT_STANDING, who);
  const vs = [...(F.head?.skull ?? []), ...(F.head?.hair ?? [])].map((p) => p.v).filter((v) => Number.isFinite(v));
  const floor = FRONT_STANDING.floor ?? 1550;
  const top = vs.length ? Math.min(...vs) : floor - 1755;
  const out = { top, floor };
  extents.set(who.id, out);
  return out;
}

/** A cast member standing, from the front, the feet's center at (`cx`, `floorY`), drawn `heightMm` tall
 *  (crown to floor) at `pxPerMm` caller units per mm. */
export const PersonStandingFrontAt = memo(function PersonStandingFrontAt({ cx, floorY, pxPerMm, who, heightMm = 1755, dim = 1 }: { cx: number; floorY: number; pxPerMm: number; who: CastMember; heightMm?: number; dim?: number }) {
  const e = frontExtents(who);
  const k = (heightMm / (e.floor - e.top)) * pxPerMm;
  // (the detail level from the real size on the screen: inside a picture that already declares its scale, that
  // scale times this one — never this one alone, which read a study's 1 unit/mm as 1 pt/mm)
  const parent = useFigureScale().ptPerMm;
  const pt = parent ? parent * k : k;
  return (
    <Group transform={[{ translateX: cx }, { translateY: floorY }, { scale: k }, { translateY: -e.floor }]}>
      <FigureScale ptPerMm={pt}>
        <PersonFrontV2 pose={FRONT_STANDING} who={who} dim={dim} />
      </FigureScale>
    </Group>
  );
});
