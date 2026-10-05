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
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));
const { fitLabels, labelRect, leaderLine } = R(await import('../src/screens/lab/miking/engine/scene/labelLayout.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { viewsOf } = R(await import('../src/screens/lab/miking/engine/model/types.ts'));
const bowedArt = R(await import('../src/screens/lab/miking/lessons/shared/bowed/BowedArt.tsx'));
const bowedSpec = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedSpec.ts'));

/** The player, not the instrument (bw.* the bowed family's figure, br.* the brass player's, pl.* the low-brass player's). */
const PERSON = /^(bw\.(player|head|armR\d?a|leftHand|chair)(\.seated)?|br\.(player|head|armR\d?a|valveHands)(\.[a-z]+)?|sx\.(player|head|handR|armR\d?|thighR|strap|chair)(\.[a-z]+)?|pl\.[a-zA-Z]+|player\..*|chair|bench\..*|kit\.throne)$/;
const LABEL_MIN_S = 0.12; // PlacementScene: no labels below this fit scale

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
      const box = views[view]!;
      const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
      const layouts = [
        { where: 'figure', w: 358, h: 358 / aspect, pad: 6 },
        ...[300, 420, 640].map((h) => ({ where: `stage ${h}`, w: 390, h, pad: 8 })),
        // A lesson that prints labels below the usual floor is checked down there too.
        ...(L.model.labelMinScale ? [{ where: 'stage 240', w: 390, h: 240, pad: 8 }] : []),
      ];
      for (const lay of layouts) {
        const xf = fitXform(view, box, lay.w, lay.h, lay.pad);
        if (lay.where !== 'figure' && xf.s < (L.model.labelMinScale ?? LABEL_MIN_S)) continue;
        for (const l of fitLabels(A.labels(view, variant), xf, 1, lay.w)) {
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
 * by this test. ONLY EVER LOWER THESE. Lab 4's upright bass (C06a/b), sitar
 * (C14) and veena (C15) are at zero and are not listed.
 */
const KNOWN: Record<string, number> = {
  // Lab 1 (drums, hand drums, concert percussion, speakers): many name a drum
  // or cymbal ON it in the kit plan — each to be moved off with a leader.
  M01: 16, M02: 56, M03: 83, M09: 62, M10: 6, M11: 82, M04a: 12, M04b: 13, M04c: 16, M05: 16,
  M06: 9, M07a: 20, M07b: 24, M08: 20, SPK: 16, M12: 5,
  // Lab 4: the guitar family's art (C01, C03, C05A–C, C07) is in an art pass
  // on another branch; the amps, the bowed family, harp, piano, clavinet, oud.
  // (C01, C03, C05A–C lowered at the merge with the guitar art pass, 2026-10-05.)
  C01: 45, C02: 8, C03: 36, C04: 8, C05A: 40, C05B: 27, C05C: 5, C07: 20, C08: 16,
  C09a: 32, C09b: 40, C09c: 12, C10: 47, C11: 229, C12: 16, C13: 25,
  // Lab 2 (percussion): merged into final-lab before this rule; RECORDED at the
  // fix4 merge (integrator, 2026-10-05) at the counts found then — new entries,
  // reported to the lead, to be worked down like the rest (cymbals name parts
  // and neighbours on the kit plan; the mallet keyboards their bars and pipes).
  I01a: 50, I01b: 36, I01c: 52, I01d: 37, I01e: 46, I06a: 4, I07: 50, I08: 40, I09: 37,
  I10: 53, I11a: 8, I11b: 16, I12: 2,
};

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
