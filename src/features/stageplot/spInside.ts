/**
 * stageplot/spInside — OBJECTS ACROSS A NEW OUTLINE (owner 2026-11-13: build
 * the remaining held items). When the stage's shape changes (a rectangle
 * becomes a circle in the round, a thrust loses its tongue), an object that
 * stood wholly on the stage can end up across the new outline, or outside
 * it. The lab never moves anything by itself: Setup says which objects, and
 * offers MOVE THEM INSIDE, one edit (one UNDO) that moves each of them the
 * shortest way to a place wholly on the stage.
 *
 * Pure: no React.
 */
import { spEdit } from './spModel.ts';
import { spOnShape, spShapeBounds } from './spShape.ts';
import { spObjectBoxM, spStageMeters } from './spSymbols.ts';
import type { SpId, SpObject, SpProject, SpStage } from './spTypes.ts';

type Pt = { x: number; y: number };

/** Points round an object's footprint (its symbol's box, turned), and its
 *  center, in stage fractions, for the object standing at `at`. */
function footprint(p: SpProject, o: SpObject, at: Pt = o): Pt[] {
  const st = spStageMeters(p);
  const b = spObjectBoxM(p, { ...o, x: at.x, y: at.y });
  const a = (b.rot * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const out: Pt[] = [];
  for (const [u, v] of [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [0, 0]]) {
    const lx = (u * b.w) / 2;
    const ly = (v * b.h) / 2;
    out.push({ x: (b.cx + lx * cos - ly * sin) / st.width, y: (b.cy + lx * sin + ly * cos) / st.depth });
  }
  return out;
}

/** Is the object wholly on the stage's floor (its performance area and
 *  wings), for this stage? */
export function spWhollyOn(p: SpProject, o: SpObject, stage: SpStage = p.stage, at: Pt = o): boolean {
  const q = stage === p.stage ? p : { ...p, stage };
  return footprint(q, o, at).every((pt) => spOnShape(pt, stage));
}

/** Is any of the object's footprint on the stage's floor? */
function partlyOn(p: SpProject, o: SpObject, stage: SpStage): boolean {
  const q = stage === p.stage ? p : { ...p, stage };
  return footprint(q, o).some((pt) => spOnShape(pt, stage));
}

/** The objects a change of shape put across the outline or outside it: wholly
 *  on the floor of the stage `before`, and not wholly on it now. */
export function spDisplacedBy(before: SpProject, after: SpProject): SpId[] {
  return after.objects.filter((o) => {
    const was = before.objects.find((x) => x.id === o.id);
    return !!was && spWhollyOn(before, was) && !spWhollyOn(after, o);
  }).map((o) => o.id);
}

/** The objects that stand ACROSS the outline now: partly on the floor and
 *  partly off it. */
export function spAcrossOutline(p: SpProject): SpId[] {
  return p.objects.filter((o) => partlyOn(p, o, p.stage) && !spWhollyOn(p, o)).map((o) => o.id);
}

/** The nearest place (stage fractions) where the object stands wholly on the
 *  floor, searched outward from where it is; null when there is none. */
export function spInsideSpot(p: SpProject, o: SpObject): Pt | null {
  if (spWhollyOn(p, o)) return { x: o.x, y: o.y };
  const b = spShapeBounds(p.stage);
  const step = 0.005;
  let best: Pt | null = null;
  let bestD = Infinity;
  for (let r = step; r <= 1.5 && best == null; r += step) {
    // a ring of candidates at this distance (the first ring that has one wins)
    const n = Math.max(8, Math.ceil((2 * Math.PI * r) / step));
    for (let k = 0; k < n; k++) {
      const t = (2 * Math.PI * k) / n;
      const at = { x: o.x + r * Math.cos(t), y: o.y + r * Math.sin(t) };
      if (at.x < b.x0 - 0.01 || at.x > b.x1 + 0.01 || at.y < b.y0 - 0.01 || at.y > b.y1 + 0.01) continue;
      if (!spWhollyOn(p, o, p.stage, at)) continue;
      const d = Math.hypot(at.x - o.x, at.y - o.y);
      if (d < bestD) {
        bestD = d;
        best = at;
      }
    }
  }
  return best ? { x: Math.round(best.x * 1e4) / 1e4, y: Math.round(best.y * 1e4) / 1e4 } : null;
}

/** MOVE THEM INSIDE: one edit that moves each object the shortest way to a
 *  place wholly on the stage. An object with no such place stays where it
 *  is. Returns the new project and the objects it moved. */
export function spMoveInside(p: SpProject, ids: readonly SpId[]): { p: SpProject; moved: SpId[] } {
  const to = new Map<SpId, Pt>();
  for (const id of ids) {
    const o = p.objects.find((x) => x.id === id);
    if (!o || spWhollyOn(p, o)) continue;
    const at = spInsideSpot(p, o);
    if (at) to.set(id, at);
  }
  if (!to.size) return { p, moved: [] };
  const next = spEdit(p, (d) => {
    for (const o of d.objects) {
      const at = to.get(o.id);
      if (at) {
        o.x = at.x;
        o.y = at.y;
      }
    }
  });
  return { p: next, moved: [...to.keys()] };
}
