/**

 * Wiring fixes, round 2 — Miking, Mixing, Mixing Guides, Mic Select

 * (owner go 2026-10-21; docs/wiring/WIRING_RULEBOOK_DRAFT_2026_10_20.md).

 * One ratchet per finding:

 *

 *   R2-MK-01  DiPath: the DI and the amp's direct out each have their OWN lane

 *             into the desk (nested, never crossing, never shared); the amp's

 *             drop never reaches the DI lane and runs clear of the amp's label.

 *   R2-MK-02  DiPath: a combo is ONE body — no speaker cable outside it; the

 *             speaker is found behind its grille (still tappable).

 *   R2-MK-03  guitar plans (C01, C03, C05C, C07): the DI's XLR out is drawn —

 *             TO STAGE BOX / TO WALL PANEL (the MK-01 diXlr pattern).

 *   R2-MK-04  backline plans (C02, C04, C08): the cables are drawn —

 *             instrument → DI → (pedals) → amp, the DI's XLR out — each in its

 *             own lane, none crossing another.

 *   R2-MK-05  the press feed box: isolated outputs, USUALLY mic level.

 *   R2-MK-06  the splitter answer: only the direct side sends phantom.

 *   R2-MX-01  Mixing: the old send runs above the main lane into the MIX

 *             strip's top; its words start right of the LEAD strip.

 *   R2-MX-02  Mixing: effects USUALLY post, cues USUALLY pre; FADER moves.

 *   R2-MX-03  Mixing: the polarity flip adds no time — but a small time

 *             offset remains, so fine alignment can follow.

 *   R2-MG-01  Gospel guide: choir mics out of the choir wedges, with the

 *             exceptions named (hand-edited line).

 *   R2-MS-01  Mic Select: phantom off while patching a ribbon; read its manual.

 *   R2-MS-02  Mic Select art comment: the male XLR's recessed pin insert.

 */

import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';

import { join } from 'node:path';

import { describe, it } from 'node:test';

import { buildChain, diPathLayout, patchVerdict, sampleSeg, type ChainSpec, type PathSeg, type XY } from '../src/screens/lab/miking/lessons/shared/speakers/signalChain.ts';

import { labelWidth } from '../src/screens/lab/miking/engine/scene/labelLayout.ts';

import { segmentsCross, type PlanCable, type PlanPt } from '../src/screens/lab/miking/lessons/shared/planFoot.ts';

import { DI_XLR_JACKS as G_XLR_JACKS, DI_XLR_TO as G_XLR_TO, GUITAR_PLANS, GUITAR_ROOM, GUITAR_WIDE, SIZES } from '../src/screens/lab/miking/lessons/shared/guitars/stagePlanModel.ts';

import { guitarsCases } from '../src/screens/lab/miking/lessons/shared/planCases/guitars.ts';

import { backlineCases } from '../src/screens/lab/miking/lessons/shared/planCases/backline.ts';

import { BACKLINE_BOX, BACKLINE_POS, BACKLINE_ROOM, BACKLINE_XLR_TO, ampInput, backlineCables, backlineCue, diJacks, keepRect, type Backline } from '../src/screens/lab/miking/lessons/shared/speakers/backlinePlanModel.ts';

import { cueCables } from '../src/screens/lab/miking/lessons/shared/monitoring/cueMix.ts';

import { DESTINATIONS } from '../src/screens/lab/miking/lessons/shared/broadcast/routing.ts';

import { POWER_CASES } from '../src/screens/lab/micselect/micSelectData.ts';



const ROOT = join(import.meta.dirname, '..');

const src = (p: string) => readFileSync(join(ROOT, p), 'utf8');



/* ── geometry helpers ── */

function sample(seg: PathSeg, n = 40): XY[] {

  if (seg.kind === 'line') return seg.pts;

  const { p0, c1, c2, p3 } = seg;

  return Array.from({ length: n + 1 }, (_, i) => {

    const t = i / n;

    const a = (1 - t) ** 3;

    const b = 3 * (1 - t) ** 2 * t;

    const c = 3 * (1 - t) * t * t;

    const d = t ** 3;

    return { x: a * p0.x + b * c1.x + c * c2.x + d * p3.x, y: a * p0.y + b * c1.y + c * c2.y + d * p3.y };

  });

}

const toPlan = (p: XY): PlanPt => ({ u: p.x, v: p.y });

function polysCross(A: readonly PlanPt[], B: readonly PlanPt[]): boolean {

  for (let i = 0; i + 1 < A.length; i++) for (let j = 0; j + 1 < B.length; j++) if (segmentsCross(A[i], A[i + 1], B[j], B[j + 1])) return true;

  return false;

}



/* ── DiPath (R2-MK-01, R2-MK-02) ── */

const SPECS: Record<string, ChainSpec> = {

  C02: { pedals: 'pedals', rig: 'combo', diBox: true, ampDirect: true },

  C04: { pedals: 'volume', rig: 'combo', diBox: true, diAfter: 'pedals', ampDirect: true, icons: { player: 'steel' } },

  C08: { pedals: 'pedals', rig: 'stack', diBox: true, ampDirect: true, icons: { player: 'bass' } },

  I11A: { pedals: null, rig: 'combo', diBox: true, ampDirect: false, icons: { player: 'keys' } },

  I11B: { pedals: null, rig: 'combo', diBox: false, ampDirect: true, icons: { player: 'keys', amp: 'keysAmp', cab: 'lidSpeakers' } },

};

const SHORT: Record<string, string> = { amp: 'COMBO', cab: 'SPEAKER', desk: 'DESK', ampdi: 'AMP OUT', dibox: 'DI BOX', player: 'GUITAR', pedals: 'PEDALS', mic: 'MIC' };

/** Each lesson's own word for its amp (lesson.ts setting items). */

const AMP_WORD: Record<string, string> = { C02: 'COMBO', C04: 'AMP', C08: 'HEAD', I11A: 'COMBO', I11B: 'AMP' };

const SIZES_PX = [

  { w: 420, h: 260, ts: 1 },

  { w: 360, h: 220, ts: 1 },

  { w: 760, h: 420, ts: 1.4 },

];

const wordOf = (lesson: string, id: string) => (id === 'amp' ? AMP_WORD[lesson] : SHORT[id] ?? id.toUpperCase());

const layout = (lesson: string, s: { w: number; h: number; ts: number }) => diPathLayout(SPECS[lesson], s.w, s.h, s.ts, (id) => Math.max(22 * s.ts, labelWidth(wordOf(lesson, id), s.ts, s.w)));



describe('R2-MK-01: each electrical link has its own lane into the desk', () => {

  for (const id of ['C02', 'C04', 'C08']) {

    for (const s of SIZES_PX) {

      it(`${id} @ ${s.w}×${s.h}: the amp out on the upper lane, the DI on the lower, nested verticals, no crossing`, () => {

        const g = layout(id, s);

        assert.ok(g.lanes.amp < g.lanes.di, 'the amp’s direct out runs ABOVE the DI lane');

        const di = g.links.find((k) => k.l.from === 'dibox' && k.l.to === 'desk')!;

        const amp = g.links.find((k) => k.l.from === 'ampdi' && k.l.to === 'desk')!;

        const drop = g.links.find((k) => k.l.from === 'amp' && k.l.to === 'ampdi')!;

        const dPts = sample(di.seg!);

        const aPts = sample(amp.seg!);

        const vxD = dPts[dPts.length - 1].x;

        const vxA = aPts[aPts.length - 1].x;

        assert.ok(vxD - vxA >= 8, `own verticals, ≥ 8 px apart (${vxA.toFixed(1)} / ${vxD.toFixed(1)})`);

        assert.ok(vxA < vxD, 'the upper lane turns up on the inner vertical');

        assert.ok(!polysCross(dPts.map(toPlan), aPts.map(toPlan)), 'the DI and amp-out lanes never cross');

        const dropPts = sample(drop.seg!);

        assert.ok(!polysCross(dropPts.map(toPlan), dPts.map(toPlan)), 'the amp’s drop never crosses the DI lane');

        assert.ok(Math.max(...dropPts.map((p) => p.y)) < g.lanes.di - g.S * 0.5, 'the drop ends well above the DI lane');

        // the drop runs clear of the amp's label (centred under the amp)

        const half = Math.max(22 * s.ts, labelWidth(AMP_WORD[id], s.ts, s.w)) / 2;

        assert.ok(dropPts[0].x - g.label.amp.x >= half + 4, 'the drop clears the amp’s label');

        assert.ok(dropPts[0].x < g.pos.amp.x + g.halfW.amp, 'the drop starts inside the amp’s body');

        // neither electrical lane runs through the desk's label (it sits above the desk)

        assert.ok(g.label.desk.y < g.pos.desk.y - g.S * 0.3);

      });

    }

  }

  it('the drawing reads the shared geometry (no hand-placed desk vertical left)', () => {

    const t = src('src/screens/lab/miking/lessons/shared/speakers/DiPath.tsx');

    assert.ok(t.includes('diPathLayout('));

    assert.ok(!t.includes('b.x - 6'), 'the old shared vertical at b.x − 6 is gone');

  });

});



describe('R2-MK-02: a combo is one body (no outside speaker cable)', () => {

  for (const id of ['C02', 'C04', 'I11A']) {

    it(`${id}: merged; the speaker link is not drawn; the speaker sits inside the combo`, () => {

      const g = layout(id, SIZES_PX[0]);

      assert.equal(g.merged, true);

      const spk = g.links.find((k) => k.l.kind === 'speaker')!;

      assert.equal(spk.seg, null, 'no speaker cable drawn outside the combo');

      const amp = g.pos.amp;

      const hw = g.halfW.amp;

      assert.ok(Math.abs(g.pos.cab.x - amp.x) < hw * 0.5 && Math.abs(g.pos.cab.y - amp.y) < hw * 0.5, 'the speaker is inside the combo body');

      assert.ok(g.speaker && g.speaker.r < hw, 'the speaker circle fits the body');

      const air = g.links.find((k) => k.l.kind === 'air')!;

      assert.ok(air.arcs!.x0 > amp.x + hw, 'the sound leaves the combo’s front, right of its body');

      // the SPEAKER and COMBO words do not sit on each other

      assert.ok(g.label.cab.y < amp.y - hw * 0.6 && g.label.amp.y > amp.y + hw * 0.6);

      // the AIR caption keeps clear of the SPEAKER word above the combo

      assert.ok(g.label.cab.y - g.airY >= 14);

    });

  }

  it('a head and cabinet (C08) still draw their speaker cable; the reed piano’s lid speakers are not a combo', () => {

    const st = layout('C08', SIZES_PX[0]);

    assert.equal(st.merged, false);

    assert.ok(st.links.find((k) => k.l.kind === 'speaker')!.seg, 'the stack keeps its speaker cable');

    assert.equal(layout('I11B', SIZES_PX[0]).merged, false);

  });

  it('the drawing skips the separate speaker icon and the cable when merged', () => {

    const t = src('src/screens/lab/miking/lessons/shared/speakers/DiPath.tsx');

    assert.ok(t.includes("g.merged && n.id === 'cab'"));

    assert.ok(t.includes('if (!seg) return null'));

  });

});



/* ── R2-MK-03: the guitar plans draw the DI's XLR out ── */

describe('R2-MK-03: guitar plans draw the DI’s XLR out (TO STAGE BOX / TO WALL PANEL)', () => {

  const cases = guitarsCases();

  it('the words and jacks follow the MK-01 ruling', () => {

    assert.deepEqual(G_XLR_TO, { stage: 'TO STAGE BOX', studio: 'TO WALL PANEL' });

    assert.equal(patchVerdict(G_XLR_JACKS.di, G_XLR_JACKS.to), 'ok');

  });

  for (const [id, opts] of Object.entries(GUITAR_PLANS)) {

    const mine = cases.filter((c) => c.lesson === id);

    if (!mine.length) continue;

    it(`${id}: ${opts.di ? 'the XLR runs from the DI’s far end to the plan’s edge, crossing no cable' : 'no DI, no XLR'}`, () => {

      for (const c of mine) {

        const x = c.cables.find((k) => k.id === 'diXlr');

        if (!opts.di) {

          assert.equal(x, undefined);

          continue;

        }

        assert.ok(x, `${id} ${c.scene}: diXlr drawn`);

        assert.equal(x!.kind, 'xlr');

        assert.equal(x!.from, 'di');

        const din = c.cables.find((k) => k.id === 'diCable')!;

        // the XLR leaves the DI's +v end (the input enters its −v end)

        assert.ok(x!.pts[0].v > din.pts[din.pts.length - 1].v + SIZES.di.hv);

        const end = x!.pts[x!.pts.length - 1];

        // R3-MK-05 (2026-10-21): on stage the XLR now turns UPSTAGE to the plan's
        // upstage edge (was: the side edge, u0); the studio's still ends at the wall.
        if (c.scene === 'stage') assert.equal(end.v, GUITAR_WIDE.v0);
        else assert.equal(end.u, GUITAR_ROOM.u0);

        for (const k of c.cables) if (k !== x) assert.ok(!polysCross(x!.pts, k.pts), `${id} ${c.scene}: the XLR crosses ${k.id}`);

      }

    });

  }

  it('the plan draws it and names its destination', () => {

    const t = src('src/screens/lab/miking/lessons/shared/guitars/StagePlan.tsx');

    assert.ok(t.includes('diXlr(diObj.at'));

    assert.ok(t.includes('DI_XLR_TO[scene]'));

    assert.ok(t.includes('xlr={xlr?.pts ?? []}'));

  });

});



/* ── R2-MK-04: the backline plans draw their cables ── */

describe('R2-MK-04: the backline plans draw instrument → DI → (pedals) → amp, and the DI’s XLR', () => {

  const WHO: Backline[] = ['guitar', 'bass', 'steel'];

  for (const who of WHO) {

    for (const scene of ['stage', 'studio'] as const) {

      it(`${who} ${scene}: the chain, end to end, each cable its own lane`, () => {

        const ks = backlineCables(who, scene);

        const J = diJacks(who);

        const A = ampInput(who);

        const K = keepRect(who);

        const by = (id: string) => ks.find((k) => k.id === id)!;

        const last = (k: PlanCable) => k.pts[k.pts.length - 1];

        if (who === 'steel') {

          assert.deepEqual(ks.map((k) => k.id), ['steelOut', 'diThru', 'diXlr']);

          assert.deepEqual(by('steelOut').pts[0], { u: J.input.u, v: K.v0 });

          assert.deepEqual(last(by('steelOut')), J.input);

          assert.deepEqual(by('diThru').pts[0], J.thru);

          assert.deepEqual(last(by('diThru')), A);

        } else {

          assert.deepEqual(ks.map((k) => k.id), ['instrumentCord', 'diThru', 'pedalsOut', 'diXlr']);

          assert.equal(by('instrumentCord').from, 'instrument');

          assert.deepEqual(last(by('instrumentCord')), J.input, 'the instrument goes INTO the DI first');

          assert.deepEqual(by('diThru').pts[0], J.thru);

          const P = BACKLINE_POS[who].pedals;

          assert.equal(last(by('diThru')).v, P.v + 250, 'the THRU reaches the pedalboard’s input end');

          assert.equal(by('pedalsOut').pts[0].v, P.v - 250, 'the pedalboard’s output end');

          assert.deepEqual(last(by('pedalsOut')), A, 'the pedals feed the amp’s INPUT');

        }

        const x = by('diXlr');

        assert.equal(x.kind, 'xlr');

        assert.deepEqual(x.pts[0], J.xlr);

        const end = last(x);

        if (scene === 'stage') assert.equal(end.u, BACKLINE_BOX.stage.u0, 'TO STAGE BOX, off the upstage edge');

        else assert.ok(end.u === BACKLINE_ROOM.u1 || end.v === BACKLINE_ROOM.v0, 'TO WALL PANEL, at a wall');

        const all = [...ks, ...(scene === 'studio' ? cueCables(backlineCue(who)) : [])];

        for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) assert.ok(!polysCross(all[a].pts, all[b].pts), `${all[a].id} crosses ${all[b].id}`);

      });

    }

  }

  it('the words and jacks', () => {

    assert.deepEqual(BACKLINE_XLR_TO, { stage: 'TO STAGE BOX', studio: 'TO WALL PANEL' });

    assert.equal(patchVerdict('instrumentOut', 'diIn'), 'ok');

    assert.equal(patchVerdict('diOut', 'micIn'), 'ok');

  });

  it('the plan cases carry the cables (the overlap test checks them), and the drawing draws them', () => {

    for (const c of backlineCases()) assert.ok(c.cables.some((k) => k.id === 'diXlr'), `${c.lesson} ${c.scene}`);

    const t = src('src/screens/lab/miking/lessons/shared/speakers/BacklinePlan.tsx');

    assert.ok(t.includes('backlineCables(who, scene)'));

    assert.ok(t.includes('BACKLINE_XLR_TO[scene]'));

    assert.ok(t.includes('rotate: DI_TURN[who]'));

  });

});



/* ── text fixes ── */

describe('R2-MK-05 / R2-MK-06: broadcast and splitter words', () => {

  it('the press feed box: isolated outputs, usually mic level (many switch to line)', () => {

    const w = DESTINATIONS.pressBox.words;

    assert.ok(w.includes('isolated output, usually mic level (many switch to line)'));

    assert.ok(!w.includes('an isolated mic-level output'));

  });

  it('the splitter answer names the one side that sends phantom', () => {

    const t = src('src/screens/lab/miking/lessons/e09CompleteBand/lesson.ts');

    assert.ok(t.includes('only one side (the direct side) sends phantom; the isolated outputs do not pass it.'));

  });

});



describe('R2-MX-01: the old send runs above the main lane into the top of the MIX strip', () => {

  const t = src('src/screens/lab/mixing/begArt.tsx');

  const body = t.slice(t.indexOf('export function DoubleRouteArt'), t.indexOf('/* ════ page 14'));

  const num = (re: RegExp) => Number(body.match(re)![1]);

  const ch = { x: num(/ch = \{ x: (\d+)/), y: num(/ch = \{ x: \d+, y: (\d+)/), w: num(/ch = \{[^}]*w: (\d+)/), h: num(/ch = \{[^}]*h: (\d+)/) };

  const mix = { x: num(/mix = \{ x: (\d+)/), y: num(/mix = \{ x: \d+, y: (\d+)/), w: num(/mix = \{[^}]*w: (\d+)/) };

  const sendY = ch.y + 5 + 6.5;

  const send: PlanPt[] = [

    { u: ch.x + ch.w, v: sendY },

    { u: mix.x + mix.w / 2 + 8, v: sendY },

    { u: mix.x + mix.w / 2 + 8, v: mix.y },

  ];

  const mainTop = num(/\{ x: 240, y: (\d+) \}, \{ x: mix\.x \+ mix\.w \/ 2 - 8/);

  const main: PlanPt[] = [

    { u: ch.x + ch.w / 2, v: ch.y + ch.h },

    { u: ch.x + ch.w / 2, v: 184 },

    { u: 240, v: 184 },

    { u: 240, v: mainTop },

    { u: mix.x + mix.w / 2 - 8, v: mainTop },

    { u: mix.x + mix.w / 2 - 8, v: mix.y },

  ];

  it('the send is drawn as three points: along the top, then down into the strip’s top', () => {

    assert.ok(body.includes('{ x: ch.x + ch.w, y: sendY }, { x: mix.x + mix.w / 2 + 8, y: sendY }, { x: mix.x + mix.w / 2 + 8, y: mix.y }'));

    assert.ok(!body.includes('y: 96'), 'no side entry at y = 96');

  });

  it('the send never crosses the main out; it runs above the main lane', () => {

    assert.ok(!polysCross(send, main));

    assert.ok(sendY < mainTop);

    assert.ok(send[1].u > main[4].u, 'the send turns down right of the main’s end');

  });

  it('the OLD SEND words start right of the LEAD strip', () => {

    assert.ok(body.includes('<T x={ch.x + ch.w + 6} y={sendY - 6} anchor="start"'));

  });

});



describe('R2-MX-02 / R2-MX-03: Mixing words hedged and true', () => {

  const a = src('src/screens/lab/mixing/pagesAdvA.tsx');

  const b = src('src/screens/lab/mixing/pagesAdvB.tsx');

  it('effects usually ride post, cue feeds usually ride pre', () => {

    assert.ok(a.includes('That is why effects usually ride post and cue feeds usually ride pre.'));

    assert.ok(!a.includes('effects ride post and cue feeds ride pre'));

  });

  it('a cue mix: your FADER moves never reach their ears', () => {

    assert.ok(a.includes('Your fader moves never reach their ears'));

    assert.ok(!a.includes('Your mix moves never reach their ears'));

  });

  it('snare top/bottom: the flip adds no time, a small time offset remains', () => {

    assert.ok(!b.includes('zero time involved'));

    assert.ok(b.includes('The flip adds no time, but top and bottom still sit a small time apart, so fine alignment can follow.'));

    assert.ok(!b.includes('and this was not one'), 'wrong[2] no longer says there is no time offset');

    assert.ok(b.includes('The small time gap between top and bottom is fixed by alignment, not by the flip.'));

    // the quiz logic is unchanged: the mirror answer is correct, "the flip added a delay" is wrong

    const q = b.slice(b.indexOf('Snare top and bottom mics'));

    assert.match(q, /correct=\{1\}/);

    assert.ok(q.includes("'The flip added a small delay that aligned the two mics'"));

  });

});



describe('R2-MG-01: Gospel guide — choir mics out of the choir wedges, exceptions named', () => {

  const g = src('src/screens/lab/mixingGuides/data/guides/g20-gospel.ts');

  it('the hand-edited line', () => {

    assert.ok(g.includes('keep choir mics out of the choir wedges (in-ears, or a little added with care, are the exceptions)'));

    assert.ok(!g.includes('never send choir mics to choir wedges'));

  });

});



describe('R2-MS-01 / R2-MS-02: Mic Select', () => {

  it('the ribbon power card: phantom off while patching; the manual decides', () => {

    const r = POWER_CASES.find((p) => p.key === 'ribbon')!;

    assert.ok(r.lines.includes('Leave phantom off while patching; check the mic’s manual (some ribbons can be harmed; active ribbons need it).'));

  });

  it('the XLR tail comment names the male connector’s recessed pin insert', () => {

    const t = src('src/screens/lab/micselect/micArt.tsx');

    assert.ok(t.includes("the male XLR's recessed pin insert"));

    assert.ok(!t.includes("the connector's dark socket insert"));

  });

});


/* ── follow-up (2026-10-21) ── */
describe('C04: the volume pedal comes BEFORE the DI (steel → volume pedal → DI → amp)', () => {
  it('the chain model', () => {
    const c = buildChain(SPECS.C04);
    const has = (from: string, to: string) => c.links.some((l) => l.from === from && l.to === to);
    assert.ok(has('player', 'pedals'), 'steel → volume pedal');
    assert.ok(has('pedals', 'dibox'), 'volume pedal → DI');
    assert.ok(has('dibox', 'amp'), 'DI thru → amp');
    assert.ok(has('dibox', 'desk'), 'the DI’s XLR → desk');
    assert.ok(!has('player', 'dibox') && !has('dibox', 'pedals') && !has('pedals', 'amp'));
    const di = c.nodes.find((n) => n.id === 'dibox')!;
    assert.ok(di.col > c.nodes.find((n) => n.id === 'pedals')!.col && di.col < c.nodes.find((n) => n.id === 'amp')!.col);
  });
  it('the guitar and bass keep the DI right after the instrument', () => {
    for (const id of ['C02', 'C08']) {
      const c = buildChain(SPECS[id]);
      assert.ok(c.links.some((l) => l.from === 'player' && l.to === 'dibox') && c.links.some((l) => l.from === 'dibox' && l.to === 'pedals'), id);
    }
  });
  it('the lesson, the page and the plan say the same', () => {
    assert.ok(src('src/screens/lab/miking/lessons/c04Steel/pages.tsx').includes("diAfter: 'pedals'"));
    const a = src('src/screens/lab/miking/lessons/shared/electric/ampPages.tsx');
    assert.ok(a.includes('a DI box after the volume pedal and before the amp'));
    assert.ok(a.includes("...(spec.chain.diBox && diLast ? ['dibox'] : [])"), 'ITEM steps through the pedal, then the DI');
    assert.deepEqual(backlineCables('steel', 'stage').map((k) => k.id), ['steelOut', 'diThru', 'diXlr'], 'the plan: the steel’s own run (volume pedal) → DI → amp');
    assert.ok(src('src/screens/lab/miking/lessons/shared/speakers/DiPath.tsx').includes("spec.diAfter !== 'pedals' ? 'down' : 'right'"));
  });
});

const ALL_SIZES = [{ w: 360, h: 160, ts: 1 }, { w: 360, h: 200, ts: 1 }, ...SIZES_PX];
describe('labels: the PLAYER word clear of its cord; NEVER inside the glass at every height', () => {
  for (const id of ['C02', 'C08', 'I11A']) {
    for (const s of ALL_SIZES) {
      it(`${id} @ ${s.w}×${s.h}: the cord never runs through the PLAYER word, and the next word keeps clear`, () => {
        const g = layout(id, s);
        const cord = g.links.find((k) => k.l.from === 'player' && k.l.to === 'dibox')!;
        const half = Math.max(22 * s.ts, labelWidth(wordOf(id, 'player'), s.ts, s.w)) / 2;
        const L = g.label.player;
        const box = { x0: L.x - half, x1: L.x + half, y0: L.y - 7 * s.ts, y1: L.y + 5 * s.ts };
        assert.ok(!sampleSeg(cord.seg!, 80).some((p) => p.x > box.x0 && p.x < box.x1 && p.y > box.y0 && p.y < box.y1), 'cord through the word');
        const next = SPECS[id].pedals ? 'pedals' : 'amp';
        const nh = Math.max(22 * s.ts, labelWidth(wordOf(id, next), s.ts, s.w)) / 2;
        assert.ok(g.label[next].x - nh - box.x1 >= 4, `${next} word touches the player word`);
      });
    }
  }
  for (const id of ['C02', 'C04', 'C08']) {
    for (const s of ALL_SIZES) {
      it(`${id} @ ${s.w}×${s.h}: NEVER’s words sit inside the glass; the X sits on the curve`, () => {
        const g = layout(id, s);
        assert.ok(g.bad.labelY - 7 * s.ts >= 2, 'the words’ top inside the glass');
        const b = g.bad;
        const midY = (b.p0.y + 3 * b.c1.y + 3 * b.c2.y + b.p3.y) / 8;
        assert.ok(Math.abs(midY - b.mid.y) < 0.5, 'the X on the curve’s crest');
        assert.ok(b.mid.y - b.labelY >= 15 * s.ts, 'the X below the words');
        assert.ok(g.elY + 5 * s.ts <= s.h, 'the ELECTRICAL caption inside the glass');
        assert.ok(g.airY - 7 * s.ts >= 2, 'the AIR caption inside the glass');
      });
    }
  }
  it('the NEVER words come first (they win any clash) and are never under 9 pt', () => {
    const t = src('src/screens/lab/miking/lessons/shared/speakers/DiPath.tsx');
    const i = t.indexOf('const labels: StaticLabel[] = [');
    assert.ok(t.indexOf("id: 'bad'", i) < t.indexOf('...nodes.map(', i));
    assert.ok(src('src/screens/lab/miking/engine/scene/StaticLabels.tsx').includes('fontSize: Math.max(9, 9.5 * scale)'));
  });
});
