/**
 * stageplot/spShape — THE SHAPE OF THE STAGE (owner GO 2026-11-13: "a
 * stage-shape option (thrust, round or wings)"). Pure geometry and words,
 * shared by the model, the Stage screen, the packet and the PDF, so the
 * drawing, the "on stage" test and the position words agree everywhere.
 *
 * Positions stay what they always were: fractions of the MAIN stage
 * (x: 0 = stage right … 1 = stage left; y: 0 = upstage … 1 = the front edge).
 *
 *   rect    the main stage, the audience in front of it. Every plot saved
 *           before 2026-11-13 is one, and nothing about it changes.
 *   thrust  the main stage plus a TONGUE in the middle of the front edge,
 *           reaching into the audience (y from 1 to 1 + its depth).
 *   round   the audience on every side. The stage is the width × depth
 *           square, or the circle inside it. There is no single downstage,
 *           so one side is the REFERENCE (drawn at the bottom; usually the
 *           side where the mix position is, "FOH"): position words and
 *           "facing" are said from it.
 * WINGS are an on/off option of a rectangle or a thrust (owner 2026-11-13,
 * "build them all"; that morning they were a fourth shape): an offstage area
 * at each side (x below 0, x above 1). What stands in a wing is off the
 * performance area and still on the plot: monitor world, stage boxes, racks,
 * sidefills. It is not asked about as "outside the stage". A stage in the
 * round has no wings (the audience is on every side).
 *
 * A shape's own sizes are in the stage's unit. When a size is not given the
 * part is drawn at a usual size and the plot says so.
 *
 * Pure: no React. Types only from spTypes.
 */
import type { SpStage, SpStageShape } from './spTypes.ts';

export type SpFracPt = { x: number; y: number };
/** A box in stage fractions. */
export type SpFracRect = { x0: number; y0: number; x1: number; y1: number };

/** The shapes a stage can be chosen as. Wings are not one of them: they are
 *  an option of a rectangle or a thrust (spHasWings). */
export type SpStageForm = Exclude<SpStageShape, 'wings'>;
export const SP_SHAPES: readonly SpStageForm[] = ['rect', 'thrust', 'round'];
export const SP_SHAPE_WORD: Record<SpStageForm, string> = { rect: 'Rectangle', thrust: 'Thrust', round: 'In the round' };
/** One plain line for each shape (Setup). */
export const SP_SHAPE_HINT: Record<SpStageForm, string> = {
  rect: 'A rectangle: the audience is in front of the stage.',
  thrust: 'A thrust: a tongue of stage reaches into the audience, so people watch from three sides.',
  round: 'In the round: the audience is on every side. The side drawn at the bottom is usually front of house (FOH), where the engineer mixes.',
};
/** The one plain line for the wings option (Setup). */
export const SP_WINGS_HINT = 'Wings: room at each side of the stage, usually out of the audience’s sight. It is not the performance area, but it is on your plot.';

/** The shape fields a plot saved before 2026-11-13 reads as (`wings`
 *  absent = off). */
export const SP_SHAPE_DEFAULTS: Pick<SpStage, 'shape' | 'thrustWidth' | 'thrustDepth' | 'wingWidth' | 'roundForm' | 'roundRef'> = { shape: 'rect', thrustWidth: null, thrustDepth: null, wingWidth: null, roundForm: 'circle', roundRef: 'FOH' };

/** The usual size of a part whose size was not given (fractions of the main
 *  stage), and the largest a typed size may be. */
export const SP_THRUST_USUAL = { w: 0.4, d: 0.35 } as const;
export const SP_THRUST_MAX = { w: 1, d: 1.5 } as const;
export const SP_WING_USUAL = 0.18;
export const SP_WING_MAX = 0.5;

type StageLike = Partial<Pick<SpStage, 'width' | 'depth' | 'shape' | 'thrustWidth' | 'thrustDepth' | 'wingWidth' | 'wings' | 'roundForm' | 'roundRef'>> | null | undefined;

/** The shape: a rectangle, a thrust or in the round. The morning's "wings"
 *  shape reads as the rectangle it was drawn on (its wings: spHasWings). */
export const spShapeOf = (s: StageLike): SpStageForm => {
  const v = s?.shape;
  return v === 'thrust' || v === 'round' ? v : 'rect';
};
/** Wings at each side: on a rectangle or a thrust when switched on (or a plot
 *  saved with the morning's "wings" shape). Never in the round. */
export const spHasWings = (s: StageLike): boolean => {
  const v = s?.shape;
  if (v === 'round') return false;
  return v === 'wings' || s?.wings === true;
};
/** Anything but a plain rectangle: a thrust, the round, or wings. A plain
 *  rectangle runs the code it always ran (its layouts are pinned). */
export const spIsShaped = (s: StageLike): boolean => spShapeOf(s) !== 'rect' || spHasWings(s);
export const spIsCircle = (s: StageLike): boolean => spShapeOf(s) === 'round' && s?.roundForm !== 'square';

/** The longest name the reference side may have (it is said in short
 *  readouts: "FOH side, toward stage right"). */
export const SP_ROUND_REF_MAX = 12;

/** The reference side's name in the round ("FOH" when none is typed). */
export const spRoundRef = (s: StageLike): string => (s?.roundRef ?? '').trim() || 'FOH';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** A thrust's tongue as fractions of the main stage, and whether that is the
 *  size the band gave (false = drawn at a usual size). */
export function spThrustFrac(s: StageLike): { w: number; d: number; given: boolean } {
  const W = s?.width;
  const D = s?.depth;
  const tw = s?.thrustWidth;
  const td = s?.thrustDepth;
  if (W && D && tw && td && tw > 0 && td > 0) return { w: clamp(tw / W, 0.05, SP_THRUST_MAX.w), d: clamp(td / D, 0.05, SP_THRUST_MAX.d), given: true };
  return { w: SP_THRUST_USUAL.w, d: SP_THRUST_USUAL.d, given: false };
}

/** One wing's width as a fraction of the main stage width. */
export function spWingFrac(s: StageLike): { w: number; given: boolean } {
  const W = s?.width;
  const ww = s?.wingWidth;
  if (W && ww && ww > 0) return { w: clamp(ww / W, 0.04, SP_WING_MAX), given: true };
  return { w: SP_WING_USUAL, given: false };
}

/** The tongue of a thrust, in stage fractions (null for another shape). */
export function spThrustRect(s: StageLike): SpFracRect | null {
  if (spShapeOf(s) !== 'thrust') return null;
  const t = spThrustFrac(s);
  return { x0: 0.5 - t.w / 2, y0: 1, x1: 0.5 + t.w / 2, y1: 1 + t.d };
}

/** The two wings, in stage fractions (empty for another shape). */
export function spWingRects(s: StageLike): { side: 'right' | 'left'; r: SpFracRect }[] {
  if (!spHasWings(s)) return [];
  const w = spWingFrac(s).w;
  return [
    { side: 'right', r: { x0: -w, y0: 0, x1: 0, y1: 1 } },
    { side: 'left', r: { x0: 1, y0: 0, x1: 1 + w, y1: 1 } },
  ];
}

/** Everything the plot draws as stage floor, in stage fractions. */
export function spShapeBounds(s: StageLike): SpFracRect {
  // (a thrust with wings: the tongue below the main stage, a wing each side)
  const y1 = spShapeOf(s) === 'thrust' ? 1 + spThrustFrac(s).d : 1;
  const w = spHasWings(s) ? spWingFrac(s).w : 0;
  return { x0: -w, y0: 0, x1: 1 + w, y1 };
}

const inRect = (at: SpFracPt, r: SpFracRect, e = 1e-9): boolean => at.x >= r.x0 - e && at.x <= r.x1 + e && at.y >= r.y0 - e && at.y <= r.y1 + e;
const MAIN: SpFracRect = { x0: 0, y0: 0, x1: 1, y1: 1 };

/** On the PERFORMANCE AREA: the main stage, a thrust's tongue, or inside the
 *  circle of a round stage. A wing is not the performance area. */
export function spInPerformance(at: SpFracPt, s?: StageLike): boolean {
  if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return false;
  const shape = spShapeOf(s);
  if (shape === 'round' && spIsCircle(s)) return (at.x - 0.5) ** 2 + (at.y - 0.5) ** 2 <= 0.25 + 1e-9;
  if (inRect(at, MAIN)) return true;
  const t = spThrustRect(s);
  return !!t && inRect(at, t);
}

/** Which wing a point stands in, if any. */
export function spInWing(at: SpFracPt, s?: StageLike): 'right' | 'left' | null {
  for (const w of spWingRects(s)) if (inRect(at, w.r) && !inRect(at, MAIN, -1e-9)) return w.side;
  return null;
}

/** ON THE PLOT'S STAGE: on the performance area, or in a wing. Anything else
 *  is "outside the stage" (the review asks about it). */
export const spOnShape = (at: SpFracPt, s?: StageLike): boolean => spInPerformance(at, s) || spInWing(at, s) != null;

/** Thirds of the main stage, the words of the rectangle. */
function rectWords(at: SpFracPt): string {
  const row = at.y < 1 / 3 ? 'up' : at.y < 2 / 3 ? 'mid' : 'down';
  const col = at.x < 1 / 3 ? 'right' : at.x < 2 / 3 ? 'center' : 'left';
  if (row === 'mid') return col === 'center' ? 'Center stage' : `Stage ${col}`;
  return `${row === 'up' ? 'Upstage' : 'Downstage'} ${col}`;
}

/** Where a point is, in stage words, for any shape. Stage right is the
 *  viewer's LEFT. In the round the words are said from the reference side:
 *  "The FOH side, stage left", "The far side, center", "Center". */
export function spShapeLocationWord(at: SpFracPt, s?: StageLike): string {
  const shape = spShapeOf(s);
  if (!spOnShape(at, s)) return 'Off the stage';
  if (shape === 'round') {
    const row = at.y < 1 / 3 ? 'far' : at.y < 2 / 3 ? 'mid' : 'near';
    const col = at.x < 1 / 3 ? 'stage right' : at.x < 2 / 3 ? 'center' : 'stage left';
    if (row === 'mid') return col === 'center' ? 'Center' : col.charAt(0).toUpperCase() + col.slice(1);
    // "The FOH side…": a sentence that lowers its first letter keeps "FOH"
    return `${row === 'far' ? 'The far side' : `The ${spRoundRef(s)} side`}, ${col}`;
  }
  const wing = spInWing(at, s);
  if (wing) return wing === 'right' ? 'Stage right wing' : 'Stage left wing';
  const t = spThrustRect(s);
  if (t && at.y > 1 + 1e-9 && inRect(at, t)) {
    const third = (t.x1 - t.x0) / 3;
    const col = at.x < t.x0 + third ? 'stage right side' : at.x < t.x0 + 2 * third ? 'center' : 'stage left side';
    return `${at.y > (t.y0 + t.y1) / 2 ? 'Thrust tip' : 'Thrust'}, ${col}`;
  }
  return rectWords(at);
}

/** Which way an object faces, in the shape's words. Only the round changes
 *  them: there is no "audience" side, so 0° faces the reference side. */
export function spShapeFacingWords(rot: number, s?: StageLike): { full: string; short: string } | null {
  if (spShapeOf(s) !== 'round') return null;
  const ref = `the ${spRoundRef(s)} side`;
  const r = ((Math.round(rot) % 360) + 360) % 360;
  if (r === 0) return { full: `facing ${ref}`, short: `facing ${ref}` };
  if (r === 90) return { full: 'facing stage right', short: 'facing stage right' };
  if (r === 180) return { full: 'facing the far side', short: 'facing the far side' };
  if (r === 270) return { full: 'facing stage left', short: 'facing stage left' };
  // (the short words say "faces", so a turn is never read as a place)
  if (r < 90) return { full: `facing ${ref}, turned toward stage right`, short: `faces ${spRoundRef(s)} side, to stage right` };
  if (r < 180) return { full: 'facing the far side, turned toward stage right', short: 'faces far side, to stage right' };
  if (r < 270) return { full: 'facing the far side, turned toward stage left', short: 'faces far side, to stage left' };
  return { full: `facing ${ref}, turned toward stage left`, short: `faces ${spRoundRef(s)} side, to stage left` };
}

/** The four words round the drawing. */
export function spShapeDirections(s?: StageLike): { up: string; down: string; right: string; left: string } {
  // every side is audience in the round: all four words say so
  if (spShapeOf(s) === 'round') return { up: 'FAR SIDE (AUDIENCE)', down: `${spRoundRef(s).toUpperCase()} SIDE (AUDIENCE)`, right: 'STAGE RIGHT (AUDIENCE)', left: 'STAGE LEFT (AUDIENCE)' };
  return { up: 'UPSTAGE', down: 'AUDIENCE / DOWNSTAGE', right: 'STAGE RIGHT', left: 'STAGE LEFT' };
}

/** The outline of the performance area, in stage fractions: a closed
 *  polygon [x, y, x, y…], or the circle. */
export type SpShapeOutline = { t: 'poly'; pts: number[] } | { t: 'circle'; cx: number; cy: number; r: number };
export function spShapeOutline(s?: StageLike): SpShapeOutline {
  if (spIsCircle(s)) return { t: 'circle', cx: 0.5, cy: 0.5, r: 0.5 };
  const t = spThrustRect(s);
  if (t) return { t: 'poly', pts: [0, 0, 1, 0, 1, 1, t.x1, 1, t.x1, t.y1, t.x0, t.y1, t.x0, 1, 0, 1] };
  return { t: 'poly', pts: [0, 0, 1, 0, 1, 1, 0, 1] };
}

/** The edges the audience sees, drawn heavier: the front edge; a thrust's
 *  front pieces and the three sides of its tongue; every side of a round
 *  stage (`all`). */
export function spFrontEdges(s?: StageLike): { all: boolean; lines: [number, number, number, number][] } {
  const shape = spShapeOf(s);
  if (shape === 'round') return { all: true, lines: spIsCircle(s) ? [] : [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]] };
  const t = spThrustRect(s);
  if (t) return { all: false, lines: [[0, 1, t.x0, 1], [t.x1, 1, 1, 1], [t.x0, 1, t.x0, t.y1], [t.x0, t.y1, t.x1, t.y1], [t.x1, t.y1, t.x1, 1]] };
  return { all: false, lines: [[0, 1, 1, 1]] };
}

/** The areas the grid is drawn in (stage fractions), and the circle that
 *  clips it on a round stage. */
function gridAreas(s?: StageLike): { rects: SpFracRect[]; circle: boolean } {
  if (spIsCircle(s)) return { rects: [MAIN], circle: true };
  const rects: SpFracRect[] = [MAIN];
  const t = spThrustRect(s);
  if (t) rects.push(t);
  for (const w of spWingRects(s)) rects.push(w.r);
  return { rects, circle: false };
}

/** Grid lines inside the shape, as segments [x1, y1, x2, y2] in stage
 *  fractions, at every `every`-th multiple of the step (the snap grid). A
 *  line on an area's own edge is left out (the outline is there). */
export function spShapeGridSegments(s: StageLike, step: { x: number; y: number }, every = 1): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  if (!(step.x > 0) || !(step.y > 0)) return out;
  const sx = step.x * every;
  const sy = step.y * every;
  const { rects, circle } = gridAreas(s);
  const e = 1e-6;
  for (const r of rects) {
    if ((r.x1 - r.x0) / sx > 400 || (r.y1 - r.y0) / sy > 400) continue;
    for (let k = Math.ceil((r.x0 + e) / sx); k * sx < r.x1 - e; k++) {
      const x = k * sx;
      if (circle) {
        const h = Math.sqrt(Math.max(0, 0.25 - (x - 0.5) ** 2));
        if (h > e) out.push([x, 0.5 - h, x, 0.5 + h]);
      } else out.push([x, r.y0, x, r.y1]);
    }
    for (let k = Math.ceil((r.y0 + e) / sy); k * sy < r.y1 - e; k++) {
      const y = k * sy;
      if (circle) {
        const h = Math.sqrt(Math.max(0, 0.25 - (y - 0.5) ** 2));
        if (h > e) out.push([0.5 - h, y, 0.5 + h, y]);
      } else out.push([r.x0, y, r.x1, y]);
    }
  }
  return out;
}

/** How far a point may be moved: the shape's floor, and a quarter of the
 *  stage beyond it (front of house, an aisle), never out of reach. */
export const SP_OFF_MAX = 0.25;
export function spMoveLimits(s?: StageLike): SpFracRect {
  const b = spShapeBounds(s);
  return { x0: b.x0 - SP_OFF_MAX, y0: b.y0 - SP_OFF_MAX, x1: b.x1 + SP_OFF_MAX, y1: b.y1 + SP_OFF_MAX };
}

/** What the plot says about the shape, in words ('' for a rectangle). */
export function spShapeWords(s: StageLike, unit: 'ft' | 'm' = 'ft'): string {
  const shape = spShapeOf(s);
  const n = (v: number) => String(Math.round(v * 100) / 100);
  const wingWords = (): string => {
    const w = spWingFrac(s);
    return `The wings${w.given ? ` (${n(s?.wingWidth ?? 0)} ${unit} wide each)` : ''} are drawn dashed at each side. What stands there is out of the audience’s sight, off the performance area, and still on the plot.${w.given ? '' : ' Their width is not given: they are drawn at a usual width.'}`;
  };
  if (shape === 'thrust') {
    const t = spThrustFrac(s);
    const size = t.given ? ` ${n(s?.thrustWidth ?? 0)} ${unit} wide and ${n(s?.thrustDepth ?? 0)} ${unit} deep` : '';
    const thrust = `Thrust stage: a tongue${size} reaches into the audience from the middle of the front edge, so the audience is on three sides of it.${t.given ? '' : ' Its size is not given: it is drawn at a usual size.'}`;
    // a thrust with wings says both, the tongue first
    return spHasWings(s) ? `${thrust} ${wingWords()}` : thrust;
  }
  if (spHasWings(s)) return wingWords();
  if (shape === 'round') {
    const ref = spRoundRef(s);
    return `In the round${spIsCircle(s) ? ' (a circular stage)' : ' (a square stage)'}: the audience is on every side. The bottom of this drawing is the ${ref} side. Stage right and stage left are as a performer facing the ${ref} side sees them, so stage right is on the left of this drawing.`;
  }
  return '';
}
