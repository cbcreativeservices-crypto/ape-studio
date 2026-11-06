/**
 * Miking, MEET IT, "The parts", the suspended metal drawn face-on (I06a triangle,
 * I06b finger cymbals, I06c bar chimes, I12 gong): every part of every way of
 * playing must be plainly marked at 375 wide (owner 2026-11-05).
 *
 * The old marks were low tints UNDER the art: 9 px on a dancer's cymbal, behind
 * the fist on the clip, behind the mallet head on the boss, none at all for a
 * dancer's STRAP, one beater of two, and a tint over the whole space inside the
 * gong's frame. The floors are the shared scene's: 44 long, 16 wide, a 3 pt line.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { MARK_MIN_PX, MARK_STROKE_PX, MARK_THIN_PX } = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));
const mark = R(await import('../src/screens/lab/miking/lessons/shared/metal/metalMark.tsx'));
const TRI = R(await import('../src/screens/lab/miking/lessons/i06aTriangle/art.tsx'));
const FC = R(await import('../src/screens/lab/miking/lessons/i06bFingerCymbals/art.tsx'));
const BC = R(await import('../src/screens/lab/miking/lessons/i06cBarChimes/art.tsx'));
const GG = R(await import('../src/screens/lab/miking/lessons/i12Gong/art.tsx'));

type Pt = readonly [number, number];
type Mark = { kind: 'ring'; u: number; v: number; r: number; band?: number } | { kind: 'run'; a: Pt; b: Pt; w: number } | { kind: 'shape'; pts: readonly Pt[] };
type Box = { u0: number; u1: number; v0: number; v1: number };
type Front = { box: (v: string) => Box; hitTest: (v: string, u: number, vv: number, tol: number) => string | null };

const W = mark.STAGE_W;
const H = mark.STAGE_H;
const source = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** The parts the page lists for a variant (the page's own filter). */
const listed = (id: string, v: string): { id: string }[] => lessonById(id).model.parts.filter((p: { variants?: string[]; listIn?: string[] }) => (!p.variants || p.variants.includes(v)) && (!p.listIn || p.listIn.includes(v)));
const variantsOf = (id: string): string[] => lessonById(id).model.variants.map((v: { id: string }) => v.id);

/** On the glass, in stage pixels: its least width, its length, and its bounds. */
function measure(m: Mark, s: number) {
  if (m.kind === 'ring') {
    const out = m.r + (m.band ?? 0) / 2;
    return { long: 2 * out * s, thin: m.band ? Math.max(m.band * s, 2 * out * s) : 2 * out * s, b: { u0: m.u - out, u1: m.u + out, v0: m.v - out, v1: m.v + out } };
  }
  if (m.kind === 'run') {
    const len = Math.hypot(m.b[0] - m.a[0], m.b[1] - m.a[1]);
    return { long: (len + m.w) * s, thin: m.w * s, b: { u0: Math.min(m.a[0], m.b[0]) - m.w / 2, u1: Math.max(m.a[0], m.b[0]) + m.w / 2, v0: Math.min(m.a[1], m.b[1]) - m.w / 2, v1: Math.max(m.a[1], m.b[1]) + m.w / 2 } };
  }
  const us = m.pts.map((p) => p[0]);
  const vs = m.pts.map((p) => p[1]);
  const b = { u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs) };
  return { long: Math.max(b.u1 - b.u0, b.v1 - b.v0) * s, thin: Math.min(b.u1 - b.u0, b.v1 - b.v0) * s, b };
}

function assertPlain(where: string, marks: Mark[], box: Box) {
  const xf = fitXform('side', box, W, H, 6);
  const s = xf.s;
  const stage = { u0: -xf.ox / s, u1: (W - xf.ox) / s, v0: -xf.oy / s, v1: (H - xf.oy) / s };
  assert.ok(marks.length, `${where}: no mark`);
  for (const m of marks) {
    const { long, thin, b } = measure(m, s);
    assert.ok(long >= MARK_MIN_PX - 0.01, `${where}: ${long.toFixed(1)} px long`);
    assert.ok(thin >= MARK_THIN_PX - 0.01, `${where}: ${thin.toFixed(1)} px wide`);
    assert.ok(b.u0 >= stage.u0 && b.u1 <= stage.u1 && b.v0 >= stage.v0 && b.v1 <= stage.v1, `${where}: runs off the stage`);
  }
}

const LESSONS = [
  { id: 'I06a', front: TRI.TRI_FRONT as Front, of: TRI.triangleMark as (v: string, p: string) => Mark[] },
  { id: 'I06b', front: FC.FC_FRONT as Front, of: FC.fingerCymbalsMark as (v: string, p: string) => Mark[] },
  { id: 'I06c', front: BC.BC_FRONT as Front, of: BC.barChimesMark as (v: string, p: string) => Mark[] },
  { id: 'I12', front: GG.GONG_FRONT as Front, of: GG.gongMark as (v: string, p: string) => Mark[] },
];

describe('the chosen part shows on the suspended metal, face-on', () => {
  it('the floors are the shared scene ones, and mmPerPx is the stage fit', () => {
    assert.equal(mark.FRONT_MARK_MIN_PX, MARK_MIN_PX);
    assert.equal(mark.FRONT_MARK_THIN_PX, MARK_THIN_PX);
    assert.equal(mark.FRONT_MARK_LINE_PX, MARK_STROKE_PX);
    assert.ok(W === 353 && H === 290, 'the rack stage on a 375 pt phone');
    const box = { u0: -250, u1: 250, v0: -1560, v1: -1080 };
    assert.ok(Math.abs(mark.mmPerPx(box) * fitXform('side', box, W, H, 6).s - 1) < 1e-9);
  });

  for (const { id, front, of } of LESSONS) {
    for (const v of variantsOf(id)) {
      const parts = listed(id, v);
      it(`${id} ${v}: every listed part is big enough and on the stage`, () => {
        assert.ok(parts.length >= 3, 'found the parts');
        for (const p of parts) assertPlain(`${id} ${v} ${p.id}`, of(v, p.id), front.box(v));
      });

      it(`${id} ${v}: no two parts share a mark, so moving PART moves the mark`, () => {
        const seen = new Map<string, string>();
        for (const p of parts) {
          const lens = id === 'I06b' ? FC.danceLens(v === 'dance' ? p.id : null) : null;
          const key = JSON.stringify([of(v, p.id), lens?.marks ?? null]);
          assert.ok(!seen.has(key), `${p.id} and ${seen.get(key)} look the same`);
          seen.set(key, p.id);
        }
      });
    }
  }

  it('the mark lands on its own part: the drawing\'s tap at the mark names that part', () => {
    const on = (m: Mark): Pt => (m.kind === 'ring' ? [m.u, m.v] : m.kind === 'run' ? [m.a[0] + (m.b[0] - m.a[0]) * 0.3, m.a[1] + (m.b[1] - m.a[1]) * 0.3] : [0, 0]);
    const cases: [number, string, string][] = [
      [0, 'held', 'tri.base'], [0, 'held', 'tri.side'], [0, 'held', 'tri.oside'], [0, 'held', 'tri.open'], [0, 'held', 'tri.corner'], [0, 'held', 'tri.clip'],
      [0, 'mounted', 'tri.sideM'], [0, 'mounted', 'tri.topM'], [0, 'mounted', 'tri.osideM'], [0, 'mounted', 'tri.open'],
      [1, 'orchestral', 'fc.held'], [1, 'orchestral', 'fc.drop'],
      [2, 'single', 'bc.hand'], [2, 'single', 'bc.stand'],
      [3, 'tamtam', 'gg.cords'], [3, 'bossed', 'gg.cords'], [3, 'tamtam', 'gg.mallet'], [3, 'bossed', 'gg.mallet'],
    ];
    for (const [i, v, id] of cases) {
      const { front, of } = LESSONS[i];
      const [u, vv] = on(of(v, id)[0]);
      const s = fitXform('side', front.box(v), W, H, 6).s;
      assert.equal(front.hitTest(v, u, vv, 8 / s), id, `${v} ${id}`);
    }
  });

  it('every mark is drawn last, over the player, the hands, the mallet and the metal', () => {
    const tail = (f: string, from: string, mark_: string) => {
      const src = source(f);
      const body = src.slice(src.indexOf(from));
      const i = body.indexOf(mark_);
      assert.ok(i > 0, `${f}: found the mark`);
      assert.match(body.slice(i).split('\n').slice(1, 3).join('\n'), /^\s*(<DanceLens id=\{highlight\} \/>\n\s*)?<\/Group>/, `${f}: something is drawn over ${mark_}`);
    };
    tail('i06aTriangle/art.tsx', 'function FrontTriangleArt', '<FrontMarks marks={triangleMark');
    tail('i06bFingerCymbals/art.tsx', 'function FrontArtImpl', '<FrontMarks marks={fingerCymbalsMark');
    tail('i06cBarChimes/art.tsx', 'function FrontImpl', '<FrontMarks marks={barChimesMark');
    tail('i12Gong/art.tsx', 'function frontArt', '<FrontMarks marks={gongMark');
    for (const f of ['i06aTriangle', 'i06cBarChimes', 'i12Gong']) assert.doesNotMatch(source(`${f}/art.tsx`), /HIGHLIGHT/, `${f}: an old tint is left`);
  });

  it('the triangle marks both mounted beaters, the stand\'s bar and its post', () => {
    assert.equal(TRI.triangleMark('mounted', 'tri.beater').length, 2);
    assert.equal(TRI.triangleMark('mounted', 'tri.stand').length, 2);
  });

  it('the gong marks the frame\'s three bars, not the space inside them, and both cords', () => {
    for (const [v, id] of [['tamtam', 'gg.frame'], ['bossed', 'gg.frameB']]) {
      const marks = GG.gongMark(v, id) as Mark[];
      assert.equal(marks.length, 3);
      assert.ok(marks.every((m) => m.kind === 'run'));
      assert.equal((GG.gongMark(v, 'gg.cords') as Mark[]).length, 2);
    }
  });

  it('the rim and the face differ: a band on the edge, an outline inside it', () => {
    const rim = GG.gongMark('tamtam', 'gg.rim')[0] as Extract<Mark, { kind: 'ring' }>;
    const face = GG.gongMark('tamtam', 'gg.face')[0] as Extract<Mark, { kind: 'ring' }>;
    assert.ok(rim.band && !face.band && face.r < rim.r - rim.band / 2);
  });

  it('on the small bossed gong the face and the boss differ in kind: the face is hollow, the boss stays clear of it', () => {
    const face = GG.gongMark('bossed', 'gg.faceB')[0] as Extract<Mark, { kind: 'ring' }> & { inner?: number };
    const boss = GG.gongMark('bossed', 'gg.boss')[0] as Extract<Mark, { kind: 'ring' }> & { inner?: number };
    assert.ok(face.inner && !boss.inner && face.inner < face.r, 'two equal rings would read as no change at all');
  });

  describe('the dancer\'s cymbals, 5 px apart on the phone', () => {
    const box = FC.FC_FRONT.box('dance') as Box;
    const s = fitXform('side', box, W, H, 6).s;

    it('STRAP is marked and named, as THUMB and FINGER are', () => {
      assert.ok(FC.fingerCymbalsMark('dance', 'fc.strap').length === 2, 'a ring on each hand');
      assert.ok(FC.FC_FRONT.labels('dance').some((l: { id: string }) => l.id === 'fc.strap'), 'a label to turn amber');
    });

    it('no label starts inside the ring on a hand', () => {
      const ring = FC.fingerCymbalsMark('dance', 'fc.strap') as Extract<Mark, { kind: 'ring' }>[];
      for (const l of FC.FC_FRONT.labels('dance') as { id: string; u: number; v: number }[]) {
        if (l.id === 'fc.route') continue;
        assert.ok(ring.every((m) => Math.abs(l.u - m.u) >= m.r), `${l.id}: starts inside a ring`);
      }
    });

    it('the close-up tells them apart: it is on the stage, and each mark is plain inside it', () => {
      const lens = (id: string) => FC.danceLens(id) as { c: Pt; r: number; z: number; hand: Pt; marks: Mark[] };
      for (const id of ['fc.thumb', 'fc.finger', 'fc.strap']) {
        const l = lens(id);
        assert.ok(2 * l.r * s >= 1.5 * MARK_MIN_PX, `the close-up is ${(2 * l.r * s).toFixed(0)} px across`);
        assertPlain(`lens ${id}`, [{ kind: 'ring', u: l.c[0], v: l.c[1], r: l.r }], box);
        assertPlain(`lens ${id} mark`, l.marks, box);
        for (const m of l.marks) {
          const reach = m.kind === 'ring' ? [Math.hypot(m.u - l.c[0], m.v - l.c[1]) + m.r] : m.kind === 'run' ? [m.a, m.b].map((p) => Math.hypot(p[0] - l.c[0], p[1] - l.c[1])) : [Infinity];
          assert.ok(Math.max(...reach) <= l.r, `${id}: the mark leaves the close-up`);
        }
        assert.ok(Math.hypot(l.c[0] - l.hand[0], l.c[1] - l.hand[1]) > l.r + (24 / s), 'beside the hand, not over it');
      }
      assert.equal(FC.danceLens('fc.route'), null);
      const [t, f] = [lens('fc.thumb').marks[0], lens('fc.finger').marks[0]] as Extract<Mark, { kind: 'run' }>[];
      assert.ok(Math.abs(t.a[0] - f.a[0]) * s >= 12, 'the thumb and the finger marks are clearly apart');
    });
  });
});
