/**
 * The part labels of a lesson's ART, laid out the way every scene draws them
 * (PlacementScene, the read-step InstrumentFigure) and the way the label
 * ratchet measures them (test/mikingLabelsClear.test.ts). Pure (no React
 * Native).
 *
 * Owner, Pixel 2026-10-06: "many of the text details cover up objects below
 * or stack on top of each other. Maybe the finest details aren't shown until
 * the image is zoomed in enough." So a label is kept only in FREE SPACE —
 * clear of the drawing (the art's own hit test) and of every other label —
 * moved there with a leader when its own place is taken, and left out at a
 * scale where no such spot exists (labelLayout.fitLabels, `clearOf`). A
 * closer zoom draws the instrument larger than the words, and the finer
 * names come back.
 *
 * THE OCCUPANCY GRID: the art's hit test can cost a tenth of a millisecond a
 * call (a saxophone walks its whole tube), so the drawing is sampled once per
 * (art, view, variant) on a coarse grid of cells over the frame, each cell
 * tested at its centre with a small tolerance (a third of a cell) — a quick
 * filter; a box the grid passes is then confirmed with the exact hit test. Cells are filled lazily
 * (only those a label asks about) and kept for the session.
 */
import type { Envelope, InstrumentModel, VariantId, Vec3, ViewBox, ViewId } from '../model/types.ts';
import { bodyEnvelope, shapeBox } from '../geometry/contentFrame.ts';
import { sdf } from '../geometry/sdf.ts';
import type { ViewXform } from '../geometry/frame.ts';
import type { ArtLabel, LessonArt } from './sceneTypes.ts';
import { fitLabels, type LabelOpts } from './labelLayout.ts';

/** Cells along the frame's longer side. */
export const OCC_CELLS = 96;

export type Occupancy = { clearOf: (u0: number, v0: number, u1: number, v1: number) => boolean };

const cache = new WeakMap<object, Map<string, Occupancy>>();

/**
 * The PLAYER's body, where the art does not hit-test it (a guitarist, a
 * drummer drawn from a pose): the model's body keep-outs (contentFrame's
 * bodyEnvelope), projected along the view's depth — a point is "body" when
 * any depth through it is inside one.
 */
function bodyAt(envs: readonly Envelope[], view: ViewId): ((u: number, v: number, tol: number) => boolean) | null {
  const shapes = envs.map((e) => ({ s: e.shape, b: shapeBox(e.shape) })).filter((x) => x.b);
  if (!shapes.length) return null;
  return (u, v, tol) => {
    for (const { s, b } of shapes) {
      const d0 = view === 'side' ? b!.min.z : b!.min.y;
      const d1 = view === 'side' ? b!.max.z : b!.max.y;
      for (let k = 0; k <= 6; k++) {
        const d = d0 + ((d1 - d0) * k) / 6;
        const p: Vec3 = view === 'side' ? { x: u, y: v, z: d } : { x: u, y: d, z: v };
        if (sdf(s, p) < tol) return true;
      }
    }
    return false;
  };
}

/** The drawing's occupancy for one view of one variant, over `frame` (mm).
 *  `body`: the model's keep-outs that stand for the player (optional). */
export function occupancy(art: Pick<LessonArt, 'hitTest' | 'figureAt'>, view: ViewId, variant: VariantId, frame: ViewBox, body: readonly Envelope[] = []): Occupancy {
  const key = `${view}|${variant}|${frame.u0}|${frame.u1}|${frame.v0}|${frame.v1}|${body.length}`;
  const envBody = bodyAt(body, view);
  const fig = art.figureAt;
  // The player: the drawn figure where the art can say (figureAt), else its
  // body keep-outs.
  const onBody = fig ? (u: number, v: number, t: number) => fig(view, variant, u, v, t) || (!!envBody && envBody(u, v, t)) : envBody;
  let byKey = cache.get(art);
  if (!byKey) {
    byKey = new Map();
    cache.set(art, byKey);
  }
  const hit = byKey.get(key);
  if (hit) return hit;
  const cell = Math.max(frame.u1 - frame.u0, frame.v1 - frame.v0) / OCC_CELLS;
  const tol = cell * 0.35;
  const cols = Math.ceil((frame.u1 - frame.u0) / cell) + 1;
  const cells = new Map<number, boolean>();
  const busy = (i: number, j: number): boolean => {
    const k = j * cols + i;
    let b = cells.get(k);
    if (b === undefined) {
      const cu = frame.u0 + (i + 0.5) * cell;
      const cv = frame.v0 + (j + 0.5) * cell;
      b = art.hitTest(view, variant, cu, cv, tol) != null || (!!onBody && onBody(cu, cv, tol));
      cells.set(k, b);
    }
    return b;
  };
  const occ: Occupancy = {
    clearOf: (u0, v0, u1, v1) => {
      // Outside the frame nothing is drawn (the frame holds the content).
      const i0 = Math.max(0, Math.floor((u0 - frame.u0) / cell));
      const i1 = Math.min(cols - 1, Math.floor((u1 - frame.u0) / cell));
      const j0 = Math.max(0, Math.floor((v0 - frame.v0) / cell));
      const j1 = Math.floor((v1 - frame.v0) / cell);
      const rows = Math.ceil((frame.v1 - frame.v0) / cell) + 1;
      for (let j = j0; j <= Math.min(rows - 1, j1); j++) for (let i = i0; i <= i1; i++) if (busy(i, j)) return false;
      // The grid passed: confirm with the exact hit test on a fine lattice of
      // the box (a thin part — a stand's tube, a cymbal's edge — can slip
      // between cell centres). Only boxes the grid already cleared get here.
      for (let i = 0; i <= 12; i++)
        for (let j = 0; j <= 4; j++) {
          const u = u0 + ((u1 - u0) * i) / 12;
          const v = v0 + ((v1 - v0) * j) / 4;
          if (art.hitTest(view, variant, u, v, 0) != null || (onBody && onBody(u, v, 0))) return false;
        }
      return true;
    },
  };
  byKey.set(key, occ);
  return occ;
}

const bodies = new WeakMap<object, Map<VariantId, Envelope[]>>();
/** The model's keep-outs that stand for the player's body, in a variant. */
export function bodyOf(model: InstrumentModel, variant: VariantId): Envelope[] {
  let m = bodies.get(model);
  if (!m) {
    m = new Map();
    bodies.set(model, m);
  }
  let b = m.get(variant);
  if (!b) {
    b = (model.envelopes as Envelope[]).filter((e) => (!e.variants || e.variants.includes(variant)) && bodyEnvelope(e));
    m.set(variant, b);
  }
  return b;
}

/** The art's labels, laid out at `xf` on a (w × h) glass. */
export function layoutArtLabels(
  art: Pick<LessonArt, 'labels' | 'hitTest' | 'figureAt'>,
  view: ViewId,
  variant: VariantId,
  frame: ViewBox,
  xf: ViewXform,
  scale: number,
  w: number,
  h: number,
  more: { avoid?: { x0: number; y0: number; x1: number; y1: number }; obstacles?: { x0: number; y0: number; x1: number; y1: number }[]; minY?: number; labels?: ArtLabel[]; model?: InstrumentModel } = {},
) {
  const occ = occupancy(art, view, variant, frame, more.model ? bodyOf(more.model, variant) : []);
  const opts: LabelOpts = { clearOf: occ.clearOf, minY: more.minY ?? 1, maxY: h - 1 };
  return fitLabels(more.labels ?? art.labels(view, variant), xf, scale, w, more.avoid, more.obstacles, opts);
}
