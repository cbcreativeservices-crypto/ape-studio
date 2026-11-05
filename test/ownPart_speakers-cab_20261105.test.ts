/**
 * Miking, MEET IT, "The parts" (SPK) and the amp / speaker steps of C02, C04,
 * C08 and I11a: moving PART must show the chosen part on the drawing, whatever
 * the VIEW (owner 2026-11-05). PART = BACK, VIEW = FRONT drew only the amber
 * ring that is always there.
 *
 * Every cabinet, every back, every view, cloth on and off, every part the page
 * lists: the mark exists, a student can find it on a 375 pt phone, it stays on
 * the glass, it is not the always-on ring, no two parts share a mark in one
 * view, and a part the view does not draw is named in words that survive the
 * label fitter.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { CAB_MARK_MIN_PX, CAB_MARK_THIN_PX, PART_MARK, cabPartMark } = R(await import('../src/screens/lab/miking/lessons/shared/speakers/CabExplorer.tsx'));
const { SPK_CABS } = R(await import('../src/screens/lab/miking/lessons/spk/geometry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { fitLabels } = R(await import('../src/screens/lab/miking/engine/scene/labelLayout.ts'));
const { cabDraw, frontDrivers } = R(await import('../src/screens/lab/miking/lessons/shared/speakers/cabGeometry.ts'));
const { cabLabels, faceBox, frontBox } = R(await import('../src/screens/lab/miking/lessons/shared/speakers/cabLabels.ts'));

/** The rack's stage on a 375 pt phone (as in partMarkerVisible_20261105). */
const W = 355;
const H = 290;
const VIEWS = ['front', 'side', 'top', 'face'] as const;
const source = (p: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type Case = { name: string; kind: string; back: string; parts: string[]; above?: number; views: readonly (typeof VIEWS)[number][] };
const ids = (lesson: string, re: RegExp) => lessonById(lesson).model.parts.map((p: { id: string }) => p.id).filter((id: string) => re.test(id));

const CASES: Case[] = [
  ...(['1x12:closed', '1x12:open', '4x12:closed', 'bass410:closed'] as const).map((k) => {
    const [kind, back] = k.split(':');
    const parts = SPK_CABS[kind].model.parts.filter((p: { id: string; variants?: string[] }) => /^spk\./.test(p.id) && (!p.variants || p.variants.includes(back))).map((p: { id: string }) => p.id);
    return { name: `SPK ${k}`, kind, back, parts, views: VIEWS };
  }),
  { name: 'C02 amp', kind: 'combo12', back: 'open', parts: ids('C02', /^(spk|amp)\./), views: VIEWS },
  { name: 'C04 amp', kind: 'combo12', back: 'open', parts: ids('C04', /^(spk|amp)\./), views: VIEWS },
  { name: 'C08 amp', kind: 'bass410', back: 'closed', parts: ids('C08', /^(spk|amp)\./), above: 90, views: VIEWS },
  { name: 'I11a speaker', kind: 'combo12', back: 'open', parts: ids('I11a', /^(spk|amp)\./), views: ['front', 'side', 'face'] },
];

function boxOf(c: Case, view: (typeof VIEWS)[number]) {
  const d = cabDraw(c.kind, 'closed');
  const base = view === 'front' ? frontBox(c.kind) : view === 'face' ? faceBox() : view === 'side' ? { u0: d.box.x0 - 70, u1: 220, v0: d.box.y0 - 60, v1: d.floorY + 26 } : { u0: d.box.x0 - 70, u1: 220, v0: d.box.z0 - 60, v1: d.box.z1 + 40 };
  return c.above && (view === 'front' || view === 'side') ? { ...base, v0: base.v0 - c.above } : base;
}

type Bounds = { u0: number; u1: number; v0: number; v1: number };
function bounds(sh: { kind: string; u?: number; v?: number; r?: number; u0?: number; u1?: number; v0?: number; v1?: number; pts?: readonly (readonly [number, number])[] }): Bounds {
  if (sh.kind === 'disc') return { u0: sh.u! - sh.r!, u1: sh.u! + sh.r!, v0: sh.v! - sh.r!, v1: sh.v! + sh.r! };
  if (sh.kind === 'box') return { u0: sh.u0!, u1: sh.u1!, v0: sh.v0!, v1: sh.v1! };
  const us = sh.pts!.map((p) => p[0]);
  const vs = sh.pts!.map((p) => p[1]);
  return { u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs) };
}

describe('the chosen speaker part shows on the drawing', () => {
  it('the owner\'s case: 1 × 12, PART = BACK, VIEW = FRONT, cloth on', () => {
    const m = cabPartMark('1x12', 'closed', 'front', 'spk.back', 'cloth', 0.45);
    assert.ok(m, 'a mark');
    assert.equal(m.hidden, true, 'out of sight, so dashed');
    assert.match(m.note.text, /BEHIND THE CABINET/);
    const c = cabDraw('1x12', 'closed');
    const outer = bounds(m.shapes[0]);
    assert.ok(outer.u0 < c.box.z0 && outer.u1 > c.box.z1 && outer.v0 < c.box.y0 && outer.v1 > c.box.y1, 'banded round the cabinet edge');
  });

  it('the mark is not the always-on amber', () => {
    assert.notEqual(PART_MARK.toLowerCase(), '#ffc64d');
    const page = source('shared/speakers/CabExplorer.tsx');
    assert.match(page, /strokeWidth=\{3\.5 \/ xf\.s\} color=\{PART_MARK\}/);
    assert.doesNotMatch(page, /AMBER/, 'no part is drawn in the ring\'s colour');
    assert.match(page, /DashPathEffect/);
  });

  for (const c of CASES) {
    it(`${c.name}: every part, every view, cloth on and off`, () => {
      assert.ok(c.parts.length >= 8, `${c.name}: parts ${c.parts}`);
      const bad: string[] = [];
      const ring = frontDrivers(cabDraw(c.kind, 'closed')).find((d: { active: boolean }) => d.active);
      for (const view of c.views)
        for (const mode of ['cloth', 'baffle'] as const) {
          if (mode === 'baffle' && view !== 'front') continue;
          const xf = fitXform(view === 'side' ? 'side' : 'top', boxOf(c, view), W, H, 6);
          const s = xf.s;
          const glass = { u0: -xf.ox / s, u1: (W - xf.ox) / s, v0: -xf.oy / s, v1: (H - xf.oy) / s };
          const seen = new Map<string, string>();
          for (const id of c.parts) {
            const where = `${c.name} ${view} ${mode} ${id}`;
            const m = cabPartMark(c.kind, c.back, view, id, mode, s);
            if (!m) {
              bad.push(`${where}: no mark`);
              continue;
            }
            if (!m.shapes.length) bad.push(`${where}: empty`);
            for (const sh of m.shapes) {
              const b = bounds(sh);
              if (b.u0 < glass.u0 - 1 || b.u1 > glass.u1 + 1 || b.v0 < glass.v0 - 1 || b.v1 > glass.v1 + 1) bad.push(`${where}: off the glass`);
            }
            // The two sides of a cut count as one mark (a hole never adds to it).
            const all = m.shapes.map(bounds);
            const first = m.shapes[0].kind === 'poly' ? { u0: Math.min(...all.map((b) => b.u0)), u1: Math.max(...all.map((b) => b.u1)), v0: Math.min(...all.map((b) => b.v0)), v1: Math.max(...all.map((b) => b.v1)) } : all[0];
            const long = Math.max(first.u1 - first.u0, first.v1 - first.v0) * s;
            const short = Math.min(first.u1 - first.u0, first.v1 - first.v0) * s;
            if (long < CAB_MARK_MIN_PX - 0.5 || short < CAB_MARK_THIN_PX - 0.5) bad.push(`${where}: ${long.toFixed(0)} × ${short.toFixed(0)} px`);
            if (view === 'front' && m.shapes.length === 1 && m.shapes[0].kind === 'disc' && Math.abs(m.shapes[0].r - (ring.rCut + 10)) < 3 && m.shapes[0].u === ring.u) bad.push(`${where}: sits on the always-on ring`);
            const key = JSON.stringify(m.shapes);
            if (seen.has(key) && !(view === 'face' && /amp\./.test(id))) bad.push(`${where}: the same mark as ${seen.get(key)}`);
            seen.set(key, id);
            if (m.hidden && view !== 'front' && !m.note) bad.push(`${where}: out of sight, not named`);
            if (m.note) {
              const others = view === 'face' ? [] : cabLabels(c.kind, c.back, view).filter((l: { id: string }) => l.id !== 'axis' && l.id !== 'floor');
              const kept = fitLabels([{ id: 'partMark', ...m.note }, ...others], xf, 1, W);
              if (!kept.some((l: { id: string }) => l.id === 'partMark')) bad.push(`${where}: the words were dropped`);
              const n = kept.find((l: { id: string }) => l.id === 'partMark');
              if (n && (n.v < glass.v0 || n.v > glass.v1)) bad.push(`${where}: the words are off the glass`);
            }
          }
        }
      assert.deepEqual(bad, []);
    });
  }

  it('SPK says so in the badge', () => {
    const page = source('spk/pages.tsx');
    assert.match(page, /green: the \$\{shown\.short\}/);
    assert.match(page, /not drawn in this view/);
  });
});
