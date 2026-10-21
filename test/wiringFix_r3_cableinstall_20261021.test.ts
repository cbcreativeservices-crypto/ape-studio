/**
 * Wiring fix round 3 (owner decisions 2026-10-21), geometry pinned from the
 * source (the art imports Skia, so its constants are evaluated here).
 *  - Cable Install stage plan, wedge power: every powered wedge has its OWN
 *    mains lead from its own quad-box outlet — no wedge-to-wedge link — each
 *    lead its own lane, upstage of the line-level feed lanes, crossing them
 *    square, never through a wedge, covered at the stair walkway (R1, R2, R6).
 *  - Cable Install drum fan-out: KEEP four tails (kick, snare, two overheads).
 *  - Sound Systems venue plot: the BARRIER word sits clear of every wall-loom
 *    lane (it used to sit under the stage-left loom's inner lanes).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const FLOOR = read('src/screens/lab/cableinstall/scenes/FloorScene.tsx');
const ART = read('src/screens/lab/cableinstall/scenes/floorArt.tsx');
const stagePlan = FLOOR.slice(FLOOR.indexOf('function StagePlan('), FLOOR.indexOf('/* ── route drawing shared'));
const artNum = (name: string) => Number(ART.match(new RegExp(`export const ${name} = ([\\d.]+);`))![1]);

/* the stage plan's layout constants, evaluated */
type Geo = {
  VOX_XS: readonly number[];
  WEDGE_Y: number;
  WEDGE_HALF: number;
  WEDGE_AC_Y: number;
  AC_BEHIND_Y: number;
  AC_FEED_Y: number;
  AC_PITCH: number;
  SEND_X: readonly number[];
  SEND_Y: readonly number[];
  J_MON: { x: number; y: number }[];
  STAIR: { x: number; w: number };
  QUAD: { w: number; h: number; plug: number };
  WQUAD: { x: number; slots: readonly number[] };
  WQUAD2: { x: number; slots: readonly number[] };
  WEDGE_MAINS: readonly string[];
  QUAD_PLUGS: readonly (readonly [number, number])[];
  DRUM_TAILS: readonly number[];
};
const region = FLOOR.slice(FLOOR.indexOf('const PLOT = '), FLOOR.indexOf('/** A numbered hazard badge'));
const G: Geo = new Function(
  stripTypeScriptTypes(`const WEDGE_JACK_DX = ${artNum('WEDGE_JACK_DX')}; const WEDGE_JACK_DY = ${artNum('WEDGE_JACK_DY')};\n${region}\n`) +
    'return { VOX_XS, WEDGE_Y, WEDGE_HALF, WEDGE_AC_Y, AC_BEHIND_Y, AC_FEED_Y, AC_PITCH, SEND_X, SEND_Y, J_MON, STAIR, QUAD, WQUAD, WQUAD2, WEDGE_MAINS, QUAD_PLUGS, DRUM_TAILS };',
)();
const WEDGE_W = artNum('WEDGE_W');
const WEDGE_D = artNum('WEDGE_D');

/** An orthogonal path (M x y, then H / V) → its corner points. */
function corners(d: string): [number, number][] {
  const tok = d.trim().split(/\s+|(?=[MHV])/).filter(Boolean);
  const pts: [number, number][] = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < tok.length; i++) {
    const t = tok[i];
    if (t.startsWith('M')) {
      x = Number(t.slice(1));
      y = Number(tok[++i]);
    } else if (t.startsWith('H')) x = Number(t.slice(1));
    else if (t.startsWith('V')) y = Number(t.slice(1));
    else throw new Error(`unexpected token ${t} in ${d}`);
    pts.push([x, y]);
  }
  return pts;
}
type Seg = { x0: number; y0: number; x1: number; y1: number };
const segs = (pts: [number, number][]): Seg[] => pts.slice(1).map(([x1, y1], i) => ({ x0: pts[i][0], y0: pts[i][1], x1, y1 }));
const horiz = (s: Seg) => s.y0 === s.y1;
const lo = (a: number, b: number) => Math.min(a, b);
const hi = (a: number, b: number) => Math.max(a, b);

/** The feeder from the SL quad box to the stair quad box, as drawn. */
const FEEDER = `M${G.WQUAD.x - G.QUAD.plug} ${G.AC_FEED_Y} H${G.WQUAD2.x + G.QUAD.w}`;
const AC_RUNS = [...G.WEDGE_MAINS, FEEDER];
/** The dressed line-level feeds: return jack → down → along the lip → up into the wedge. */
const FEEDS = G.VOX_XS.map((_, i) => segs(corners(`M${G.SEND_X[i]} 155.8 V${G.SEND_Y[i]} H${G.J_MON[i].x} V${G.J_MON[i].y}`)));

test('no wedge-to-wedge power link: nothing leaves a wedge but its own lead in', () => {
  assert.equal(G.WEDGE_MAINS.length, 3, 'one mains lead per wedge');
  assert.doesNotMatch(stagePlan, /- WEDGE_HALF/, 'no AC connector or run at a wedge side other than its inlet');
  assert.doesNotMatch(FLOOR, /links its mains|link out to the next|then wedge to wedge/);
  for (const d of G.WEDGE_MAINS) {
    const pts = corners(d);
    const [start] = pts;
    const onWedge = G.VOX_XS.some((x) => Math.abs(start[0] - (x + G.WEDGE_HALF)) < 0.01 || Math.abs(start[0] - (x - G.WEDGE_HALF)) < 0.01);
    assert.ok(!onWedge, `lead ${d} starts at a quad box, never at a wedge`);
    // and never touches a wedge's other (SR) side, where a link out would sit
    for (const [px, py] of pts) assert.ok(!G.VOX_XS.some((x) => Math.abs(px - (x - G.WEDGE_HALF)) < 0.01 && Math.abs(py - G.WEDGE_AC_Y) < 2), `lead ${d} touches a wedge's SR side`);
  }
  // the a11y text and the caption say each wedge has its own lead
  assert.match(stagePlan, /each on its own mains lead from its own quad-box outlet/);
  assert.match(FLOOR, /red = AC power \(quad boxes, and each wedge's own mains lead from its own quad-box outlet/);
});

test("each powered wedge has its own mains run: own outlet, plug seated, ends on that wedge's inlet", () => {
  const outlets = new Set<string>();
  G.WEDGE_MAINS.forEach((d, i) => {
    const pts = corners(d);
    const [sx, sy] = pts[0];
    const [ex, ey] = pts[pts.length - 1];
    assert.equal(ex, G.VOX_XS[i] + G.WEDGE_HALF, `lead ${i + 1} ends on wedge ${i + 1}'s SL side panel`);
    assert.equal(ey, G.WEDGE_AC_Y, `lead ${i + 1} ends at the inlet height`);
    const box = [G.WQUAD, G.WQUAD2].find((b) => Math.abs(sx - (b.x - G.QUAD.plug)) < 0.01);
    assert.ok(box, `lead ${i + 1} starts at a quad box's plug`);
    assert.ok(box!.slots.includes(sy), `lead ${i + 1} leaves on one of that box's outlets`);
    assert.ok(G.QUAD_PLUGS.some(([bx, py]) => bx === box!.x && py === sy), `lead ${i + 1}'s plug is drawn seated`);
    outlets.add(`${box!.x}/${sy}`);
  });
  assert.equal(outlets.size, 3, 'three leads, three different outlets');
  // the feeder to the stair box is plugged into the SL box, too
  assert.ok(G.WQUAD.slots.includes(G.AC_FEED_Y) && G.QUAD_PLUGS.some(([bx, py]) => bx === G.WQUAD.x && py === G.AC_FEED_Y));
  // the inlet connectors are drawn, one per wedge
  assert.match(stagePlan, /VOX_XS\.map\(\(x\) => \(\s*<Rect key=\{`acj\$\{x\}`\} x=\{x \+ WEDGE_HALF - 0\.9\}/);
  // true scale: a quad box ≈ 0.14 × 0.44 m at 32 units per metre
  assert.ok(G.QUAD.w / 32 > 0.1 && G.QUAD.w / 32 < 0.2 && G.QUAD.h / 32 > 0.3 && G.QUAD.h / 32 < 0.5);
});

test('every AC run is its own lane: never through a wedge, apart from the feed lanes, crossing them square', () => {
  const wedges = G.VOX_XS.map((x) => ({ x0: x - WEDGE_W / 2, x1: x + WEDGE_W / 2, y0: G.WEDGE_Y - WEDGE_D / 2, y1: G.WEDGE_Y + WEDGE_D / 2 }));
  for (const d of AC_RUNS) {
    for (const s of segs(corners(d))) {
      // never through a wedge body (touching its side panel at the inlet is the end)
      for (const w of wedges) {
        const inside = horiz(s)
          ? s.y0 > w.y0 && s.y0 < w.y1 && hi(s.x0, s.x1) > w.x0 + 0.01 && lo(s.x0, s.x1) < w.x1 - 0.01
          : s.x0 > w.x0 && s.x0 < w.x1 && hi(s.y0, s.y1) > w.y0 && lo(s.y0, s.y1) < w.y1;
        assert.ok(!inside, `${d}: segment ${JSON.stringify(s)} runs through a wedge`);
      }
      for (const feed of FEEDS) {
        for (const f of feed) {
          if (horiz(s) && horiz(f)) {
            const overlap = Math.min(hi(s.x0, s.x1), hi(f.x0, f.x1)) - Math.max(lo(s.x0, s.x1), lo(f.x0, f.x1));
            if (overlap > 0) assert.ok(f.y0 - s.y0 >= 4, `AC (y ${s.y0}) runs ${(f.y0 - s.y0).toFixed(1)} from a feed lane (y ${f.y0}) — keep ≥ 4 and upstage`);
          } else if (!horiz(s) && !horiz(f)) {
            const overlap = Math.min(hi(s.y0, s.y1), hi(f.y0, f.y1)) - Math.max(lo(s.y0, s.y1), lo(f.y0, f.y1));
            if (overlap > 0) assert.ok(Math.abs(s.x0 - f.x0) >= 2, `AC riser at x ${s.x0} lies along a feed riser at x ${f.x0}`);
          }
          // any other meeting is horizontal against vertical: a square crossing
        }
      }
    }
  }
  // the AC runs never cross one another (each its own lane)
  const all = AC_RUNS.map((d) => segs(corners(d)));
  for (let a = 0; a < all.length; a++)
    for (let b = a + 1; b < all.length; b++)
      for (const s of all[a])
        for (const t of all[b]) {
          if (horiz(s) === horiz(t)) continue;
          const [h, v] = horiz(s) ? [s, t] : [t, s];
          const crosses = v.x0 > lo(h.x0, h.x1) + 0.01 && v.x0 < hi(h.x0, h.x1) - 0.01 && h.y0 > lo(v.y0, v.y1) + 0.01 && h.y0 < hi(v.y0, v.y1) - 0.01;
          assert.ok(!crosses, `AC runs ${a} and ${b} cross`);
        }
});

test('the quad boxes and the stair crossing: clear of the walkway, the wedges, the feeds and the WEDGES word', () => {
  const box = (b: { x: number; slots: readonly number[] }) => ({ x0: b.x, x1: b.x + G.QUAD.w, y0: b.slots[0] - G.AC_PITCH / 2, y1: b.slots[0] - G.AC_PITCH / 2 + G.QUAD.h });
  const q2 = box(G.WQUAD2);
  const q1 = box(G.WQUAD);
  // the stair box: off the walkway (and its cover), short of wedge 3, above wedge 3's feed lane
  const coverX1 = G.STAIR.x - 4 + G.STAIR.w + 6.4;
  assert.ok(q2.x0 - G.QUAD.plug > coverX1, 'its plugs clear the power cover');
  assert.ok(q2.x1 < G.VOX_XS[2] - WEDGE_W / 2 - 1, 'clear of wedge 3');
  assert.ok(q2.y1 < G.SEND_Y[2] - 1.1 - 1, "clear of wedge 3's feed lane");
  // the SL box sits under the WEDGES word (x 294, baseline WEDGE_Y − 1.6), not on it
  assert.match(stagePlan, /<PlanLabel x=\{294\} y=\{WEDGE_Y - 1\.6\} text="WEDGES"/);
  assert.ok(q1.y0 > G.WEDGE_Y - 1.6 + 2, 'the SL quad box clears the WEDGES word');
  // the power cover over the walkway takes every AC lead that crosses it and ends before the audio's cover
  const coverY0 = G.WEDGE_AC_Y - 3;
  const coverY1 = coverY0 + G.AC_PITCH + 6;
  assert.match(stagePlan, /<Rect x=\{STAIR\.x - 4\} y=\{WEDGE_AC_Y - 3\} width=\{STAIR\.w \+ 6\.4\} height=\{AC_PITCH \+ 6\}/);
  for (const d of G.WEDGE_MAINS)
    for (const s of segs(corners(d)))
      if (horiz(s) && lo(s.x0, s.x1) < G.STAIR.x && hi(s.x0, s.x1) > G.STAIR.x + G.STAIR.w)
        assert.ok(s.y0 - 0.9 > coverY0 && s.y0 + 0.9 < coverY1, `lead at y ${s.y0} crosses the walkway under the power cover`);
  assert.ok(coverY1 < G.SEND_Y[2] - 4, "the power cover is apart from the feeds' cover");
  // the as-found feed lies past the stair box, never over it
  assert.match(FLOOR, /C240 164 252 168 258 176 C262 181 \$\{J_MON\[2\]\.x\} 181/);
});

test('drum fan-out: four tails (kick, snare, two overheads), each on its own input, and the text says four', () => {
  assert.equal(G.DRUM_TAILS.length, 4);
  assert.equal(new Set(G.DRUM_TAILS).size, 4);
  assert.match(FLOOR, /four XLR tails \(kick, snare, two overheads\)/);
  assert.match(stagePlan, /fans out at the snake head into four XLR tails, one per input/);
});

/* ── Sound Systems: the BARRIER word clear of the wall lines ─────────────── */
const VENUE = read('src/screens/lab/soundsystems/art/VenueView.tsx');
const SYSTEM = read('src/features/soundsystems/system.ts');
const vnum = (re: RegExp) => Number(VENUE.match(re)![1]);

test('BARRIER: the word is clear of every wall-loom lane and stays under the barrier line', () => {
  const m = VENUE.match(/const BARRIER_LABEL = \{ x: AUD\.left \+ ([\d.]+), y: ([\d.]+), x0: ([\d.]+), x1: ([\d.]+), y0: ([\d.]+), y1: ([\d.]+) \};/)!;
  assert.ok(m, 'BARRIER_LABEL is declared');
  const audLeft = vnum(/const AUD = \{ top: \d+, bottom: \d+, left: (\d+),/);
  const [x, y, x0, x1, y0, y1] = m.slice(1).map(Number);
  const lx = audLeft + x;
  // drawn from the constant, left-anchored, and listed so no run lies along it
  assert.match(VENUE, /<PlotLabel x=\{BARRIER_LABEL\.x\} y=\{BARRIER_LABEL\.y\}[^>]*textAnchor="start"[^>]*>BARRIER<\/PlotLabel>/);
  assert.doesNotMatch(VENUE, /AUD\.right - 4\} y=\{174\}[^>]*>BARRIER/);
  assert.match(VENUE, /const LABEL_BOXES = \[[\s\S]*?BARRIER_LABEL,\s*\];/);
  // the word (7 letters, condensed face ≈ 0.52 em + 1 unit tracking) fits its box
  const fs = vnum(/export const PLOT_FS = (\d+);/);
  assert.ok(x0 <= lx && lx + 7 * (0.52 * fs + 1) <= x1, 'the word fits its clear box');
  assert.ok(y0 <= y - 0.75 * fs && y1 >= y);
  // under the barrier line (y 162), above nothing it could sit on
  const barrierY = vnum(/the barrier: the sub line[^\n]*\n\s*<Line x1=\{AUD\.left\} y1=\{(\d+)\}/);
  assert.ok(y0 > barrierY, 'below the barrier line');
  // the stage-left wall loom: lanes at LOOM_WALL_X − CABLE_GAP·k — even 30 lanes stay right of the word
  const gap = vnum(/const CABLE_GAP = (\d+);/);
  const slWall = vnum(/const LOOM_WALL_X = (\d+);/);
  assert.ok(slWall - gap * 29 - 1 > x1 + 2, 'clear of the stage-left wall loom');
  // the house-left wall carries only the house-left loudspeaker runs (far wall + FOH) — one lane each,
  // with room for two more lanes pushed out by a clash
  const houseLeft = [...SYSTEM.matchAll(/role: '(main|sub|fill|delay)', label: '[^']*', x: (\d+),/g)].filter((s) => Number(s[2]) < 170).length;
  assert.ok(houseLeft >= 4);
  const srWall = vnum(/const SR_WALL_X = (\d+);/);
  assert.ok(srWall + gap * (houseLeft + 1) + 1 < x0 - 2, 'clear of the house-left wall lanes');
  // no house-left loudspeaker's position or feed tag lands on it
  const tagDy = (slot: string) => (slot === 'subL' ? -18 : 26);
  for (const s of SYSTEM.matchAll(/id: '(\w+)', role: '(main|sub|fill|delay)', label: '[^']*', x: (\d+), y: (\d+)/g)) {
    const [sx, sy] = [Number(s[3]), Number(s[4])];
    if (sx > x1 + 30) continue;
    assert.ok(!(sy > y0 - 12 && sy < y1 + 12), `${s[1]} stands clear of the word`);
    const ty = sy + tagDy(s[1]);
    assert.ok(!(ty > y0 && ty - 10 < y1) || sx - 35 > x1, `${s[1]}'s feed tag clears the word`);
  }
});
