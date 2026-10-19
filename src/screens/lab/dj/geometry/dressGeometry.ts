/**
 * dressGeometry — Screens 3 and 4 (overnight fix 2026-10-19, grades in
 * docs/labs/dj/grades/screens_01_08.json): pure TypeScript, so
 * test/djCables.test.ts can check every cable exactly as it is drawn.
 *
 *  - DRESSED RUNS. A cable is laid out as a lane (a polyline of control
 *    points), then DRESSED: its bends get a real bend radius, and every
 *    horizontal span that hangs free between two supports sags in a
 *    catenary (y = a·cosh(x/a), scaled to the span's sag). Parallel cables
 *    that run together share ONE sag profile, so they stay parallel and never
 *    touch. The dressed polyline is what the drawing strokes AND what the
 *    clearance test measures.
 *  - SCREEN 3: the source's rear above the mixer's rear, each RCA lead in its
 *    own lane: the lead for a TOP-row jack drops straight into it; the lead
 *    for the BOTTOM-row jack comes down its own column beside the stack and
 *    hooks in from the side, so it never passes over the plug above it. The
 *    turntable's ground wire hangs in its own lane LEFT of the RCA leads (the
 *    turntable's GND post sits left of its outputs, the mixer's left of CH 1),
 *    with a spade lug at each end.
 *  - SCREEN 4: the room band at ONE stated scale (1:5) above the patch band
 *    at full size; each speaker's signal light comes from ITS OWN feed.
 */
import { MIXER_REAR_JACKS, PLAYER_REAR, PLAYER_REAR_JACKS, type Box, type Pt } from './boothGeometry.ts';
import { MONITOR_H, MONITOR_W, SPEAKER_H, SPEAKER_W } from './gearGeometry.ts';
import { FLAG, FLAG_TEXT, MAP, MAP_BODIES, MAP_PLUGS, TIED, FLOOR_Y, PLUG_R, farKindOf, fixedEnd, fixedKindOf, jackPt, phonesJackPt, routeOf, type SpeakerKey } from './mapGeometry.ts';
import { PLUGS, deviceLive, speakerFeed, type Booth, type JackId, type PlugId } from '../model/djModel.ts';
import type { BoothRender } from '../engine/djRender.ts';

export type P2 = [number, number];
/** A sag profile: how far (mm) the cable hangs below its lane at x. */
export type Profile = (x: number) => number;

/* ── dressing ─────────────────────────────────────────────────────────── */

/**
 * A catenary hung between x0 and x1, `sag` mm deep at its middle:
 * f(x) = sag · (cosh c − cosh(c·u)) / (cosh c − 1), u = (x − mid) / half.
 * (c = 1.6: a cable a little heavier than its stiffness.) Zero outside.
 */
export function catenary(x0: number, x1: number, sag: number, c = 1.6): Profile {
  const lo = Math.min(x0, x1);
  const hi = Math.max(x0, x1);
  const mid = (lo + hi) / 2;
  const half = Math.max(1e-6, (hi - lo) / 2);
  const den = Math.cosh(c) - 1;
  return (x) => {
    const u = (x - mid) / half;
    if (u <= -1 || u >= 1) return 0;
    return (sag * (Math.cosh(c) - Math.cosh(c * u))) / den;
  };
}

/**
 * Dress a lane: round every bend (radius up to `corner` mm) and let each
 * horizontal span with a profile hang by it. Returns a dense polyline (mm).
 * The first and last points (the jacks) never move.
 */
export function dressPoints(pts: readonly P2[], profileOf?: (a: P2, b: P2, i: number) => Profile | null, opt: { corner?: number; step?: number } = {}): P2[] {
  const n = pts.length;
  if (n < 2) return pts.map((p) => [p[0], p[1]] as P2);
  const corner = opt.corner ?? 16;
  const step = opt.step ?? 4;
  const prof: (Profile | null)[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    prof.push(Math.abs(a[1] - b[1]) < 0.5 && Math.abs(a[0] - b[0]) > 1 && profileOf ? profileOf(a as P2, b as P2, i) : null);
  }
  // the control points, with each bend on a hanging span lowered onto it
  const c: P2[] = pts.map((p) => [p[0], p[1]]);
  for (let i = 1; i < n - 1; i++) {
    const pr = prof[i - 1] ?? prof[i];
    if (pr) c[i][1] = pts[i][1] + pr(pts[i][0]);
  }
  const onSpan = (i: number, x: number, y: number): number => (prof[i] ? pts[i][1] + prof[i]!(x) : y);
  const out: P2[] = [[c[0][0], c[0][1]]];
  const push = (p: P2) => {
    const l = out[out.length - 1];
    if (Math.abs(l[0] - p[0]) > 1e-6 || Math.abs(l[1] - p[1]) > 1e-6) out.push(p);
  };
  const span = (from: P2, to: P2, i: number) => {
    if (!prof[i]) {
      push(to);
      return;
    }
    const m = Math.max(1, Math.ceil(Math.abs(to[0] - from[0]) / step));
    for (let j = 1; j <= m; j++) {
      const x = from[0] + ((to[0] - from[0]) * j) / m;
      push(j === m ? to : [x, onSpan(i, x, to[1])]);
    }
  };
  let start: P2 = c[0];
  for (let i = 1; i < n; i++) {
    if (i === n - 1) {
      span(start, c[i], i - 1);
      break;
    }
    const p0 = c[i - 1];
    const p1 = c[i];
    const p2 = c[i + 1];
    const d0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
    const d1 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const k = Math.min(Math.min(d0, d1) * 0.45, corner);
    const A: P2 = [p1[0] - ((p1[0] - p0[0]) / d0) * k, p1[1] - ((p1[1] - p0[1]) / d0) * k];
    const B: P2 = [p1[0] + ((p2[0] - p1[0]) / d1) * k, p1[1] + ((p2[1] - p1[1]) / d1) * k];
    if (prof[i - 1]) A[1] = onSpan(i - 1, A[0], A[1]);
    if (prof[i]) B[1] = onSpan(i, B[0], B[1]);
    span(start, A, i - 1);
    // the bend: a quadratic through the corner, sampled
    for (let j = 1; j <= 6; j++) {
      const t = j / 6;
      const u = 1 - t;
      push([u * u * A[0] + 2 * u * t * p1[0] + t * t * B[0], u * u * A[1] + 2 * u * t * p1[1] + t * t * B[1]]);
    }
    start = B;
  }
  return out;
}

/** Minimum distance from (px, py) to a polyline (mm). */
export function distToPolyline(pts: readonly P2[], px: number, py: number): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const L2 = dx * dx + dy * dy;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / L2)) : 0;
    best = Math.min(best, Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy)));
  }
  return best;
}

/** Do two polylines cross (or touch within `gap` mm)? Sampled. */
export function polylinesMeet(a: readonly P2[], b: readonly P2[], gap: number): boolean {
  for (const p of a) if (distToPolyline(b, p[0], p[1]) < gap) return true;
  return false;
}

/* ── Screen 3: the rear stack ─────────────────────────────────────────── */

/** The turntable's rear panel (300 × 90) and its sockets (local mm). The
 *  GND post sits LEFT of the outputs, as on many decks — so the ground wire
 *  hangs to the mixer's GND post (left of CH 1) without crossing the RCA
 *  leads. */
export const TT_REAR = { w: 300, h: 90 } as const;
export const TT_REAR_JACKS = { outL: { x: 84, y: 46 }, outR: { x: 108, y: 46 }, gnd: { x: 56, y: 46 }, preamp: { x: 176, y: 40 }, ac: { x: 230, y: 36 } } as const;

export const S3 = {
  /** The source's rear (player at x 0, turntable at x 10). */
  srcY: 0,
  ttX: 10,
  /** The mixer's rear, under the source with a 70 mm gap for the leads. */
  mix: { x: 25, y: 176 },
  frame: { x: -8, y: -8, w: 336, h: 296 } as Box,
  /** The lanes in the gap: the R lead's above the L lead's (R goes further
   *  right, so the two never cross), the ground wire's lowest. */
  lane: { R: 122, L: 136, gnd: 150 },
  /** The column beside a stacked pair that a BOTTOM-row lead comes down. */
  sideCol: 11,
  sag: 7,
} as const;

export type Source3 = 'A' | 'TT';
export const mixJack3 = (j: keyof typeof MIXER_REAR_JACKS): Pt => ({ x: S3.mix.x + MIXER_REAR_JACKS[j].x, y: S3.mix.y + MIXER_REAR_JACKS[j].y });
export const srcBox3 = (src: Source3): Box => (src === 'A' ? { x: 0, y: S3.srcY, w: PLAYER_REAR.w, h: PLAYER_REAR.h } : { x: S3.ttX, y: S3.srcY, w: TT_REAR.w, h: TT_REAR.h });
export const srcJack3 = (src: Source3, side: 'L' | 'R'): Pt => {
  const k = side === 'L' ? 'outL' : 'outR';
  return src === 'A' ? { x: PLAYER_REAR_JACKS[k].x, y: S3.srcY + PLAYER_REAR_JACKS[k].y } : { x: S3.ttX + TT_REAR_JACKS[k].x, y: S3.srcY + TT_REAR_JACKS[k].y };
};
export const ttGnd3: Pt = { x: S3.ttX + TT_REAR_JACKS.gnd.x, y: S3.srcY + TT_REAR_JACKS.gnd.y };

const BOTTOM_ROW = (j: string) => /\.R$/.test(j) && (j.startsWith('ch') || j.startsWith('booth'));

/** The lane of one RCA lead (control points), plugged into `to` or hanging
 *  loose from its socket. */
export function lane3(src: Source3, side: 'L' | 'R', to: JackId | null): P2[] {
  const a = srcJack3(src, side);
  if (!to || !to.startsWith('ch')) {
    // loose: it hangs straight down under its own plug's weight, a little
    // out from its neighbour
    const out = side === 'L' ? -4 : 4;
    return [[a.x, a.y], [a.x, a.y + 24], [a.x + out, a.y + 46]];
  }
  const d = mixJack3(to as keyof typeof MIXER_REAR_JACKS);
  const lane = S3.lane[side];
  if (BOTTOM_ROW(to)) {
    // beside the stack: right of the LINE pair (clear of its halo), or between
    // the PHONO and LINE pairs (11 mm from each column)
    const col = d.x + (to.includes('phono') ? S3.sideCol : S3.sideCol + 2);
    return [[a.x, a.y], [a.x, lane], [col, lane], [col, d.y], [d.x, d.y]];
  }
  return [[a.x, a.y], [a.x, lane], [d.x, lane], [d.x, d.y]];
}

/** The same lane, dressed: its span across the gap hangs in a catenary. */
export function run3(src: Source3, side: 'L' | 'R', to: JackId | null): P2[] {
  const l = lane3(src, side, to);
  if (l.length === 3) return dressPoints(l, undefined, { corner: 10 });
  return dressPoints(l, (a, b) => (a[1] === S3.lane[side] && b[1] === S3.lane[side] ? catenary(a[0], b[0], Math.min(S3.sag, Math.abs(b[0] - a[0]) * 0.16)) : null), { corner: 12 });
}

/** The turntable's ground wire: GND post to GND post, in its own lane. The
 *  lugs sit under the posts; the wire leaves each lug's crimp barrel, which
 *  points the way the wire goes (up from the mixer's post, down from the
 *  turntable's). */
export const GND_LUG = 9;
export function groundLane3(): P2[] {
  const a = ttGnd3;
  const b = mixJack3('gnd');
  const lane = S3.lane.gnd;
  return [[a.x, a.y + GND_LUG], [a.x, lane], [b.x, lane], [b.x, b.y - GND_LUG]];
}
export function groundRun3(): P2[] {
  const l = groundLane3();
  return dressPoints(l, (a, b) => (a[1] === S3.lane.gnd ? catenary(a[0], b[0], 6) : null), { corner: 10 });
}

/** Every socket centre on the Screen 3 stack (for the clearance test). */
export function sockets3(src: Source3): { id: string; x: number; y: number }[] {
  const out: { id: string; x: number; y: number }[] = [];
  for (const j of ['ch1.line.L', 'ch1.line.R', 'ch1.phono.L', 'ch1.phono.R', 'ch2.line.L', 'ch2.line.R', 'ch2.phono.L', 'ch2.phono.R', 'gnd', 'booth.L', 'booth.R'] as const) out.push({ id: j, ...mixJack3(j) });
  out.push({ id: 'src.L', ...srcJack3(src, 'L') }, { id: 'src.R', ...srcJack3(src, 'R') });
  if (src === 'TT') out.push({ id: 'src.gnd', ...ttGnd3 });
  return out;
}

/* ── Screen 4: the room band and the patch band ───────────────────────── */

/** The room band's ONE scale: gear, stands, table and speakers at 1:5. */
export const ROOM_F = 0.2;
/** The room's floor line (map mm). The patch band (mapGeometry, authored with
 *  its top at FLOOR_Y + 22) is moved down by PATCH_DY to sit under it. */
export const ROOM_FLOOR = 400;
export const PATCH_DY = ROOM_FLOOR - FLOOR_Y;
export const BUILD_FRAME: Box = { x: -8, y: -8, w: 1056, h: 840 + PATCH_DY };
/** A patch-band point on the map. */
export const patchPt = (p: Pt): Pt => ({ x: p.x, y: p.y + PATCH_DY });
export const patchBox = (b: Box): Box => ({ x: b.x, y: b.y + PATCH_DY, w: b.w, h: b.h });

/** Speakers on tripod stands (bottom of the cabinet 1.4 m up), the booth
 *  monitors on a 0.9 m table, centres along the room (mm of the map). */
export const ROOM4 = {
  cx: { paR: 112, boothR: 367, boothL: 693, paL: 936 } as Record<SpeakerKey, number>,
  table: { x: 320, w: 420 },
  paBottom: 1400,
  tableH: 900,
  /** The gear on the table, rears to you (left edges, mm of the map). */
  deckB: 412,
  mixer: 486,
  deckA: 550,
  phones: 622,
} as const;
export const roomTableTop = ROOM_FLOOR - ROOM4.tableH * ROOM_F;

export function roomSpeakerBox4(k: SpeakerKey): Box {
  const small = k.startsWith('booth');
  const w = (small ? MONITOR_W : SPEAKER_W) * ROOM_F;
  const h = (small ? MONITOR_H : SPEAKER_H) * ROOM_F;
  const bottom = small ? roomTableTop : ROOM_FLOOR - ROOM4.paBottom * ROOM_F;
  return { x: ROOM4.cx[k] - w / 2, y: bottom - h, w, h };
}

/**
 * A speaker's signal light, from ITS OWN feed: which mixer output and side
 * is plugged into it (djModel.speakerFeed), and whether that output side
 * carries signal in the last render. MASTER is per side; the BOOTH output's
 * level is metered as a pair, so its side is told by the bus side (the same
 * bus feeds MASTER, so a silent MASTER side means a silent bus side) — unless
 * the MASTER is all the way down, when the booth pair's level decides.
 */
export function speakerLit(b: Booth, last: BoothRender | null, k: SpeakerKey): boolean {
  if (!last) return false;
  const f = speakerFeed(b, k);
  if (!f) return false;
  const r = last.rmsDb;
  const on = (db: number) => db > -90;
  if (f.out === 'MASTER') return on(f.side === 'L' ? r.masterL : r.masterR);
  if (!on(r.booth)) return false;
  const mL = on(r.masterL);
  const mR = on(r.masterR);
  if (!mL && !mR) return true;
  return f.side === 'L' ? mL : mR;
}

/** Live on the map: a speaker is drawn live only with power AND its feed. */
export const speakerOn = (b: Booth, k: SpeakerKey): boolean => deviceLive(b, k);

/* the headphone cable on the patch band: the headphones themselves sit on the
   table in the room band (1:5); the band shows the cable at full size, from
   a break mark (it carries on up to the headphones) to the PHONES jack */
export const PHONES_BREAK: Pt = { x: 334, y: 712 };

/** Screen 4's lane for each plug (patch-band mm, before PATCH_DY): the map's
 *  own routes, except the headphone cable, which starts at its break mark. */
export function lane4(p: PlugId, to: JackId | null): P2[] {
  if (PLUGS[p].kind !== 'phones') return routeOf(p, to);
  const a = PHONES_BREAK;
  if (!to) return [[a.x, a.y], [a.x + 22, a.y], [a.x + 46, a.y - 6]];
  const b = to === 'mix.phones' ? phonesJackPt : null;
  if (!b) return routeOf(p, to);
  return [[a.x, a.y], [b.x, a.y], [b.x, b.y]];
}

/**
 * Which lanes hang together, and how deep: cables that run side by side
 * share one catenary across their joint span, so they stay parallel.
 * Lanes near the floor (the power cords' runs to the strip) lie flat.
 */
const HANG_GROUPS: { plugs: readonly PlugId[]; sag: number }[] = [
  // the outputs' runs hang between the plates and the panels' top edges
  { plugs: ['mst.xlrR', 'bth.trsR'], sag: 6 },
  { plugs: ['mst.xlrL', 'bth.trsL'], sag: 8 },
  // the inputs' pairs hang under the panels (deck A's over the mixer front)
  { plugs: ['B.rcaL', 'B.rcaR'], sag: 16 },
  { plugs: ['A.rcaL', 'A.rcaR'], sag: 5 },
];
const FLOOR_LANE = 700;
/** A span shorter than this is a step into a jack, never a hanging run. */
const MIN_HANG = 30;

function horizontalSpans(pts: readonly P2[]): { x0: number; x1: number; y: number }[] {
  const out: { x0: number; x1: number; y: number }[] = [];
  for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][1] - pts[i - 1][1]) < 0.5 && Math.abs(pts[i][0] - pts[i - 1][0]) > 1) out.push({ x0: Math.min(pts[i][0], pts[i - 1][0]), x1: Math.max(pts[i][0], pts[i - 1][0]), y: pts[i][1] });
  return out;
}

/** Screen 4's dressed run for one plug (patch-band mm), given every plug's
 *  jack (a group's shared sag needs its partners' spans). */
export function run4(p: PlugId, plugs: Partial<Record<PlugId, JackId | null>>): P2[] {
  const to = plugs[p] ?? null;
  const l = lane4(p, to);
  if (!to) return dressPoints(l, undefined, { corner: 10 });
  const g = HANG_GROUPS.find((x) => x.plugs.includes(p));
  let shared: Profile | null = null;
  if (g) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const q of g.plugs) {
      const tq = plugs[q] ?? null;
      if (!tq) continue;
      for (const s of horizontalSpans(lane4(q, tq))) {
        if (s.y >= FLOOR_LANE || s.x1 - s.x0 < MIN_HANG) continue;
        lo = Math.min(lo, s.x0);
        hi = Math.max(hi, s.x1);
      }
    }
    if (hi - lo > 40) shared = catenary(lo, hi, Math.min(g.sag, (hi - lo) * 0.05));
  }
  // power cords are dressed flat: clipped along the plates, the room's edges
  // and the floor to the strip (secondary to the audio the lesson is about)
  return dressPoints(l, (a, b) => (shared && a[1] < FLOOR_LANE && Math.abs(b[0] - a[0]) >= MIN_HANG ? shared : null), { corner: 14 });
}

/** The headphones on the table (room band, 1:5): their box. */
export const roomPhonesBox: Box = { x: ROOM4.phones, y: roomTableTop - 300 * ROOM_F, w: 200 * ROOM_F, h: 300 * ROOM_F };
export const MAP_PATCH = MAP;

/* ── the words on Screen 4's patch band ───────────────────────────────── */

export type LabelItem =
  | { kind: 'flag'; id: PlugId; text: string; live: boolean; edge: string; along: readonly P2[]; prefer: P2; loose?: Box; optional?: boolean }
  | { kind: 'name'; id: string; text: string; box: Box };
export type Placed = { id: string; kind: 'flag' | 'name'; text: string; x: number; y: number; w: number; h: number; live?: boolean; edge?: string; leader?: { x0: number; y0: number; x1: number; y1: number } };

const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * Place the patch band's words (patch mm): each name beside its device, each
 * cable's flag ON its own cable, none on gear, a plug, another word or
 * another cable where it can be helped. Greedy, in the order given. `s` is
 * the scene's pt per mm, `k` the words' zoom growth.
 */
export function placeLabels(items: readonly LabelItem[], bodies: readonly Box[], plugs: readonly { x: number; y: number; r: number }[], cables: readonly { id: string; pts: readonly P2[] }[], s: number, k: number, textWidthPt: (t: string, k: number) => number, band: Box): Placed[] {
  const out: Placed[] = [];
  const samples = cables.map((c) => {
    const pts: P2[] = [];
    for (let i = 1; i < c.pts.length; i++) {
      const [x0, y0] = c.pts[i - 1];
      const [x1, y1] = c.pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
      for (let j = 0; j < n; j++) pts.push([x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n]);
    }
    return { id: c.id, pts };
  });
  const cost = (r: Box, own: string | null) => {
    let c = 0;
    if (r.x < band.x || r.y < band.y || r.x + r.w > band.x + band.w || r.y + r.h > band.y + band.h) c += 5000;
    for (const b of bodies) {
      const o = overlap(r, b);
      if (o > 0.5) c += 2500 + (o / (r.w * r.h)) * 4000; // never on the gear
    }
    for (const p of plugs) c += (overlap(r, { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }) / (r.w * r.h)) * 6000;
    for (const q of out) c += overlap(r, { x: q.x - 1.5 / s, y: q.y - 1.5 / s, w: q.w + 3 / s, h: q.h + 3 / s }) > 0 ? 9000 : 0;
    for (const cs of samples) {
      if (cs.id === own) continue;
      let n = 0;
      for (const [x, y] of cs.pts) if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) n++;
      c += n * 60;
    }
    return c;
  };
  for (const it of items) {
    if (it.kind === 'flag' && !it.loose) {
      const pt = (9.5 * k) / s;
      const w = (textWidthPt(it.text, k) * 0.92 + 8 * k) / s;
      const h = pt * 1.32;
      let best: { c: number; x: number; y: number } | null = null;
      const pts = it.along;
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i];
        // the flag sits ON its cable: centred on it, or slid along it so the
        // cable still runs through the flag (a flag on an edge run stays in)
        for (const f of [0, -0.38, 0.38]) {
          const cx = px + f * w;
          const r = { x: cx - w / 2, y: py - h / 2, w, h };
          const c = cost(r, it.id) + Math.hypot(px - it.prefer[0], py - it.prefer[1]) * 0.6 + Math.abs(f) * 30;
          if (!best || c < best.c) best = { c, x: cx, y: py };
        }
      }
      // a secondary flag (a mains cord's) that finds no clean place waits for a closer zoom
      if (best && !(it.optional && best.c >= 2500)) out.push({ id: it.id, kind: 'flag', text: it.text, x: best.x - w / 2, y: best.y - h / 2, w, h, live: it.live, edge: it.edge });
    } else {
      // a name beside its device, or a LOOSE cable's flag beside its plug
      // (with a leader), never over the gear the loose end hangs in front of
      const isFlag = it.kind === 'flag';
      const fs = ((isFlag ? 9.5 : 10) * k) / s;
      const w = isFlag ? (textWidthPt(it.text, k) * 0.92 + 8 * k) / s : (textWidthPt(it.text, k) + 8 * k) / s;
      const h = isFlag ? fs * 1.32 : fs * 1.45;
      const b = it.kind === 'flag' ? it.loose! : it.box;
      const cands: { x: number; y: number; ax: number; ay: number }[] = [];
      for (const d of [2, 8, 16, 28, 44, 64, 92, 124].map((v) => v / s)) {
        for (const f of [0.15, 0.5, 0.85]) {
          const cx = b.x + b.w * f;
          cands.push({ x: cx - w / 2, y: b.y - d - h, ax: cx, ay: b.y });
          cands.push({ x: cx - w / 2, y: b.y + b.h + d, ax: cx, ay: b.y + b.h });
          const cy = b.y + b.h * f;
          cands.push({ x: b.x - d - w, y: cy - h / 2, ax: b.x, ay: cy });
          cands.push({ x: b.x + b.w + d, y: cy - h / 2, ax: b.x + b.w, ay: cy });
        }
      }
      let best: { c: number; x: number; y: number; ax: number; ay: number } | null = null;
      for (const cd of cands) {
        const r = { x: cd.x, y: cd.y, w, h };
        const lx = Math.max(r.x, Math.min(r.x + r.w, cd.ax));
        const ly = Math.max(r.y, Math.min(r.y + r.h, cd.ay));
        const c = cost(r, null) + Math.hypot(lx - cd.ax, ly - cd.ay) * s * 0.8;
        if (!best || c < best.c) best = { c, ...cd };
      }
      if (best) {
        const r = { x: best.x, y: best.y, w, h };
        const lx = Math.max(r.x, Math.min(r.x + r.w, best.ax));
        const ly = Math.max(r.y, Math.min(r.y + r.h, best.ay));
        const long = Math.hypot(lx - best.ax, ly - best.ay) * s > 6;
        if (it.kind === 'flag' && it.optional && best.c >= 2500) continue;
        out.push({ id: it.id, kind: it.kind, text: it.text, ...r, leader: long ? { x0: best.ax, y0: best.ay, x1: lx, y1: ly } : undefined, live: it.kind === 'flag' ? it.live : undefined, edge: it.kind === 'flag' ? it.edge : undefined });
      }
    }
  }
  return out;
}

/** The patch band's top edge (patch mm): right under the room's floor strip. */
export const PATCH_TOP = ROOM_FLOOR + 10 - PATCH_DY;

/** Every word on Screen 4's patch band for a wiring, a set of shown flags
 *  and a zoom (`s` pt per mm, `k` the words' growth): pure, so the test can
 *  prove none sits on gear, on a plug or on another word. */
export function patchLabels4(plugsAt: Partial<Record<PlugId, JackId | null>>, shown: readonly PlugId[], live: (p: PlugId) => boolean, s: number, k: number, measure: (t: string, k: number) => number): Placed[] {
  const plugs: { x: number; y: number; r: number }[] = [];
  for (const p of MAP_PLUGS) {
    const a = fixedEnd(p);
    if (a && PLUGS[p].kind !== 'phones') plugs.push({ x: a.x, y: a.y, r: PLUG_R[fixedKindOf(p)] + 1 });
    const to = plugsAt[p];
    if (to) {
      const b = jackPt(to);
      plugs.push({ x: b.x, y: b.y, r: PLUG_R[farKindOf(p)] + 1 });
    }
  }
  const runOf = (p: PlugId): P2[] => (plugsAt[p] ? run4(p, plugsAt) : lane4(p, null));
  const bodies: Box[] = [...MAP_BODIES, MAP.front];
  const cables = MAP_PLUGS.map((p) => ({ id: p as string, pts: runOf(p) }));
  // at phone size a tied RCA pair that runs together carries ONE flag (its
  // plugs' white and red already tell L from R): "A L·R"
  const merged = new Map<PlugId, string>();
  const dropped = new Set<PlugId>();
  if (s < 0.6) {
    for (const [a, b] of TIED) {
      if (shown.includes(a) && shown.includes(b) && plugsAt[a] && plugsAt[b]) {
        merged.set(a, `${(FLAG_TEXT[a] ?? a).split(' ')[0]} L·R`);
        dropped.add(b);
      }
    }
  }
  const order = shown.filter((p) => !dropped.has(p)).sort((a, b) => (PLUGS[a].kind === 'iec' ? 1 : 0) - (PLUGS[b].kind === 'iec' ? 1 : 0));
  const edgeOf = (p: PlugId) => (PLUGS[p].kind === 'rca' ? (p.endsWith('R') ? '#7a2018' : '#8d9097') : PLUGS[p].kind === 'xlr' ? '#3d4046' : '#6f757e');
  const items: LabelItem[] = [
    { kind: 'name', id: 'db', text: 'DECK B', box: MAP_BODIES[0] },
    { kind: 'name', id: 'mx', text: 'MIXER', box: MAP_BODIES[1] },
    { kind: 'name', id: 'da', text: 'DECK A', box: MAP_BODIES[2] },
    { kind: 'name', id: 'st', text: 'POWER STRIP', box: MAP_BODIES[3] },
    { kind: 'name', id: 'hp', text: 'TO THE HEADPHONES', box: { x: PHONES_BREAK.x - 6, y: PHONES_BREAK.y - 7, w: 12, h: 14 } },
    ...order.map((p): LabelItem => {
      const along = runOf(p);
      const plugged = plugsAt[p] != null;
      // candidates: points along the run, away from its plugs
      const a0 = along[0];
      const a1 = along[along.length - 1];
      const cands: P2[] = [];
      for (let i = 1; i < along.length; i++) {
        const [x0, y0] = along[i - 1];
        const [x1, y1] = along[i];
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8));
        for (let j = 0; j < n; j++) {
          const q: P2 = [x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n];
          if (Math.hypot(q[0] - a0[0], q[1] - a0[1]) > 14 && Math.hypot(q[0] - a1[0], q[1] - a1[1]) > 14) cands.push(q);
        }
      }
      if (cands.length === 0) cands.push(a1);
      const pref = (plugged ? FLAG[p] : null) ?? cands[Math.floor(cands.length / 2)];
      // a loose end's flag goes beside its plug (with a leader), off the gear
      const loose = plugged ? undefined : { x: a1[0] - 8, y: a1[1] - 8, w: 16, h: 16 };
      return { kind: 'flag', id: p, text: merged.get(p) ?? FLAG_TEXT[p] ?? PLUGS[p].short, live: live(p), edge: edgeOf(p), along: cands, prefer: pref as P2, loose, optional: PLUGS[p].kind === 'iec' };
    }),
  ];
  return placeLabels(items, bodies, plugs, cables, s, k, measure, { x: 0, y: PATCH_TOP + 2, w: 1040, h: 828 - PATCH_TOP });
}
