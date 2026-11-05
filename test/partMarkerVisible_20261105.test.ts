/**
 * Miking, MEET IT, "The parts": moving PART must show the chosen part on the
 * DRAWING, not only in the words (owner 2026-11-05, F06 GROUND: a ring 70 mm
 * across on a 30 m site, or nothing at all).
 *
 * For every lesson whose parts step draws through PlacementScene (DualView or
 * the scene itself), every variant, both views, every part the page lists:
 * the engine's own partMark finds a marker, and markOnGlass gives it a size a
 * student can find on a 375 pt phone. The only part with no marker is one
 * `hiddenIn` that view. Lessons with their own drawing for this step
 * (FrontStage, the Explorers) highlight inside that drawing; they are pinned
 * by name, so a new one has to be looked at.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { viewsOf } = R(await import('../src/screens/lab/miking/engine/model/types.ts'));
const { sceneFrame } = R(await import('../src/screens/lab/miking/engine/geometry/contentFrame.ts'));
const { MARK_MIN_PX, MARK_THIN_PX, MARK_STROKE_PX, markOnGlass, markStroke, partMark } = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));

/** The rack's stage on a 375 pt phone (the bezel's frame, as measured on web). */
const W = 355;
const H = 290;
/** The parts step of these pages is the shared scene. */
const SCENE_PAGES = /^(HInstrument|SInstrument)$/;
/** These lessons draw the step themselves. */
const OWN_DRAWING = ['A10', 'A11', 'A12', 'B08', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'C02', 'C04', 'C08', 'E02', 'E04', 'E05', 'E06', 'E08', 'E09', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'F10', 'I06a', 'I06b', 'I06c', 'I11a', 'I11b', 'I12', 'M09', 'M10', 'M11', 'SPK'];

const pageName = (id: string): string | undefined => (lessonArt(id)?.pages?.instrument as { name?: string } | undefined)?.name;
/** A lesson's own MEET IT page replaces the shared parts step altogether. */
const onScene = (id: string) => !lessonArt(id)?.pages?.meet && (!pageName(id) || SCENE_PAGES.test(pageName(id)!));

function walk(id: string, each: (where: string, part: { id: string; hiddenIn?: string[] }, view: 'side' | 'top', mark: ReturnType<typeof partMark>, s: number, vis: { u0: number; u1: number; v0: number; v1: number }) => void) {
  const model = lessonById(id).model;
  const art = lessonArt(id);
  for (const v of model.variants)
    for (const view of ['side', 'top'] as const) {
      const authored = viewsOf(model, v.id)[view];
      if (!authored) continue;
      const box = sceneFrame(model, v.id, view, false) ?? authored;
      const xf = fitXform(view, box, W, H, 8);
      const vis = { u0: -xf.ox / xf.s, u1: (W - xf.ox) / xf.s, v0: -xf.oy / xf.s, v1: (H - xf.oy) / xf.s };
      const floor = model.floorByVariant?.[v.id] ?? model.yFloorByVariant?.[v.id] ?? model.yFloor.mm;
      for (const p of model.parts) {
        if ((p.variants && !p.variants.includes(v.id)) || (p.listIn && !p.listIn.includes(v.id))) continue;
        each(`${id} ${v.id} ${view} ${p.id}`, p, view, partMark(model, art, view, v.id, box, p.id, floor), xf.s, vis);
      }
    }
}

describe('the chosen part shows on the drawing', () => {
  it('every lesson is either on the shared scene or pinned as its own drawing', () => {
    const own = LESSONS.map((m: { id: string }) => m.id).filter((id: string) => !onScene(id)).sort();
    assert.deepEqual(own, [...OWN_DRAWING].sort());
    assert.ok(LESSONS.length >= 128, `lessons: ${LESSONS.length}`);
  });

  for (const m of LESSONS as { id: string }[]) {
    if (!onScene(m.id)) continue;
    it(`${m.id}: every part, every variant, both views`, () => {
      const bad: string[] = [];
      let seen = 0;
      walk(m.id, (where, part, view, mark, s, vis) => {
        seen++;
        if (part.hiddenIn?.includes(view)) {
          if (mark) bad.push(`${where}: hiddenIn, yet marked`);
          return;
        }
        if (!mark) {
          bad.push(`${where}: no marker`);
          return;
        }
        const d = markOnGlass(mark, view, s, vis);
        if (!mark.shapes.length && !d.rects.length && !d.rings.length) bad.push(`${where}: an empty marker`);
        const px = (x: number) => x * s;
        for (const r of d.rects) {
          const long = px(Math.max(r.u1 - r.u0, r.v1 - r.v0));
          const short = px(Math.min(r.u1 - r.u0, r.v1 - r.v0));
          if (long < MARK_MIN_PX - 0.5 || short < MARK_THIN_PX - 0.5) bad.push(`${where}: box ${long.toFixed(0)} × ${short.toFixed(0)} px`);
          if (r.u0 < vis.u0 - 0.5 / s || r.u1 > vis.u1 + 0.5 / s || r.v0 < vis.v0 - 0.5 / s || r.v1 > vis.v1 + 0.5 / s) bad.push(`${where}: box off the glass`);
        }
        for (const c of d.rings) {
          if (px(c.r * 2) < MARK_MIN_PX - 0.5) bad.push(`${where}: ring ${px(c.r * 2).toFixed(0)} px`);
          if (c.u < vis.u0 || c.u > vis.u1 || c.v < vis.v0 || c.v > vis.v1) bad.push(`${where}: ring off the glass`);
        }
        if (markStroke(s) * s < MARK_STROKE_PX - 0.01) bad.push(`${where}: stroke under ${MARK_STROKE_PX} px`);
      });
      assert.ok(seen > 0, `${m.id}: no parts walked`);
      assert.deepEqual(bad, []);
    });
  }

  it('F06: GROUND and PAVING, the owner\'s case, sit on the ground in their own variant', () => {
    const marks: Record<string, ReturnType<typeof partMark>> = {};
    walk('F06', (where, _p, _v, mark) => {
      marks[where] = mark;
    });
    for (const k of ['F06 woodland side floor', 'F06 woodland top floor', 'F06 plaza side paving', 'F06 plaza top paving']) assert.equal(marks[k]?.how, 'hit', k);
    assert.ok(marks['F06 woodland side floor']!.rects[0].v0 > -500, 'the forest floor is the band at the ground');
    // A sound source of the other setup is never ringed: the road has two lanes here.
    assert.equal(marks['F06 plaza side road']!.rings.length, 2);
  });
});
