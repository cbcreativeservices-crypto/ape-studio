/**
 * stageplot/spChoir — A CHOIR OF ANY SIZE (owner 2026-11-13: "Yes, build them
 * all"). The student sets how many singers and how many rows (or "auto"); the
 * riser, the drawing on the screen, the printed symbol, the key, the area
 * microphones and the review all follow from this one layout.
 *
 * WHERE THE NUMBERS COME FROM
 *   • The riser is drawn as SOLD choral riser units: 6 ft (1.83 m) wide with
 *     18 in (0.46 m) steps. Wenger's layout sheet for its 6 ft, 3-step, 18 in
 *     riser lists 12 to 16 standing performers per unit (16 = shoulder to
 *     shoulder) on a stage area of about 6 ft × 4 ft 10 in. A venue gives
 *     floor by riser units, so the plot counts units (live-sound review,
 *     2026-11-13). The tool uses the 12-performer figure: 4 singers a row on
 *     one unit, about 0.44 m each.
 *   • WINDOW SPACING: rows are counted across the whole riser. From the back,
 *     a full row holds 4 × units, the next (standing in the gaps of the row
 *     behind) 4 × units − 1, and so on. One unit is 4 + 3 + 4 = 11 singers:
 *     the choir the stage drew before this round, so an old plot looks the
 *     same. The fewest units that seat everybody are used.
 *   • 2 rows stand on a two-step unit, 3 on a three-step, 4 on a four-step.
 *     ONE ROW stands on the floor, no riser, 0.5 m a singer.
 *   • AREA MICROPHONES: about one for every 2.5 m of choir width (one
 *     cardioid microphone covers 15 to 20 voices over 3 or 4 rows), at least
 *     one, at most six. As few as cover the choir: every open microphone adds
 *     feedback. (The task brief's "one per 8–12 singers in a row" asks for too
 *     many: changed on the live-sound reviewer's advice.)
 *
 * Geometry: METERS, centered on the object's position, the choir facing the
 * audience (+y), the back row upstage (−y). Pure.
 */
import type { SpChoir, SpObject } from './spTypes.ts';

export const SP_CHOIR_MIN = 4;
export const SP_CHOIR_MAX = 60;
export const SP_CHOIR_ROWS_MAX = 4;

/** What a choir saved before this round is: 11 singers on a three-step
 *  riser (the drawing it always had). */
export const SP_CHOIR_LEGACY: SpChoir = { singers: 11, rows: 3 };
/** A new choir: 11 singers, rows chosen automatically (3 rows). */
export const SP_CHOIR_DEFAULT: SpChoir = { singers: 11, rows: 'auto' };

/** One sold riser unit, 6 ft wide, and one 18 in step (the drawing's own
 *  figures: 58.7 and 14.73 floor units of 32 to the meter). */
export const SP_RISER_UNIT_W = 58.7 / 32;
export const SP_RISER_STEP_D = 44.2 / 3 / 32;
/** The room at each end of a row of singers on the riser. */
const ROW_EDGE = 1.15 / 32;
/** Singers standing in one row on the floor: 0.5 m each. */
export const SP_CHOIR_FLOOR_PITCH = 0.5;
/** The depth a row of singers on the floor takes. */
const FLOOR_DEPTH = 0.45;
/** The footprint is a little bigger than the riser (its edge). */
const PAD_W = 0.0156;
const PAD_H = 0.0187;

const whole = (v: unknown, lo: number, hi: number): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : null);

/** A choir's size as saved, made safe: whole numbers in range, rows 1–4 or
 *  'auto'. Anything unreadable is the choir of before (11 singers, 3 rows). */
export function spChoirClean(raw: unknown): SpChoir {
  const r = (raw ?? {}) as Partial<SpChoir>;
  const singers = whole(r.singers, SP_CHOIR_MIN, SP_CHOIR_MAX);
  if (singers == null) return { ...SP_CHOIR_LEGACY };
  const rows = r.rows === 'auto' ? 'auto' : whole(r.rows, 1, SP_CHOIR_ROWS_MAX);
  return { singers, rows: rows ?? 'auto' };
}

/** The choir an object draws: its own size, or the choir of before. */
export const spChoirOf = (o: Pick<SpObject, 'kind' | 'choir'>): SpChoir => (o.choir ? spChoirClean(o.choir) : { ...SP_CHOIR_LEGACY });

/** Rows chosen automatically: 4–5 singers in one row, 6–7 in two, 8–35 in
 *  three (the three-step riser most venues own), 36 and more in four. */
export function spChoirAutoRows(singers: number): number {
  if (singers <= 5) return 1;
  if (singers <= 7) return 2;
  if (singers <= 35) return 3;
  return 4;
}

export const spChoirRows = (c: SpChoir): number => (c.rows === 'auto' ? spChoirAutoRows(c.singers) : c.rows);

/** Seats in each row, from the back, on `units` riser units. */
const rowSlots = (rows: number, units: number): number[] => Array.from({ length: rows }, (_, i) => (i % 2 === 0 ? 4 * units : 4 * units - 1));

export type SpChoirSinger = { x: number; y: number; row: number };
export type SpChoirLayout = {
  singers: number;
  rows: number;
  /** Riser units side by side (0 = one row on the floor, no riser). */
  units: number;
  /** The singers in each row, from the back. */
  perRow: number[];
  /** Footprint, meters. */
  w: number;
  h: number;
  /** The riser's outline and its step edges (y of each edge, top to bottom),
   *  and the joins between units (x); none on the floor. */
  riser: { x0: number; x1: number; steps: number[]; joins: number[] } | null;
  /** Where each singer stands (the center of the figure). */
  at: SpChoirSinger[];
};

/** The layout of a choir: the riser units, each row's singers in window
 *  spacing, the footprint. */
export function spChoirLayout(c: SpChoir): SpChoirLayout {
  const n = c.singers;
  const rows = spChoirRows(c);
  if (rows === 1) {
    // one row, on the floor: 0.5 m a singer
    // (a little more than the singers' 0.5 m each: the outer two's shoulders)
    const w = n * SP_CHOIR_FLOOR_PITCH + 0.03;
    const at = Array.from({ length: n }, (_, k) => ({
      x: (k - (n - 1) / 2) * SP_CHOIR_FLOOR_PITCH,
      y: 0,
      row: 0,
    }));
    return {
      singers: n,
      rows,
      units: 0,
      perRow: [n],
      w,
      h: FLOOR_DEPTH,
      riser: null,
      at,
    };
  }
  let units = 1;
  while (rowSlots(rows, units).reduce((a, b) => a + b, 0) < n) units += 1;
  const slots = rowSlots(rows, units);
  // the empty places, two at a time (so a row stays centered on its seats),
  // each pair from the fullest row (the back one first when two are equal),
  // so the rows stay about even; one left over comes off the back row, which
  // then stands half a seat off center
  const perRow = [...slots];
  let empty = slots.reduce((a, b) => a + b, 0) - n;
  while (empty >= 2) {
    let i = -1;
    for (let r = 0; r < rows; r++) if (perRow[r]! >= 3 && (i < 0 || perRow[r]! > perRow[i]!)) i = r;
    if (i < 0) break;
    perRow[i]! -= 2;
    empty -= 2;
  }
  while (empty > 0)
    for (let i = 0; i < rows && empty > 0; i++)
      if (perRow[i]! >= 2) {
        perRow[i]! -= 1;
        empty -= 1;
      }
  const riserW = units * SP_RISER_UNIT_W;
  const pitch = (riserW - 2 * ROW_EDGE) / (4 * units);
  const depth = rows * SP_RISER_STEP_D;
  const top = -depth / 2;
  const at: SpChoirSinger[] = [];
  perRow.forEach((count, row) => {
    const seats = slots[row];
    // seat k of a full row, or of a row in the gaps (half a seat in)
    const seatX = (k: number) => (k - (seats - 1) / 2) * pitch;
    const y = top + (row + 0.5) * SP_RISER_STEP_D + 0.2 / 32;
    // always on its own seats, so the window spacing holds; a row whose
    // empty places cannot be split evenly stands half a seat off center
    const first = Math.floor((seats - count) / 2);
    for (let k = 0; k < count; k++) at.push({ x: seatX(first + k), y, row });
  });
  const steps = Array.from({ length: rows + 1 }, (_, i) => top + i * SP_RISER_STEP_D);
  const joins = Array.from({ length: units - 1 }, (_, i) => -riserW / 2 + (i + 1) * SP_RISER_UNIT_W);
  return {
    singers: n,
    rows,
    units,
    perRow,
    w: riserW + PAD_W,
    h: depth + PAD_H,
    riser: { x0: -riserW / 2, x1: riserW / 2, steps, joins },
    at,
  };
}

/** How many area microphones a choir wants: about one for every 2.5 m of
 *  its width, at least one, at most six. */
export const spChoirMics = (lay: Pick<SpChoirLayout, 'w'>): number => Math.max(1, Math.min(6, Math.ceil(lay.w / 2.5 - 1e-9)));

const num = (v: number): string => (Math.round(v * 10) / 10).toString();

/** "11 singers in 3 rows, on one 6 ft three-step riser unit (1.8 m wide)". */
export function spChoirWords(c: SpChoir): string {
  const lay = spChoirLayout(c);
  const who = `${lay.singers} singers in ${lay.rows === 1 ? 'one row' : `${lay.rows} rows`}`;
  if (!lay.riser) return `${who}, standing on the floor (${num(lay.w)} m wide)`;
  const step = ['', 'one-step', 'two-step', 'three-step', 'four-step'][lay.rows] ?? `${lay.rows}-step`;
  // (a count in words: "3 6 ft" would read as one number)
  const count = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][lay.units - 1] ?? String(lay.units);
  const units = lay.units === 1 ? `one 6 ft ${step} riser unit` : `${count} 6 ft ${step} riser units side by side`;
  return `${who}, on ${units} (${num(lay.w)} m wide, ${num(lay.h)} m deep)`;
}

/** The placement words every area-microphone package prints. */
export const SP_CHOIR_MIC_HOW =
  'About one microphone for every 2.5 m of choir width (each covers 15 to 20 voices), on tall stands 0.6 to 0.9 m in front of the front row and 0.3 to 0.6 m above the back row’s heads, aimed at the back row. Keep the microphones at least three times as far from each other as each one is from the front row, and use as few as cover the choir: every open microphone adds feedback. Leave about 0.9 m of clear floor in front of the choir for the stands.';

/** The names of `n` area microphones, stage right to stage left. */
export function spChoirMicNames(n: number): string[] {
  if (n === 1) return ['Choir'];
  if (n === 2) return ['Choir L', 'Choir R'];
  if (n === 3) return ['Choir L', 'Choir C', 'Choir R'];
  return Array.from({ length: n }, (_, i) => `Choir ${i + 1}`);
}

/** The catalog id of the area-microphone package with `n` microphones. */
export const spChoirPackageId = (n: number): string => ['choir-one', 'choir-two', 'choir-three', 'choir-four', 'choir-five', 'choir-six'][Math.max(1, Math.min(6, n)) - 1]!;
