/**
 * Miking, MEET IT, "The parts", the two free reeds that draw this step
 * themselves (A10 harmonica, A11 accordion): the chosen part must be plainly
 * visible at 375 wide, in every variant, not only the one first measured.
 *
 * The sizes are the shared scene's own minimum (44 pt long, 16 pt wide, a 3 pt
 * line), taken at the drawing's real scale on the rack's stage. A11's STRAPS
 * is the two SHOULDER straps, not the bass strap. A10's PATH = AMP lists eleven
 * parts; the shared amp art marked only one of them.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { MARK_MIN_PX, MARK_STROKE_PX, MARK_THIN_PX } = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));
const A10 = R(await import('../src/screens/lab/miking/lessons/a10Harmonica/art.tsx'));
const A11 = R(await import('../src/screens/lab/miking/lessons/a11Accordion/art.tsx'));
const { BELLOWS_STATES } = R(await import('../src/screens/lab/miking/lessons/a11Accordion/model.ts'));

/** The stage as the page measures it on a 375 pt phone. */
const W = 353;
const H = 290;
const scaleOf = (front: { box: (v: string) => { u0: number; u1: number; v0: number; v1: number } }, v: string) => fitXform('side', front.box(v), W, H, 6).s;
const source = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** The parts the page lists for a variant (the page's own filter). */
const listed = (id: string, v: string) => lessonById(id).model.parts.filter((p: { variants?: string[]; listIn?: string[] }) => (!p.variants || p.variants.includes(v)) && (!p.listIn || p.listIn.includes(v)));

function assertBox(where: string, b: { u0: number; u1: number; v0: number; v1: number }, line: number, s: number) {
  const a = (b.u1 - b.u0 + line) * s;
  const c = (b.v1 - b.v0 + line) * s;
  assert.ok(Math.max(a, c) >= MARK_MIN_PX, `${where}: ${a.toFixed(0)} x ${c.toFixed(0)} pt`);
  assert.ok(Math.min(a, c) >= MARK_THIN_PX, `${where}: ${a.toFixed(0)} x ${c.toFixed(0)} pt`);
}

describe('A11 accordion: the chosen part at every bellows state', () => {
  for (const st of BELLOWS_STATES as { id: string; top: number; bottom: number }[]) {
    const s = scaleOf(A11.ACC_FRONT, st.id);
    it(`${st.id}: KEYS is a band at least 16 pt wide and 44 pt long`, () => {
      assertBox('keys', A11.KEYS_MARK, A11.KEYS_MARK.w, s);
      assert.ok(A11.KEYS_MARK.w * s >= MARK_STROKE_PX - 0.01, 'a 3 pt line');
    });
    it(`${st.id}: STRAPS marks both shoulder straps, each big enough to find`, () => {
      const runs = A11.strapMarks(st.top, st.bottom) as { from: { u: number; v: number }; to: { u: number; v: number } }[];
      assert.equal(runs.length, 2);
      for (const r of runs) {
        assert.ok(A11.STRAP_MARK_W * s >= MARK_THIN_PX, `band ${(A11.STRAP_MARK_W * s).toFixed(0)} pt wide`);
        const long = (Math.hypot(r.to.u - r.from.u, r.to.v - r.from.v) + A11.STRAP_MARK_W) * s;
        assert.ok(long >= MARK_MIN_PX, `band ${long.toFixed(0)} pt long`);
      }
      assert.ok(runs[0].to.u < 0 && runs[1].to.u > 0, 'one over each shoulder');
    });
  }

  it('the mark is on the shoulders: the bass strap no longer lights up, and the mark is drawn over the player', () => {
    const src = source('a11Accordion/art.tsx');
    const branch = src.slice(src.indexOf("if (part === 'strap') {"), src.indexOf('  return (\n    <Group>\n      <Path path={endFace}>'));
    assert.ok(branch.length > 100, 'found the bass strap');
    assert.doesNotMatch(branch, /HIGHLIGHT/);
    const front = src.slice(src.indexOf('export function AccordionFront'), src.indexOf('/** The hands from the front'));
    assert.ok(front.indexOf('<PartMark') > front.indexOf('<PlayerInFront'), 'the mark is not hidden by the player');
    assert.ok(front.indexOf('<PartMark') > front.indexOf('<AccHandsFront'), 'the mark is not hidden by the hands');
  });
});

describe('A10 harmonica: the chosen part on both paths', () => {
  it('HARMONICA in the close-up is at least 44 pt each way', () => {
    const s = scaleOf(A10.HARP_FRONT, 'acoustic');
    const b = A10.HARP_MARK;
    assert.ok((b.u1 - b.u0 + b.w) * s >= MARK_MIN_PX, 'wide');
    assert.ok((b.v1 - b.v0 + b.w) * s >= MARK_MIN_PX, 'tall');
    assert.ok(b.w * s >= MARK_STROKE_PX - 0.01, 'a 3 pt line');
  });

  it('the harp amp: every part the page lists has a mark a student can find', () => {
    const s = scaleOf(A10.HARP_FRONT, 'amp');
    const parts = listed('A10', 'amp') as { id: string }[];
    assert.ok(parts.length >= 11, `parts: ${parts.length}`);
    for (const p of parts) {
      const m = A10.ampFrontMark(p.id);
      assert.ok(m, `${p.id}: no mark`);
      if (m.kind === 'box') assertBox(p.id, m, 7, s);
      else {
        assert.ok((m.r * 2 + m.w) * s >= MARK_MIN_PX, `${p.id}: ring across`);
        assert.ok(m.w * s >= MARK_STROKE_PX - 0.01, `${p.id}: ring line`);
      }
    }
  });

  it('the amp marks are drawn, over the shared art', () => {
    const src = source('a10Harmonica/art.tsx');
    assert.ok(src.indexOf('<AmpPartMark id={highlight} />') > src.indexOf("AMP_EX(highlight).render?.('front')"), 'after the amp art');
  });
});
