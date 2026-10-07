/**
 * Miking Labs — ENGINE-WIDE: a part label never sits ON the instrument
 * (owner 2026-10-05: the upright bass, sitar and veena labels were drawn on
 * top of their instruments; review docs/labs/miking/REVIEW_LAB4.md M2).
 *
 * For every lesson, every variant and every view, the labels are laid out
 * exactly as a phone lays them out (labelLayout.fitLabels / labelRect) at
 * 390 pt wide:
 *   • the read-step FIGURE (InstrumentFigure: 358 wide, its aspect, pad 6);
 *   • the placement STAGE (PlacementScene: 390 wide, three heights, pad 8;
 *     labels shown only from LABEL_MIN_S up, as the scene does).
 * Each kept label's box is sampled (7 × 3 points) through the lesson's own
 * hit test at tolerance 0 — the instrument's drawn parts. A box may not touch
 * one; a label set clear of the instrument reaches its part by a LEADER line
 * (`lead`), which is allowed to cross it. The player's own figure (body,
 * head, arms, chair, bench, throne) is not the instrument and is not counted.
 *
 * Lessons drawn before this rule are held by a RATCHET (KNOWN): the count of
 * overlapping label placements per lesson may only go down. A lesson not in
 * the list must have none. The bowed portrait figure (makeBowedPortrait) is
 * checked separately against its own body outline.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));
const { fitLabels, labelRect, leaderLine } = R(await import('../src/screens/lab/miking/engine/scene/labelLayout.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { viewsOf } = R(await import('../src/screens/lab/miking/engine/model/types.ts'));
const { sceneFrame } = R(await import('../src/screens/lab/miking/engine/geometry/contentFrame.ts'));
const { layoutArtLabels } = R(await import('../src/screens/lab/miking/engine/scene/artLabels.ts'));
const { liveReserve } = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));
const bowedArt = R(await import('../src/screens/lab/miking/lessons/shared/bowed/BowedArt.tsx'));
const bowedSpec = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedSpec.ts'));

/** The player, not the instrument (bw.* the bowed family's figure, br.* the brass player's, pl.* the low-brass player's). */
const PERSON = /^(bw\.(player|head|armR\d?a|leftHand|chair)(\.seated)?|br\.(player|head|armR\d?a|valveHands)(\.[a-z]+)?|sx\.(player|head|handR|armR\d?|thighR|strap|chair)(\.[a-z]+)?|hm\.(body|head)|ac\.(body|strap)|ww\.(player|head|hands|chair|chairBack)(\.[a-z]+)?|pl\.[a-zA-Z]+|player\..*|chair|bench\..*|kit\.throne)$/;
const LABEL_MIN_S = 0.06; // PlacementScene: no labels below this fit scale

type Hit = { lesson: string; where: string; text: string; parts: string[] };
function overlaps(id: string): Hit[] {
  const L = lessonById(id);
  const A = lessonArt(id);
  if (!L || !A) return [];
  const out: Hit[] = [];
  const variants: string[] = L.model.variants?.map((v: { id: string }) => v.id) ?? ['default'];
  for (const variant of variants) {
    const views = viewsOf(L.model, variant);
    for (const view of Object.keys(views) as ('side' | 'top')[]) {
      // Laid out exactly as the phone lays them out (2026-10-06): the frame a
      // scene fits (the instrument's content frame with no mic on the drawing;
      // the authored box with mics, under the live strip's band) and the
      // level-of-detail layout (artLabels.layoutArtLabels).
      const authored = views[view]!;
      const parts = sceneFrame(L.model, variant, view, false)!;
      const aspect = (parts.u1 - parts.u0) / (parts.v1 - parts.v0);
      const band = liveReserve(1, 390, 1);
      const layouts = [
        { where: 'figure', box: parts, w: 358, h: 358 / aspect, pad: 6, top: 0 },
        ...[300, 420, 640].map((h) => ({ where: `parts ${h}`, box: parts, w: 390, h, pad: 8, top: 0 })),
        ...[300, 420, 640].map((h) => ({ where: `stage ${h}`, box: authored, w: 390, h, pad: 8, top: band })),
        // A lesson that prints labels below the usual floor is checked down there too.
        ...(L.model.labelMinScale ? [{ where: 'stage 240', box: authored, w: 390, h: 240, pad: 8, top: band }] : []),
      ];
      for (const lay of layouts) {
        const f = fitXform(view, lay.box, lay.w, lay.h - lay.top, lay.pad);
        const xf = { ...f, oy: f.oy + lay.top };
        if (lay.where !== 'figure' && xf.s < (L.model.labelMinScale ?? LABEL_MIN_S)) continue;
        for (const l of layoutArtLabels(A, view, variant, authored, xf, 1, lay.w, lay.h, { minY: lay.top + 1, model: L.model })) {
          const r = labelRect(l, xf, 1, lay.w);
          const parts = new Set<string>();
          for (let i = 0; i <= 6; i++)
            for (let j = 0; j <= 2; j++) {
              const sx = r.x0 + ((r.x1 - r.x0) * i) / 6;
              const sy = r.y0 + ((r.y1 - r.y0) * j) / 2;
              const hit = A.hitTest(view, variant, (sx - xf.ox) / xf.s, (sy - xf.oy) / xf.s, 0);
              if (hit && !PERSON.test(hit)) parts.add(hit);
            }
          if (parts.size) out.push({ lesson: id, where: `${variant} ${view} ${lay.where}`, text: l.text, parts: [...parts] });
        }
      }
    }
  }
  return out;
}

/**
 * The ratchet (2026-10-05): overlapping label placements per lesson, counted
 * by this test. ONLY EVER LOWER THESE. It stood at 1445 (Lab 1 440, Lab 2 423,
 * Lab 4 582); the level-of-detail layout of 2026-10-06 (artLabels.ts — a
 * label only in clear space, moved there on a leader, or left out until a
 * closer zoom) took every lesson to 0, at seven layouts (the read-step figure,
 * the parts stage and the placement stage at three heights). A lesson listed
 * here again would be a regression.
 */
const KNOWN: Record<string, number> = {};

const ids: string[] = LESSONS.map((m: { id: string }) => m.id);
const found = new Map(ids.map((id) => [id, overlaps(id)]));

describe('part labels sit clear of the instrument (engine-wide)', () => {
  it('every lesson has art with labels and a hit test', () => {
    for (const id of ids) {
      const A = lessonArt(id);
      assert.ok(A && typeof A.labels === 'function' && typeof A.hitTest === 'function', id);
    }
  });
  for (const id of ['C06a', 'C06b', 'C14', 'C15']) {
    it(`${id}: no label on the instrument, in any view, at any size`, () => {
      const hits = found.get(id)!;
      assert.deepEqual(hits.map((h) => `${h.where} "${h.text}" over ${h.parts.join(',')}`), []);
    });
  }
  it('every other lesson: at most its recorded count (the ratchet only goes down)', () => {
    const over: string[] = [];
    for (const id of ids) {
      const n = found.get(id)!.length;
      const cap = KNOWN[id] ?? 0;
      if (n > cap) over.push(`${id}: ${n} > ${cap} — ${found.get(id)!.slice(0, 3).map((h) => `${h.where} "${h.text}"`).join('; ')}`);
    }
    assert.deepEqual(over, []);
  });
  it('the ratchet lists no lesson that is already clear (lower it when you fix one)', () => {
    for (const [id, cap] of Object.entries(KNOWN)) assert.ok(found.get(id)!.length === cap, `${id}: recorded ${cap}, now ${found.get(id)!.length} — lower KNOWN.${id}`);
  });
});

describe('leaders', () => {
  const xf = { view: 'side' as const, s: 0.5, ox: 0, oy: 0 };
  it('a label far from its part draws a leader ending at its box', () => {
    const l = { u: 400, v: 0, text: 'BRIDGE', align: 'left' as const };
    const r = labelRect(l, xf, 1, 390);
    const ln = leaderLine(r, xf, { u: 0, v: 0 });
    assert.ok(ln);
    assert.equal(ln!.x1, 0);
    assert.ok(Math.abs(ln!.x2 - (r.x0 - 2)) < 1e-9);
  });
  it('a part under its own label needs no leader', () => {
    const l = { u: 100, v: 0, text: 'BRIDGE', align: 'center' as const };
    assert.equal(leaderLine(labelRect(l, xf, 1, 390), xf, { u: 100, v: 0 }), null);
  });
  it('the double bass, sitar and veena labels set clear carry a leader to their part', () => {
    for (const id of ['C06a', 'C06b', 'C14', 'C15']) {
      const A = lessonArt(id);
      const all = (['side', 'top'] as const).flatMap((view) => A.labels(view, lessonById(id).model.variants?.[0]?.id ?? 'default'));
      assert.ok(all.filter((l: { lead?: unknown }) => l.lead).length >= 3, id);
    }
  });
});

describe('the bowed portrait (ORIENT figure): labels around the body, not on it', () => {
  for (const spec of [bowedSpec.VIOLIN, bowedSpec.VIOLA, bowedSpec.CELLO, bowedSpec.BASS]) {
    it(`${spec.id}`, () => {
      const labels = bowedArt.portraitLabels(spec);
      const box = bowedArt.portraitBox(spec);
      const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
      const xf = fitXform('side', box, 358, 358 / aspect, 6);
      const bad: string[] = [];
      for (const l of fitLabels(labels, xf, 1, 358)) {
        const r = labelRect(l, xf, 1, 358);
        for (let i = 0; i <= 6; i++)
          for (let j = 0; j <= 2; j++) {
            const u = (r.x0 + ((r.x1 - r.x0) * i) / 6 - xf.ox) / xf.s;
            const v = (r.y0 + ((r.y1 - r.y0) * j) / 2 - xf.oy) / xf.s;
            if (bowedArt.portraitHit(spec, u, v)) bad.push(l.text);
          }
      }
      assert.deepEqual([...new Set(bad)], []);
    });
  }
});

describe('level of detail (owner 2026-10-06: "the finest details aren’t shown until the image is zoomed in enough")', () => {
  // The default phone glass (390 × 248) against the full screen's 2× step:
  // the drawing doubles, the words keep their size (PlacementScene divides
  // the text scale by StageZoom), so at least as many names find room.
  for (const id of ids) {
    const L = lessonById(id);
    const A = lessonArt(id);
    if (!L || !A) continue;
    const variant = L.model.defaultVariant;
    for (const view of Object.keys(viewsOf(L.model, variant)) as ('side' | 'top')[]) {
      it(`${id} ${view}: no two labels overlap, every label is on the glass, zooming in keeps at least as many`, () => {
        const authored = viewsOf(L.model, variant)[view]!;
        const box = sceneFrame(L.model, variant, view, false)!;
        const xf = fitXform(view, box, 390, 248, 8);
        const phone = layoutArtLabels(A, view, variant, authored, xf, 1, 390, 248, { model: L.model });
        const zoomed = layoutArtLabels(A, view, variant, authored, fitXform(view, box, 780, 496, 8), 1, 780, 496, { model: L.model });
        const rects = phone.map((l: { u: number; v: number; text: string; align: 'left' | 'center' | 'right' }) => ({ t: l.text, r: labelRect(l, xf, 1, 390) }));
        for (const [i, a] of rects.entries()) {
          assert.ok(a.r.y0 >= 0 && a.r.y1 <= 248, `${a.t} off the glass`);
          for (const b of rects.slice(i + 1)) assert.ok(!(a.r.x0 < b.r.x1 - 2 && a.r.x1 > b.r.x0 + 2 && a.r.y0 < b.r.y1 - 1 && a.r.y1 > b.r.y0 + 1), `"${a.t}" over "${b.t}"`);
        }
        assert.ok(zoomed.length >= phone.length, `${zoomed.length} zoomed < ${phone.length} at the phone fit`);
      });
    }
  }
  it('labels never shrink below the 9 pt floor (fontSize max(9, 9.5 × scale))', () => {
    assert.match(readFileSync('src/screens/lab/miking/engine/scene/StaticLabels.tsx', 'utf8'), /fontSize: Math\.max\(9, 9\.5 \* scale\)/);
    // A scene label is 9.5 × labelScale, and labelScale is floored at 1.
    assert.match(readFileSync('src/screens/lab/miking/engine/scene/PlacementScene.tsx', 'utf8'), /fontSize: 9\.5 \* scale, textAlign: align/);
  });
  it('the scenes lay their part labels out with the level-of-detail layout, labels held at the 1× size while zooming', () => {
    const scene = readFileSync('src/screens/lab/miking/engine/scene/PlacementScene.tsx', 'utf8');
    assert.match(scene, /layoutArtLabels\(art, view, variant, authoredBox, base, labelScale/);
    assert.match(scene, /const labelScale = Math\.max\(1, textScale \/ useStageZoom\(\)\);/);
    assert.match(readFileSync('src/screens/lab/miking/engine/scene/InstrumentFigure.tsx', 'utf8'), /layoutArtLabels\(art, view, variant/);
  });
});
