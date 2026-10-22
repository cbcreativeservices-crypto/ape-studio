/**
 * Wiring fixes, round 6 — Miking + Mixing (owner go 2026-10-21; graded R5).
 * One ratchet per finding:
 *
 *   R5-MIK-01  I11A (tine piano) path: the keys → DI cord starts at the OUTPUT
 *              JACK drawn on the keyboard's case front (not mid-air below it).
 *   MIK-02     every DI link (the DI's input cord, its THRU, its XLR, the amp's
 *              drop and direct out) runs clear of EVERY word at 300 / 360 /
 *              390 / 640 px: the node feeding the DI names itself ABOVE its
 *              drawing; the amp's direct-out words sit under its panel; the
 *              THRU rises at once, never crossing the input cord.
 *   MIK-03     C08: the bass head's direct-out drop leaves from the head's
 *              front underside, clearly apart from the speaker cable.
 *   MIK-04     guitar stage plans: the words keep off the dashed audience edge.
 *   MIK-05     speaker plan: the words keep off the blue amp → player line.
 *   MIX-01     Advanced Mixing p5: the red LOOP lane runs left of SOLO SAFE.
 *   MIX-02     Advanced Mixing p3: RHYTHM BUS fits its strip's tape.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { HEAD_ART, KEYS_ART, diPathLayout, headFront, keysJack, sampleSeg, type ChainSpec, type XY } from '../src/screens/lab/miking/lessons/shared/speakers/signalChain.ts';
import { labelWidth } from '../src/screens/lab/miking/engine/scene/labelLayout.ts';
import { clearOfFoots, segmentsCross } from '../src/screens/lab/miking/lessons/shared/planFoot.ts';
import { GUITAR_PLANS, GUITAR_WIDE, STAGE_EDGE, stageEdgeCables } from '../src/screens/lab/miking/lessons/shared/guitars/stagePlanModel.ts';
import { AMP_TO_PLAYER, CAB, POS, ampToPlayerFoot, spkCables, spkFoots } from '../src/screens/lab/miking/lessons/shared/speakers/stagePlanModel.ts';

const ROOT = join(import.meta.dirname, '..');
const src = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const SPK = 'src/screens/lab/miking/lessons/shared/speakers/';

/** Each lesson's chain and its own words (lesson.ts setting items; C04's path words, ampPages). */
const LESSONS: Record<string, { spec: ChainSpec; words: Record<string, string> }> = {
  C02: { spec: { pedals: 'pedals', rig: 'combo', diBox: true, ampDirect: true }, words: { player: 'GUITAR', pedals: 'PEDALS', amp: 'COMBO', cab: 'SPEAKER', mic: 'MIC', desk: 'DESK', dibox: 'DI BOX', ampdi: 'AMP OUT' } },
  C04: { spec: { pedals: 'volume', rig: 'combo', diBox: true, diAfter: 'pedals', ampDirect: true, icons: { player: 'steel' } }, words: { player: 'STEEL', pedals: 'VOL PEDAL', amp: 'AMP', cab: 'SPEAKER', mic: 'MIC', desk: 'DESK', dibox: 'DI BOX', ampdi: 'AMP OUT' } },
  C08: { spec: { pedals: 'pedals', rig: 'stack', diBox: true, ampDirect: true, icons: { player: 'bass' } }, words: { player: 'BASS', pedals: 'PEDALS', amp: 'HEAD', cab: 'CABINET', mic: 'MIC', desk: 'DESK', dibox: 'DI BOX', ampdi: 'HEAD DI' } },
  I11A: { spec: { pedals: null, rig: 'combo', diBox: true, ampDirect: false, icons: { player: 'keys' } }, words: { player: 'KEYS', amp: 'COMBO', cab: 'SPEAKER', mic: 'MIC', desk: 'DESK', dibox: 'DI BOX' } },
};
/** The grader's widths (300 / 360 / 390 / 640 px). */
const SIZES_PX = [
  { w: 300, h: 180, ts: 1 },
  { w: 360, h: 200, ts: 1 },
  { w: 390, h: 260, ts: 1 },
  { w: 640, h: 300, ts: 1.2 },
];
/** Two width rules: the drawing's own (labelWidth) and the grader's 6.2 pt a character. */
const WIDTHS = {
  drawn: (t: string, s: { w: number; ts: number }) => Math.max(22 * s.ts, labelWidth(t, s.ts, s.w)),
  grader: (t: string, s: { w: number; ts: number }) => Math.max(22 * s.ts, t.length * 6.2 * s.ts),
};
const near = (a: XY, b: XY, tol = 0.01) => Math.hypot(a.x - b.x, a.y - b.y) <= tol;
const crosses = (A: readonly XY[], B: readonly XY[]) => {
  for (let i = 0; i + 1 < A.length; i++) for (let j = 0; j + 1 < B.length; j++) if (segmentsCross({ u: A[i].x, v: A[i].y }, { u: A[i + 1].x, v: A[i + 1].y }, { u: B[j].x, v: B[j].y }, { u: B[j + 1].x, v: B[j + 1].y })) return true;
  return false;
};

describe('R5-MIK-01: the tine piano’s cord leaves from a jack on its case', () => {
  for (const s of SIZES_PX) {
    it(`${s.w}×${s.h}: keys → DI starts at the drawn output jack, seated (plug drawn)`, () => {
      const L = LESSONS.I11A;
      const g = diPathLayout(L.spec, s.w, s.h, s.ts, (id) => WIDTHS.drawn(L.words[id], s));
      const cord = g.links.find((k) => k.l.from === 'player' && k.l.to === 'dibox')!;
      assert.equal(cord.seg?.kind, 'cubic');
      const c = cord.seg!.kind === 'cubic' ? cord.seg! : null!;
      const j = keysJack(g.S);
      assert.ok(near(c.p0, { x: g.pos.player.x + j.x, y: g.pos.player.y + j.y }), 'from the jack');
      assert.ok(cord.over && cord.plugs?.length === 1 && near(cord.plugs[0], c.p0), 'the plug is drawn in the jack');
      // the jack is ON the keyboard: inside its case (not below it in mid-air)
      const k = Math.min(1 / KEYS_ART.W, 0.9 / (KEYS_ART.D * KEYS_ART.f + KEYS_ART.front)) * g.S;
      const halfTall = ((KEYS_ART.D * KEYS_ART.f + KEYS_ART.front) / 2) * k;
      assert.ok(Math.abs(j.x) < (KEYS_ART.W / 2) * k, 'within the case’s width');
      assert.ok(j.y < halfTall && j.y > halfTall - KEYS_ART.front * k, 'on the case’s front face (not below the case)');
      assert.ok(c.p3.x < g.pos.dibox.x, 'into the DI’s input end');
    });
  }
  it('the keyboard draws the jack from the same numbers', () => {
    const t = src(SPK + 'chainIcons.tsx');
    assert.ok(t.includes('const W = rh ? KEYS_ART.W : 1000;'));
    assert.ok(t.includes('cx={x0 + KEYS_ART.cheek / 2} cy={y0 + depth + front * KEYS_ART.jackY}'));
    assert.ok(src(SPK + 'signalChain.ts').includes("byId(l.from).kind === 'keys'"));
  });
});

describe('MIK-02: every DI link runs clear of every word at 300 / 360 / 390 / 640 px', () => {
  for (const [id, L] of Object.entries(LESSONS)) {
    for (const s of SIZES_PX) {
      for (const [rule, wOf] of Object.entries(WIDTHS)) {
        it(`${id} @ ${s.w}×${s.h} (${rule} widths): no link through a word; THRU never crosses the input cord`, () => {
          const lw = (n: string) => wOf(L.words[n], s);
          const g = diPathLayout(L.spec, s.w, s.h, s.ts, lw);
          const diLinks = g.links.filter((k) => k.seg && [k.l.from, k.l.to].some((n) => n === 'dibox' || n === 'ampdi'));
          assert.ok(diLinks.length >= 3, 'the DI’s input, THRU and XLR at least');
          for (const k of g.links.filter((q) => q.seg)) {
            for (const n of Object.keys(g.label)) {
              const P = g.label[n];
              const half = lw(n) / 2;
              const hit = sampleSeg(k.seg!, 160).find((p) => p.y >= P.y - 7 * s.ts - 2 && p.y <= P.y + 5 * s.ts + 2 && p.x >= P.x - half - 2 && p.x <= P.x + half + 2);
              assert.ok(!hit, `${k.l.from}>${k.l.to} runs through ${L.words[n]} at ${hit?.x.toFixed(0)},${hit?.y.toFixed(0)}`);
            }
          }
          const cord = g.links.find((k) => k.l.to === 'dibox' && k.l.kind === 'instrument')!;
          const thru = g.links.find((k) => k.l.from === 'dibox' && k.l.kind === 'instrument')!;
          assert.ok(!crosses(sampleSeg(cord.seg!, 80).slice(2), sampleSeg(thru.seg!, 80).slice(2)), 'the THRU and the input cord never cross');
          // the feeding node's words sit above its drawing, under the AIR caption, inside the glass
          const feed = g.label[cord.l.from];
          assert.ok(feed.y < g.pos[cord.l.from].y - g.S * 0.5, 'above the feeding node');
          assert.ok(feed.y - 7 * s.ts - (g.airY + 5 * s.ts) >= 2, 'clear of the AIR caption');
          assert.ok(g.airY - 7 * s.ts >= 2, 'the AIR caption inside the glass');
        });
      }
    }
  }
  it('the direct out’s words sit under its panel when a DI box shares the drawing', () => {
    for (const s of SIZES_PX) {
      const L = LESSONS.C04;
      const g = diPathLayout(L.spec, s.w, s.h, s.ts, (n) => WIDTHS.drawn(L.words[n], s));
      assert.equal(g.label.ampdi.x, g.pos.ampdi.x);
      assert.ok(g.label.ampdi.y - 7 * s.ts > g.pos.ampdi.y + g.S * 0.22, 'below the panel');
      assert.ok(g.label.ampdi.y + 5 * s.ts < g.lanes.di - g.S * 0.2, 'above the DI lane');
    }
  });
});

describe('MIK-03: the bass head’s direct out leaves from its body, apart from the speaker cable', () => {
  for (const s of SIZES_PX) {
    it(`C08 @ ${s.w}×${s.h}`, () => {
      const L = LESSONS.C08;
      const lw = (n: string) => WIDTHS.drawn(L.words[n], s);
      const g = diPathLayout(L.spec, s.w, s.h, s.ts, lw);
      const drop = g.links.find((k) => k.l.from === 'amp' && k.l.to === 'ampdi')!;
      const spk = g.links.find((k) => k.l.kind === 'speaker')!;
      assert.equal(drop.seg?.kind, 'line');
      assert.equal(spk.seg?.kind, 'line');
      const d0 = drop.seg!.kind === 'line' ? drop.seg!.pts[0] : null!;
      const s0 = spk.seg!.kind === 'line' ? spk.seg!.pts[0] : null!;
      const F = headFront(g.S);
      assert.ok(Math.abs(d0.y - (g.pos.amp.y + F.bottom)) < 1e-9, 'from the front’s underside');
      assert.ok(d0.x - g.pos.amp.x < F.x1 - 1, 'under the front, left of the side face');
      assert.ok(Math.hypot(d0.x - s0.x, d0.y - s0.y) >= g.S * 0.25 && Math.hypot(d0.x - s0.x, d0.y - s0.y) >= 7, 'clearly apart from the speaker cable');
      assert.ok(d0.y > s0.y + 2, 'never on the speaker cable’s line');
      // still clear of the HEAD word
      assert.ok(d0.x - g.label.amp.x >= lw('amp') / 2 + 4);
    });
  }
  it('the head is drawn from the same numbers', () => {
    const t = src(SPK + 'chainIcons.tsx');
    assert.ok(t.includes('const W = HEAD_ART.W;') && t.includes('const dd = HEAD_ART.depth;'));
    assert.equal(HEAD_ART.depth, 250 * 0.45);
  });
});

describe('MIK-04: guitar stage plans keep their words off the audience edge', () => {
  it('the edge is in the labels’ clearOf, drawn from the same numbers', () => {
    const t = src('src/screens/lab/miking/lessons/shared/guitars/StagePlan.tsx');
    assert.ok(t.includes("...(scene === 'stage' ? stageEdgeCables(edgeZ) : [])])} />"));
    assert.ok(t.includes('<Line p1={vec(wide.u0 + STAGE_EDGE.inset, edgeZ)} p2={vec(wide.u1 - STAGE_EDGE.inset, edgeZ)}'));
  });
  for (const [id, plan] of Object.entries(GUITAR_PLANS)) {
    it(`${id}: a word on the edge’s stroke is refused; one clear of it is not`, () => {
      const z = plan.stageEdgeZ;
      const rails = stageEdgeCables(z);
      assert.ok(STAGE_EDGE.half >= 22 / 2, 'the rails bracket the lit (22) stroke');
      const clear = clearOfFoots([], rails);
      const mid = (GUITAR_WIDE.u0 + GUITAR_WIDE.u1) / 2;
      for (const dv of [-60, -5, 0, 5, 60]) assert.equal(clear(mid - 200, z + dv - 90, mid + 200, z + dv + 90), false, `${id}: a word centred ${dv} from the edge`);
      assert.equal(clear(mid - 200, z - 300, mid + 200, z - 120), true);
      assert.equal(clear(mid - 200, z + 120, mid + 200, z + 300), true);
    });
  }
});

describe('MIK-05: the speaker plan keeps its words off the amp → player line', () => {
  it('the line’s band is among the footprints the words keep clear of, drawn from the same numbers; not a cable, not an item', () => {
    const t = src(SPK + 'StagePlan.tsx');
    assert.ok(t.includes('const foots = useMemo(() => [...spkFoots(scene, wedges), ampToPlayerFoot()], [scene, wedges]);'));
    assert.ok(t.includes('clearOf={clearOfFoots(T.foots(foots),'), 'the words’ clearOf reads those footprints');
    assert.ok(t.includes('<Line p1={vec(AMP_TO_PLAYER.u0, AMP_TO_PLAYER.v)} p2={vec(AMP_TO_PLAYER.u1, AMP_TO_PLAYER.v)} color={BLUE} strokeWidth={14}'));
    assert.equal(AMP_TO_PLAYER.u0, CAB.box.x1 + 40);
    assert.equal(AMP_TO_PLAYER.u1, POS.player.u - 300);
    assert.ok(AMP_TO_PLAYER.u0 < AMP_TO_PLAYER.u1);
    for (const sc of ['stage', 'studio'] as const) {
      assert.ok(!spkCables(sc).some((k) => k.id.startsWith('ampToPlayer')));
      assert.ok(!spkFoots(sc, []).some((f) => f.id === 'ampToPlayer'));
    }
  });
  it('a word on the line’s stroke is refused (CABINET / PLAYER’s old places)', () => {
    const band = ampToPlayerFoot();
    assert.ok(!band.zone, 'a zone would not block words');
    const clear = clearOfFoots([band]);
    assert.ok(AMP_TO_PLAYER.half >= 14 / 2);
    const u = (AMP_TO_PLAYER.u0 + AMP_TO_PLAYER.u1) / 2;
    for (const dv of [-70, -6, 0, 6, 70]) assert.equal(clear(u - 150, dv - 80, u + 150, dv + 80), false);
    assert.equal(clear(u - 150, 30, u + 150, 200), true);
  });
});

describe('MIX-01 / MIX-02: Advanced Mixing routing figures', () => {
  const t = src('src/screens/lab/mixing/advFigures.tsx');
  it('MIX-01: the LOOP lane runs left of the SOLO SAFE words, right of the LEAD strip', () => {
    const loopX = Number(t.match(/export const LOOP_X = (\d+(?:\.\d+)?);/)![1]);
    assert.ok(t.includes('{ x: LOOP_X, y: 214 }, { x: LOOP_X, y: aux2Y + 8 }'));
    assert.ok(!t.includes('{ x: 178, y: 214 }'), 'the old lane through SOLO SAFE is gone');
    // SOLO SAFE: right-aligned at the VERB strip's x − 4 (196 − 4), 9 glyphs of 10 pt Oswald (≤ 0.55 em) + 0.6 tracking
    const verbX = Number(t.match(/const verb = \{ x: (\d+),/)![1]);
    assert.ok(t.includes('<T x={verb.x - 4} y={verb.y + 5 + 15 + 8} anchor="end" color={ART.cyan}>'));
    const soloLeft = verbX - 4 - (9 * 0.55 * 10 + 8 * 0.6);
    assert.ok(loopX + 0.8 + 4 <= soloLeft, `the lane (${loopX}) keeps 4 pt clear of SOLO SAFE (${soloLeft.toFixed(1)})`);
    const leadRight = 12 + 46 + 2.5; // the LEAD strip and its highlight ring
    const loopLabel = { x0: loopX - 24 - (4 * 0.55 * 10 + 3 * 0.6) / 2, x1: loopX - 24 + (4 * 0.55 * 10 + 3 * 0.6) / 2 };
    assert.ok(loopLabel.x0 >= leadRight + 4 && loopLabel.x1 <= loopX - 6 - 2, 'LOOP sits between the LEAD strip and the lane’s X');
    assert.ok(t.includes('<T x={LOOP_X - 24} y={176} color={ART.red} anchor="middle">'));
  });
  it('MIX-02: RHYTHM BUS fits its tape, clear of the FX return', () => {
    const cx = t.match(/const busCx = \{ fx: (\d+(?:\.\d+)?), rhythm: (\d+(?:\.\d+)?),/)!;
    const fx = Number(cx[1]);
    const rhythm = Number(cx[2]);
    const w = Number(t.match(/<Strip \{\.\.\.bus\(busCx\.rhythm, (\d+)\)\} name="RHYTHM BUS"/)![1]);
    const tape = w - 4; // Strip: the tape is the strip's width − 4
    const text = 10 * 0.55 * 'RHYTHM BUS'.length + 0.4 * 9; // 10 pt Oswald SemiBold, tracking 0.4
    assert.ok(tape >= text + 2, `tape ${tape} ≥ words ${text.toFixed(1)} + 2`);
    const bw = Number(t.match(/const bw = (\d+);/)![1]);
    assert.ok(rhythm - w / 2 >= fx + bw / 2 + 4, 'clear of the FX RTN strip');
    assert.ok(rhythm + w / 2 + 4 <= 211.5 - 29, 'clear of the MUSIC BUS strip');
  });
});
