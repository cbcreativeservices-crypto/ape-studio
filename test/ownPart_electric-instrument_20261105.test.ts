/**
 * Miking, MEET IT, "The instrument" in C02, C04 and C08: moving PART must show
 * the chosen part on the drawing (owner 2026-11-05). These lessons draw the step
 * themselves (ElectricExplorer), so the shared scene's marker never reaches them.
 *
 * The old marker was a 4 or 5 mm line, under 2 px on a 375 pt phone, round knobs
 * and pickups a few pixels across. Every part of every view: a stroke of at least
 * 3 px, a box at least 44 px long and 16 px wide or a ring at least 44 px across,
 * all of it on the stage.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const art = R(await import('../src/screens/lab/miking/lessons/shared/electric/ElectricArt.tsx'));
const steel = R(await import('../src/screens/lab/miking/lessons/shared/electric/SteelArt.tsx'));
const { BASS, GUITAR } = R(await import('../src/screens/lab/miking/lessons/shared/electric/electricSpec.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { MARK_MIN_PX, MARK_STROKE_PX, MARK_THIN_PX } = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));

/** The rack's stage on a 375 pt phone, and the Explorer's own fit. */
const W = 353;
const H = 290;
type Box = { u0: number; u1: number; v0: number; v1: number };
const scale = (box: Box) => fitXform('side', box, W, H, 6).s;

function check(name: string, mark: { rects: Box[]; rings: { u: number; v: number; r: number }[]; outline?: boolean } | null, box: Box) {
  assert.ok(mark, `${name}: no marker`);
  const s = scale(box);
  assert.ok(mark.outline || mark.rects.length || mark.rings.length, `${name}: an empty marker`);
  const edge = (art.HI_STROKE_PX * art.hiMm(box)) / 2;
  const glass = { u0: box.u0 - 6 / s, u1: box.u1 + 6 / s, v0: box.v0 - 6 / s, v1: box.v1 + 6 / s };
  for (const b of mark.rects) {
    const long = Math.max(b.u1 - b.u0, b.v1 - b.v0) * s;
    const thin = Math.min(b.u1 - b.u0, b.v1 - b.v0) * s;
    assert.ok(long >= MARK_MIN_PX - 0.01, `${name}: ${long.toFixed(1)} px long`);
    assert.ok(thin >= MARK_THIN_PX - 0.01, `${name}: ${thin.toFixed(1)} px wide`);
    assert.ok(b.u0 - edge >= glass.u0 && b.u1 + edge <= glass.u1 && b.v0 - edge >= glass.v0 && b.v1 + edge <= glass.v1, `${name}: runs off the stage`);
  }
  if (mark.rings.length) assert.ok(Math.max(...mark.rings.map((r) => 2 * r.r)) * s >= MARK_MIN_PX - 0.01, `${name}: the ring is too small`);
  for (const r of mark.rings) assert.ok(r.u - r.r - edge >= glass.u0 && r.u + r.r + edge <= glass.u1 && r.v - r.r - edge >= glass.v0 && r.v + r.r + edge <= glass.v1, `${name}: a ring runs off the stage`);
}

describe('the chosen part shows on the electric instruments', () => {
  it('the floors are the shared scene ones', () => {
    assert.equal(art.HI_STROKE_PX, MARK_STROKE_PX);
    assert.equal(art.HI_MIN_PX, MARK_MIN_PX);
    assert.equal(art.HI_THIN_PX, MARK_THIN_PX);
  });

  for (const [name, spec] of [['guitar', GUITAR], ['bass', BASS]] as const) {
    it(`${name}: every part`, () => {
      const box = art.electricBox(spec);
      assert.ok(art.HI_STROKE_PX * art.hiMm(box) * scale(box) >= MARK_STROKE_PX - 0.01, 'the stroke is under 3 px');
      for (const id of art.ELECTRIC_PARTS) check(`${name} ${id}`, art.electricMark(spec, id), box);
    });
  }

  it('the pedal steel from the seat, from above, and the lap steel', () => {
    const bar = steel.STEEL.nutU + 260;
    const views = {
      side: ['ps.neck', 'ps.changer', 'ps.keyhead', 'ps.pedals', 'ps.knee', 'ps.volume', 'ps.legs'],
      top: ['ps.neck', 'ps.bar', 'ps.pickup', 'ps.changer', 'ps.keyhead', 'ps.pedals'],
      lap: ['ls.body'],
    } as const;
    for (const view of ['side', 'top', 'lap'] as const) {
      const box = steel.steelBox(view);
      assert.ok(art.HI_STROKE_PX * art.hiMm(box) * scale(box) >= MARK_STROKE_PX - 0.01, `${view}: the stroke is under 3 px`);
      for (const id of views[view]) check(`${view} ${id}`, steel.steelMark(view, id, bar), box);
    }
  });

  it('LEGS marks the legs, not the whole space under the body', () => {
    assert.equal(steel.steelMark('side', 'ps.legs')?.rects.length, 2);
  });

  it('CONTROLS stops short of the jack', () => {
    for (const spec of [GUITAR, BASS]) {
      const jack = art.buildElectric(spec).jack;
      for (const b of art.electricMark(spec, 'el.controls')!.rects) assert.ok(jack.u > b.u1, `${spec.id}: the jack is inside CONTROLS`);
    }
  });

  it('no thin amber marker line is left in either drawing', () => {
    for (const f of ['ElectricArt.tsx', 'SteelArt.tsx']) {
      const src = readFileSync(`src/screens/lab/miking/lessons/shared/electric/${f}`, 'utf8').replace(/\r\n/g, '\n');
      const left = src.split('\n').filter((l) => /\b(hi|hiPath)\b.*\?/.test(l) && /strokeWidth=\{[45]\}/.test(l));
      assert.deepEqual(left, [], f);
    }
  });
});
