/**
 * Miking, MEET IT, the electric pianos' own drawings (I11a, I11b): moving PART
 * must show the chosen part on the drawing a student can actually see at 375 pt
 * wide (owner 2026-11-05). Measured before the fix: OUTPUT JACK 14x14 px,
 * CONTROLS 30x17, SUSTAIN PEDAL 39x21, every line about 1 px; KEYS and CASE on
 * the cut view, and most speaker parts, drew nothing at all.
 *
 * Every part a page lists, in every view it is listed for, both mounts: a mark
 * exists, each shape is at least 44 px long and 16 px wide (a smaller part gets
 * 44 both ways), its line at least 3 px, and it stays on the stage.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { HI_MIN_PX, HI_SCALE, HI_STAGE, HI_STROKE_PX, HI_THIN_PX, hiShapes, hiStroke } = R(await import('../src/screens/lab/miking/lessons/shared/keys/KeysArt.tsx'));
const { keysBox } = R(await import('../src/screens/lab/miking/lessons/shared/keys/KeysExplorer.tsx'));
const { MECH_FRAME, mechHiRect } = R(await import('../src/screens/lab/miking/lessons/shared/keys/MechanismDisplay.tsx'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));

const src = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const KEYS_ART = src('shared/keys/KeysArt.tsx');
const MECH_SRC = src('shared/keys/MechanismDisplay.tsx');

type Box = { u0: number; u1: number; v0: number; v1: number };
type Show = 'rhodesFront' | 'rhodesTop' | 'wurliFront' | 'wurliLid' | 'wurliSide' | 'oval';
const fit = (b: Box) => fitXform('side', b, HI_STAGE.w, HI_STAGE.h, HI_STAGE.pad);
const ART_OF: Record<Show, string> = { rhodesFront: 'rhodesFront', rhodesTop: 'rhodesTop', wurliFront: 'wurliFront', wurliLid: 'wurliFront', wurliSide: 'wurliSide', oval: 'oval' };

/** The (part, view) pairs of the page spec, read from the source. */
function listed(file: string): { id: string; views: string[] }[] {
  const out: { id: string; views: string[] }[] = [];
  for (const m of src(file).matchAll(/\{ id: '((?:rh|wur|k)\.\w+)', title: '[^']*', text: '.*?', views: \[([^\]]*)\] \}/g)) out.push({ id: m[1], views: [...m[2].matchAll(/'(\w+)'/g)].map((v) => v[1]) });
  return out;
}
function bounds(m: { kind: string; q?: Box; u?: number; v?: number; a?: number; b?: number; pts?: readonly (readonly [number, number])[] }): Box {
  if (m.kind === 'rect') return m.q!;
  if (m.kind === 'oval') return { u0: m.u! - m.a!, u1: m.u! + m.a!, v0: m.v! - m.b!, v1: m.v! + m.b! };
  const us = m.pts!.map((p) => p[0]);
  const vs = m.pts!.map((p) => p[1]);
  return { u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs) };
}
function sized(where: string, q: Box, s: number, bad: string[]) {
  const w = (q.u1 - q.u0) * s;
  const h = (q.v1 - q.v0) * s;
  if (Math.max(w, h) < HI_MIN_PX - 1e-6 || Math.min(w, h) < HI_THIN_PX - 1e-6) bad.push(`${where}: ${w.toFixed(1)}x${h.toFixed(1)} px`);
}
function checkArt(where: string, show: Show, id: string, mount: 'lid' | 'rail', bad: string[]) {
  const art = ART_OF[show];
  const shapes = hiShapes(art, id, mount);
  const xf = fit(keysBox(show));
  if (!shapes.length) bad.push(`${where}: no mark`);
  // the jack's small ring is the extra pointer inside its floored ring
  const main = id === 'rh.jack' ? shapes.slice(0, 1) : shapes;
  for (const m of main) sized(where, bounds(m), xf.s, bad);
  for (const m of shapes) {
    const q = bounds(m);
    const half = hiStroke(art) / 2;
    if (q.u0 - half < -xf.ox / xf.s - 1e-6 || q.u1 + half > (HI_STAGE.w - xf.ox) / xf.s + 1e-6 || q.v0 - half < -xf.oy / xf.s - 1e-6 || q.v1 + half > (HI_STAGE.h - xf.oy) / xf.s + 1e-6) bad.push(`${where}: runs off the stage`);
  }
}

describe('the keys drawings mark the chosen part at phone size', () => {
  it('the floors are the shared scene\'s', () => {
    assert.equal(HI_MIN_PX, 44);
    assert.equal(HI_THIN_PX, 16);
    assert.equal(HI_STROKE_PX, 3);
  });

  it('each drawing\'s scale is its real fit on the stage', () => {
    for (const show of ['rhodesFront', 'rhodesTop', 'wurliSide', 'oval'] as const) assert.ok(Math.abs(HI_SCALE[show] - fit(keysBox(show)).s) < 1e-9, show);
    assert.ok(Math.abs(HI_SCALE.wurliFront - Math.min(fit(keysBox('wurliFront')).s, fit(keysBox('wurliLid')).s)) < 1e-9);
  });

  it('the line is 3 px or more on every drawing and in the inside view', () => {
    for (const art of Object.keys(HI_SCALE)) assert.ok(hiStroke(art) * HI_SCALE[art] >= HI_STROKE_PX - 1e-6, art);
    assert.match(MECH_SRC, /strokeWidth=\{Math\.max\(2\.8, HI_STROKE_PX \/ xf\.s\)\}/);
  });

  it('the page specs are read', () => {
    assert.equal(listed('i11aRhodes/pages.tsx').length, 12);
    assert.equal(listed('i11bWurlitzer/pages.tsx').length, 13);
  });

  it('I11a: every part in every view', () => {
    const bad: string[] = [];
    for (const p of listed('i11aRhodes/pages.tsx'))
      for (const view of p.views) {
        if (view === 'inside') continue;
        checkArt(`I11a ${view} ${p.id}`, view === 'top' ? 'rhodesTop' : 'rhodesFront', p.id, 'lid', bad);
      }
    assert.deepEqual(bad, []);
  });

  it('I11b: every part in every view, both mounts', () => {
    const bad: string[] = [];
    for (const p of listed('i11bWurlitzer/pages.tsx'))
      for (const view of p.views) {
        if (view === 'inside') continue;
        for (const mount of ['lid', 'rail'] as const) checkArt(`I11b ${view} ${mount} ${p.id}`, view === 'side' ? 'wurliSide' : 'wurliFront', p.id, mount, bad);
      }
    assert.deepEqual(bad, []);
  });

  it('I11b speaker step: every part in all three of its views', () => {
    const bad: string[] = [];
    for (const id of ['wur.grille', 'wur.lid', 'wur.cone', 'wur.dust', 'wur.frame'])
      for (const show of ['wurliLid', 'wurliSide', 'oval'] as const)
        for (const mount of ['lid', 'rail'] as const) checkArt(`I11b speaker ${show} ${mount} ${id}`, show, id, mount, bad);
    assert.deepEqual(bad, []);
  });

  it('inside view: every part of each mechanism', () => {
    const bad: string[] = [];
    const parts = { tine: listed('i11aRhodes/pages.tsx'), reed: listed('i11bWurlitzer/pages.tsx') };
    for (const kind of ['tine', 'reed'] as const) {
      const s = fit(MECH_FRAME[kind].box).s;
      for (const p of parts[kind]) {
        if (!p.views.includes('inside')) continue;
        const q = mechHiRect(kind, p.id, s);
        if (!q) bad.push(`${kind} ${p.id}: no mark`);
        else {
          sized(`${kind} ${p.id}`, q, s, bad);
          // all four sides show: inside the clipped picture, clear of the scope panel
          const { box, scope } = MECH_FRAME[kind];
          if (q.u0 < box.u0 || q.v0 < box.v0 || q.u1 > box.u1 || q.v1 > scope.v0) bad.push(`${kind} ${p.id}: a side of the mark is hidden`);
        }
      }
    }
    assert.deepEqual(bad, []);
  });

  it('the drawings mark only through the floored mark', () => {
    assert.doesNotMatch(KEYS_ART, /\{hi === '/);
    assert.doesNotMatch(KEYS_ART, /hiRect/);
    for (const art of ['rhodesFront', 'rhodesTop', 'wurliFront', 'wurliSide', 'oval']) assert.ok(KEYS_ART.includes(`<HiMark art="${art}"`), art);
  });
});
