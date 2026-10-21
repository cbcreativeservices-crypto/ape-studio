/**
 * eventBoardGeometry — the PURE geometry of the signal-flow boards on
 * screens 23 and 24 (no React, no Skia: the tests reach it directly):
 * each device tile's authored size, how a card shares its room between its
 * device and its words (`cardLayout`), where a cord's plug seats in a wall
 * plate or a strip, every crossing and every parallel gap between two cords,
 * and both boards' outlets, lanes and cords.
 *
 * Lab-art grade 2026-10-19: screen 23's laptop power line and ground-loop path
 * ran 3–4 px apart, screen 24's seven cords 2–4 px apart. Here every two
 * parallel cord runs are 10 board units apart or more (≥ 7.5 pt at 390 wide),
 * the cords cross at most where a hop says so, and every cord has its own
 * pattern and name (test/djEventBoards_20261019.test.ts pins all of it).
 */

export type TileKind = 'laptop' | 'player' | 'channel' | 'micch' | 'master' | 'speaker' | 'monitors' | 'phones' | 'recorder' | 'mic' | 'wall';

/** Each tile's authored box (its own units). */
export const TILE_SIZE: Record<TileKind, { w: number; h: number }> = {
  laptop: { w: 100, h: 78 },
  player: { w: 80, h: 100 },
  channel: { w: 34, h: 120 },
  micch: { w: 34, h: 84 },
  master: { w: 34, h: 300 },
  speaker: { w: 60, h: 100 },
  monitors: { w: 120, h: 84 },
  phones: { w: 90, h: 80 },
  recorder: { w: 40, h: 86 },
  mic: { w: 70, h: 80 },
  wall: { w: 30, h: 48 },
};

/** The wall plate's receptacles (plate-local, board units). */
export const WALL_PLATE = { w: 30, h: 48, top: { x: 15, y: 13 }, bottom: { x: 15, y: 35 } } as const;

/** What the layout needs of a card (EventFlow's FlowNode fits it). */
export type CardSpec = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string | readonly string[];
  art?: { kind: TileKind };
  tap?: unknown;
  extTap?: unknown;
  onAir?: boolean;
  bare?: boolean;
  reserve?: readonly string[];
  /** Readouts drawn under the sub where they fit whole (EventFlow). */
  detail?: readonly string[];
};

export type Pt = [number, number];

/* ── the card's layout (pure: the tests reach it) ─────────────────────── */

/** Split `text` into lines that fit `room` (mm) at `size` mm in the label
 *  face: one line when it fits, else at the best space; never cut. */
export function wrapMm(text: string, size: number, room: number, width: (t: string) => number): string[] {
  if (!text) return [];
  if (width(text) * size <= room) return [text];
  const words = text.split(' ');
  if (words.length < 2) return [text];
  let best: string[] = [text];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(width(a), width(b));
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
}

type Box = { x: number; y: number; w: number; h: number };
export type CardLayout = { art: Box | null; title: { x: number; y: number; lines: string[] }; sub: { x: number; y: number; lines: { t: string; onAir: boolean }[] }; lh: number; fits: boolean };

const PAD = 3;
const GAP = 3;
const METER_SLOT = 10;

/**
 * Where a card's device and words go, for label size `lm` (mm) and a text
 * measure `width` (per mm of font size). SIDE: the device on the left, as
 * big as it can be while the words fit beside it; else STACKED: the title
 * across the top, the device under it with the sub beside. The words keep
 * 9 pt; the device takes what is left (more of the card as the zoom grows).
 */
export function cardLayout(n: CardSpec, lm: number, width: (t: string) => number): CardLayout {
  const meter = n.tap || n.extTap ? METER_SLOT : 0;
  const inner = { x: n.x + PAD, y: n.y + PAD, w: n.w - 2 * PAD - meter, h: n.h - 2 * PAD };
  const lh = lm * 1.12;
  const subs = [...(n.sub == null ? [] : typeof n.sub === 'string' ? [n.sub] : n.sub)].filter(Boolean).map((t) => ({ t, onAir: false }));
  if (n.onAir) subs.push({ t: 'ON AIR', onAir: true });
  const wrapAll = (room: number) => ({
    T: wrapMm(n.title, lm, room, width),
    S: subs.flatMap((s) => wrapMm(s.t, lm, room, width).map((t) => ({ t, onAir: s.onAir }))),
  });
  const textW = (ls: readonly string[]) => (ls.length ? Math.max(...ls.map((t) => width(t) * lm)) : 0);
  if (!n.art) {
    const { T, S } = wrapAll(inner.w);
    return { art: null, title: { x: inner.x, y: inner.y, lines: T }, sub: { x: inner.x, y: inner.y + T.length * lh, lines: S }, lh, fits: textW([...T, ...S.map((s) => s.t)]) <= inner.w + 0.01 };
  }
  const asp = TILE_SIZE[n.art.kind].w / TILE_SIZE[n.art.kind].h;
  // SIDE: the largest device that leaves the words room beside it — kept
  // unless STACKED gives the device clearly more of the card
  const side = sideLayout(n, inner, asp, lh, wrapAll, textW, lm, width);
  const stacked = stackLayout(n, inner, asp, lh, subs, textW, lm, width);
  const area = (L: CardLayout | null) => (L?.art ? L.art.w * L.art.h : 0);
  if (side && (!stacked.fits || area(side) * 1.25 >= area(stacked))) return side;
  return stacked;
}

type Inner = { x: number; y: number; w: number; h: number };
type Sub = { t: string; onAir: boolean };

function sideLayout(n: CardSpec, inner: Inner, asp: number, lh: number, wrapAll: (room: number) => { T: string[]; S: Sub[] }, textW: (ls: readonly string[]) => number, lm: number, width: (t: string) => number): CardLayout | null {
  for (const frac of [0.7, 0.62, 0.55, 0.48, 0.42, 0.36, 0.3]) {
    let aw = Math.min(inner.h * asp, inner.w * frac);
    const room = inner.w - aw - GAP;
    const { T, S } = wrapAll(room);
    const R = (n.reserve ?? []).flatMap((t) => wrapMm(t, lm, room, width));
    const tw = textW([...T, ...S.map((s) => s.t), ...R]);
    const th = (T.length + Math.max(S.length, R.length ? 1 : 0)) * lh;
    if (tw <= room + 0.01 && th <= inner.h + 0.01) {
      aw = Math.max(aw, Math.min(inner.h * asp, inner.w - tw - GAP));
      const ah = aw / asp;
      // what room is left over goes either side of the pair (device + words),
      // so a zoomed card never shows an empty half
      // (the zoom's extra readouts count, so centring never squeezes them out)
      const twc = Math.max(tw, Math.min(inner.w - aw - GAP, textW(n.detail ?? [])));
      const off = Math.max(0, (inner.w - aw - GAP - twc) / 2);
      const tx = inner.x + off + aw + GAP;
      return { art: { x: inner.x + off, y: inner.y + (inner.h - ah) / 2, w: aw, h: ah }, title: { x: tx, y: inner.y, lines: T }, sub: { x: tx, y: inner.y + T.length * lh, lines: S }, lh, fits: true };
    }
  }
  return null;
}

/** STACKED: the title across the top; the device below, the sub beside it. */
function stackLayout(n: CardSpec, inner: Inner, asp: number, lh: number, subs: Sub[], textW: (ls: readonly string[]) => number, lm: number, width: (t: string) => number): CardLayout {
  const T = wrapMm(n.title, lm, inner.w, width);
  const top = T.length * lh + 1;
  const bh = Math.max(4, inner.h - top);
  const S0 = [...subs.map((s) => s.t), ...(n.reserve ?? [])];
  const sw = textW(S0);
  let aw = Math.min(bh * asp, S0.length ? inner.w - sw - GAP : inner.w);
  aw = Math.max(aw, inner.w * 0.25);
  const ah = Math.min(bh, aw / asp);
  aw = ah * asp;
  const room = inner.w - aw - GAP;
  const S = subs.flatMap((s) => wrapMm(s.t, lm, room, width).map((t) => ({ t, onAir: s.onAir })));
  const fits = textW(T) <= inner.w + 0.01 && (S.length === 0 || textW(S.map((s) => s.t)) <= room + 0.01) && top + S.length * lh <= inner.h + 0.01;
  // with nothing beside it, the device sits centred under its title
  const ax = S.length ? inner.x : inner.x + (inner.w - aw) / 2;
  return { art: { x: ax, y: inner.y + top + (bh - ah) / 2, w: aw, h: ah }, title: { x: inner.x, y: inner.y, lines: T }, sub: { x: inner.x + aw + GAP, y: inner.y + top, lines: S }, lh, fits };
}

/** Where the wall plate of a `wall` card sits (board units). */
export function wallPlateAt(n: CardSpec): { x: number; y: number } {
  return n.bare ? { x: n.x, y: n.y } : { x: n.x + 4, y: n.y + (n.h - WALL_PLATE.h) / 2 };
}
/** A wall card's receptacle centre — where a cord's plug seats. */
export function wallOutlet(n: CardSpec, which: 'top' | 'bottom'): [number, number] {
  const p = wallPlateAt(n);
  const o = which === 'top' ? WALL_PLATE.top : WALL_PLATE.bottom;
  return [p.x + o.x, p.y + o.y];
}
/** A strip card's outlet centre (y) — where a cord's plug seats. */
export const stripOutletY = (n: { y: number }): number => n.y + 12;

/* ── cords: crossings and lanes ───────────────────────────────────────── */

export const HOP_R = 2.6;

/** Crossings of segment a (axis-aligned) with segment b (perpendicular). */
function crossAt(a0: readonly [number, number], a1: readonly [number, number], b0: readonly [number, number], b1: readonly [number, number]): [number, number] | null {
  const aH = Math.abs(a0[1] - a1[1]) < 1e-6;
  const bH = Math.abs(b0[1] - b1[1]) < 1e-6;
  if (aH === bH) return null;
  const [h0, h1, v0, v1] = aH ? [a0, a1, b0, b1] : [b0, b1, a0, a1];
  const x = v0[0];
  const y = h0[1];
  const inH = x > Math.min(h0[0], h1[0]) + HOP_R && x < Math.max(h0[0], h1[0]) - HOP_R;
  const inV = y > Math.min(v0[1], v1[1]) + HOP_R && y < Math.max(v0[1], v1[1]) - HOP_R;
  return inH && inV ? [x, y] : null;
}

/** Every crossing between two orthogonal polylines (pure; for the tests). */
export function cordCrossings(a: readonly [number, number][], b: readonly [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < a.length; i++) for (let j = 1; j < b.length; j++) {
    const c = crossAt(a[i - 1], a[i], b[j - 1], b[j]);
    if (c) out.push(c);
  }
  return out;
}

/** The smallest gap (board units) between two PARALLEL runs of two cords
 *  that overlap along their length — the lane spacing (pure; for the tests). */
export function parallelGap(a: readonly [number, number][], b: readonly [number, number][]): number {
  let best = Infinity;
  for (let i = 1; i < a.length; i++) for (let j = 1; j < b.length; j++) {
    const [p0, p1] = [a[i - 1], a[i]];
    const [q0, q1] = [b[j - 1], b[j]];
    const pH = Math.abs(p0[1] - p1[1]) < 1e-6;
    const qH = Math.abs(q0[1] - q1[1]) < 1e-6;
    if (pH !== qH) continue;
    const ax = pH ? 0 : 1; // the axis along the run
    const lo = Math.max(Math.min(p0[ax], p1[ax]), Math.min(q0[ax], q1[ax]));
    const hi = Math.min(Math.max(p0[ax], p1[ax]), Math.max(q0[ax], q1[ax]));
    if (hi - lo <= 1) continue;
    best = Math.min(best, Math.abs(p0[1 - ax] - q0[1 - ax]));
  }
  return best;
}


/* ── the two boards' power (board units, about a millimetre) ──────────── */

/** Each cord's own jacket pattern (charter §8: never colour alone). */
export type CordPattern = 'ribs' | 'dash' | 'dots' | 'dashdot' | 'long' | 'short' | 'pair';
export type CordGeo = { id: string; pts: Pt[]; pattern: CordPattern; flag?: { text: string; at: Pt } };

/** Screen 23: the wall socket (another circuit) and the booth strip under
 *  the board. DJ 2's charger outlet sits LEFT of DJ 1's, so their cords never
 *  cross; DJ 1's lane is inner, DJ 2's outer (14 apart), their runs 12 apart. */
export const B23 = {
  FRAME: { x: -34, y: -14, w: 452, h: 392 } as Box,
  WALL: { x: 0, y: 308, w: 112, h: 64 } as Box,
  STRIP: { x: 150, y: 308, w: 262, h: 64 } as Box,
  OUT: { lap2: 172, lap1: 212, mixer: 288 },
  SPARE: [250, 326, 362, 396] as const,
  LANE: { lap1: -12, lap2: -26 },
  RUN: { lap1: 286, lap2: 300 },
  /** Where each cord leaves its device (the card's edge). */
  EXIT: { lap1: [0, 50] as Pt, lap2: [0, 180] as Pt, mixer: [288, 258] as Pt },
  /** The tag key, in the free corner over the strip. */
  KEY: { x: 328, y: 222 },
  /** The ground loop's name, in the free band under deck B. */
  LOOP_AT: { x: 4, y: 262 },
} as const;

export function board23Cords(charger: 'WALL' | 'STRIP' | 'NONE'): CordGeo[] {
  const { OUT, LANE, RUN, EXIT, WALL, STRIP } = B23;
  const sy = stripOutletY(STRIP);
  const wallTop = wallOutlet({ ...WALL, title: '' }, 'top');
  const out: CordGeo[] = [{ id: 'lap1', pts: [EXIT.lap1, [LANE.lap1, EXIT.lap1[1]], [LANE.lap1, RUN.lap1], [OUT.lap1, RUN.lap1], [OUT.lap1, sy]], pattern: 'ribs' }];
  if (charger === 'WALL') out.push({ id: 'lap2', pts: [EXIT.lap2, [LANE.lap2, EXIT.lap2[1]], [LANE.lap2, RUN.lap2], [wallTop[0], RUN.lap2], wallTop], pattern: 'dash', flag: { text: 'DJ 2', at: [(LANE.lap2 + wallTop[0]) / 2, RUN.lap2] } });
  else if (charger === 'STRIP') out.push({ id: 'lap2', pts: [EXIT.lap2, [LANE.lap2, EXIT.lap2[1]], [LANE.lap2, RUN.lap2], [OUT.lap2, RUN.lap2], [OUT.lap2, sy]], pattern: 'dash' });
  out.push({ id: 'mixer', pts: [EXIT.mixer, [OUT.mixer, sy]], pattern: 'dots' });
  return out;
}

/** Screen 24: the strip (one circuit) along the bottom. Every powered device
 *  has its own straight way down: deck B, the mixer and the two booth
 *  monitors drop from their cards; deck A, PA R and PA L each take their own
 *  lane. The PA L wall plate sits beside PA L. */
export const B24 = {
  FRAME: { x: -22, y: -10, w: 452, h: 370 } as Box,
  STRIP: { x: 0, y: 300, w: 426, h: 54 } as Box,
  OUT: { A: 26, B: 60, mixer: 261, boothL: 320, boothR: 356, paR: 392, paL: 410 },
  SPARE: [94, 128, 162, 196, 230] as const,
  LANE_A: -12,
  RUN_A: 292,
  WALL_AT: { x: 395, y: 104 },
  OUT_X: 298,
  OUT_W: 82,
  /** Each output's row (its route from MIX is straight). */
  ROW: { ph: { y: 0, h: 42 }, rec: { y: 50, h: 54 }, paL: { y: 112, h: 54 }, paR: { y: 174, h: 54 }, bth: { y: 236, h: 48 } },
  /** The bottom of deck B's card, the master section's and the booth card's. */
  BOTTOM: 284,
  EXIT_A: [0, 160] as Pt,
} as const;

export function board24Cords(paLWall: boolean): CordGeo[] {
  const { OUT, STRIP, LANE_A, RUN_A, WALL_AT, OUT_X, OUT_W, ROW, BOTTOM, EXIT_A } = B24;
  const sy = stripOutletY(STRIP);
  const right = OUT_X + OUT_W;
  const exitL = ROW.paL.y + ROW.paL.h - 8;
  const exitR = ROW.paR.y + ROW.paR.h - 8;
  const wallBottom = wallOutlet({ ...WALL_AT, w: WALL_PLATE.w, h: WALL_PLATE.h, title: '', bare: true }, 'bottom');
  return [
    { id: 'A', pts: [EXIT_A, [LANE_A, EXIT_A[1]], [LANE_A, RUN_A], [OUT.A, RUN_A], [OUT.A, sy]], pattern: 'ribs' },
    { id: 'B', pts: [[OUT.B, BOTTOM], [OUT.B, sy]], pattern: 'dash' },
    { id: 'mixer', pts: [[OUT.mixer, BOTTOM], [OUT.mixer, sy]], pattern: 'dots' },
    { id: 'boothL', pts: [[OUT.boothL, BOTTOM], [OUT.boothL, sy]], pattern: 'dashdot' },
    { id: 'boothR', pts: [[OUT.boothR, BOTTOM], [OUT.boothR, sy]], pattern: 'short' },
    { id: 'paR', pts: [[right, exitR], [OUT.paR, exitR], [OUT.paR, sy]], pattern: 'long' },
    paLWall ? { id: 'paL', pts: [[right, exitL], [OUT.paL, exitL], wallBottom], pattern: 'pair' } : { id: 'paL', pts: [[right, exitL], [OUT.paL, exitL], [OUT.paL, sy]], pattern: 'pair' },
  ];
}
