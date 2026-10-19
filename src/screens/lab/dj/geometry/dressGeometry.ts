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
import { MIXER_REAR, MIXER_REAR_JACKS, PLAYER_REAR, PLAYER_REAR_JACKS, type Box, type Pt } from './boothGeometry.ts';
import { MONITOR_H, MONITOR_W, SPEAKER_H, SPEAKER_W } from './gearGeometry.ts';
import { FLAG, FLAG_TEXT, LANE, MAP, MAP_BODIES, MAP_PLUGS, TIED, FLOOR_Y, PLUG_R, farKindOf, fixedEnd, fixedKindOf, jackPt, phonesJackPt, routeOf, type SpeakerKey } from './mapGeometry.ts';
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

/**
 * Screen 3, round 2 (grades screen 3, #10): the OTHER source's plugs stay
 * where they are when you switch SOURCE. Deck A patched into LINE and then
 * SOURCE → TURNTABLE leaves deck A's white and red plugs in the LINE jacks
 * (the bezel still says CH1 GETS DECK A), so the drawing keeps them there:
 * each plug in its jack, its lead leaving it and fading out (its source is
 * off this picture), in the direction with the most clear air — away from
 * the shown source's leads and plugs, the other parked lead and the empty
 * sockets.
 */
export type Parked3 = { side: 'L' | 'R'; jack: JackId; at: Pt; stub: P2[] };
export const PARK_STUB = 26;

export function parked3(active: Source3, activeTo: { L: JackId | null; R: JackId | null }, otherTo: { L: JackId | null; R: JackId | null }): Parked3[] {
  const into = (j: JackId | null) => (j && j.startsWith('ch') ? j : null);
  const aL = into(activeTo.L);
  const aR = into(activeTo.R);
  const runs: { pts: P2[]; half: number }[] = [
    { pts: run3(active, 'L', aL), half: 1.6 },
    { pts: run3(active, 'R', aR), half: 1.6 },
  ];
  if (active === 'TT') runs.push({ pts: groundRun3(), half: 1 });
  const plugs: Pt[] = [srcJack3(active, 'L'), srcJack3(active, 'R')];
  for (const j of [aL, aR]) if (j) plugs.push(mixJack3(j as keyof typeof MIXER_REAR_JACKS));
  const parkedAt = (['L', 'R'] as const)
    .map((side) => ({ side, jack: into(otherTo[side]) }))
    .filter((p): p is { side: 'L' | 'R'; jack: JackId } => !!p.jack && p.jack !== aL && p.jack !== aR);
  const taken = new Set<string>([...(aL ? [aL] : []), ...(aR ? [aR] : []), ...parkedAt.map((p) => p.jack)]);
  const empty = sockets3(active).filter((q) => q.id.startsWith('ch') || q.id.startsWith('booth') ? !taken.has(q.id) : false);
  const out: Parked3[] = [];
  for (const p of parkedAt) {
    const at = mixJack3(p.jack as keyof typeof MIXER_REAR_JACKS);
    const others = parkedAt.filter((q) => q !== p).map((q) => mixJack3(q.jack as keyof typeof MIXER_REAR_JACKS));
    let best: { score: number; stub: P2[] } | null = null;
    // straight down first, then swung either way (a lead hangs, so never up)
    // (shorter where the jacks round it are crowded: it still leaves its plug)
    for (const len of [PARK_STUB, 18, 13])
    for (const deg of [90, 115, 65, 140, 40, 165, 15]) {
      const a = (deg * Math.PI) / 180;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const stub: P2[] = [[at.x, at.y], [at.x + dx * len, at.y + dy * len]];
      let clear = Infinity;
      for (let t = 6; t <= len; t += 1) {
        const x = at.x + dx * t;
        const y = at.y + dy * t;
        for (const r of runs) clear = Math.min(clear, distToPolyline(r.pts, x, y) - r.half - 1.6);
        for (const q of plugs) clear = Math.min(clear, Math.hypot(q.x - x, q.y - y) - PLUG_R.rca - 1.6);
        for (const q of others) clear = Math.min(clear, Math.hypot(q.x - x, q.y - y) - PLUG_R.rca - 1.6);
        for (const q of empty) clear = Math.min(clear, Math.hypot(q.x - x, q.y - y) - 4.5 - 1.6);
      }
      // another parked lead's stub: never cross it
      for (const o of out) for (let t = 0; t <= len; t += 1) clear = Math.min(clear, distToPolyline(o.stub, at.x + dx * t, at.y + dy * t) - 3.2);
      const score = Math.min(clear, 4) * 10 - Math.abs(deg - 90) * 0.05 + len * 0.2;
      if (!best || score > best.score) best = { score, stub };
    }
    out.push({ side: p.side, jack: p.jack, at, stub: best!.stub });
  }
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
   a break mark (it carries on up to the headphones) to the PHONES jack.
   Round 2 (2026-10-19): the break sits 8 mm higher, so the cable keeps a
   clear 16 mm from deck B's power cord under it. */
export const PHONES_BREAK: Pt = { x: 334, y: 704 };

/**
 * Screen 4's lanes, RE-SPACED (round 2, grades screen 4: "nine leads and
 * seven cords run within a few px of each other"). Runs that share a stretch
 * now keep at least 11 mm apart (the two halves of an RCA twin lead keep
 * their 8 mm, tied): the map's own routes (mapGeometry.routeOf) with their
 * lane heights moved. Up top, under the plates: speaker power 476 / 487, the
 * MASTER runs 498 / 500 and the BOOTH runs 513 / 514 (a left-going and a
 * right-going run share a height but never a stretch). Under the panels: deck
 * B's pair 638 / 646, deck A's 658 / 666. Down low: the mixer's cord 710,
 * deck B's 720, deck A's 724, the speaker cords over the strip 738 / 750.
 */
export const LANE4: Partial<Record<PlugId, number>> = {
  'B.rcaL': 638, 'B.rcaR': 646, 'A.rcaL': 658, 'A.rcaR': 666,
  'mst.xlrR': 498, 'mst.xlrL': 500, 'bth.trsL': 513, 'bth.trsR': 514,
  'ac.paR': 476, 'ac.paL': 476, 'ac.boothR': 487, 'ac.boothL': 487,
  'ac.mixer': 710, 'ac.playerB': 720, 'ac.playerA': 724,
};
export const OVER4: Partial<Record<PlugId, number>> = { 'ac.boothR': 738, 'ac.boothL': 738, 'ac.paR': 750, 'ac.paL': 750 };
/** The map's own "over the strip" heights (mapGeometry keeps them private). */
const MAP_OVER: Partial<Record<PlugId, number>> = { 'ac.boothR': 740, 'ac.boothL': 740, 'ac.paR': 748, 'ac.paL': 748 };
/** The mixer's power cord leaves its inlet sideways, OFF the panel's right
 *  edge, before it drops to its lane (it used to drop straight down across
 *  the rear panel's face). */
export const MIXER_CORD_X = MAP.mixer.x + MIXER_REAR.w + 8;

/** Screen 4's lane for each plug (patch-band mm, before PATCH_DY): the map's
 *  own routes on the re-spaced lanes; the headphone cable starts at its break
 *  mark; the mixer's cord leaves off the panel's edge. */
export function lane4(p: PlugId, to: JackId | null): P2[] {
  if (PLUGS[p].kind === 'phones') {
    const a = PHONES_BREAK;
    if (!to) return [[a.x, a.y], [a.x + 22, a.y], [a.x + 46, a.y - 6]];
    const b = to === 'mix.phones' ? phonesJackPt : null;
    if (!b) return routeOf(p, to);
    return [[a.x, a.y], [b.x, a.y], [b.x, b.y]];
  }
  const r = routeOf(p, to);
  if (!to) return r;
  const lane = LANE4[p];
  if (p === 'ac.mixer' && lane != null && to.startsWith('strip.')) {
    const a = r[0];
    const b = r[r.length - 1];
    return [[a[0], a[1]], [MIXER_CORD_X, a[1]], [MIXER_CORD_X, lane], [b[0], lane], [b[0], b[1]]];
  }
  const was = (LANE as Partial<Record<PlugId, number>>)[p];
  const wasOver = MAP_OVER[p];
  const over = OVER4[p];
  return r.map(([x, y]): P2 => [x, lane != null && y === was ? lane : over != null && y === wasOver ? over : y]);
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

/** How deep a loose end dips below its chord as drawn (art/cables default). */
export const LOOSE_SAG = 16;

/**
 * The run EXACTLY as Screen 4 draws it (patch mm): a plugged cable's dressed
 * run; a loose one's lane with its last stretch sagging to where the plug
 * lies (the quadratic art/parts.sagPath strokes, sampled). The words and the
 * test keep off THIS.
 */
export function drawnRun4(p: PlugId, plugs: Partial<Record<PlugId, JackId | null>>): P2[] {
  if (plugs[p]) return run4(p, plugs);
  const l = lane4(p, null);
  if (l.length < 2) return l;
  const pre = l.slice(0, -1);
  const a = pre[pre.length - 1];
  const b = l[l.length - 1];
  const mx = (a[0] + b[0]) / 2;
  const my = Math.max(a[1], b[1]) + LOOSE_SAG;
  const out: P2[] = pre.map((q) => [q[0], q[1]]);
  for (let j = 1; j <= 12; j++) {
    const t = j / 12;
    const u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * mx + t * t * b[0], u * u * a[1] + 2 * u * t * my + t * t * b[1]]);
  }
  return out;
}

/** Half a cable's drawn width on Screen 4 (mm): art/cables WIDTH, a mains
 *  cord at its "quiet" 62 %. */
export function cableHalf4(p: PlugId): number {
  const k = PLUGS[p].kind;
  return k === 'rca' ? 1.6 : k === 'xlr' ? 2.3 : k === 'trs' ? 2.1 : k === 'phones' ? 1.5 : (6.2 * 0.62) / 2;
}

/** The headphones on the table (room band, 1:5): their box. */
export const roomPhonesBox: Box = { x: ROOM4.phones, y: roomTableTop - 300 * ROOM_F, w: 200 * ROOM_F, h: 300 * ROOM_F };
export const MAP_PATCH = MAP;

/** The patch band's top edge (patch mm): right under the room's floor strip. */
export const PATCH_TOP = ROOM_FLOOR + 10 - PATCH_DY;
/** The patch band as the words may use it (patch mm). */
export const PATCH_BAND: Box = { x: 0, y: PATCH_TOP + 2, w: 1040, h: 828 - PATCH_TOP };

/* ── the FOLLOW view (round 2): the active lead, close up ─────────────── */

/**
 * The part of the patch band (patch mm) the CABLE view opens on for one plug:
 * its whole run as drawn, both plugs and a margin — at least `minW` wide —
 * grown to the glass's shape (`aspect` = width ÷ height) and kept inside the
 * band. A loose cable shows the device it hangs from, so you can see where it
 * comes from before you choose where it goes.
 */
export function followBox4(p: PlugId, plugs: Partial<Record<PlugId, JackId | null>>, aspect: number, minW = 340): Box {
  const pts = drawnRun4(p, plugs);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const add = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (const q of pts) add(q[0], q[1]);
  const pad = 30;
  x0 -= pad;
  y0 -= pad;
  x1 += pad;
  y1 += pad;
  if (!plugs[p] && PLUGS[p].kind !== 'phones') {
    // the device (or plate) the loose cable hangs from
    const a = fixedEnd(p);
    const body = a ? [...MAP_BODIES].find((b) => a.x >= b.x && a.x <= b.x + b.w && a.y >= b.y && a.y <= b.y + b.h) : null;
    if (body) add(body.x - 10, body.y - 10), add(body.x + body.w + 10, body.y + body.h + 10);
  }
  let w = Math.max(x1 - x0, minW);
  let h = y1 - y0;
  const asp = Math.max(0.3, aspect);
  if (w / h < asp) w = h * asp;
  else h = w / asp;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const B = { x: -8, y: PATCH_TOP - 2, w: 1056, h: 840 - (PATCH_TOP - 2) };
  if (w > B.w) {
    h *= B.w / w;
    w = B.w;
  }
  let x = cx - w / 2;
  let y = cy - h / 2;
  x = Math.max(B.x, Math.min(B.x + B.w - w, x));
  y = h >= B.h ? B.y + (B.h - h) / 2 : Math.max(B.y, Math.min(B.y + B.h - h, y));
  return { x, y, w, h };
}

/* ── the words on Screen 4's patch band ───────────────────────────────── */

export type LabelItem =
  | { kind: 'flag'; id: PlugId; text: string; live: boolean; edge: string; along: readonly P2[]; prefer: P2; loose?: Box; optional?: boolean }
  | { kind: 'name'; id: string; text: string; box: Box; optional?: boolean };
export type Placed = { id: string; kind: 'flag' | 'name'; text: string; x: number; y: number; w: number; h: number; live?: boolean; edge?: string; leader?: { x0: number; y0: number; x1: number; y1: number } };
/** A cable as the words see it: its drawn polyline and half its width. */
export type CableObstacle = { id: string; pts: readonly P2[]; half: number };

const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** The length (mm) of the segment a→b that lies inside the box (Liang–Barsky). */
export function clipLength(ax: number, ay: number, bx: number, by: number, r: Box): number {
  const dx = bx - ax;
  const dy = by - ay;
  let t0 = 0;
  let t1 = 1;
  const edges: [number, number][] = [
    [-dx, ax - r.x],
    [dx, r.x + r.w - ax],
    [-dy, ay - r.y],
    [dy, r.y + r.h - ay],
  ];
  for (const [p, q] of edges) {
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return 0;
    } else {
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return 0;
    }
  }
  return (t1 - t0) * Math.hypot(dx, dy);
}

/** How much of a cable (mm) runs through a box grown by `grow` mm all round. */
export function cableInBox(pts: readonly P2[], r: Box, grow: number): number {
  const g = { x: r.x - grow, y: r.y - grow, w: r.w + grow * 2, h: r.h + grow * 2 };
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (Math.max(x0, x1) < g.x || Math.min(x0, x1) > g.x + g.w || Math.max(y0, y1) < g.y || Math.min(y0, y1) > g.y + g.h) continue;
    len += clipLength(x0, y0, x1, y1, g);
  }
  return len;
}

function crosses(a: readonly [number, number, number, number], b: readonly [number, number, number, number]): boolean {
  const d = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const d1 = d(b[0], b[1], b[2], b[3], a[0], a[1]);
  const d2 = d(b[0], b[1], b[2], b[3], a[2], a[3]);
  const d3 = d(a[0], a[1], a[2], a[3], b[0], b[1]);
  const d4 = d(a[0], a[1], a[2], a[3], b[2], b[3]);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** Evenly spaced points along a polyline (at most `n`), with the direction there. */
function stations(pts: readonly P2[], n: number, keepOff: number): { x: number; y: number; tx: number; ty: number }[] {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (total <= 0) return [];
  const step = Math.max(6, total / n);
  const out: { x: number; y: number; tx: number; ty: number }[] = [];
  let acc = 0;
  let next = Math.min(keepOff, total / 2);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L <= 0) continue;
    while (next <= acc + L && next <= total - Math.min(keepOff, total / 2) + 1e-6) {
      const t = (next - acc) / L;
      out.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, tx: (x1 - x0) / L, ty: (y1 - y0) / L });
      next += step;
    }
    acc += L;
  }
  return out;
}

/**
 * Place the patch band's words (patch mm). Round 2 (grades screen 4): a
 * cable's flag sits JUST OFF its cable, beside it, with a short leader to it
 * — never on any cable (its own included), never at a crossing; each name
 * beside its device, clear of the cables too; none on gear, a plug or
 * another word. Greedy, in the order given. `s` is the scene's pt per mm,
 * `k` the words' zoom growth. An `optional` word that finds no clean place
 * waits for a closer zoom; a required one always shows (the cable you are
 * working on, the three devices).
 */
export function placeLabels(items: readonly LabelItem[], bodies: readonly Box[], plugs: readonly { x: number; y: number; r: number }[], cables: readonly CableObstacle[], s: number, k: number, textWidthPt: (t: string, k: number) => number, band: Box): Placed[] {
  const out: Placed[] = [];
  const air = 1.5 / s; // the clear air a word keeps round a cable (1.5 pt)
  const legs: [number, number, number, number][] = [];
  // every cable segment in a coarse grid, so a word asks only its neighbours
  const CELL = 32;
  const segs: { x0: number; y0: number; x1: number; y1: number; grow: number; ci: number }[] = [];
  const grid = new Map<number, number[]>();
  const key = (gx: number, gy: number) => (gx + 512) * 4096 + (gy + 512);
  cables.forEach((cb, ci) => {
    const grow = cb.half + air;
    for (let i = 1; i < cb.pts.length; i++) {
      const [x0, y0] = cb.pts[i - 1];
      const [x1, y1] = cb.pts[i];
      const id = segs.push({ x0, y0, x1, y1, grow, ci }) - 1;
      for (let gx = Math.floor((Math.min(x0, x1) - grow) / CELL); gx <= Math.floor((Math.max(x0, x1) + grow) / CELL); gx++) {
        for (let gy = Math.floor((Math.min(y0, y1) - grow) / CELL); gy <= Math.floor((Math.max(y0, y1) + grow) / CELL); gy++) {
          const kk = key(gx, gy);
          const cell = grid.get(kk);
          if (cell) cell.push(id);
          else grid.set(kk, [id]);
        }
      }
    }
  });
  const stamp = new Int32Array(segs.length);
  let tick = 0;
  const near = (x0: number, y0: number, x1: number, y1: number, fn: (i: number) => void) => {
    tick++;
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) {
      for (let gy = Math.floor(y0 / CELL); gy <= Math.floor(y1 / CELL); gy++) {
        const cell = grid.get(key(gx, gy));
        if (!cell) continue;
        for (const i of cell) {
          if (stamp[i] === tick) continue;
          stamp[i] = tick;
          fn(i);
        }
      }
    }
  };
  const hitCables = new Float64Array(cables.length);
  /** How much cable (mm, each cable grown by its half width and the air)
   *  runs through a box, and through how many cables. */
  const onCables = (r: Box): { len: number; n: number } => {
    hitCables.fill(0);
    near(r.x, r.y, r.x + r.w, r.y + r.h, (i) => {
      const g = segs[i];
      const L = clipLength(g.x0, g.y0, g.x1, g.y1, { x: r.x - g.grow, y: r.y - g.grow, w: r.w + g.grow * 2, h: r.h + g.grow * 2 });
      if (L > 0) hitCables[g.ci] += L;
    });
    let len = 0;
    let n = 0;
    for (let i = 0; i < hitCables.length; i++) if (hitCables[i] > 0) (len += hitCables[i]), n++;
    return { len, n };
  };
  const cost = (r: Box, bound: number) => {
    let c = 0;
    if (r.x < band.x || r.y < band.y || r.x + r.w > band.x + band.w || r.y + r.h > band.y + band.h) c += 5000;
    for (const b of bodies) {
      const o = overlap(r, b);
      if (o > 0.5) c += 2500 + (o / (r.w * r.h)) * 4000; // never on the gear
    }
    for (const p of plugs) {
      const o = overlap(r, { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 });
      if (o > 0) c += 2500 + (o / (r.w * r.h)) * 6000;
    }
    for (const q of out) c += overlap(r, { x: q.x - 1.5 / s, y: q.y - 1.5 / s, w: q.w + 3 / s, h: q.h + 3 / s }) > 0 ? 9000 : 0;
    for (const l of legs) if (cableInBox([[l[0], l[1]], [l[2], l[3]]], r, 0) > 0) c += 700;
    if (c > bound) return c;
    const on = onCables(r);
    if (on.n > 0) c += 3000 * on.n + on.len * 20; // never on a cable
    return c;
  };
  // a leader: short, and across as few cables (and no words) as it can help
  const legCost = (x0: number, y0: number, x1: number, y1: number, ownId: string | null) => {
    let c = Math.hypot(x1 - x0, y1 - y0) * s * 0.8;
    const seg = [x0, y0, x1, y1] as const;
    near(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), (i) => {
      const g = segs[i];
      if (cables[g.ci].id === ownId) return;
      if (crosses(seg, [g.x0, g.y0, g.x1, g.y1])) c += 40;
    });
    for (const q of out) if (cableInBox([[x0, y0], [x1, y1]], q, 0) > 0) c += 600;
    return c;
  };
  for (const it of items) {
    const isFlag = it.kind === 'flag';
    const fs = ((isFlag ? 9.5 : 10) * k) / s;
    const w = isFlag ? (textWidthPt(it.text, k) * 0.92 + 8 * k) / s : (textWidthPt(it.text, k) + 8 * k) / s;
    const h = isFlag ? fs * 1.32 : fs * 1.45;
    type Cand = { x: number; y: number; ax: number; ay: number; pref: number };
    const cands: Cand[] = [];
    if (it.kind === 'flag' && !it.loose) {
      // beside its own cable: above / below a level stretch, left / right of
      // a climbing one, at growing distances (the leader grows with it)
      const half = cables.find((c) => c.id === it.id)?.half ?? 2;
      for (const st of stations(it.along, 36, 14)) {
        const level = Math.abs(st.tx) >= Math.abs(st.ty);
        const pref = Math.hypot(st.x - it.prefer[0], st.y - it.prefer[1]) * s * 0.35;
        for (const dPt of [4, 9, 16, 28, 44, 64, 90]) {
          const d = half + air + dPt / s;
          for (const f of [0, -0.25, 0.25, -0.5, 0.5]) {
            const pf = pref + Math.abs(f) * 8;
            // across the cable first (above / below a level stretch, beside a
            // climbing one), then along it
            const x = st.x - w / 2 + f * w;
            const y = st.y - h / 2 + f * h;
            cands.push({ x, y: st.y - d - h, ax: st.x, ay: st.y, pref: pf + (level ? 0 : 12) });
            cands.push({ x, y: st.y + d, ax: st.x, ay: st.y, pref: pf + (level ? 1 : 13) });
            cands.push({ x: st.x - d - w, y, ax: st.x, ay: st.y, pref: pf + (level ? 12 : 0) });
            cands.push({ x: st.x + d, y, ax: st.x, ay: st.y, pref: pf + (level ? 13 : 1) });
          }
        }
      }
    } else {
      // a name beside its device, or a LOOSE cable's flag beside its plug
      const b = it.kind === 'flag' ? it.loose! : it.box;
      for (const d of [2, 8, 16, 28, 44, 64, 92, 124, 160, 200].map((v) => v / s)) {
        for (const f of [0.5, 0.15, 0.85, 0.3, 0.7, 0, 1]) {
          for (const g of [0, -0.4, 0.4]) {
            const pg = Math.abs(g) * 6;
            const cx = b.x + b.w * f;
            cands.push({ x: cx - w / 2 + g * w, y: b.y - d - h, ax: cx, ay: b.y, pref: pg });
            cands.push({ x: cx - w / 2 + g * w, y: b.y + b.h + d, ax: cx, ay: b.y + b.h, pref: pg });
            const cy = b.y + b.h * f;
            cands.push({ x: b.x - d - w, y: cy - h / 2 + g * h, ax: b.x, ay: cy, pref: pg });
            cands.push({ x: b.x + b.w + d, y: cy - h / 2 + g * h, ax: b.x + b.w, ay: cy, pref: pg });
          }
        }
      }
    }
    let best: { c: number; place: number; x: number; y: number; ax: number; ay: number; lx: number; ly: number } | null = null;
    for (const cd of cands) {
      const r = { x: cd.x, y: cd.y, w, h };
      const place = cost(r, best ? best.c : Infinity);
      if (best && place > best.c) continue;
      const lx = Math.max(r.x, Math.min(r.x + r.w, cd.ax));
      const ly = Math.max(r.y, Math.min(r.y + r.h, cd.ay));
      const c = place + cd.pref + legCost(cd.ax, cd.ay, lx, ly, isFlag ? it.id : null);
      if (!best || c < best.c) best = { c, place, x: cd.x, y: cd.y, ax: cd.ax, ay: cd.ay, lx, ly };
    }
    if (!best) continue;
    if (it.optional && best.place >= 2500) continue;
    const r = { x: best.x, y: best.y, w, h };
    const long = Math.hypot(best.lx - best.ax, best.ly - best.ay) * s > (isFlag ? 1 : 6);
    const leader = long ? { x0: best.ax, y0: best.ay, x1: best.lx, y1: best.ly } : undefined;
    if (leader) legs.push([leader.x0, leader.y0, leader.x1, leader.y1]);
    out.push({ id: it.id, kind: it.kind, text: it.text, ...r, leader, live: it.kind === 'flag' ? it.live : undefined, edge: it.kind === 'flag' ? it.edge : undefined });
  }
  return out;
}

/** Every cable on Screen 4's patch band as drawn, for the words to keep off. */
export function cableObstacles4(plugsAt: Partial<Record<PlugId, JackId | null>>): CableObstacle[] {
  return MAP_PLUGS.map((p) => ({ id: p as string, pts: drawnRun4(p, plugsAt), half: cableHalf4(p) }));
}

const boxesMeet = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Every word on Screen 4's patch band for a wiring, a set of shown flags and
 * a zoom (`s` pt per mm, `k` the words' growth): pure, so the test can prove
 * none sits on gear, on a plug, on another word or on ANY cable.
 *   `focus`: the flags that must show (the cable being patched, the one just
 *            patched, one in the wrong place); every other shown flag shows
 *            only where it finds clean air. Default: all of `shown`.
 *   `view`:  the part of the band on the glass (the CABLE view): words keep
 *            inside it, and a device or cable outside it gets no word.
 */
export function patchLabels4(plugsAt: Partial<Record<PlugId, JackId | null>>, shown: readonly PlugId[], live: (p: PlugId) => boolean, s: number, k: number, measure: (t: string, k: number) => number, opt: { focus?: readonly PlugId[]; view?: Box } = {}): Placed[] {
  const focus = new Set<PlugId>(opt.focus ?? shown);
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
  const bodies: Box[] = [...MAP_BODIES, MAP.front];
  const cables = cableObstacles4(plugsAt);
  const runOf = (p: PlugId): P2[] => cables.find((c) => c.id === p)!.pts as P2[];
  let band = PATCH_BAND;
  if (opt.view) {
    const v = opt.view;
    const x0 = Math.max(band.x, v.x);
    const y0 = Math.max(band.y, v.y);
    const x1 = Math.min(band.x + band.w, v.x + v.w);
    const y1 = Math.min(band.y + band.h, v.y + v.h);
    band = { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
  }
  const inView = (b: Box) => boxesMeet(b, band);
  // at phone size a tied RCA pair that runs together carries ONE flag (its
  // plugs' white and red already tell L from R): "A L·R"
  const merged = new Map<PlugId, string>();
  const dropped = new Set<PlugId>();
  if (s < 0.6) {
    for (const [a, b] of TIED) {
      if (shown.includes(a) && shown.includes(b) && plugsAt[a] && plugsAt[b]) {
        merged.set(a, `${(FLAG_TEXT[a] ?? a).split(' ')[0]} L·R`);
        dropped.add(b);
        if (focus.has(b)) focus.add(a);
      }
    }
  }
  const edgeOf = (p: PlugId) => (PLUGS[p].kind === 'rca' ? (p.endsWith('R') ? '#7a2018' : '#8d9097') : PLUGS[p].kind === 'xlr' ? '#3d4046' : '#6f757e');
  const flagItem = (p: PlugId): LabelItem | null => {
    const along = runOf(p);
    const plugged = plugsAt[p] != null;
    const seen = opt.view ? along.filter((q) => q[0] >= band.x && q[0] <= band.x + band.w && q[1] >= band.y && q[1] <= band.y + band.h) : along;
    if (seen.length === 0) return null;
    const a1 = along[along.length - 1];
    const pref = (plugged ? FLAG[p] : null) ?? seen[Math.floor(seen.length / 2)];
    // a loose end's flag goes beside its plug (with a leader), off the gear
    const loose = plugged ? undefined : { x: a1[0] - 8, y: a1[1] - 8, w: 16, h: 16 };
    return { kind: 'flag', id: p, text: merged.get(p) ?? FLAG_TEXT[p] ?? PLUGS[p].short, live: live(p), edge: edgeOf(p), along: opt.view ? seen : along, prefer: pref as P2, loose, optional: !focus.has(p) };
  };
  const near = s >= 0.6;
  const powerFocus = [...focus].some((p) => PLUGS[p].kind === 'iec');
  const names: (LabelItem & { kind: 'name' })[] = [
    { kind: 'name', id: 'db', text: 'DECK B', box: MAP_BODIES[0], optional: true },
    { kind: 'name', id: 'mx', text: 'MIXER', box: MAP_BODIES[1], optional: true },
    { kind: 'name', id: 'da', text: 'DECK A', box: MAP_BODIES[2], optional: true },
    // the front edge is the SAME mixer, seen from the front: said so
    { kind: 'name', id: 'mf', text: 'MIXER’S FRONT EDGE', box: MAP.front, optional: !!opt.view || !near },
    { kind: 'name', id: 'st', text: 'POWER STRIP', box: MAP_BODIES[3], optional: !!opt.view || !(near || powerFocus) },
    { kind: 'name', id: 'hp', text: 'TO THE HEADPHONES', box: { x: PHONES_BREAK.x - 6, y: PHONES_BREAK.y - 7, w: 12, h: 14 }, optional: !!opt.view || !near },
  ].filter((n) => inView(n.box)) as (LabelItem & { kind: 'name' })[];
  const shownFlags = shown.filter((p) => !dropped.has(p));
  const required = shownFlags.filter((p) => focus.has(p));
  const extra = shownFlags.filter((p) => !focus.has(p)).sort((a, b) => (PLUGS[a].kind === 'iec' ? 1 : 0) - (PLUGS[b].kind === 'iec' ? 1 : 0));
  const items: LabelItem[] = [
    // the cable you are working on first: it gets the clean air beside it;
    // then the devices' names (a name that finds no clean air waits for a
    // closer zoom rather than sit on gear or a cable)
    ...(required.map(flagItem).filter(Boolean) as LabelItem[]),
    ...names.filter((n) => !n.optional),
    ...names.filter((n) => n.optional),
    ...(extra.map(flagItem).filter(Boolean) as LabelItem[]),
  ];
  return placeLabels(items, bodies, plugs, cables, s, k, measure, band);
}
