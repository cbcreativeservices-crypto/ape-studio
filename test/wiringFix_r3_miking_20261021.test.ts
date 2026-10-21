/**
 * Wiring fixes, round 3 — Miking (owner go 2026-10-21; rule book
 * docs/wiring/WIRING_RULEBOOK_DRAFT_2026_10_20.md). One ratchet per finding:
 *
 *   R3-MK-01  C04 path: the VOL PEDAL → DI cord starts AT the pedal's OUT jack
 *             (not mid-air below its base), and the words of whichever node
 *             feeds the DI step right of the cord.
 *   R3-MK-02  C04 path: the steel → VOL PEDAL cable starts at the OUTPUT JACK on
 *             the steel's BODY and ends at the pedal's IN jack.
 *   R3-MK-03  C04 backline plan: the DI's THRU runs straight to the steel amp's
 *             input (no double-back beside the steel's own cord).
 *   R3-MK-04  I11b: the reed piano's AUX OUT (one unbalanced jack) reaches the
 *             desk through the DI box: AUX OUT → DI → desk, on the amp's lane.
 *   R3-MK-05  guitar stage plans: the DI's XLR runs UPSTAGE to the plan's edge,
 *             TO STAGE BOX; the studio's still runs TO WALL PANEL.
 *   R3-MK-06  guitar plans: the drawn DI input cord IS the model's diCable, and
 *             the labels keep clear of it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { STEEL_ART, VOL_ART, buildChain, diPathLayout, sampleSeg, steelJack, volJack, type ChainSpec } from '../src/screens/lab/miking/lessons/shared/speakers/signalChain.ts';
import { ampInput, backlineCables, diJacks } from '../src/screens/lab/miking/lessons/shared/speakers/backlinePlanModel.ts';
import { DI_XLR_TO, GUITAR_ROOM, GUITAR_WIDE, SIZES, diCord, diXlr } from '../src/screens/lab/miking/lessons/shared/guitars/stagePlanModel.ts';
import { guitarsCases } from '../src/screens/lab/miking/lessons/shared/planCases/guitars.ts';

const ROOT = join(import.meta.dirname, '..');
const src = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const C04: ChainSpec = { pedals: 'volume', rig: 'combo', diBox: true, diAfter: 'pedals', ampDirect: true, icons: { player: 'steel' } };
const SIZES_PX = [
  { w: 360, h: 200, ts: 1 },
  { w: 640, h: 300, ts: 1.2 },
  { w: 300, h: 180, ts: 1 },
];
const WORD: Record<string, string> = { player: 'STEEL', pedals: 'VOL PEDAL', amp: 'AMP', cab: 'SPEAKER', mic: 'MIC', desk: 'DESK', dibox: 'DI BOX', ampdi: 'AMP OUT' };
const lay = (spec: ChainSpec, s: { w: number; h: number; ts: number }) => diPathLayout(spec, s.w, s.h, s.ts, (id) => Math.max(22 * s.ts, WORD[id].length * 6.2 * s.ts));
const near = (a: { x: number; y: number }, b: { x: number; y: number }, tol = 0.01) => Math.hypot(a.x - b.x, a.y - b.y) <= tol;

describe('R3-MK-01/02: the steel’s cables are seated in real jacks', () => {
  it('the icons draw from the same jack numbers', () => {
    const t = src('src/screens/lab/miking/lessons/shared/speakers/chainIcons.tsx');
    assert.ok(t.includes('[VOL_ART.inX, VOL_ART.outX]'), 'the pedal’s jacks');
    assert.ok(t.includes('translateY: VOL_ART.dy * S'));
    assert.ok(t.includes('STEEL_ART.jackU'), 'the steel draws its body output jack');
    assert.ok(STEEL_ART.jackU > 380 + 13 && STEEL_ART.jackU <= 450, 'right of the leg, under the body');
    assert.equal(VOL_ART.k, Math.min(1.05 / 300, 0.8 / 140), 'VolumeIcon scale (fit)');
    assert.equal(STEEL_ART.k, Math.min(1.25 / 940, 1 / 720), 'SteelIcon scale (fit)');
  });
  for (const s of SIZES_PX) {
    it(`${s.w}×${s.h}: steel body jack → pedal IN; pedal OUT → DI; words clear of the cord`, () => {
      const g = lay(C04, s);
      const { S, pos } = g;
      const toPedal = g.links.find((k) => k.l.from === 'player' && k.l.to === 'pedals')!;
      assert.equal(toPedal.seg?.kind, 'cubic');
      const a = toPedal.seg!.kind === 'cubic' ? toPedal.seg! : null!;
      const sj = steelJack(S);
      assert.ok(near(a.p0, { x: pos.player.x + sj.x, y: pos.player.y + sj.y }), 'starts at the steel body’s output jack');
      // the jack is ON the body: the body's underside, not the legs or the floor
      assert.ok(Math.abs(sj.y - (STEEL_ART.dy + STEEL_ART.bodyBottom * STEEL_ART.k) * S) < 1e-9);
      const vin = volJack(S, 'in');
      assert.ok(near(a.p3, { x: pos.pedals.x + vin.x, y: pos.pedals.y + vin.y }), 'ends at the pedal’s IN jack');
      assert.ok(toPedal.over && toPedal.plugs?.length === 1 && near(toPedal.plugs[0], a.p3), 'the plug seated in the IN jack is drawn');

      const toDi = g.links.find((k) => k.l.from === 'pedals' && k.l.to === 'dibox')!;
      const b = toDi.seg!.kind === 'cubic' ? toDi.seg! : null!;
      const vout = volJack(S, 'out');
      assert.ok(near(b.p0, { x: pos.pedals.x + vout.x, y: pos.pedals.y + vout.y }), 'starts at the pedal’s OUT jack');
      const baseBottom = pos.pedals.y + VOL_ART.dy * S;
      assert.ok(b.p0.y < baseBottom, 'inside the pedal’s base, not below it in mid-air');
      assert.ok(toDi.over && toDi.plugs?.length === 1 && near(toDi.plugs[0], b.p0));
      assert.ok(vout.x > vin.x, 'IN on the steel’s side, OUT toward the DI');

      // the VOL PEDAL words: no cord point inside their box
      const L = g.label.pedals;
      const half = (WORD.pedals.length * 6.2 * s.ts) / 2;
      for (const p of sampleSeg(toDi.seg!, 80)) {
        const inRow = p.y >= L.y - 7 * s.ts - 2 && p.y <= L.y + 5 * s.ts + 2;
        assert.ok(!(inRow && p.x >= L.x - half && p.x <= L.x + half), `the cord runs through VOL PEDAL at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      }
    });
  }
  it('the label nudge follows whichever node feeds the DI (not only the instrument)', () => {
    const t = src('src/screens/lab/miking/lessons/shared/speakers/signalChain.ts');
    assert.ok(t.includes("k.l.to === 'dibox' && k.l.kind === 'instrument'"));
    assert.ok(!t.includes("k.l.from === 'player' && k.l.to === 'dibox'"));
  });
  it('the drawing draws the seated cables over the icons, with their plugs', () => {
    const t = src('src/screens/lab/miking/lessons/shared/speakers/DiPath.tsx');
    assert.ok(t.includes('paths.filter((q) => q.over)'));
    assert.ok(t.includes('if (over) return null'));
  });
});

describe('R3-MK-03: the steel backline’s THRU runs straight to the amp', () => {
  for (const scene of ['stage', 'studio'] as const) {
    it(`${scene}: one straight run, level with the THRU jack`, () => {
      const J = diJacks('steel');
      const A = ampInput('steel');
      assert.equal(A.v, J.thru.v);
      const thru = backlineCables('steel', scene).find((k) => k.id === 'diThru')!;
      assert.deepEqual(thru.pts, [J.thru, A]);
      // it never runs beside the steel's own cord (which rises from +v into the input jack)
      const cord = backlineCables('steel', scene).find((k) => k.id === 'steelOut')!;
      const cordV = cord.pts.map((p) => p.v);
      assert.ok(thru.pts.every((p) => p.v <= Math.min(...cordV)), 'the THRU stays at the jack end, never alongside the cord');
    });
  }
});

describe('R3-MK-04: the reed piano’s AUX OUT goes through the DI box', () => {
  const t = src('src/screens/lab/miking/lessons/i11bWurlitzer/pages.tsx');
  it('the lesson’s chain says so', () => {
    assert.match(t, /const CHAIN = \{ pedals: null, rig: 'combo', diBox: false, ampDirect: true, ampDirectDi: true,/);
  });
  const spec: ChainSpec = { pedals: null, rig: 'combo', diBox: false, ampDirect: true, ampDirectDi: true, icons: { player: 'keys', amp: 'keysAmp', cab: 'lidSpeakers' } };
  it('AUX OUT → DI (instrument lead) → desk (balanced XLR), the DI on the amp’s lane', () => {
    const { nodes, links } = buildChain(spec);
    const di = nodes.find((n) => n.id === 'dibox')!;
    assert.equal(di.lane, 'amp');
    assert.equal(di.kind, 'di');
    assert.deepEqual(
      links.filter((l) => ['ampdi', 'dibox'].includes(l.from)).map((l) => `${l.from}>${l.to}:${l.kind}`),
      ['ampdi>dibox:instrument', 'dibox>desk:balanced'],
    );
    assert.ok(!links.some((l) => l.from === 'ampdi' && l.to === 'desk'), 'no straight AUX → desk line');
  });
  for (const s of SIZES_PX) {
    it(`${s.w}×${s.h}: the lead is seated at the AUX jack and reaches the DI’s input end`, () => {
      const g = diPathLayout(spec, s.w, s.h, s.ts, () => 40);
      const lead = g.links.find((k) => k.l.from === 'ampdi' && k.l.to === 'dibox')!;
      const c = lead.seg!.kind === 'cubic' ? lead.seg! : null!;
      assert.ok(near(c.p0, g.pos.ampdi), 'from the AUX OUT jack (the panel’s centre)');
      assert.ok(c.p3.x < g.pos.dibox.x, 'into the DI’s input end');
      assert.ok(lead.over && lead.plugs?.length === 1);
      assert.ok(g.pos.ampdi.x < g.pos.dibox.x && g.pos.dibox.x < g.pos.desk.x);
      const xlr = g.links.find((k) => k.l.from === 'dibox' && k.l.to === 'desk')!;
      assert.equal(xlr.seg?.kind, 'line');
    });
  }
  it('the path lists the DI item; the DI draws one input lead, no thru', () => {
    const k = src('src/screens/lab/miking/lessons/shared/keys/keysPages.tsx');
    assert.ok(k.includes("...(spec.chain.ampDirectDi && !spec.chain.diBox ? ['dibox'] : [])"));
    assert.ok(src('src/screens/lab/miking/lessons/i11bWurlitzer/lesson.ts').includes("{ id: 'dibox', label: 'a DI box for the auxiliary output'"));
    assert.ok(src('src/screens/lab/miking/lessons/shared/speakers/DiPath.tsx').includes("single={n.id === 'dibox' && !!spec.ampDirectDi && !spec.diBox}"));
  });
});

describe('R3-MK-05: guitar stage plans run the DI’s XLR upstage, TO STAGE BOX', () => {
  const di = { x: -520, z: 260 };
  it('stage: from the DI, then upstage (−v) to the plan’s upstage edge', () => {
    const x = diXlr(di as never, 'stage');
    const end = x.pts[x.pts.length - 1];
    assert.equal(end.v, GUITAR_WIDE.v0);
    const last = x.pts[x.pts.length - 2];
    assert.equal(last.u, end.u, 'the last run is straight upstage');
    assert.ok(last.v > end.v);
    assert.equal(DI_XLR_TO.stage, 'TO STAGE BOX');
  });
  it('studio: unchanged, to the wall panel', () => {
    const x = diXlr(di as never, 'studio');
    assert.equal(x.pts[x.pts.length - 1].u, GUITAR_ROOM.u0);
    assert.equal(DI_XLR_TO.studio, 'TO WALL PANEL');
  });
  it('every guitar stage case: the XLR ends upstage and crosses no object', () => {
    for (const c of guitarsCases()) {
      const x = c.cables.find((k) => k.id === 'diXlr');
      if (!x) continue;
      const end = x.pts[x.pts.length - 1];
      if (c.scene === 'stage') assert.equal(end.v, GUITAR_WIDE.v0, `${c.lesson}`);
      for (const f of c.foots) {
        if (f.zone) continue;
        for (let i = 1; i < x.pts.length; i++) {
          const p = x.pts[i - 1];
          const q = x.pts[i];
          const u0 = Math.min(p.u, q.u), u1 = Math.max(p.u, q.u), v0 = Math.min(p.v, q.v), v1 = Math.max(p.v, q.v);
          const hit = u0 < f.u1 && f.u0 < u1 && v0 < f.v1 && f.v0 < v1;
          // the DI's own footprint is where it starts
          if (f.id !== 'di' && !String(f.id).startsWith('di')) assert.ok(!hit, `${c.lesson} ${c.scene}: the XLR runs through ${f.id}`);
        }
      }
    }
  });
});

describe('R3-MK-06: the drawn DI cord is the model’s diCable', () => {
  it('the drawing uses diCord; the labels keep clear of diCable', () => {
    const t = src('src/screens/lab/miking/lessons/shared/guitars/StagePlan.tsx');
    assert.ok(t.includes('const c = diCord(from, o.at);'));
    assert.ok(!t.includes('p.cubicTo(from.x - 120'));
    assert.ok(t.includes('...(diObj ? [diCable(sc, diObj.at)] : [])'));
  });
  it('diCable follows that curve: from the space’s edge to the DI’s −v end', () => {
    for (const c of guitarsCases()) {
      const k = c.cables.find((q) => q.id === 'diCable');
      if (!k) continue;
      assert.ok(k.pts.length > 2, `${c.lesson} ${c.scene}: the curve, not a straight stand-in`);
      const end = k.pts[k.pts.length - 1];
      const di = c.cables.find((q) => q.id === 'diXlr')!.pts[0];
      assert.equal(end.u, di.u);
      assert.ok(Math.abs(end.v - (di.v - 2 * SIZES.di.hv)) < 1e-9, 'the DI’s −v end');
    }
    const cord = diCord({ x: 0, z: 0 } as never, { x: -500, z: 300 } as never);
    assert.deepEqual(cord.p3, { u: -500, v: 300 - SIZES.di.hv });
  });
});
