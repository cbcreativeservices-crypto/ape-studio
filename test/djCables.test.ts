/**
 * DJ Systems Lab — cable and drawing invariants (visual review 2026-10-18).
 *
 *  - Screen 4's room map: every run starts at its own fixed end and ends at
 *    the jack it is plugged into; no route passes within ONE PLUG RADIUS of
 *    any plug it is not attached to (finding 16: the booth R cable used to
 *    climb over the booth L plug) — wired, unwired, the Screen 4 fault, and
 *    every single-plug move the PATCH tray allows; no two runs share a lane.
 *  - True dimensions (D67, SOURCES.md): the player's 7-inch screen and
 *    100 mm tempo fader; the turntable's rigid 230 mm arm about a pivot
 *    215 mm from the spindle, its rest clear of the pitch fader.
 *  - The waveform's headroom scaling puts the 99th-percentile peak at 80 %.
 *  - The cable flow pulse is decorative: Screen 4 passes it the gate.
 *  - Round 2 (2026-10-19): no flag or name on ANY cable (flags sit beside
 *    their cable with a short leader); re-spaced lanes; the mixer's cord off
 *    the panel's edge; the CABLE view; Screen 3's other-source plugs stay in
 *    their jacks across a SOURCE switch.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILT_PLUGS, PLUGS, type JackId, type PlugId } from '../src/screens/lab/dj/model/djModel.ts';
import { MAP, MAP_BODIES, MAP_PLUGS, PLUG_R, TIED, farKindOf, fixedEnd, fixedKindOf, jackPt, routeOf } from '../src/screens/lab/dj/geometry/mapGeometry.ts';
import { PLAYER, TT, stylusAt, armAngleFor, GROOVE } from '../src/screens/lab/dj/geometry/boothGeometry.ts';
import { builtBooth, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import type { BoothRender } from '../src/screens/lab/dj/engine/djRender.ts';
import * as D from '../src/screens/lab/dj/geometry/dressGeometry.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

type State = Partial<Record<PlugId, JackId | null>>;

function distToPolyline(pts: readonly [number, number][], px: number, py: number): number {
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

/** Every plug drawn on the map in a state: where it is and how big. */
function plugsIn(st: State): { owner: PlugId; x: number; y: number; r: number }[] {
  const out: { owner: PlugId; x: number; y: number; r: number }[] = [];
  for (const p of MAP_PLUGS) {
    const a = fixedEnd(p)!;
    if (PLUGS[p].kind !== 'phones') out.push({ owner: p, x: a.x, y: a.y, r: PLUG_R[fixedKindOf(p)] });
    const to = st[p] ?? null;
    if (to) {
      const b = jackPt(to);
      out.push({ owner: p, x: b.x, y: b.y, r: PLUG_R[farKindOf(p)] });
    }
  }
  return out;
}

function clearances(st: State): string[] {
  const bad: string[] = [];
  const plugs = plugsIn(st);
  for (const p of MAP_PLUGS) {
    const route = routeOf(p, st[p] ?? null);
    for (const q of plugs) {
      if (q.owner === p) continue;
      const d = distToPolyline(route, q.x, q.y);
      if (d < q.r) bad.push(`${p} passes ${d.toFixed(1)} mm from ${q.owner}'s plug at (${q.x}, ${q.y}) (radius ${q.r})`);
    }
  }
  return bad;
}

const WIRED: State = Object.fromEntries(MAP_PLUGS.map((p) => [p, BUILT_PLUGS[p]]));
const UNWIRED: State = Object.fromEntries(MAP_PLUGS.map((p) => [p, null]));

describe('DJ Systems Lab — the room map’s cables', () => {
  it('every run starts at its fixed end and ends in its jack', () => {
    for (const p of MAP_PLUGS) {
      const r = routeOf(p, WIRED[p] ?? null);
      const a = fixedEnd(p)!;
      assert.deepEqual(r[0], [a.x, a.y], `${p} starts at its fixed end`);
      const b = jackPt(WIRED[p]!);
      assert.deepEqual(r[r.length - 1], [b.x, b.y], `${p} ends in ${WIRED[p]}`);
    }
  });

  it('no route passes within one plug radius of another plug — wired', () => {
    assert.deepEqual(clearances(WIRED), []);
  });

  it('no route passes within one plug radius of another plug — unwired (every end loose)', () => {
    assert.deepEqual(clearances(UNWIRED), []);
  });

  it('no route passes within one plug radius of another plug — the Screen 4 fault', () => {
    const fault: State = { ...UNWIRED, 'A.rcaL': 'ch1.line.L', 'A.rcaR': 'ch1.line.R', 'B.rcaL': 'ch2.line.L', 'B.rcaR': 'ch2.line.R', 'bth.trsR': 'boothR.in', phones: 'mix.phones', 'mst.xlrR': 'paR.in', 'mst.xlrL': 'boothL.in', 'ac.paL': 'strip.1', 'ac.boothL': 'strip.2', 'ac.playerA': 'strip.3', 'ac.mixer': 'strip.4', 'ac.playerB': 'strip.5', 'ac.boothR': 'strip.6', 'ac.paR': 'strip.7' };
    assert.deepEqual(clearances(fault), []);
  });

  it('…and after any one move the PATCH tray allows (from the wired booth)', () => {
    const bad: string[] = [];
    for (const p of MAP_PLUGS) {
      for (const j of PLUGS[p].fits) {
        const st: State = { ...WIRED };
        for (const q of MAP_PLUGS) if (q !== p && st[q] === j) st[q] = null; // the jack it lands in frees up
        st[p] = j;
        for (const m of clearances(st)) bad.push(`${p} → ${j}: ${m}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  it('no two runs share a lane: parallel horizontal runs overlap only ≥ 7 mm apart', () => {
    const segs: { p: PlugId; y: number; x0: number; x1: number }[] = [];
    for (const p of MAP_PLUGS) {
      const r = routeOf(p, WIRED[p] ?? null);
      for (let i = 1; i < r.length; i++) {
        if (r[i][1] === r[i - 1][1] && Math.abs(r[i][0] - r[i - 1][0]) > 1) segs.push({ p, y: r[i][1], x0: Math.min(r[i][0], r[i - 1][0]), x1: Math.max(r[i][0], r[i - 1][0]) });
      }
    }
    const bad: string[] = [];
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        const a = segs[i];
        const b = segs[j];
        if (a.p === b.p) continue;
        const overlap = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        if (overlap > 2 && Math.abs(a.y - b.y) < 7) bad.push(`${a.p} and ${b.p} run together at y ${a.y}/${b.y}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  it('the flow pulse is decorative: Screen 4 hands the map the decorative gate', () => {
    const p04 = read('src/screens/lab/dj/pages/p04Build.tsx');
    assert.match(p04, /flowMotion=\{audio\.flowMotion\}/);
    assert.match(p04, /<SystemMap booth=\{booth\} last=\{last\} flow=\{flowMotion\}/);
    assert.match(read('src/screens/lab/dj/booth/useBoothAudio.ts'), /const flowMotion = useDecorativeMotion\(\);/);
  });
});

describe('DJ Systems Lab — true dimensions (SOURCES.md)', () => {
  it('the player has a 7-inch screen and a 100 mm tempo fader', () => {
    const diag = Math.hypot(PLAYER.screen.w, PLAYER.screen.h) / 25.4;
    assert.ok(Math.abs(diag - 7) < 0.1, `screen diagonal ${diag.toFixed(2)} in`);
    assert.equal(PLAYER.tempo.len, 100);
  });

  it('the tonearm is one rigid 230 mm arm about a pivot 215 mm from the spindle', () => {
    const pv = TT.armPivot;
    const d = Math.hypot(pv.x - TT.platter.cx, pv.y - TT.platter.cy);
    assert.ok(Math.abs(d - 215) < 1.5, `pivot to spindle ${d.toFixed(1)} mm`);
    for (const a of [0, 0.2, 0.45, 0.7, 0.9]) {
      const s = stylusAt(a);
      assert.ok(Math.abs(Math.hypot(s.x - pv.x, s.y - pv.y) - TT.arm.effective) < 1e-9, 'the arm never changes length');
    }
    // the stylus reaches the lead-in and the run-out grooves
    for (const r of [GROOVE.leadIn, GROOVE.runOut]) {
      const s = stylusAt(armAngleFor(r));
      assert.ok(Math.abs(Math.hypot(s.x - TT.platter.cx, s.y - TT.platter.cy) - r) < 0.1, `groove at ${r} mm`);
    }
    // at rest the stylus is off the record, and the head clears the pitch fader
    const rest = stylusAt(0);
    assert.ok(Math.hypot(rest.x - TT.platter.cx, rest.y - TT.platter.cy) > TT.platter.d / 2, 'rest is off the platter');
    assert.ok(rest.x + 22 < TT.pitch.x - TT.pitch.capW / 2, 'the headshell and its lift clear the pitch fader');
    assert.ok(rest.y + 20 < 353, 'the headshell stays on the plinth');
  });
});

describe('DJ Systems Lab — waveform layers', () => {
  it('headroom scaling puts the 99th-percentile peak at 80 % of the lane', async () => {
    const { headroomGain } = await import('../src/screens/lab/dj/art/waveHeadroom.ts');
    const hi = Array.from({ length: 1000 }, (_, i) => (i < 995 ? 0.4 : 1));
    const lo = hi.map((v) => -v * 0.9);
    assert.ok(Math.abs(headroomGain(hi, lo) * 0.4 - 0.8) < 1e-9);
  });
});

/* ── overnight fix 2026-10-19: Screens 3 and 4 (grades screens_01_08) ── */

const RCA_HALF = 1.6; // half an RCA lead's width (mm)
const lowest = (pts: readonly [number, number][], x0: number, x1: number) => Math.max(...pts.filter((p) => p[0] > Math.min(x0, x1) + 2 && p[0] < Math.max(x0, x1) - 2).map((p) => p[1]));

describe('DJ Systems Lab — Screen 3’s leads (dressed, laned, clear of every plug)', () => {
  const JACKS = ['ch1.line.L', 'ch1.line.R', 'ch1.phono.L', 'ch1.phono.R', null] as const;
  for (const src of ['A', 'TT'] as const) {
    it(`${src}: no lead passes over the other lead’s plug, in any patch the tray allows`, () => {
      const bad: string[] = [];
      for (const toL of JACKS) {
        for (const toR of JACKS) {
          if (toL && toL === toR) continue;
          const runs = { L: D.run3(src, 'L', toL), R: D.run3(src, 'R', toR) };
          const plugAt = { L: toL ? D.mixJack3(toL) : null, R: toR ? D.mixJack3(toR) : null };
          for (const [me, other] of [['L', 'R'], ['R', 'L']] as const) {
            const theirs = [D.srcJack3(src, other), plugAt[other]].filter(Boolean) as { x: number; y: number }[];
            for (const q of theirs) {
              const d = D.distToPolyline(runs[me], q.x, q.y);
              if (d < PLUG_R.rca + RCA_HALF) bad.push(`${src} L→${toL} R→${toR}: the ${me} lead passes ${d.toFixed(1)} mm from the ${other} plug at (${q.x}, ${q.y})`);
            }
          }
        }
      }
      assert.deepEqual(bad, []);
    });
  }

  it('the finding: deck A into CH1 LINE — the R lead never runs over the white plug in LINE L, and the two leads never touch', () => {
    const L = D.run3('A', 'L', 'ch1.line.L');
    const R = D.run3('A', 'R', 'ch1.line.R');
    const white = D.mixJack3('ch1.line.L');
    assert.ok(D.distToPolyline(R, white.x, white.y) >= PLUG_R.rca + RCA_HALF + 2, 'R keeps a clear lane beside the stacked pair');
    assert.ok(!D.polylinesMeet(L, R, RCA_HALF * 2 + 1), 'the two leads have their own lanes');
    assert.ok(!D.polylinesMeet(D.run3('TT', 'L', 'ch1.phono.L'), D.run3('TT', 'R', 'ch1.phono.R'), RCA_HALF * 2 + 1));
  });

  it('a patched lead hangs: its span across the gap sags in a catenary, its ends stay in their sockets', () => {
    for (const side of ['L', 'R'] as const) {
      const to = side === 'L' ? 'ch1.line.L' : 'ch1.line.R';
      const lane = D.lane3('A', side, to);
      const run = D.run3('A', side, to);
      assert.deepEqual(run[0], lane[0]);
      assert.deepEqual(run[run.length - 1], lane[lane.length - 1]);
      const drop = lowest(run, lane[1][0], lane[2][0]) - D.S3.lane[side];
      assert.ok(drop >= 4, `${side} sags ${drop.toFixed(1)} mm`);
    }
    // a loose lead hangs straight down from its socket
    const loose = D.lane3('A', 'R', null);
    assert.ok(loose[loose.length - 1][1] - loose[0][1] > 40 && Math.abs(loose[loose.length - 1][0] - loose[0][0]) < 6);
  });

  it('the turntable’s ground wire: post to post in its own lane, lugs at both ends, clear of the RCA leads and their plugs', () => {
    const g = D.groundRun3();
    const a = D.ttGnd3;
    const b = D.mixJack3('gnd');
    assert.deepEqual(g[0], [a.x, a.y + D.GND_LUG]);
    assert.deepEqual(g[g.length - 1], [b.x, b.y - D.GND_LUG]);
    assert.ok(D.TT_REAR_JACKS.gnd.x < D.TT_REAR_JACKS.outL.x, 'the turntable’s GND post sits left of its outputs');
    for (const [toL, toR] of [['ch1.phono.L', 'ch1.phono.R'], ['ch1.line.L', 'ch1.line.R'], [null, null]] as const) {
      for (const side of ['L', 'R'] as const) {
        const run = D.run3('TT', side, side === 'L' ? toL : toR);
        assert.ok(!D.polylinesMeet(g, run, 1 + RCA_HALF + 0.5), `the ground wire never touches the ${side} lead (${toL})`);
      }
      for (const j of [toL, toR]) {
        if (!j) continue;
        const q = D.mixJack3(j);
        assert.ok(D.distToPolyline(g, q.x, q.y) > PLUG_R.rca + 2, `clear of the plug in ${j}`);
      }
    }
    // the drawing uses the lugged, dressed wire — never a bare straight line
    const p03 = read('src/screens/lab/dj/pages/p03Connect.tsx');
    assert.match(p03, /<GroundWire \/>/);
    assert.match(p03, /function SpadeLug/);
    assert.doesNotMatch(p03, /<Line p1=\{vec\(10 \+ TT_REAR_JACKS\.gnd/);
  });

  it('the swing of a pulled lead is decorative motion (it follows the gate)', () => {
    assert.match(read('src/screens/lab/dj/pages/p03Connect.tsx'), /swing=\{audio\.flowMotion\}/);
  });

  it('round 2: the OTHER source’s plugs stay drawn in their jacks across a SOURCE switch, their leads clear of the shown ones', () => {
    // the finding: deck A into LINE, then SOURCE → TURNTABLE
    const kept = D.parked3('TT', { L: null, R: null }, { L: 'ch1.line.L', R: 'ch1.line.R' });
    assert.deepEqual(kept.map((q) => `${q.side}→${q.jack}`), ['L→ch1.line.L', 'R→ch1.line.R']);
    for (const q of kept) {
      const j = D.mixJack3(q.jack as 'ch1.line.L');
      assert.deepEqual(q.stub[0], [j.x, j.y], 'the plug sits IN its jack');
      assert.ok(q.stub[1][1] > q.stub[0][1], 'its lead hangs away from it');
    }
    // and back the other way: the turntable in PHONO while deck A is shown
    assert.equal(D.parked3('A', { L: null, R: null }, { L: 'ch1.phono.L', R: 'ch1.phono.R' }).length, 2);
    // every patch the tray allows, both sources: a kept lead never touches a shown lead or a shown plug
    const J = ['ch1.line.L', 'ch1.line.R', 'ch1.phono.L', 'ch1.phono.R', null] as const;
    const bad: string[] = [];
    for (const src of ['A', 'TT'] as const) {
      for (const aL of J) for (const aR of J) for (const oL of J) for (const oR of J) {
        const used = [aL, aR, oL, oR].filter(Boolean);
        if (new Set(used).size !== used.length) continue;
        const runs = [D.run3(src, 'L', aL), D.run3(src, 'R', aR)];
        const plugs = [D.srcJack3(src, 'L'), D.srcJack3(src, 'R'), ...[aL, aR].filter(Boolean).map((j) => D.mixJack3(j!))];
        const kept2 = D.parked3(src, { L: aL, R: aR }, { L: oL, R: oR });
        assert.equal(kept2.length, [oL, oR].filter(Boolean).length, `${src}: every plugged lead of the other source is drawn`);
        for (const q of kept2) {
          const [a, b] = q.stub;
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (let t = 6; t <= L; t += 1) {
            const x = a[0] + ((b[0] - a[0]) * t) / L;
            const y = a[1] + ((b[1] - a[1]) * t) / L;
            for (const r of runs) if (D.distToPolyline(r, x, y) < RCA_HALF * 2) bad.push(`${src} ${aL}/${aR} kept ${q.jack}: its lead touches a shown lead`);
            for (const pl of plugs) if (Math.hypot(pl.x - x, pl.y - y) < PLUG_R.rca + RCA_HALF) bad.push(`${src} ${aL}/${aR} kept ${q.jack}: its lead runs over a plug`);
          }
        }
      }
    }
    assert.deepEqual([...new Set(bad)], []);
    // the drawing draws them, and the AUDIO OUT callout (which covered the
    // hanging plugs and repeated the printed legend) is gone
    const p03 = read('src/screens/lab/dj/pages/p03Connect.tsx');
    assert.match(p03, /const parked = parked3\(src,/);
    assert.match(p03, /<ParkedLead key=/);
    assert.match(p03, /box && sock\.id !== 'out'/);
  });
});

describe('DJ Systems Lab — Screen 4’s map (two bands, dressed runs, per-feed lights)', () => {
  const dressedClear = (st: State) => {
    const bad: string[] = [];
    const plugs = plugsIn(st);
    for (const p of MAP_PLUGS) {
      if (PLUGS[p].kind === 'phones') continue; // its own lane (below)
      const run = st[p] ? D.run4(p, st) : routeOf(p, null);
      for (const q of plugs) {
        if (q.owner === p) continue;
        const d = D.distToPolyline(run, q.x, q.y);
        if (d < q.r) bad.push(`${p} passes ${d.toFixed(1)} mm from ${q.owner}'s plug`);
      }
    }
    return bad;
  };
  const FAULT: State = { ...UNWIRED, 'A.rcaL': 'ch1.line.L', 'A.rcaR': 'ch1.line.R', 'B.rcaL': 'ch2.line.L', 'B.rcaR': 'ch2.line.R', 'bth.trsR': 'boothR.in', phones: 'mix.phones', 'mst.xlrR': 'paR.in', 'mst.xlrL': 'boothL.in', 'ac.paL': 'strip.1', 'ac.boothL': 'strip.2', 'ac.playerA': 'strip.3', 'ac.mixer': 'strip.4', 'ac.playerB': 'strip.5', 'ac.boothR': 'strip.6', 'ac.paR': 'strip.7' };

  it('the DRESSED runs keep one plug radius from every other plug — wired, the fault, and every single move', () => {
    assert.deepEqual(dressedClear(WIRED), []);
    assert.deepEqual(dressedClear(FAULT), []);
    const bad: string[] = [];
    for (const p of MAP_PLUGS) {
      for (const j of PLUGS[p].fits) {
        const st: State = { ...WIRED };
        for (const q of MAP_PLUGS) if (q !== p && st[q] === j) st[q] = null;
        st[p] = j;
        for (const m of dressedClear(st)) bad.push(`${p} → ${j}: ${m}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  it('cables that hang together share one sag: two runs that share a span never run together', () => {
    // the mirrored rear panels make each RCA pair cross ONCE where the L lead
    // climbs past the R lead's column (a twin lead does exactly that), and a
    // booth run climbs once across the MASTER run above it; along the span
    // they stay a lane apart — a crossing, never a merge
    for (const [a, b] of [['A.rcaL', 'A.rcaR'], ['B.rcaL', 'B.rcaR'], ['mst.xlrR', 'bth.trsR'], ['mst.xlrL', 'bth.trsL']] as const) {
      const ra = D.run4(a, WIRED);
      const rb = D.run4(b, WIRED);
      let touching = 0;
      // measured every 1 mm along the run (a dressed run's long straight segments
      // would otherwise count whole where only their end meets a crossing)
      for (let i = 1; i < ra.length; i++) {
        const L = Math.hypot(ra[i][0] - ra[i - 1][0], ra[i][1] - ra[i - 1][1]);
        const n = Math.max(1, Math.ceil(L));
        for (let j = 1; j <= n; j++) {
          const x = ra[i - 1][0] + ((ra[i][0] - ra[i - 1][0]) * j) / n;
          const y = ra[i - 1][1] + ((ra[i][1] - ra[i - 1][1]) * j) / n;
          if (D.distToPolyline(rb, x, y) < 3.5) touching += L / n;
        }
      }
      assert.ok(touching < 16, `${a} and ${b} touch along ${touching.toFixed(1)} mm`);
    }
    // and they do hang: deck B's pair dips well below its lane
    const lane = D.lane4('B.rcaL', 'ch2.line.L');
    const run = D.run4('B.rcaL', WIRED);
    assert.ok(lowest(run, lane[1][0], lane[2][0]) - lane[1][1] >= 8);
  });

  it('the headphone cable runs from its break mark to the PHONES jack, clear of every plug', () => {
    const r = D.run4('phones', WIRED);
    assert.deepEqual(r[0], [D.PHONES_BREAK.x, D.PHONES_BREAK.y]);
    const j = jackPt('mix.phones');
    assert.deepEqual(r[r.length - 1], [j.x, j.y]);
    for (const q of plugsIn(WIRED)) if (q.owner !== 'phones') assert.ok(D.distToPolyline(r, q.x, q.y) >= q.r, `clear of ${q.owner}`);
  });

  it('ONE stated scale per band: the room at 1:5 with readable speakers, the patch band under it', () => {
    assert.equal(D.ROOM_F, 0.2);
    const pa = D.roomSpeakerBox4('paL');
    assert.ok(pa.h >= 110, `PA cabinet ${pa.h} mm tall on the map`);
    assert.ok(Math.abs(D.ROOM_FLOOR - pa.y - pa.h - 1400 * D.ROOM_F) < 1e-9, 'the PA cabinet sits 1.4 m up its stand');
    const bm = D.roomSpeakerBox4('boothL');
    assert.ok(Math.abs(bm.y + bm.h - D.roomTableTop) < 1e-9, 'the booth monitor stands on the table');
    assert.equal(D.BUILD_FRAME.h, 840 + D.PATCH_DY);
    const sm = read('src/screens/lab/dj/art/SystemMap.tsx');
    assert.match(sm, /THE ROOM · 1:5/);
    assert.match(sm, /WHAT YOU PLUG · 1:1/);
    assert.doesNotMatch(sm, /DashPathEffect/, 'no dashed leaders from the plates up to the room');
  });

  // a render with just the levels the light reads
  const fake = (masterL: number, masterR: number, booth: number) => ({ rmsDb: { masterL, masterR, booth, crowd: Math.max(masterL, masterR) } }) as unknown as BoothRender;
  const withPlugs = (plugs: Partial<Booth['plugs']>): Booth => {
    const b = builtBooth();
    return { ...b, plugs: { ...b.plugs, ...plugs } };
  };

  it('each speaker’s light comes from ITS OWN feed — the “half the PA is silent” fault', () => {
    // MASTER L in the left booth monitor; PA L has no cable at all
    const b = withPlugs({ 'mst.xlrL': 'boothL.in', 'bth.trsL': null });
    const r = fake(-20, -20, -20);
    assert.equal(D.speakerLit(b, r, 'paL'), false, 'the dead PA shows no signal, even powered');
    assert.equal(D.speakerLit(b, r, 'paR'), true);
    assert.equal(D.speakerLit(b, r, 'boothL'), true, 'the booth monitor plays the MASTER L it was given');
    assert.equal(D.speakerLit(b, r, 'boothR'), true);
  });

  it('…and a one-sided source lights only the speakers on that side', () => {
    const b = builtBooth();
    const rOnly = fake(-200, -20, -23);
    assert.equal(D.speakerLit(b, rOnly, 'paL'), false);
    assert.equal(D.speakerLit(b, rOnly, 'paR'), true);
    assert.equal(D.speakerLit(b, rOnly, 'boothL'), false, 'BOOTH L carries the silent bus side');
    assert.equal(D.speakerLit(b, rOnly, 'boothR'), true);
    // MASTER all the way down: the booth pair still plays
    assert.equal(D.speakerLit(b, fake(-200, -200, -20), 'boothL'), true);
    assert.equal(D.speakerLit(b, fake(-200, -200, -20), 'paL'), false);
    // unpowered, or no render: dark
    assert.equal(D.speakerLit({ ...b, power: { ...b.power, paR: false } }, rOnly, 'paR'), false);
    assert.equal(D.speakerLit(b, null, 'paR'), false);
  });

  it('every word on the patch band keeps off the gear, the other words and EVERY cable — on the phone, in the CABLE view, full screen and at 3× (round 2)', () => {
    // the label face's measure (a copy of art/Scene textWidthPt, which is .tsx)
    const tw = (t: string, k = 1) => {
      let em = 0;
      for (const c of t) em += 'MW'.includes(c) ? 0.74 : " .,:;·'’|!I1()".includes(c) ? 0.3 : 0.55;
      return em * 10 * k + t.length * 0.6 * k;
    };
    const ov = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const bad: string[] = [];
    for (const [name, st] of [['wired', WIRED], ['fault', FAULT], ['unwired', UNWIRED]] as const) {
      const cables = D.cableObstacles4(st);
      const wrong = MAP_PLUGS.filter((p) => st[p] && st[p] !== WIRED[p] && PLUGS[p].kind !== 'iec');
      for (const sel of MAP_PLUGS) {
        // what Screen 4 asks for: the cable being patched and any in the wrong place
        const focus = [...new Set([sel, ...wrong])];
        const fb = D.followBox4(sel, st, 345 / 318);
        const cases: [string, number, number, readonly PlugId[], typeof fb | undefined][] = [
          ['phone', 0.327, 1, focus, undefined],
          ['cable view', 345 / fb.w, 1, focus, fb],
          ['full 1×', 0.37, 1, MAP_PLUGS, undefined],
          ['full 3×', 1.08, Math.sqrt(3), MAP_PLUGS, undefined],
        ];
        for (const [view, s, k, shown, box] of cases) {
          const placed = D.patchLabels4(st, shown, () => false, s, k, tw, { focus, view: box });
          const at = `${name}, ${sel}, ${view}`;
          for (const p of placed) {
            for (const b of [...MAP_BODIES, MAP.front, D.patchTitleBox4(s, k, tw)]) if (ov(p, b) > 0.5) bad.push(`${at}: ${p.id} on the gear (or the band's title) at (${b.x}, ${b.y})`);
            for (const q of placed) if (q !== p && ov(p, q) > 0) bad.push(`${at}: ${p.id} on ${q.id}`);
            // the finding: no flag (and no name) on a cable or a crossing
            for (const c of cables) {
              const len = D.cableInBox(c.pts, p, c.half);
              if (len > 0) bad.push(`${at}: ${p.kind} ${p.id} on the ${c.id} cable (${len.toFixed(1)} mm)`);
            }
            // a flag sits JUST off its cable: its leader is short
            if (p.kind === 'flag' && p.leader) {
              const L = Math.hypot(p.leader.x1 - p.leader.x0, p.leader.y1 - p.leader.y0) * s;
              const limit = st[p.id as PlugId] ? 100 : 140; // a loose end's flag may reach a little further
              if (L > limit) bad.push(`${at}: ${p.id}'s leader is ${L.toFixed(0)} pt`);
            }
          }
          // the cable you are working on always carries its flag (in the CABLE view: the one it follows)
          for (const f of box ? [sel] : focus) if (!placed.some((q) => q.id === f || (q.text.endsWith('L·R') && q.text.startsWith(f[0])))) bad.push(`${at}: ${f} has no flag`);
          // at 3× there is room for every audio flag of the wired booth
          if (view === 'full 3×' && name === 'wired') for (const p of MAP_PLUGS) if (PLUGS[p].kind !== 'iec' && !placed.some((q) => q.id === p)) bad.push(`${at}: ${p} has no flag`);
        }
      }
    }
    assert.deepEqual(bad, []);
  });

  it('the lanes are re-spaced: runs that share a stretch keep ≥ 11 mm apart (a tied RCA pair its 8 mm)', () => {
    const segs: { p: PlugId; y: number; x0: number; x1: number }[] = [];
    for (const p of MAP_PLUGS) {
      const r = D.lane4(p, WIRED[p] ?? null);
      for (let i = 1; i < r.length; i++) if (r[i][1] === r[i - 1][1] && Math.abs(r[i][0] - r[i - 1][0]) > 1) segs.push({ p, y: r[i][1], x0: Math.min(r[i][0], r[i - 1][0]), x1: Math.max(r[i][0], r[i - 1][0]) });
    }
    const pair = (a: PlugId, b: PlugId) => TIED.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    const bad: string[] = [];
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        const a = segs[i];
        const b = segs[j];
        if (a.p === b.p) continue;
        if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) <= 2) continue;
        const need = pair(a.p, b.p) ? 8 : 11;
        if (Math.abs(a.y - b.y) < need) bad.push(`${a.p} and ${b.p} run ${Math.abs(a.y - b.y)} mm apart`);
      }
    }
    assert.deepEqual(bad, []);
  });

  it('the mixer’s power cord leaves OFF the panel’s edge, never down across its rear panel', () => {
    const m = MAP_BODIES[1];
    const r = D.run4('ac.mixer', WIRED);
    const inlet = r[0];
    for (const [x, y] of r) if (y > inlet[1] + 0.5 && y < m.y + m.h) assert.ok(x > m.x + m.w, `the cord drops at x ${x.toFixed(1)}, on the panel's face`);
    assert.ok(Math.max(...r.map((q) => q[0])) > m.x + m.w, 'it goes round the panel’s right edge');
  });

  it('the CABLE view frames the whole cable at the glass’s shape, and makes it big on a phone', () => {
    for (const [name, st] of [['wired', WIRED], ['fault', FAULT], ['unwired', UNWIRED]] as const) {
      for (const p of MAP_PLUGS) {
        const b = D.followBox4(p, st, 345 / 318);
        assert.ok(Math.abs(b.w / b.h - 345 / 318) < 0.02 || b.w >= 1055, `${name} ${p}: the frame keeps the glass's shape`);
        for (const q of D.drawnRun4(p, st)) assert.ok(q[0] >= b.x - 0.5 && q[0] <= b.x + b.w + 0.5 && q[1] >= b.y - 0.5 && q[1] <= b.y + b.h + 0.5, `${name} ${p}: the whole run is in view`);
        // at least about 1.7× the whole map's scale on a 390-wide phone
        assert.ok(345 / b.w >= 0.55, `${name} ${p}: ${(345 / b.w).toFixed(2)} pt per mm`);
      }
    }
    const p04 = read('src/screens/lab/dj/pages/p04Build.tsx');
    assert.match(p04, /\{ id: 'CABLE', label: 'FOLLOW THE CABLE' \}/);
    assert.match(p04, /VIEWS\.map/);
    assert.match(p04, /frame=\{cable \? patchBox\(follow\) : MAP_FRAME\}/);
    // the less dense glass: focus at full strength, the rest stepping back, cords fading with no power task
    assert.match(p04, /dimRest=\{!inFull\}/);
    assert.match(p04, /cordAlpha=\{powerTask \? 1 : inFull \? 0\.55 : 0\.3\}/);
    assert.match(read('src/screens/lab/dj/art/SystemMap.tsx'), /MIXER’S FRONT EDGE|patchLabels4\(/);
    assert.match(read('src/screens/lab/dj/geometry/dressGeometry.ts'), /text: 'MIXER’S FRONT EDGE'/);
  });

  it('the drawing and the bezel both use the per-feed light; mains cords are secondary, under the audio', () => {
    const sm = read('src/screens/lab/dj/art/SystemMap.tsx');
    assert.doesNotMatch(sm, /rmsDb\.crowd/, 'no summed crowd level drives a speaker light');
    assert.match(sm, /signal=\{lit\(k\)\}/);
    assert.match(sm, /live=\{lit\(k\)\}/);
    assert.match(sm, /quiet: PLUGS\[p\]\.kind === 'iec'/);
    assert.ok(sm.indexOf('.filter((r) => r.quiet)') < sm.indexOf('.filter((r) => !r.quiet)'), 'power is drawn first, underneath');
    assert.match(read('src/screens/lab/dj/pages/p04Build.tsx'), /speakerLit\(booth, last, 'paL'\)/);
    assert.match(read('src/screens/lab/dj/art/cables.tsx'), /r\.live && !r\.quiet/, 'a quiet cord never glows');
  });
});
