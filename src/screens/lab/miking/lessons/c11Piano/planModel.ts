/**
 * C11 PIANO — the setting page's plans (PStagePlan draws them), pure so the
 * plans' overlap test reads the same numbers (planCases/pstage.ts).
 *
 * Frame K from above: u = x away from the pianist, v = z toward the treble;
 * the audience is toward +v (a grand's curved side faces it). Positions are
 * ILLUSTRATIVE (a typical layout).
 *
 * Collision pass 2026-10-15:
 *  - the singer faces the audience, their vocal mic in front, and their own
 *    floor wedge (the lesson's wedge.vocal, never drawn before) downstage of
 *    them, facing upstage;
 *  - the band's riser stays inside the plan (and, at an upright, on the
 *    pianist's side of the wall behind the piano, upstage);
 *  - the PA stands at the audience edge, facing the audience; the
 *    AUDIENCE words keep clear of the side-fill's;
 *  - STUDIO: the room's words sit on open floor (not on the wall); the
 *    upright's room wall IS the wall behind it; its outside pair stands
 *    beside the bass end, not over the piano's back; no wedges — a personal
 *    headphone mixer for the pianist and for the singer, fed from the
 *    CONTROL ROOM on the room's left wall.
 */
import type { VariantId, ViewBox } from '../../engine/model/types.ts';
import { foot, type PlanFoot, type PlanRect } from '../shared/planFoot.ts';
import { cueFootprints, type CueRig } from '../shared/monitoring/cueMix.ts';
import { roomOfBox, stringPlanFoots, type PlanScene, type PlanSpot } from '../shared/strings/pstagePlanModel.ts';
import { pianistAt } from '../shared/piano/pianoSpec.ts';
import { GB, GS, SETUP, UP, type PianoVariant } from './model.ts';
import { PIANIST_AT } from './geometry.ts';

type Grand = typeof GB;
export const pianoSetupOf = (v: VariantId) => SETUP[(v as PianoVariant) in SETUP ? (v as PianoVariant) : 'grand'];
export const isGrandPlan = (v: VariantId) => pianoSetupOf(v).kind === 'grand';
export const grandOf = (v: VariantId): Grand => {
  const s = pianoSetupOf(v);
  return s.kind === 'grand' && s.id === 'S' ? GS : GB;
};

export const grandNear = (g: Grand): ViewBox => ({ u0: -1250, u1: g.xTail + 900, v0: -1100, v1: 1800 });
export const grandWide = (g: Grand): ViewBox => ({ u0: -1700, u1: g.xTail + 2400, v0: -1900, v1: 2900 });
export const UP_NEAR: ViewBox = { u0: -1500, u1: 1100, v0: -1300, v1: 1950 };
export const UP_WIDE: ViewBox = { u0: -2700, u1: 1000, v0: -2500, v1: 3000 };

/** The upright's wall (UprightPlan: 60 thick, hatched to +120, ±1100). */
export const UP_WALL = { u0: UP.wallX, u1: UP.wallX + 120, v0: -1100, v1: 1100 } as const;

export function pianoBoxes(v: VariantId): { near: ViewBox; wide: ViewBox } {
  return isGrandPlan(v) ? { near: grandNear(grandOf(v)), wide: grandWide(grandOf(v)) } : { near: UP_NEAR, wide: UP_WIDE };
}
/** The stage's wide plan reaches past the deck's edge for the AUDIENCE word. */
export function pianoWideStage(v: VariantId): ViewBox {
  const w = pianoBoxes(v).wide;
  return { ...w, v1: w.v1 + (isGrandPlan(v) ? 450 : 500) };
}

/** The studio room's inner wall faces. At an upright the wall behind the
 *  piano is the room's own wall. */
export function pianoRoom(v: VariantId): PlanRect {
  const r = roomOfBox(pianoBoxes(v).wide);
  return isGrandPlan(v) ? r : { ...r, u1: UP.wallX };
}

export function pianoAudience(v: VariantId) {
  // the stage's downstage edge (dashed) just in front of the PA pair; the
  // house beyond it is an off-plan direction (owner 2026-10-15)
  return isGrandPlan(v)
    ? { text: 'AUDIENCE ↓ (THE CURVED SIDE)', u: grandOf(v).xTail - 600, v: 2900, align: 'center' as const, lip: { axis: 'v' as const, at: 2560 } }
    : // (under the left PA, so the vocal wedge's name has the space under the wedge: lab art fix 2026-10-16)
      { text: 'AUDIENCE ↓', u: -2000, v: 3200, align: 'center' as const, lip: { axis: 'v' as const, at: 2860 } };
}

/** The singer (a near item, so on every plan): beside the piano, facing the
 *  audience. */
export function singerAt(v: VariantId) {
  return isGrandPlan(v) ? { u: -150, v: grandOf(v).hw + 480 } : { u: -700, v: UP.hw + 600 };
}

export function grandSpots(g: Grand): PlanSpot[] {
  const s = { u: -150, v: g.hw + 480 };
  return [
    { item: 'bench', glyph: 'none', x: PIANIST_AT.grand.xKey - 450, z: 0, scene: 'all', r: 330, label: { du: 0, dv: 470 } },
    { item: 'desk', glyph: 'none', x: g.desk.x0 + 40, z: 0, scene: 'near', r: 190, label: { du: 0, dv: -560 } },
    { item: 'singer', glyph: 'singer', x: s.u, z: s.v, faces: { x: 0, z: 1 }, scene: 'near', r: 300, label: { du: -420, dv: 0 } },
    // the lesson's live.wedges positions (the Studio-or-live page)
    { item: 'wedge.pianist', glyph: 'wedge', x: -700, z: -1100, faces: { x: 0.2, z: 1 }, scene: 'stage', r: 330, label: { du: 0, dv: -400 } },
    // in the stage wing past the tail, facing across the stage at head height
    // (a side fill — owner 2026-10-16; the lesson's wedge at the short grand)
    { item: 'fill.side', glyph: 'pa', x: g.xTail + 1960, z: 1000, faces: { x: -1, z: 0 }, scene: 'stage', r: 360, label: { du: 0, dv: 480 } },
    { item: 'wedge.vocal', glyph: 'wedge', x: -150, z: 2300, faces: { x: 0, z: -1 }, scene: 'stage', r: 330, label: { du: -640, dv: 0 } },
    { item: 'band', glyph: 'band', x: g.xTail + 1300, z: -850, half: { u: 900, v: 1000 }, scene: 'stage', r: 900 },
    // the PA pair on the deck's downstage corners, facing the audience
    { item: 'pa', glyph: 'pa', x: g.xTail + 1900, z: 2300, faces: { x: 0, z: 1 }, scene: 'stage', r: 380 },
    { item: 'pa.2', glyph: 'pa', x: -1300, z: 2300, faces: { x: 0, z: 1 }, scene: 'stage', r: 0, text: 'PA', label: { du: 0, dv: -420 } },
    { item: 'pair', glyph: 'pair', x: g.curve.p.x + 800 * g.curve.n.x, z: g.curve.p.z + 800 * g.curve.n.z, faces: { x: -g.curve.n.x, z: -g.curve.n.z }, scene: 'studio', r: 300 },
    { item: 'room', glyph: 'none', x: g.xTail + 1400, z: -1000, scene: 'studio', r: 500, label: { du: 0, dv: 0 } },
  ];
}

export function uprightSpots(): PlanSpot[] {
  const s = { u: -700, v: UP.hw + 600 };
  return [
    { item: 'bench', glyph: 'none', x: PIANIST_AT.upright.xKey - 450, z: 0, scene: 'all', r: 330, label: { du: 0, dv: 470 } },
    { item: 'desk', glyph: 'none', x: UP.panel.x - 40, z: 0, scene: 'near', r: 160, label: { du: 0, dv: -560 } },
    // (Lab art fix 2026-10-16: SINGER, VOCAL WEDGE and AUDIENCE stacked in
    // one column on the downstage edge.) The singer's name to their left, the
    // wedge's above and to its right (between the singer and the PA), the
    // right PA's below it — so AUDIENCE alone sits under the wedge.
    { item: 'singer', glyph: 'singer', x: s.u, z: s.v, faces: { x: 0, z: 1 }, scene: 'near', r: 300, label: { du: -720, dv: 0 } },
    { item: 'wedge.pianist', glyph: 'wedge', x: -1300, z: -900, faces: { x: 0.4, z: 1 }, scene: 'stage', r: 330 },
    // at the stage's side, facing across it at head height
    { item: 'fill.side', glyph: 'pa', x: -2200, z: 900, faces: { x: 1, z: 0 }, scene: 'stage', r: 360 },
    { item: 'wedge.vocal', glyph: 'wedge', x: s.u, z: 2500, faces: { x: 0, z: -1 }, scene: 'stage', r: 330, label: { du: 760, dv: -440 } },
    // upstage, on the pianist's side of the wall
    { item: 'band', glyph: 'band', x: -1100, z: -1800, half: { u: 1000, v: 500 }, scene: 'stage', r: 800 },
    // the PA pair on the deck's downstage corners, facing the audience
    { item: 'pa', glyph: 'pa', x: -2200, z: 2600, faces: { x: 0, z: 1 }, scene: 'stage', r: 380 },
    { item: 'pa.2', glyph: 'pa', x: 600, z: 2600, faces: { x: 0, z: 1 }, scene: 'stage', r: 0, text: 'PA', label: { du: 0, dv: 460 } },
    { item: 'pair', glyph: 'pair', x: -250, z: -1250, faces: { x: 0, z: 1 }, scene: 'studio', r: 300 },
    { item: 'room', glyph: 'none', x: -1700, z: -300, scene: 'studio', r: 500, label: { du: 0, dv: 0 } },
  ];
}

export function pianoSpots(v: VariantId): PlanSpot[] {
  return isGrandPlan(v) ? grandSpots(grandOf(v)) : uprightSpots();
}

/** Strips of the grand's outline (its curved side follows the bentside, so
 *  the outside pair in the curve is not "inside" a bounding box). */
export function outlineStrips(outline: readonly (readonly [number, number])[], step = 80): { u0: number; u1: number; v0: number; v1: number }[] {
  const us = outline.map((p) => p[0]);
  const lo = Math.min(...us);
  const hi = Math.max(...us);
  const out: { u0: number; u1: number; v0: number; v1: number }[] = [];
  for (let a = lo; a < hi - 1e-6; a += step) {
    const b = Math.min(hi, a + step);
    let v0 = Infinity;
    let v1 = -Infinity;
    for (let i = 0; i < outline.length; i++) {
      const [x0, z0] = outline[i];
      const [x1, z1] = outline[(i + 1) % outline.length];
      const take = (x: number, z: number) => {
        v0 = Math.min(v0, z);
        v1 = Math.max(v1, z);
        void x;
      };
      if (x0 >= a && x0 <= b) take(x0, z0);
      // where the edge crosses the strip's sides
      for (const s of [a, b])
        if ((x0 - s) * (x1 - s) < 0) take(s, z0 + ((z1 - z0) * (s - x0)) / (x1 - x0));
    }
    if (v0 <= v1) out.push({ u0: a, u1: b, v0, v1 });
  }
  return out;
}

const pianistOf = (v: VariantId) => (isGrandPlan(v) ? pianistAt(PIANIST_AT.grand.xKey, PIANIST_AT.grand.pedalX) : pianistAt(PIANIST_AT.upright.xKey, PIANIST_AT.upright.pedalX));

/** The piano and the pianist on the bench: one assembly (hands over the
 *  keys, feet at the pedals). The upright's wall is its own object. */
export function pianoOwnFoots(v: VariantId, scene: PlanScene): PlanFoot[] {
  const pn = pianistOf(v);
  const g = 'pianist';
  const out: PlanFoot[] = [
    foot('pianist:bench', 'chair', { u0: pn.bench.x0, u1: pn.bench.x1, v0: -pn.bench.hw, v1: pn.bench.hw }, { group: g }),
    foot('pianist:body', 'player', { u0: pn.body.min.x, u1: pn.body.max.x, v0: pn.body.min.z, v1: pn.body.max.z }, { group: g }),
    foot('pianist:arms', 'player', { u0: pn.arms.min.x, u1: pn.arms.max.x, v0: pn.arms.min.z, v1: pn.arms.max.z }, { group: g }),
    foot('pianist:feet', 'player', { u0: pn.feet.min.x, u1: pn.feet.max.x, v0: pn.feet.min.z, v1: pn.feet.max.z }, { group: g }),
  ];
  if (isGrandPlan(v)) outlineStrips(grandOf(v).outline).forEach((r, i) => out.push(foot(`piano:${i}`, 'instrument', r, { group: g })));
  else {
    out.push(foot('piano', 'instrument', { u0: UP.xKey, u1: UP.lid.tip.x, v0: -UP.hw, v1: UP.hw }, { group: g }));
    // the wall behind the upright: on a stage a wall of its own; in the
    // studio the room's wall (not an object inside the room)
    if (scene !== 'studio') out.push(foot('wall', 'wall', UP_WALL));
  }
  return out;
}

/** The pianist's and the singer's heads (PianoArt's pianist: the head on
 *  the keyboard's centre line; the singer glyph's head at its centre). */
export function pianistHead(v: VariantId) {
  const pn = pianistOf(v);
  return { u: pn.head.x, v: pn.head.z };
}

/** STUDIO: the pianist's mixer at their left (the bass end), beside the
 *  bench and behind the hands; the singer's at their right, away from the
 *  piano's curve and the vocal mic. Both feeds run to the CONTROL ROOM box
 *  on the room's left wall, each in its own lane. */
export function pianoCue(v: VariantId): CueRig {
  const room = pianoRoom(v);
  const s = singerAt(v);
  const grand = isGrandPlan(v);
  return {
    room,
    wall: 'u0',
    hubAt: 300,
    stations: [
      { id: 'pianist', at: grand ? { u: -1000, v: -700 } : { u: -1150, v: -850 }, head: pianistHead(v), facing: 0 },
      { id: 'singer', at: grand ? { u: s.u - 600, v: s.v + 30 } : { u: s.u - 650, v: s.v }, head: s, facing: Math.PI / 2 },
    ],
  };
}

export function pianoPlanFoots(v: VariantId, scene: PlanScene): PlanFoot[] {
  return stringPlanFoots(pianoOwnFoots(v, scene), pianoSpots(v), scene, cueFootprints(pianoCue(v)));
}
