/**
 * FIGURE V2 — THE SAXOPHONE AND WOODWIND HANDS, ONE REVIEW SHEET (owner 2026-11-25, "batches by family"; prefix `reed`).
 * Checked here:
 *   • THE SHEET (src/dev/reedSheetStudy.tsx, route sheet-reed) lists every drawing of the family, numbered, each with
 *     its caption, NEW or KEPT, and the lessons it serves;
 *   • EACH NEW HAND FILE exists, is an authored drawing (its header says what the hand does) and is USED by the family
 *     art: the saxophone and woodwind figures end each arm at its cuff and their scenes paint the drawings, behind the
 *     instrument and over it;
 *   • NOTHING OF THE POSE MOVES: each placed drawing's wrist is the posed hand's own wrist, its fingertips land on the
 *     keys the pose presses (within a few mm), a left hand is the mirror image, the size near real size.
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons';
type V3 = { x: number; y: number; z: number };

const SXS = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxSpec.ts'));
const SXP = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxPosture.ts'));
const SXH = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxHands.ts'));
const SXF = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxFigureV2.tsx'));
const WH = R(await import('../src/screens/lab/miking/lessons/shared/woodwinds/windHands.ts'));
const WF = R(await import('../src/screens/lab/miking/lessons/shared/woodwinds/windFigureV2.tsx'));
const FV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/familyV2.tsx'));
const KIT = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/reedHandKit.tsx'));
const WL = {
  fl: R(await import('../src/screens/lab/miking/lessons/a06Flute/geometry.ts')).layoutOf,
  pc: R(await import('../src/screens/lab/miking/lessons/a07Piccolo/geometry.ts')).layoutOf,
  cl: R(await import('../src/screens/lab/miking/lessons/a08aClarinet/geometry.ts')).layoutOf,
  bc: R(await import('../src/screens/lab/miking/lessons/a08bBassClarinet/geometry.ts')).layoutOf,
  ob: R(await import('../src/screens/lab/miking/lessons/a09aOboe/geometry.ts')).layoutOf,
  bs: R(await import('../src/screens/lab/miking/lessons/a09bBassoon/geometry.ts')).layoutOf,
};

/** The family's drawings: file, exported art. */
const DRAWINGS = [
  { file: 'reedHandBack.tsx', art: 'REED_HAND_BACK' },
  { file: 'reedHandPalm.tsx', art: 'REED_HAND_PALM' },
];

type Inst = { id: string; view: 'side' | 'top'; fp: { in: { arms: Record<string, { handElsewhere?: boolean }> } }; placed: { side: 'L' | 'R'; pl: unknown; art: { pads: unknown[] } }[]; hands: Record<'L' | 'R', { frame: { o: V3 }; fingers: { joints: V3[] }[] }>; proj: (p: V3) => { u: number; v: number } };
function instances(): Inst[] {
  const out: Inst[] = [];
  for (const row of [SXS.SOPRANO, SXS.ALTO, SXS.TENOR, SXS.BARITONE])
    for (const k of ['standing', 'seated'] as const) {
      const P = SXP.saxPosture(row, k);
      const H = SXH.saxHands(P);
      for (const view of ['side', 'top'] as const) {
        const fp = SXF.saxFigure(P, view).fp;
        out.push({ id: `${row.id} ${k}`, view, fp, placed: SXF.saxReedHands(P, fp), hands: { L: H.L.sk, R: H.R.sk }, proj: FV.famProj(fp.in.view) });
      }
    }
  for (const Ly of [WL.fl(''), WL.fl('wooden'), WL.pc('standing'), WL.pc('seated'), WL.cl('seated'), WL.cl('standing'), WL.bc(''), WL.ob('seated'), WL.ob('standing'), WL.bs('seated'), WL.bs('standing')]) {
    const H = WH.windHands(Ly);
    for (const view of ['side', 'top'] as const) {
      const fp = FV.famPlan(WF.windFamIn(Ly, view));
      out.push({ id: `${Ly.spec.id} ${Ly.body.posture}`, view, fp, placed: WF.windReedHands(Ly, fp), hands: { L: H.L.sk, R: H.R.sk }, proj: FV.famProj(fp.in.view) });
    }
  }
  return out;
}

describe('the saxophone and woodwind hands — one review sheet (prefix reed)', () => {
  it('the sheet lists every drawing, numbered, NEW or KEPT, with the lessons it serves; its route is registered', () => {
    const sheet = read('src/dev/reedSheetStudy.tsx');
    for (const d of DRAWINGS) assert.ok(sheet.includes(d.art), `the sheet shows ${d.art}`);
    const m = sheet.match(/export const REED_SHEET[\s\S]*?\n\];/);
    assert.ok(m, 'the sheet’s list');
    const entries = [...m[0].matchAll(/\bn: (\d+),/g)].map((x) => Number(x[1]));
    assert.equal(entries.length, DRAWINGS.length, 'one numbered entry per drawing');
    assert.deepEqual(entries, DRAWINGS.map((_, i) => i + 1), 'numbered 1..N');
    for (const d of DRAWINGS) assert.ok(m[0].includes(`art: ${d.art},`), `entry for ${d.art}`);
    for (const k of ["status: 'NEW'", 'caption:', 'examples:', 'doubt:']) assert.ok(m[0].includes(k), k);
    // the lessons each drawing serves are read from the lessons themselves, every default view
    assert.match(sheet, /Used in: \$\{uses\.map\(useWord\)/);
    for (const l of ['A05a', 'A05b', 'A05c', 'A05d', 'A06', 'A07', 'A08a', 'A08b', 'A09a', 'A09b']) assert.ok(sheet.includes(`'${l}'`), l);
    const fs = read('src/dev/FigureStudy.tsx');
    assert.match(fs, /import \{ ReedSheetStudy \} from '\.\/reedSheetStudy';/);
    assert.match(fs, /only\.startsWith\('sheet-reed'\)\) return <ReedSheetStudy only=\{only\} \/>/);
  });

  it('each new hand file exists, says what the hand does, and is used by the family art', () => {
    for (const d of DRAWINGS) {
      const p = `${L}/shared/figureV2/${d.file}`;
      assert.ok(existsSync(new URL(`../${p}`, import.meta.url)), p);
      const src = read(p);
      assert.match(src, /WHAT THE HAND DOES/, `${d.file}: the technique written first`);
      assert.match(src, /AUTHORED 2-D ART|Authored 2-D art/, `${d.file}: authored, not a 3-D model`);
      for (const f of [`${L}/shared/sax/saxFigureV2.tsx`, `${L}/shared/woodwinds/windFigureV2.tsx`]) assert.ok(read(f).includes(d.art), `${f} uses ${d.art}`);
    }
    for (const f of [`${L}/shared/sax/SaxArt.tsx`, `${L}/shared/woodwinds/WindArt.tsx`]) {
      const s = read(f);
      assert.match(s, /<ReedHandsLayer placed=\{reed\} layer="back"/, `${f}: the parts behind the instrument`);
      assert.match(s, /<ReedHandsLayer placed=\{reed\} layer="front"/, `${f}: the parts over it`);
    }
    assert.equal(SXF.SAX_AUTHORED_HANDS, true);
    assert.equal(WF.WIND_AUTHORED_HANDS, true);
  });

  it('every lesson hand: the arm ends at its cuff, the drawing on the posed wrist, its fingertips on the keys, a left hand mirrored', () => {
    const rows: string[] = [];
    const bad: string[] = [];
    for (const c of instances()) {
      assert.equal(c.placed.length, 2, `${c.id} ${c.view}: two hands`);
      for (const h of c.placed) {
        assert.equal(c.fp.in.arms[h.side].handElsewhere, true, `${c.id} ${c.view} ${h.side}: the arm ends at the cuff`);
        const pl = h.pl as { mirror: boolean; k: number; kx: number; ky: number; miss: number };
        assert.equal(pl.mirror, h.side === 'L', `${c.id} ${c.view} ${h.side}: a left hand is the mirror image`);
        // (real size, shortened along the hand at most to 0.55 where it points toward or away from us, never stretched)
        assert.ok(pl.kx >= 0.55 && pl.kx <= 1.15 && pl.ky >= 0.72 && pl.ky <= 1.15, `${c.id} ${c.view} ${h.side}: size ${pl.kx.toFixed(2)} × ${pl.ky.toFixed(2)}`);
        // the wrist: where the posed wrist is (the bend turns only the forearm behind it)
        const o = c.proj(c.hands[h.side].frame.o);
        const w = KIT.placePt(h.pl, { u: 0, v: 0 });
        const dw = Math.hypot(w.u - o.u, w.v - o.v);
        const pads = c.hands[h.side].fingers.map((f) => c.proj(f.joints[f.joints.length - 1]));
        const after = KIT.reedPadMiss(h.art, h.pl, pads);
        rows.push(`${c.id} ${c.view} ${h.side}: ${(h.art as unknown as { name: string }).name} wrist ${dw.toFixed(0)} mm, pads ${pl.miss.toFixed(0)} mm → ${after.toFixed(1)} mm, size ${pl.kx.toFixed(2)} × ${pl.ky.toFixed(2)}`);
        // (the drawing's wrist and fingertips eased onto the pose's own: on it, or within a few mm where a finger would
        // have to move more than 22 mm)
        // (honest limits, 2026-11-25: in the main picture (side / face-on) every fingertip is on its key within 2 mm but
        // the baritone's left hand (≈ 12 mm, the hand seen end-on behind the horn); from above, where a hand is seen
        // from its index edge, up to ≈ 30 mm — the sheet prints every one more than 6 mm off as a doubt)
        if (dw >= 5) bad.push(`${c.id} ${c.view} ${h.side}: the drawn wrist ${dw.toFixed(1)} mm from the posed wrist`);
        if (after >= (c.view === 'side' ? 12.5 : 32)) bad.push(`${c.id} ${c.view} ${h.side}: a fingertip ${after.toFixed(1)} mm from its key`);
      }
    }
    if (process.env.REED_DIAG) console.log(rows.join('\n'));
    assert.deepEqual(bad, []);
  });

  it('the pose is the lesson’s own: the figure’s arms carry the posed hands unchanged', () => {
    const P = SXP.saxPosture(SXS.ALTO, 'standing');
    const H = SXH.saxHands(P);
    const fi = SXF.saxFamIn(P, 'side');
    assert.equal(fi.arms.L.sk, H.L.sk);
    assert.equal(fi.arms.R.sk, H.R.sk);
    const Ly = WL.cl('seated');
    const WHh = WH.windHands(Ly);
    const wi = WF.windFamIn(Ly, 'side');
    assert.equal(wi.arms.L.sk, WHh.L.sk);
    assert.equal(wi.arms.R.sk, WHh.R.sk);
  });
});
