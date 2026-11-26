/**
 * FIGURE V2 — THE BOWED FAMILY'S HAND SHEET (2026-11-25, "batches by family"). Every hand the bowed lessons show at
 * their default views (C09a violin standing and seated, C09b viola, C09c cello, C06a/C06b double bass; side view and
 * from above) is an AUTHORED drawing (figureV2/bowedHand*.tsx) placed by bowed/bowedHandsV2.tsx. Checked here:
 *   • the review sheet (src/dev/bowedSheetStudy.tsx, route `sheet-bowed`) lists every drawing, numbered 1..N, each
 *     NEW or KEPT with what it serves;
 *   • each drawing's file exists, says first what the hand does, and is used by the family art: every hand of every
 *     lesson picture is placed (no projected hand left), the arm ends at its cuff;
 *   • nothing of the posture moves: each drawing sits on the arm's own cuff and its grip on the lesson's own point on
 *     what it holds, at the drawing's own size (no stretching past ±15 %);
 *   • the scene keeps its groups (the person behind and over the instrument, the instrument unchanged).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons';

const PO = R(await import('../src/screens/lab/miking/lessons/shared/bowed/posture.ts'));
const SP = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedSpec.ts'));
const BH = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedHands.ts'));
const BA = R(await import('../src/screens/lab/miking/lessons/shared/bowed/BowedArt.tsx'));
const BF = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedFigureV2.tsx'));
const HV = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedHandsV2.tsx'));
const FV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/familyV2.tsx'));

type V3 = { x: number; y: number; z: number };
type Pt = { u: number; v: number };
const CASES = [
  { id: 'violin standing (C09a)', P: PO.underChin(SP.VIOLIN, 0, false), bow: true },
  { id: 'violin seated (C09a)', P: PO.underChin(SP.VIOLIN, 0, true), bow: true },
  { id: 'viola standing (C09b)', P: PO.underChin(SP.VIOLA, 20, false), bow: true },
  { id: 'viola seated (C09b)', P: PO.underChin(SP.VIOLA, 20, true), bow: true },
  { id: 'cello (C09c)', P: PO.seated(SP.CELLO), bow: true },
  { id: 'bass bowed (C06b)', P: PO.standing(SP.BASS, 'bow'), bow: true },
  { id: 'bass plucked (C06a)', P: PO.standing(SP.BASS, 'pluck'), bow: false },
];
const VIEWS = ['side', 'top'] as const;
const proj = (view: 'side' | 'top', p: V3): Pt => (view === 'side' ? { u: p.x, v: p.y } : { u: p.x, v: p.z });
const d2 = (a: Pt, b: Pt) => Math.hypot(a.u - b.u, a.v - b.v);

function planOf(P: unknown, view: 'side' | 'top', bow: boolean) {
  const D = BH.drawnHands(P, bow && (P as { strokes: unknown[] }).strokes.length > 0);
  const fi = BF.bowedFamIn(D.P, D, view, bow, (a: never) => BA.cutFor(view, a));
  assert.ok(fi, 'the figure input');
  return { D, fi, fp: FV.famPlan(fi) };
}

const FILE: Record<string, string> = {
  violinBowSide: 'bowedHandViolinBowSide',
  violinBowTop: 'bowedHandViolinBowTop',
  violinStopSide: 'bowedHandViolinStopSide',
  violinStopTop: 'bowedHandViolinStopTop',
  celloBowSide: 'bowedHandCelloBowSide',
  celloBowTop: 'bowedHandCelloBowTop',
  celloStopSide: 'bowedHandCelloStopSide',
  celloStopTop: 'bowedHandCelloStopTop',
  bassBowSide: 'bowedHandBassBowSide',
  bassBowTop: 'bowedHandBassBowTop',
  bassStopSide: 'bowedHandBassStopSide',
  bassStopTop: 'bowedHandBassStopTop',
  bassPizzSide: 'bowedHandBassPizzSide',
  bassPizzTop: 'bowedHandBassPizzTop',
};

describe('the bowed family hand sheet (2026-11-25)', () => {
  it('the sheet lists every drawing, numbered 1..N, NEW or KEPT, with what it serves; its route is registered', () => {
    const list = HV.BOWED_HANDS as { n: number; id: string; status: string; serves: string; art: { title: string } }[];
    assert.equal(list.length, Object.keys(FILE).length);
    list.forEach((e, i) => {
      assert.equal(e.n, i + 1, `${e.id}: numbered in order`);
      assert.ok(e.status === 'NEW' || e.status === 'KEPT', `${e.id}: NEW or KEPT`);
      assert.ok(/C0[69]/.test(e.serves), `${e.id}: what it serves`);
      assert.ok(e.art.title.length > 10, `${e.id}: a caption`);
    });
    const sheet = read('src/dev/bowedSheetStudy.tsx');
    assert.ok(sheet.includes('BOWED_HANDS') && sheet.includes('BowedHandAlone') && sheet.includes('3 pt per mm'), 'the sheet draws every drawing alone and large');
    assert.ok(/at lesson size, in its figure/.test(sheet), 'beside it, the same hand at lesson size in its figure');
    const fs = read('src/dev/FigureStudy.tsx');
    assert.ok(fs.includes("import { BowedSheetStudy } from './bowedSheetStudy';"), 'the import line');
    assert.ok(fs.includes("if (only.startsWith('sheet-bowed')) return <BowedSheetStudy only={only} />;"), 'the route line');
  });

  it('each drawing file exists, says first what the hand does, and is used by the family art', () => {
    const v2 = read(`${L}/shared/bowed/bowedHandsV2.tsx`);
    for (const [id, f] of Object.entries(FILE)) {
      const p = `${L}/shared/figureV2/${f}.tsx`;
      assert.ok(existsSync(new URL(`../${p}`, import.meta.url)), `${id}: ${p}`);
      const src = read(p);
      const head = src.slice(0, src.indexOf('*/'));
      assert.ok(/WHAT THE HAND DOES/.test(head) && /WHAT THE EYE SEES/.test(head), `${id}: the header says what the hand does and what the eye sees`);
      assert.ok(v2.includes(`from '../figureV2/${f}'`), `${id}: placed by the family art`);
    }
    const fig = read(`${L}/shared/bowed/bowedFigureV2.tsx`);
    assert.ok(fig.includes('bowedHandPlacements') && fig.includes('handElsewhere'), 'the family figure paints the authored hands, the arm ending at its cuff');
  });

  it('every hand of every lesson picture is an authored drawing on its arm, nothing of the posture moved', () => {
    for (const c of CASES)
      for (const view of VIEWS) {
        const { D, fi, fp } = planOf(c.P, view, c.bow);
        assert.equal(fi.arms.L.handElsewhere, true, `${c.id} ${view}: the left arm ends at its cuff`);
        assert.equal(fi.arms.R.handElsewhere, true, `${c.id} ${view}: the right arm ends at its cuff`);
        const placed = HV.bowedHandPlacements(D.P, D, view, c.bow, fp) as { side: 'L' | 'R'; x: number; y: number; rot: number; s: number; e: { art: { grip: Pt }; mode: string } }[];
        assert.deepEqual(placed.map((p) => p.side).sort(), ['L', 'R'], `${c.id} ${view}: both hands drawn`);
        for (const p of placed) {
          const arm = fp.arms.find((a: { side: string }) => a.side === p.side);
          const ph = p.side === 'L' ? D.L : D.R;
          // on the arm's own cuff
          assert.ok(d2({ u: p.x, v: p.y }, arm.arm.opening.e.c) < 0.01, `${c.id} ${view} ${p.side}: on the cuff`);
          // its grip on the lesson's own point (axis p)
          const g = p.e.art.grip;
          const co = Math.cos(p.rot);
          const si = Math.sin(p.rot);
          const G = { u: p.x + p.s * (g.u * co - g.v * si), v: p.y + p.s * (g.u * si + g.v * co) };
          assert.ok(d2(G, proj(view, ph.axis.p)) < 0.5, `${c.id} ${view} ${p.side}: the grip ${d2(G, proj(view, ph.axis.p)).toFixed(2)} mm from the lesson's point`);
          // at the drawing's own size (± 15 %)
          assert.ok(p.s > 0.86 && p.s < 1.16, `${c.id} ${view} ${p.side}: scale ${p.s.toFixed(3)}`);
          assert.equal(p.e.mode, p.side === 'L' ? 'stop' : c.bow ? 'bow' : 'pizz');
        }
      }
  });

  it('the scene keeps its groups: the person behind and over the instrument, the instrument unchanged', () => {
    for (const c of CASES)
      for (const view of VIEWS) {
        const neu = BA.sceneGroups(c.P, view, { bow: c.bow, v2: true });
        const old = BA.sceneGroups(c.P, view, { bow: c.bow, v2: false });
        const keys = neu.map((g: { key: string }) => g.key);
        for (const k of keys) assert.ok(['figureV2', 'figureV2Contact', 'figureV2Front', 'instrument', 'chair', 'chairLegs'].includes(k), `${c.id} ${view}: ${k}`);
        const inst = (gs: { key: string; items: unknown[] }[]) => gs.find((g) => g.key === 'instrument')!.items.length;
        assert.equal(inst(neu), inst(old), `${c.id} ${view}: the instrument's items`);
        // the hands ride in the figure's own groups: behind (a stopping hand's palm) and front
        const front = neu.find((g: { key: string }) => g.key === 'figureV2Front') as { items: unknown[] };
        assert.equal(front.items.length, 2, `${c.id} ${view}: the person over the instrument, then the hands`);
      }
  });

  it('the painter: one outline round the silhouette, a digit edge only over another digit, never round a finger where it meets the hand', () => {
    const src = read(`${L}/shared/figureV2/bowedHandPaint.tsx`);
    assert.ok(/strokeWidth=\{0\.9\} strokeJoin="round" color=\{SK\.edge\} opacity=\{0\.5\}/.test(src), 'the thin soft outline round the union');
    assert.ok(/q\.id === 'body' \? null/.test(src), "a digit's edge never drawn over the hand's body");
  });
});
